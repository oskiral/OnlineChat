// sockets/handlers/handleNewMessage.js
module.exports = (io, socket, db) => {
  socket.on("newMessage", ({ chatId, content }) => {
    if (!chatId || !content) {
        return socket.emit("error", { msg: "chatId and content are required" });
    }
    
    const userId = socket.user_id;
    if (!userId) {
        return socket.emit("error", { msg: "User ID missing in socket" });
    }
    
    // 1. Wstaw wiadomość i przechwyć lastID
    const insertSql = `
    INSERT INTO messages (chat_id, sender_id, content, sent_at)
    VALUES (?, ?, ?, datetime('now'))
    `;
    db.run(insertSql, [chatId, userId, content], function(err) {
        if (err) {
            console.error("DB insert error:", err);
            return socket.emit("error", { msg: "DB insert error" });
        }
        
        const messageId = this.lastID; // teraz masz poprawne ID
        
        // 2. Pobierz username w zamknięciu
        db.get(
            `SELECT username FROM users WHERE user_id = ?`,
            [userId],
            (err, row) => {
                const username = row?.username || "Unknown";
                
                // 3. Zbuduj obiekt wiadomości
                const message = {
                    message_id: messageId,
                    chat_id: chatId,
                    user_id: userId,
                    username,
                    content,
                    sent_at: new Date().toISOString(),
                };
                
                // 4. Emituj do pokoju
          io.to(String(chatId)).emit("newMessage", message);
        }
    );
    });
  });
};
