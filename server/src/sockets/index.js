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

  // Obsługa zdarzeń po nawiązaniu połączenia
  io.on("connection", (socket) => {
    socket.join(`user:${socket.user_id}`);
    
    // Ustaw status online przy połączeniu
    updateUserStatus(io, socket.user_id, 'online');
    console.log(`👤 User ${socket.username} (${socket.user_id}) is now online`);

    // Obsługa rozłączenia i usuwanie socketów z mapy
    socket.on("disconnect", () => {
      const userId = socket.user_id;
      const userSet = userSockets.get(userId);
      if (userSet) {
        userSet.delete(socket);
        if (userSet.size === 0) {
          userSockets.delete(userId);
          // Ustaw status offline gdy ostatni socket się rozłączy
          updateUserStatus(io, userId, 'offline');
          console.log(`👤 User ${socket.username} (${userId}) is now offline`);
        }
      }
    });

    // Rejestruj obsługę zdarzeń
    handleGetMessages(io, socket, db);
    handleNewMessages(io, socket, db, userSockets, getSocketIdsForUser);
    handleMarkMessagesRead(io, socket, db);
    
    // Obsługa statusu użytkownika
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
  });
};

module.exports = {
  registerSocketHandlers,
  getSocketIdsForUser,
  emitToUser,
  userSockets,
  getUserStatus,
  updateUserStatus
};
