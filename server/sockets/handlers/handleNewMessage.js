// sockets/handlers/handleNewMessage.js
module.exports = (io, socket, db) => {
  socket.on("newMessage", ({ chatId, content, fileUrl}) => {
    if (!chatId || (!content && !fileUrl)) {
        return socket.emit("error", { msg: "chatId and content or file are required" });
    }
    const updatedFileUrl = fileUrl || null;
    
    const userId = socket.user_id;
    if (!userId) {
        return socket.emit("error", { msg: "User ID missing in socket" });
    }
    
    // 1. Wstaw wiadomość i przechwyć lastID
    const insertSql = `
    INSERT INTO messages (chat_id, sender_id, content, sent_at, fileUrl)
    VALUES (?, ?, ?, datetime('now'), ?)
    `;
    db.run(insertSql, [chatId, userId, content, updatedFileUrl], function(err) {
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
                    fileUrl,
                    sender_id : userId,
                    sent_at: new Date().toISOString(),
                };
                
                // 4. Emituj do pokoju
          io.to(String(chatId)).emit("newMessage", message);
        }
    );
    });
  });
};
