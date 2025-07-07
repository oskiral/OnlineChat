// sockets/handlers/handleGetMessages.js
module.exports = (io, socket, db) => {
  socket.on("getMessages", async ({ chatId }) => {
    if (!chatId) {
      return socket.emit("error", { msg: "chatId is required" });
    }

    // Dołącz TEN socket do pokoju
    socket.join(String(chatId));
    console.log(`Socket ${socket.id} joined room ${chatId}`);

    // POBIERZ wiadomości z bazy
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

      // Wyślij historię tylko temu socketowi
      socket.emit("messages", messages);
    } catch (err) {
      socket.emit("error", { msg: err.message });
    }
  });
};
