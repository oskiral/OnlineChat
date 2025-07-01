const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const db = require('./database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Initialize the Express application
const app = express();
const port = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to parse JSON and enable CORS
app.use(cors());
app.use(express.json());


// app.get('/messages', async (req, res) => {
//     db.all("SELECT * FROM messages ORDER BY timestamp ASC", [], (err, rows) => {
//         if (err) {
//             res.status(500).json({ error: err.message });
//         } else {
//             res.json(rows);
//         }
//     });
// });
// app.post('/messages', async (req, res) => {
//     const { user, content } = req.body;
//     db.run("INSERT INTO messages (user, content) VALUES (?, ?)", [user, content], function(err) {
//         if (err) {
//             res.status(500).json({ error: err.message });
//         } else {
//             res.status(201).json({ id: this.lastID, user, content });
//         }
//     });
// });

// Create the server and Socket.IO instance
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});


// Register endpoint
// Validates input, checks for existing username, hashes password, and stores user in the database
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    // Check if username already exists
    db.get("SELECT username FROM users WHERE username = ?", [username], async (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Internal server error' });
        }
        if (row) {
            return res.status(400).json({ error: 'Username already exists' });
        }
    });

    // Hash the password and store the user
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, hashedPassword], function(err) {
            if (err) {
                return res.status(400).json({ error: 'Username already exists' });
            }
            res.status(201).json({ username });
        });
    } catch (hashErr) {
            res.status(500).json({ error: 'Error hashing password' });
        }
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
        const token = jwt.sign({username : user.username}, JWT_SECRET, {expiresIn: '1h'});
        res.status(200).json({username: user.username, token });
    });
});

// Middleware to authenticate WebSocket connections
// Checks for a valid JWT token in the socket handshake
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Authentication error'));
    }
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return next(new Error('Authentication error'));
        }
        socket.user = decoded.username;
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

  socket.on('newMessage', (data) => {
    const content = data.content?.trim();
    if (!content) return;

    const user = socket.user;
    db.run("INSERT INTO messages (user, content) VALUES (?, ?)", [user, content], function(err) {
      if (err) {
        console.error('Error inserting message:', err);
        socket.emit('errorMessage', { error: err.message });
        return;
      } else {
        const newMessage = { id: this.lastID, user, content, timestamp: new Date().toISOString() };
        io.emit('newMessage', newMessage);
      }
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});


// Start the server
server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});