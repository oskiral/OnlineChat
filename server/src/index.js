const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const db = require("./config/database.js");
const config = require("./config/config.js");
const { registerSocketHandlers } = require("./sockets/index.js");
const { setIoInstance } = require("./utils/ioInstance.js");

const app = express();

// Middleware to parse JSON and enable CORS
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require("./routes/authRoutes.js");
const friendRoutes = require("./routes/friendRoutes.js");
const userRoutes = require("./routes/userRoutes.js");
const roomRoutes = require("./routes/roomRoutes.js");
const messageRoutes = require("./routes/messageRoutes.js");

app.use("/api/auth", authRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/user", userRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/messages", messageRoutes);

const {registerSocketHandlers} = require("./sockets/index.js");
const { setIoInstance } = require("./utils/ioInstance.js");


const port = config.port;


// Create the server and Socket.IO instance
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

// Set the IO instance globally for other modules to use
setIoInstance(io);

registerSocketHandlers(io, db);

// Serve static files from the 'uploads' directory
// This allows the client to access uploaded files via URLs
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



// Start the server
server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});