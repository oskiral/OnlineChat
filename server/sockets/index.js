const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;
const userSockets = new Map();

const handleGetMessages = require("./handlers/handleGetMessages");
const handleNewMessages = require("./handlers/handleNewMessage");
const handleMarkMessagesRead = require("./handlers/handleMarkMessagesRead");

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
    console.log("Socket trying to connect", socket.handshake.auth);

    const token = socket.handshake.auth.token;
    if (!token) {
      console.log("No token in handshake");
      return next(new Error("No token"));
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        console.log("JWT verify error", err);
        return next(new Error("Invalid token"));
      }

      console.log("Decoded token:", decoded);

      const username = decoded.username;
      const userId = decoded.user_id;

      if (!username || !userId) {
        console.log(`userId: ${userId}\nusername: ${username}`);
        return next(new Error("Invalid token payload"));
      }

      socket.username = username;
      socket.user_id = userId;
      socket.sessionId = decoded.sessionId;

      if (!userSockets.has(username)) {
        userSockets.set(username, new Set());
      }
      userSockets.get(username).add(socket);

      next();
    });
  });


  // Obsługa zdarzeń po nawiązaniu połączenia
  io.on("connection", (socket) => {
    console.log("✅ Socket connected:", socket.id);

    // Rejestruj obsługę zdarzeń
    handleGetMessages(io, socket, db);
    handleNewMessages(io, socket, db);
    handleMarkMessagesRead(io, socket, db);
  });
};

module.exports = {
  registerSocketHandlers,
  getSocketIdsForUser,
  userSockets,
  emitToUser
}