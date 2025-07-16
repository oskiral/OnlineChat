const express = require('express');

const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const db = require("./config/database.js")
const multer = require('multer');
const config = require("./config/config.js");
const fs = require('fs');
const path = require('path');


const app = express();

// Middleware to parse JSON and enable CORS
app.use(cors());
app.use(express.json());

const authRoutes = require("../src/routes/authRoutes.js");
const friendRoutes = require("../src/routes/friendRoutes.js");
const userRoutes = require("../src/routes/userRoutes.js");
const roomRoutes = require("../src/routes/roomRoutes.js");
const messageRoutes = require("../src/routes/messageRoutes.js");

app.use("/api/auth", authRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/user", userRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/messages", messageRoutes);

const {registerSocketHandlers, getSocketIdsForUser} = require("./sockets/index.js");


const port = config.port;


// Create the server and Socket.IO instance
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});
registerSocketHandlers(io, db);

// Serve static files from the 'uploads' directory
// This allows the client to access uploaded files via URLs
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



// Start the server
server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});