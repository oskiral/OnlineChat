// Message limits configuration
const MESSAGE_LIMITS = {
  MAX_LENGTH: 1000
};

module.exports = (io, socket, db, userSockets, getSocketIdsForUser) => {
  socket.on("newMessage", ({ chatId, content, fileUrl }) => {
    if (!chatId || (!content && !fileUrl)) {
      return socket.emit("error", { msg: "chatId and content or file are required" });
    }

    // Check message length limit
    if (content && content.length > MESSAGE_LIMITS.MAX_LENGTH) {
      return socket.emit("error", { msg: `Message too long. Maximum ${MESSAGE_LIMITS.MAX_LENGTH} characters allowed.` });
    }

    const userId = socket.user_id;
    const updatedFileUrl = fileUrl || null;

    if (!userId) {
      return socket.emit("error", { msg: "User ID missing in socket" });
    }

    const insertSql = `
      INSERT INTO messages (chat_id, sender_id, content, sent_at, fileUrl)
      VALUES (?, ?, ?, datetime('now'), ?)
    `;

    db.run(insertSql, [chatId, userId, content, updatedFileUrl], function (err) {
      if (err) {
        console.error("DB insert error:", err);
        return socket.emit("error", { msg: "DB insert error" });
      }

      const messageId = this.lastID;

      db.get(`SELECT username FROM users WHERE user_id = ?`, [userId], (err, row) => {
        if (err || !row) {
          console.error("DB select username error:", err);
          return socket.emit("error", { msg: "Could not fetch username" });
        }

        const message = {
          message_id: messageId,
          chat_id: chatId,
          sender_id: userId,
          sender_username: row.username,
          content,
          fileUrl: updatedFileUrl,
          sent_at: new Date().toISOString(),
        };

        db.all(`SELECT user_id FROM room_members WHERE room_id = ?`, [chatId], (err, rows) => {
          if (err) {
            console.error("Error fetching room members:", err);
            return;
          }

          console.log(`📡 Broadcasting message ${messageId} to room ${chatId} members:`, rows.map(r => r.user_id));

          rows.forEach(({ user_id }) => {
            const socketIds = getSocketIdsForUser(user_id);
            console.log(`📤 Sending to user ${user_id}, sockets:`, socketIds);
            socketIds.forEach(socketId => {
              io.to(socketId).emit("newMessage", message);
            });
          });
        });
      });
    });
  });
};
