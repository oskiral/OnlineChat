const jwt = require("jsonwebtoken");
const {JWT_SECRET} = require('../config/config');

const userSockets = new Map(); // userId -> Set of sockets
const userStatus = new Map(); // userId -> { status: 'online'|'offline', lastSeen: timestamp }

const handleGetMessages = require("./handlers/handleGetMessages");
const handleNewMessages = require("./handlers/handleNewMessage");
const handleMarkMessagesRead = require("./handlers/handleMarkMessagesRead");

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set in environment variables");
}

function getSocketIdsForUser(userId) {
  const sockets = userSockets.get(userId);
  if (!sockets) return [];
  // Return the raw socket IDs
  return Array.from(sockets).map(s => s.id);
}

function emitToUser(io, userId, event, data) {
  const sockets = userSockets.get(userId);
  if (!sockets) return;
  for (const socket of sockets) {
    socket.emit(event, data);
  }
}

function updateUserStatus(io, userId, status) {
  userStatus.set(userId, {
    status,
    lastSeen: new Date().toISOString()
  });
  
  // Powiadom znajomych o zmianie statusu
  // TODO: Pobierz listę znajomych z bazy danych i powiadom ich
  broadcastStatusToFriends(io, userId, status);
}

function broadcastStatusToFriends(io, userId, status) {
  // Emit status update to all connected sockets (simplified)
  // In production, you'd query the database for user's friends
  io.emit("user_status_changed", { 
    userId, 
    status, 
    lastSeen: userStatus.get(userId)?.lastSeen 
  });
}

function getUserStatus(userId) {
  return userStatus.get(userId) || { status: 'offline', lastSeen: null };
}

function broadcastToGroup(io, groupId, event, data) {
  io.to(`group:${groupId}`).emit(event, data);
}

function registerSocketHandlers(io, db) {
  // Autoryzacja socketów na podstawie tokenu JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("No token"));
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return next(new Error("Invalid token"));
      }

      const username = decoded.username;
      const userId = decoded.user_id;

      if (!username || !userId) {
        return next(new Error("Invalid token payload"));
      }

      socket.username = username;
      socket.user_id = userId;
      socket.sessionId = decoded.sessionId;

      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId).add(socket);

      next();
    });
  });

  //handle user connection
  io.on("connection", (socket) => {
    socket.join(`user:${socket.user_id}`);
    

    updateUserStatus(io, socket.user_id, 'online');
    console.log(`👤 User ${socket.username} (${socket.user_id}) is now online`);

    
    socket.on("disconnect", () => {
      const userId = socket.user_id;
      const userSet = userSockets.get(userId);
      if (userSet) {
        userSet.delete(socket);
        if (userSet.size === 0) {
          userSockets.delete(userId);
         
          updateUserStatus(io, userId, 'offline');
          console.log(`👤 User ${socket.username} (${userId}) is now offline`);
        }
      }
    });

    // handlers for various events
    handleGetMessages(io, socket, db);
    handleNewMessages(io, socket, db, userSockets, getSocketIdsForUser);
    handleMarkMessagesRead(io, socket, db);
    
    // handlers for user status
    socket.on("get_user_status", ({ userId }, callback) => {
      const status = getUserStatus(userId);
      if (callback) callback(status);
    });
    
    socket.on("get_friends_status", ({ friendIds }, callback) => {
      const friendsStatus = friendIds.map(id => ({
        userId: id,
        ...getUserStatus(id)
      }));
      if (callback) callback(friendsStatus);
    });

    // Group chat handlers 
    socket.on("join_group", ({ groupId }) => {
      socket.join(`group:${groupId}`);
      console.log(`👥 User ${socket.user_id} joined group ${groupId}`);
    });

    socket.on("leave_group", ({ groupId }) => {
      socket.leave(`group:${groupId}`);
      console.log(`👥 User ${socket.user_id} left group ${groupId}`);
    });

    // Poll handlers
    socket.on("pollCreated", ({ chatId, poll }) => {
      console.log(`📊 Poll created in chat ${chatId}:`, poll.question);
      // Broadcast to all members of the chat
      socket.to(String(chatId)).emit("pollCreated", { poll });
    });

    socket.on("pollVoted", ({ chatId, pollId, optionIndex, userId }) => {
      console.log(`🗳️ User ${userId} voted on poll ${pollId}, option ${optionIndex}`);
      // Broadcast to all members of the chat
      socket.to(String(chatId)).emit("pollVoted", { pollId, optionIndex, userId });
    });

    socket.on("group_message", ({ groupId, message }) => {
      if (!groupId || !message) {
        return console.error("Invalid group message payload");
      }

      const userId = socket.user_id;
      const groupMessage = {
        groupId,
        userId,
        message,
        sentAt: new Date().toISOString(),
      };

      // Emit the message to the group
      broadcastToGroup(io, groupId, "group_message", groupMessage);

      console.log(`📤 Group message from user ${userId} to group ${groupId}:`, message);
    });
  });
};

module.exports = {
  registerSocketHandlers,
  getSocketIdsForUser,
  emitToUser,
  userSockets,
  getUserStatus,
  updateUserStatus,
  broadcastToGroup,
};
