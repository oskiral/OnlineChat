module.exports = (io, socket, db) => {
  socket.on("messagesRead", (data) => {
    const userId = socket.user_id;
    const chatId = data.chatId;

    console.log("messagesRead event received", { userId, chatId });

    if (!userId || !chatId) {
      return;
    }

    // Zapytanie o wiadomości w danym chacie, które użytkownik jeszcze nie przeczytał
    const queryUnread = `
      SELECT message_id FROM messages
      WHERE chat_id = ? AND message_id NOT IN (
        SELECT message_id FROM message_reads WHERE user_id = ?
      )
    `;

    db.all(queryUnread, [chatId, userId], (err, rows) => {
      if (err) {
        console.error("Error fetching unread messages:", err);
        return;
      }

      console.log("Unread messages found:", rows.length, rows);

      if (!rows.length) {
        return;
      }

      const now = new Date().toISOString();
      const insertSql = `
        INSERT OR IGNORE INTO message_reads (message_id, user_id, read_at)
        VALUES (?, ?, ?)
      `;

      const stmt = db.prepare(insertSql);

      rows.forEach(({ message_id }) => {
        stmt.run(message_id, userId, now);
      });

      stmt.finalize((err) => {
        if (err) {
          console.error("Error marking messages read:", err);
          return;
        }
        io.to(`user:${userId}`).emit("messagesReadConfirmation", { chatId });

        // Pobierz najwyższe message_id spośród przeczytanych właśnie wiadomości
        const lastReadMessageId = Math.max(...rows.map(r => r.message_id));

        // Pobierz nadawcę tej wiadomości
        const querySender = `SELECT sender_id FROM messages WHERE message_id = ?`;
        db.get(querySender, [lastReadMessageId], (err, row) => {
          if (err) {
            console.error("Error fetching sender of last read message:", err);
            return;
          }
          if (!row) return;

          const senderId = row.sender_id;

          // Nie wysyłaj powiadomienia do siebie
          if (senderId === userId) return;

          // Wyślij event do nadawcy, że wiadomość została przeczytana przez userId
          io.to(`user:${senderId}`).emit("messageReadBy", {
            chatId,
            readerId: userId,
            lastReadMessageId
          });
        });
      });

    });
  });
};
