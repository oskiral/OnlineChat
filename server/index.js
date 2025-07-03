const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const db = require('./database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const createRoomService = require('./services/room.js');
const registerSocketHandlers = require("./sockets/index.js");

const app = express();
const port = process.env.PORT;
const JWT_SECRET = process.env.JWT_SECRET;

const roomService = createRoomService(db);
const userSockets = new Map();

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err || !decoded?.username || !decoded?.sessionId) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const currentIp = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || 'unknown';

    db.get(
      `SELECT u.*, s.ip_address FROM users u 
       JOIN sessions s ON u.user_id = s.user_id 
       WHERE u.username = ? AND s.session_uuid = ? AND s.logout_time IS NULL`,
      [decoded.username, decoded.sessionId],
      (err, user) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (!user) return res.status(401).json({ error: "Session inactive or user not found" });

        
        if (user.ip_address !== currentIp) {
          return res.status(401).json({ error: "IP address mismatch" });
        }

        req.user = user;
        req.sessionId = decoded.sessionId;
        next();
      }
    );
  });
}




function notifyUsersRoomCreated(io, userIds, room) {
  userIds.forEach(userId => {
    const socketId = getSocketIdForUser(userId); // Twoja funkcja mapująca userId → socketId
    if (socketId) {
      io.to(socketId).emit('roomCreated', room);
    }
  });
}


// Middleware to parse JSON and enable CORS
app.use(cors());
app.use(express.json());

// Create the server and Socket.IO instance
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});
registerSocketHandlers(io, db);







// Set up multer for file uploads
// Configures multer to store files in the 'uploads' directory with a unique filename
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Set up multer for avatar uploads
// Configures multer to store avatar files in the 'uploads/avatars' directory with a unique filename
// This is used to update user avatars in the database
const storageAvatar = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/avatars/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadAvatar = multer({ storage: storageAvatar });

// Serve static files from the 'uploads' directory
// This allows the client to access uploaded files via URLs
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



// Endpoint to upload files
// Uses multer to handle file uploads and returns the file URL
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ fileUrl });
});

// Endpoint to upload avatar
// Uses multer to handle avatar uploads, updates the user's avatar in the database
// and returns the file URL
// Endpoint to upload avatar
app.post('/uploadAvatar', authenticate,  uploadAvatar.single('avatar'), (req, res) => {
    
  
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  if (!req.user || !req.user.username) return res.status(401).json({ error: 'Invalid token payload' });
  
  // Construct the file URL based on the environment variable or default to localhost
  const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;
  const fileUrl = `${baseUrl}/uploads/avatars/${req.file.filename}`;
  const username = req.user.username;
  


    // Check if the user exists in the database

    db.get("SELECT avatar FROM users WHERE username = ?", [username], (err, row) => {
      if (err) {
        console.error('DB error while fetching old avatar:', err);
        return res.status(500).json({ error: 'Database error' });
      }



      // If the user has an old avatar, delete it from the filesystem
      if (row && row.avatar) {
        const oldAvatarUrl = row.avatar;

        // Extract the relative path from the old avatar URL
        let relativeAvatarPath = null;
        try {
          const urlObj = new URL(oldAvatarUrl);
          relativeAvatarPath = urlObj.pathname.startsWith('/')
            ? urlObj.pathname.slice(1)
            : urlObj.pathname;
        } catch {
          
          // if the old avatar URL is not a full URL, assume it's a relative path
          relativeAvatarPath = oldAvatarUrl.startsWith('/')
            ? oldAvatarUrl.slice(1)
            : oldAvatarUrl;
        }

        const oldAvatarFullPath = path.join(__dirname, relativeAvatarPath);
        fs.unlink(oldAvatarFullPath, (err) => {
          if (err) {
            console.warn('Old avatar not deleted:', err.message);
          }
        });
      }


      // Update the user's avatar in the database
      db.run("UPDATE users SET avatar = ? WHERE username = ?", [fileUrl, username], function(err) {
        if (err) {
          console.error('Error updating avatar:', err);
          return res.status(500).json({ error: 'Could not update avatar' });
        }

        res.json({ fileUrl });
      });
    });
});


// Register endpoint
// Validates input, checks for existing username, hashes password, and stores user in the database

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  
  // Check if the username already exists in the database
  // This prevents duplicate usernames from being registered




  db.get("SELECT username FROM users WHERE username = ?", [username], async (err, row) => {
    if (err) return res.status(500).json({ error: 'Internal server error' });
    if (row) return res.status(400).json({ error: 'Username already exists' });
    
    // If the username is available, hash the password and store the user
    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert the new user into the database
      db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, hashedPassword], function(err) {
        if (err) return res.status(500).json({ error: 'Could not create user' });
        
        const userId = this.lastID; 
        const sessionId = uuidv4();
        
        // Generate a session ID and store session data in the database
        const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        





        // Insert session data into the database
        // This includes the session UUID, user ID, login time, IP address, and user
        // agent information for tracking user sessions
        // The session UUID is generated using uuidv4() to ensure uniqueness


        db.run("INSERT INTO sessions (session_uuid, user_id, login_time, ip_address, user_agent) VALUES (?, ?, datetime('now'), ?, ?)", 
          [sessionId, userId, ip, userAgent], function(err) {
            if (err) {
              return res.status(500).json({ error: 'Could not create session' });
            }
            const token = jwt.sign({ username, sessionId }, JWT_SECRET, { expiresIn: '1h' });
            res.status(201).json({ username, token });
        });
      });
    } catch {
      res.status(500).json({ error: 'Error hashing password' });
    }
  });
});

