const jwt = require("jsonwebtoken");
const {JWT_SECRET} = require('../config/config');

const userSockets = new Map();

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

    // Obsługa rozłączenia i usuwanie socketów z mapy
    socket.on("disconnect", () => {
      const userId = socket.user_id;
      const userSet = userSockets.get(userId);
      if (userSet) {
        userSet.delete(socket);
        if (userSet.size === 0) {
          userSockets.delete(userId);
        }
      }
    });

    // Rejestruj obsługę zdarzeń
    handleGetMessages(io, socket, db);
    handleNewMessages(io, socket, db, userSockets, getSocketIdsForUser);
    handleMarkMessagesRead(io, socket, db);
  });
};

module.exports = {
  registerSocketHandlers,
  getSocketIdsForUser,
  emitToUser,
  userSockets
};
