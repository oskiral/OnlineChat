// server/services/room.js

const { promisify } = require("util");

module.exports = function createRoomService(db) {
  // Promisify podstawowych metod SQLite
  const get = promisify(db.get).bind(db);
  const all = promisify(db.all).bind(db);
  const run = promisify(db.run).bind(db);

  /**
   * Sprawdza, czy użytkownik jest członkiem danego pokoju.
   * Zwraca obiekt wiersza lub undefined.
   */
  async function checkRoomAccess(roomId, user) {
    return await get(
      "SELECT * FROM room_members WHERE room_id = ? AND user_id = ?",
      [roomId, user.id]
    );
  }

  /**
   * Zwraca wszystkie pokoje, w których uczestniczy użytkownik.
   * Zwraca tablicę wierszy.
   */
  async function getUserRooms(user) {
    return await all(
      `SELECT r.* 
       FROM rooms r 
       JOIN room_members rm ON rm.room_id = r.id 
       WHERE rm.user_id = ?`,
      [user.id]
    );
  }

  /**
   * Tworzy nowy pokój i zwraca jego ID.
   */
  async function createRoom(name, user) {
    const result = await run(
      "INSERT INTO rooms (name, creator_id) VALUES (?, ?)",
      [name, user.id]
    );
    // sqlite3 w trybie promisified zwraca obiekt { lastID, changes }
    return result.lastID;
  }

  /**
   * Dodaje użytkownika do pokoju.
   */
  async function addUserToRoom(userId, roomId) {
    await run(
      "INSERT INTO room_members (user_id, room_id) VALUES (?, ?)",
      [userId, roomId]
    );
  }

  /**
   * Sprawdza, czy dany pokój to pokój grupowy (is_group = 1).
   */
  async function isGroupRoom(roomId) {
    return await get(
      "SELECT * FROM rooms WHERE id = ? AND is_group = 1",
      [roomId]
    );
  }

  return {
    checkRoomAccess,
    getUserRooms,
    createRoom,
    addUserToRoom,
    isGroupRoom,
  };
}
