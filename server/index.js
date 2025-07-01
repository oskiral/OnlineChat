const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const db = require('./database');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());


app.get('/messages', async (req, res) => {
    db.all("SELECT * FROM messages ORDER BY timestamp ASC", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('newMessage', ({ user, content }) => {
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

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});