// Login endpoint
// Validates user credentials and returns a JWT token
app.post('/login', async (req, res) => {


    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }


    db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Internal server error' });
        }
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Generate a session ID and sign a JWT token
        // The session ID can be used for tracking user sessions if needed


        const sessionUUID = uuidv4();
        const token = jwt.sign({ username: user.username, sessionId: sessionUUID }, JWT_SECRET, { expiresIn: '1h' });

        
        const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';


        // handles forceLogin

        // if (socketsSet) {
        //   console.log("Force login emit to sockets:", socketsSet.size);
        //   socketsSet.forEach(socket => {
        //     socket.emit("forceLogin", { username: user.username, token });
        //   });
        // } else {
        //   console.log("No sockets found for user", user.username);
        // }


        // Insert session data into the database


        db.run(`INSERT INTO sessions (session_uuid, user_id, login_time, ip_address, user_agent) VALUES (?, ?, datetime('now'), ?, ?)`, [sessionUUID, user.user_id, ip, userAgent], function(err) {
            if (err) {
                console.error('Error inserting session data:', err);
                return res.status(500).json({ error: 'Could not create session' });
            }
        });








        res.status(200).json({username: user.username, token });
    });
});


// Endpoint to remove avatar
// Validates the JWT token, retrieves the user's avatar from the database,
app.post('/removeAvatar', authenticate, (req, res) => {
    const username = req.user.username;

    // Usuń plik starego awatara z serwera jeśli istnieje
    db.get("SELECT avatar FROM users WHERE username = ?", [username], (err, row) => {
      if (err) return res.status(500).json({ error: 'Database error' });

      if (row && row.avatar) {
        const avatarPath = row.avatar.startsWith('http')
          ? new URL(row.avatar).pathname
          : row.avatar;
        const fullPath = path.join(__dirname, avatarPath.startsWith('/') ? avatarPath.slice(1) : avatarPath);

        fs.unlink(fullPath, (err) => {
          if (err) console.warn("Failed to delete avatar file:", err.message);
        });
      }

      // Zresetuj avatar w DB na null lub ścieżkę do defaultowego
      db.run("UPDATE users SET avatar = NULL WHERE username = ?", [username], (err) => {
        if (err) return res.status(500).json({ error: 'Could not reset avatar' });

        res.json({ message: 'Avatar removed' });
      });
    });
});



// endpoint to log out
app.post('/logout', authenticate, (req, res) => {
  const sessionId = req.sessionId; // z authenticate
  const username = req.user.username;

  if (!sessionId || !username) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  db.run(
    "UPDATE sessions SET logout_time = datetime('now') WHERE session_uuid = ?",
    [sessionId],
    (err) => {
      if (err) {
        console.error('Error updating logout_time:', err);
        return res.status(500).json({ error: 'Could not log out' });
      }

      const socketsSet = userSockets.get(username);
      if (socketsSet) {
        socketsSet.forEach(socket => socket.emit("forceLogout"));
        setTimeout(() => {
          socketsSet.forEach(socket => socket.disconnect(true));
          userSockets.delete(username);
        }, 200);
      }

      return res.status(200).json({ message: 'Logged out from current session' });
    }
  );
});





// Endpoint to get user information
// Validates the JWT token and retrieves the user's username and avatar from the database


app.get('/me', authenticate, (req, res) => {
    const username = req.user?.username;
    if (!username) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    db.get("SELECT username, avatar FROM users WHERE username = ?", [username], (err, row) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (!row) return res.status(404).json({ error: 'User not found' });
      res.json(row);
    });
});


// Middleware to authenticate WebSocket connections
// Checks for a valid JWT token in the socket handshake
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("No token"));

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error("Invalid token"));

    const username = decoded.username;
    socket.user = username;
    socket.sessionId = decoded.sessionId;

    if (!userSockets.has(username)) {
      userSockets.set(username, new Set());
    }
    userSockets.get(username).add(socket);

    socket.on('disconnect', () => {
      const sockets = userSockets.get(username);
      if (sockets) {
        sockets.delete(socket);
        if (sockets.size === 0) {
          userSockets.delete(username);
        }
      }
    });

    next();
  });
});


app.get("/rooms", authenticate, (req, res) => {
  const user = req.user;
  roomService.getUserRooms(user)
  .then((rooms) => res.json())
  .catch(err => {
    console.log("Error fetching rooms of the user");
    res.status(500).json({error: "Failed to fetch the rooms"})
  })
})

