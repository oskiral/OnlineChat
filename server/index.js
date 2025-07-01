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

// Initialize the Express application
const app = express();
const port = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;

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

// konfiguracja multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// statyczny folder, żeby pliki były dostępne pod /uploads/filename
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ fileUrl });
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

        // No user found — proceed to hash and insert
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, hashedPassword], function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Could not create user' });
                }
                const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
                res.status(201).json({ username, token });
            });
        } catch (hashErr) {
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
    const fileUrl = data.fileUrl || null;
    if (!content && !fileUrl) return;

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

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});


// Start the server
server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});