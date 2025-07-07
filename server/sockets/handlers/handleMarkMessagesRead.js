// sockets/handlers/handleMarkMessagesRead.js
module.exports = (io, socket, db) => {
  socket.on("markMessagesRead", ({ chatId }) => {
    const userId = socket.user_id;
    if (!chatId || !userId) return;


    // Oznacz w bazie
    db.run(
      `UPDATE messages
       SET read_at = datetime('now')
       WHERE chat_id = ? AND read_at IS NULL AND sender_id != ?`,
      [chatId, userId],
      function (err) {
        if (err) return socket.emit("error", { msg: err.message });

        // Wyślij tylko do WSZYSTKICH POZA TYM socketem
        io.to(chatId).except(socket.id).emit("messagesRead", { chatId, userId });
      }
    );
  });
};
