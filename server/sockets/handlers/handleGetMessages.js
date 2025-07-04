module.exports = (io, socket, db) => {
  socket.on("getMessages", async ({ chatId }) => {
    if (!chatId) {
      return socket.emit("error", { msg: "chatId is required" });
    }

    socket.join(String(chatId));
    console.log("joined");
    try {
        const messages = await new Promise((resolve, reject) => {
            db.all(
                `SELECT m.*, u.username FROM messages m JOIN users u ON m.sender_id = u.user_id WHERE chat_id = ? ORDER BY sent_at ASC`,
                [chatId],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
      socket.emit("messages", messages);
    } catch (error) {
      socket.emit("error", { msg: "Database error: " + error.message });
    }
  });
};
