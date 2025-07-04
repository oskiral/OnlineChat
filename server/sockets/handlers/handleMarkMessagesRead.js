module.exports = (io, socket, db) => {
  socket.on("markMessagesRead", ({ chatId }) => {
    if (!chatId || !socket.user_id) return;
    // zagwarantuj że dołączasz
    socket.join(String(chatId));
    console.log(`(mark) Socket ${socket.id} joined room ${chatId}`);

    db.run(`
      UPDATE messages
      SET read_at = datetime('now')
      WHERE chat_id = ? AND read_at IS NULL AND sender_id != ?`,
      [chatId, socket.user_id],
      function(err) {
        if (err) return socket.emit("error", { msg: err.message });
        console.log(`Emitting messagesRead to room ${chatId}`);
        io.to(String(chatId)).emit("messagesRead", { chatId, userId: socket.user_id });
      }
    );
  });
};
