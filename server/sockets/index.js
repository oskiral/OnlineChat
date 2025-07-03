const handleGetMessages = require("./handlers/handleGetMessages");
const handleNewMessages = require("./handlers/handleNewMessage");

module.exports = function registerSocketHandlers(io, db) {
  io.on("connection", (socket) => {
    console.log("✅ Socket connected:", socket.id);


    handleGetMessages(io, socket, db);
    handleNewMessages(io, socket, db);

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected:", socket.id);
    });
  });
};