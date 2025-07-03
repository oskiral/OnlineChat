module.exports = (io, socket, db) => {
    // Handle new messages
    // Validates content, checks for empty messages, and inserts into the database
    socket.on('newMessage', (data) => {

        const user = socket.user;
        const roomId = data.roomId;

        // Ensure the user is authenticated
        if (!user) {
        socket.emit('errorMessage', { error: 'User not authenticated' });
        return;
        }
        // Validate message content and room ID
        if (!data || typeof data !== 'object') {
            socket.emit('errorMessage', { error: 'Invalid message data' });
            return;
        }
        
        const content = data.content?.trim();
        const fileUrl = data.fileUrl || null;
        if ((!content && !fileUrl) || !roomId) {
            socket.emit('errorMessage', { error: 'Invalid message content or room ID' });
            return;
        }

        checkRoomAccess(db, roomId, user, (err, row) => {
            if (err) {
                socket.emit('errorMessage', { error: err.message });
                return;
            }
        });






        db.run("INSERT INTO messages (room_id, sender_id, content, fileUrl) VALUES (?, ?, ?, ?)", [roomId, user.id, content, fileUrl], function(err) {
        if (err) {
            console.error('Error inserting message:', err);
            socket.emit('errorMessage', { error: err.message });
            return;
        } else {
            const newMessage = { id: this.lastID, roomId, user, content, fileUrl, timestamp: new Date().toISOString() };
            io.to(roomId).emit('newMessage', newMessage);
        }
        });
    });
}
