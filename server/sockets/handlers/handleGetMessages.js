module.exports = (io, socket, db) => {
  socket.on("getMessages", async ({ chatId }) => {
    if (!chatId || (typeof chatId !== "string" && typeof chatId !== "number")) {
      return socket.emit("error", { msg: "Invalid or missing chatId" });
    }

    const rooms = Array.from(socket.rooms);
    rooms.forEach(room => {
      if (room !== socket.id) socket.leave(room);
    });
    socket.join(String(chatId));

    try {
      const messages = await new Promise((resolve, reject) => {
        db.all(
          `SELECT m.*, u.username
           FROM messages m
           JOIN users u ON m.sender_id = u.user_id
           WHERE m.chat_id = ?
           ORDER BY m.sent_at ASC`,
          [chatId],
          (err, rows) => (err ? reject(err) : resolve(rows))
        );
      });

      socket.emit("messages", { chatId, messages });
    } catch (err) {
      socket.emit("error", { msg: err.message });
    }
  });
};
