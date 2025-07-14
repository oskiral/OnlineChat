const express = require('express');

const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const db = require("./config/database.js")
const multer = require('multer');
const config = require("./config/config.js");
const fs = require('fs');
const path = require('path');

const authenticate = require("../src/middleware/authenticate.js");


const app = express();

// Middleware to parse JSON and enable CORS
app.use(cors());
app.use(express.json());

const authRoutes = require("../src/routes/authRoutes.js");
const friendRoutes = require("../src/routes/friendRoutes.js");
const userRoutes = require("../src/routes/userRoutes.js");
app.use("/api/auth", authRoutes);
app.use("/api/friends/", friendRoutes);
app.use("/api/user/", userRoutes);

const createRoomService = require('./utils/room.js');
const {registerSocketHandlers, getSocketIdsForUser} = require("./sockets/index.js");


const port = config.port;


const roomService = createRoomService(db);



function notifyUsersRoomCreated(io, userIds, room) {
  userIds.forEach(userId => {
    const socketId = getSocketIdsForUser(userId)[0]; // Twoja funkcja mapująca userId → socketId
    if (socketId) {
      io.to(socketId).emit('roomCreated', room);
    }
  });
}




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




// Endpoint to get user information
// Validates the JWT token and retrieves the user's username and avatar from the database





app.get("/rooms", authenticate, (req, res) => {
  const user = req.user;
  roomService.getUserRoomsWithLastMessages(user)
  .then((rooms) => res.json())
  .catch(err => {
    console.log("Error fetching rooms of the user");
    res.status(500).json({error: "Failed to fetch the rooms"})
  })
})

// POST /rooms
// If `memberId` is provided (and `is_group` is falsy), we treat it as a direct chat.
// If `is_group` is true, we require a `name` and create a group room.
app.post("/rooms", authenticate, async (req, res) => {
  const { memberId, name, is_group } = req.body;
  const user = req.user;

  try {
    // —— DIRECT CHAT ——
    if (memberId && !is_group) {
      // 1) Check for existing direct room between these two users
      const existing = await roomService.getDirectRoom(user.user_id, memberId);
      if (existing) {
        notifyUsersRoomCreated(io, [user.user_id, memberId], existing);
        return res.status(200).json(existing);
      }

      // 2) Create the new direct room (no name, is_group = 0)
      const roomId = await roomService.createRoom(null, user, false);
      await roomService.addUserToRoom(user.user_id, roomId);
      await roomService.addUserToRoom(memberId, roomId);

      const newRoom = { room_id: roomId, is_group: 0, name: null };
      notifyUsersRoomCreated(io, [user.user_id, memberId], newRoom);
      return res.status(201).json(newRoom);
    }

    // —— GROUP CHAT (future) ——
    if (is_group) {
      if (!name || !name.trim()) {
        return res.status(400).json({ error: "Group name is required" });
      }
      // Create group room with name
      const roomId = await roomService.createRoom(name.trim(), user, true);
      await roomService.addUserToRoom(user.user_id, roomId);
      // In future you’ll add extra members here, e.g. req.body.memberIds

      const newRoom = { room_id: roomId, is_group: 1, name: name.trim() };
      notifyUsersRoomCreated(io, [user.user_id], newRoom);
      return res.status(201).json(newRoom);
    }

    // —— INVALID REQUEST ——
    res.status(400).json({
      error: "Invalid payload: provide either memberId (direct) or is_group + name (group)",
    });
  } catch (err) {
    console.error("Error creating/fetching room:", err);
    res.status(500).json({ error: "Could not create room" });
  }
});



app.get("/unread-counts",  authenticate,(req, res) => {
  const userId = req.user.user_id;
  
  const sql = `
  SELECT m.chat_id, COUNT (*) as unread_count
  FROM messages m
  JOIN room_members rm ON rm.room_id = m.chat_id AND rm.user_id = ?
  LEFT JOIN message_reads mr ON mr.message_id = m.message_id AND mr.user_id = ?
  WHERE mr.message_id IS NULL AND m.sender_id != ?
  GROUP BY m.chat_id
  `;

  db.all(sql, [userId, userId, userId], (err, rows) => {
    if (err) {
      console.error("Unread count error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(rows); // { chat_id: 1, unread_count: 2 }
  });
})

// Start the server
server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});