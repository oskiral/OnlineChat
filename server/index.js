const express = require('express');
const cors = require('cors');
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


app.post('/messages', async (req, res) => {
    const { user, content } = req.body;
    db.run("INSERT INTO messages (user, content) VALUES (?, ?)", [user, content], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.status(201).json({ id: this.lastID, user, content });
        }
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});