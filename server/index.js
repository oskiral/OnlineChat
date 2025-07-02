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

// Initialize the Express application
const app = express();
const port = process.env.PORT;
const JWT_SECRET = process.env.JWT_SECRET;
const userSockets = new Map(); // zamiast sessionSockets


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
app.post('/uploadAvatar', uploadAvatar.single('avatar'), (req, res) => {


  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });


  // Verify the JWT token
  // This checks if the token is valid and extracts the username from it
  jwt.verify(token, JWT_SECRET, (err, decoded) => {


    
    if (err) return res.status(401).json({ error: 'Invalid token' });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    if (!decoded || !decoded.username) return res.status(401).json({ error: 'Invalid token payload' });


    // Construct the file URL based on the environment variable or default to localhost
    const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;
    const fileUrl = `${baseUrl}/uploads/avatars/${req.file.filename}`;
    const username = decoded.username;


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

        
        const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';


        const socketsSet = userSockets.get(user.username);

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
app.post('/removeAvatar', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });

    const username = decoded.username;

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
});



// endpoint to log out
app.post('/logout', (req, res) => {



  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });

    const sessionId = decoded.sessionId;
    const username = decoded.username;

    db.run("UPDATE sessions SET logout_time = datetime('now') WHERE session_uuid = ?", [sessionId], (err) => {
      if (err) return res.status(500).json({ error: 'Could not log out' });

      const socketsSet = userSockets.get(username);

      if (socketsSet) {
        socketsSet.forEach(socket => {
          socket.emit("forceLogout");

          setTimeout(() => {
            socketsSet.forEach(socket => socket.disconnect(true));
            userSockets.delete(username);
          }, 200);
        });

        userSockets.delete(username);
      }

      return res.status(200).json({ message: 'Logged out from all sessions' });
    });
  });
});



// Endpoint to get user information
// Validates the JWT token and retrieves the user's username and avatar from the database


app.get('/me', (req, res) => {



  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });

    // Check if the decoded token contains the username
    // If not, return an error response

    if (!decoded || !decoded.username) return res.status(401).json({ error: 'Invalid token payload' });
    db.get("SELECT username, avatar FROM users WHERE username = ?", [decoded.username], (err, row) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (!row) return res.status(404).json({ error: 'User not found' });
      res.json(row);
    });
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





// WebSocket connection handler
// Listens for 'getMessages' to fetch existing messages and 'newMessage' to handle
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('getMessages', () => {
    db.all("SELECT * FROM messages ORDER BY timestamp ASC", [], (err, rows) => {
      if (err) {
        console.error('Error fetching messages:', err);
        socket.emit('errorMessage', { error: err.message });
      } else {
        socket.emit('messages', rows);
      }
    });
    });

  // Handle new messages
  // Validates content, checks for empty messages, and inserts into the database
  socket.on('newMessage', (data) => {
    const content = data.content?.trim();
    const fileUrl = data.fileUrl || null;
    if (!content && !fileUrl) return;

    // Ensure the user is authenticated
    if (!socket.user) {
      socket.emit('errorMessage', { error: 'User not authenticated' });
      return;
    }

    const user = socket.user;
    db.run("INSERT INTO messages (user, content, fileUrl) VALUES (?, ?, ?)", [user, content, fileUrl], function(err) {
      if (err) {
        console.error('Error inserting message:', err);
        socket.emit('errorMessage', { error: err.message });
        return;
      } else {
        const newMessage = { id: this.lastID, user, content, fileUrl, timestamp: new Date().toISOString() };
        io.emit('newMessage', newMessage);
      }
    });
  });

  // Handle user disconnect
  // Logs the disconnection and can be used for cleanup if needed
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});


// Start the server
server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});