app.post("/rooms", authenticate, async (res, req) => {
  const {memberId, name} = req.body;
  const user = req.user;

  try {
    if (memberId) {

      // direct room
      const existing = await roomService.getDirectRoom(user.id, memberId);
      if (existing) {
        notifyUsersRoomCreated(io, [user.id, memberId], existing);
        return res.status(200).json(existing);
      }

      const roomId = await roomService.createRoom(null, user);
      await roomService.addUserToRoom(user.id, roomId);
      await roomService.addUserToRoom(memberId, roomId);

      const newRoom = { room_id : roomId, is_group: 0};
      notifyUsersRoomCreated(io, [user.id, memberId], newRoom);

      return res.status(201).json(newRoom);
    }
    if (!name) {
      return res.status(400).json({error: "Room nam required"});
    }

    const roomId = await roomService.createRoom(name, user);
    await roomService.addUserToRoom(user.id, roomId);

    const newRoom = {room_id: roomId, is_group: 1};
    notifyUsersRoomCreated(io, [user.id], newRoom);

    return res.status(201).json(newRoom);
  } catch (err) {
    console.error("Error creating room:",err);
    return res.status(500).json({error: "Could not create room"});
  }
}) 

app.get("/users/search", authenticate, async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) {
    return res.status(400).json({error: "Query too short"});
  }

  try {
    const users = await new Promise((resolve, reject) => {
      const sql = `SELECT user_id, username, avatar FROM users WHERE username LIKE ? LIMIT 20`;
      db.all(sql, [`%${q}%`], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
    res.json(users);
  } catch (err) {
    console.error('Search users error: ', err);
    res.status(500).json({error: 'Server error'});
  }
})

app.post('/friend-requests/send', authenticate, async (req, res) => {
  const senderId = req.user.id;
  const {recieverId} = req.body;

  if (!recieverId || recieverId === senderId) {
    return res.status(400).json({error: "Invalid recieverId"});
  }

  try {
    const existing = await new Promise((resolve, reject) => {
      const sql = `
      SELECT * FROM friend_requests 
      WHERE (sender_id = ? AND receiver_id = ?) 
      OR (sender_id = ? AND receiver_id = ?)
      `;
      db.get(sql, [senderId, recieverId, recieverId, senderId], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });


    if (existing) {
      return res.status(400).json({error: "Friend requests already exists or you are already connected"})
    };

    await new Promise((resolve, reject) => {
      const sql = `INSERT INTO friend_requests (sender_id, receiver_id, status) VALUES (?, ?, 'pending')`;
      db.run(sql, [senderId, recieverId], function(err) {
        if (err) return reject(err);
        resolve(this.lastID);
      });
    });

    res.json({success: true, message: "Friend request sent"})

  } catch (err) {
      console.error("Send friend request error: ", err);
      res.status(500).json({error: "Server error"});
  };
});

app.post("/friend-requests/accept", authenticate, async (req, res) => {
  const recieverId = req.user.id;
  const {senderId} = req.body;

  try {
    const updated = await new Promise((resolve,reject) => {
    const sql = `
      UPDATE friend_requests 
      SET status = 'accepted' 
      WHERE sender_id = ? AND receiver_id = ? AND status = 'pending'
    `;

    db.run(sql, [senderId, recieverId], function(err) {
      if (err) resolve(err);
      resolve(this.changes);
    });
    });

    if (updated === 0) {
      return res.status(400).json({ error: 'No pending friend request found' });
    }

    const [user1, user2] = senderId < recieverId ? [senderId, recieverId] : [recieverId, senderId];

    await new Promise((resolve,reject) => {
      const sql = `INSERT INTO friendships (user1_id, user2_id) VALUES (?, ?)`;
      db.run(sql, [user1, user2], function(err) {
        if (err) return reject(err);
        resolve(this.lastID);
      });
    });

    res.json({success: true, message:"Friend request accepted"});

  } catch (err) {

    console.error("Accept friend request error: ", err);
    res.status(500).json({error: "Server error"});
  }
})

app.post("/friend-requests/reject", authenticate, async (req, res) => {
  const recieverId = req.user.id;
  const {senderId} = req.body;

  try {
    const updated = await new Promise((resolve, reject) => {
      const sql = `
        UPDATE friend_requests 
        SET status = 'rejected' 
        WHERE sender_id = ? AND receiver_id = ? AND status = 'pending'
      `;
      db.run(sql, [senderId, receiverId], function(err) {
        if (err) return reject(err);
        resolve(this.changes);
      });
    });

    if (updated === 0) {
      return res.status(400).json({error: "No pending friend request found"});
    }

    res.json({success: true, message: "Friend request rejected"});
  } catch (err) {
    console.error("Reject friend request error:", err);
    res.status(500).json({error: "Server error"});
  }
})


// Start the server
server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});