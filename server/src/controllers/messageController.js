const db = require("../config/database"); // Make sure this path matches your db file


// Endpoint to upload files
// Uses multer to handle file uploads and returns the file URL
// upload.single('file')
exports.upload = (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ fileUrl });
};

exports.unreadCounts = (req, res) => {
  const userId = req.user.user_id;

  const sql = `
  SELECT m.chat_id, COUNT(*) as unread_count
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
};