module.exports = (io, socket, db) => {
  socket.on("getMessages", async ({ chatId }) => {
    console.log(`📥 getMessages request for chatId: ${chatId} from user: ${socket.user_id}`);
    
    if (!chatId || (typeof chatId !== "string" && typeof chatId !== "number")) {
      console.error("❌ Invalid chatId:", chatId);
      return socket.emit("error", { msg: "Invalid or missing chatId" });
    }

    // Verify user has access to this chat
    let accessCheck;
    try {
      accessCheck = await new Promise((resolve, reject) => {
        db.get(
          `SELECT rm.* FROM room_members rm WHERE rm.room_id = ? AND rm.user_id = ?`,
          [chatId, socket.user_id],
          (err, row) => {
            if (err) {
              console.error("❌ Access check error:", err);
              reject(err);
            } else {
              resolve(row);
            }
          }
        );
      });
    } catch (err) {
      console.error("❌ Database error during access check:", err);
      return socket.emit("error", { msg: "Database error during access check" });
    }

    if (!accessCheck) {
      console.error(`❌ User ${socket.user_id} has no access to chat ${chatId}`);
      return socket.emit("error", { msg: "No access to this chat" });
    }

    console.log(`✅ User ${socket.user_id} has access to chat ${chatId}`);

    // Leave other rooms and join the current chat room
    const rooms = Array.from(socket.rooms);
    rooms.forEach(room => {
      if (room !== socket.id) {
        console.log(`🚪 Leaving room: ${room}`);
        socket.leave(room);
      }
    });
    socket.join(String(chatId));
    console.log(`🚪 Joined room: ${chatId}`);

    try {
      const messages = await new Promise((resolve, reject) => {
        db.all(
          `SELECT m.*, u.username as sender_username
           FROM messages m
           JOIN users u ON m.sender_id = u.user_id
           WHERE m.chat_id = ?
           ORDER BY m.sent_at ASC`,
          [chatId],
          (err, rows) => (err ? reject(err) : resolve(rows))
        );
      });

      console.log(`📦 Fetched ${messages.length} messages for chat ${chatId}`);
      console.log(`📋 Messages preview:`, messages.slice(-3).map(m => ({
        id: m.message_id,
        sender: m.sender_username,
        content: m.content?.substring(0, 50) + '...'
      })));

      socket.emit("messages", { chatId, messages });
    } catch (err) {
      console.error("❌ Error fetching messages:", err);
      socket.emit("error", { msg: err.message });
    }
  });
};
