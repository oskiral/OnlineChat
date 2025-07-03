module.exports = (io, socket, db) => {
    // WebSocket connection handler
  // Listens for 'getMessages' to fetch existing messages and 'newMessage' to handle
    socket.on('getMessages', () => {
        db.all("SELECT * FROM messages ORDER BY sent_at ASC", [], (err, rows) => {
        if (err) {
            console.error('Error fetching messages:', err);
            socket.emit('errorMessage', { error: err.message });
        } else {
            socket.emit('messages', rows);
        }
        });
        });
}