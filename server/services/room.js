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
      [roomId, user.user_id]
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
      [user.user_id]
    );
  }

  /**
   * Tworzy nowy pokój i zwraca jego ID.
   */
  async function createRoom(name, user) {
    return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO rooms (room_name, created_by) VALUES (?, ?)",
      [name, user.user_id],
      function (err) {
        if (err) return reject(err);
        resolve(this.lastID);   // <-- here you grab the new row’s ID
      }
    );
  });
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
  async function getDirectRoom(userId1, userId2) {
      const sql = `
        SELECT r.*
        FROM rooms r
          JOIN room_members rm1 ON r.room_id = rm1.room_id AND rm1.user_id = ?
          JOIN room_members rm2 ON r.room_id = rm2.room_id AND rm2.user_id = ?
        WHERE r.is_group = 0
          AND (
            SELECT COUNT(*) 
            FROM room_members rm 
            WHERE rm.room_id = r.room_id
          ) = 2
        LIMIT 1;
      `;

      // Wrap db.all in a Promise:
      const rows = await new Promise((resolve, reject) => {
        db.all(sql, [userId1, userId2], (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        });
      });

      console.log("found rooms:", rows.length);
      return rows.length > 0 ? rows[0] : null;
    }


  return {
    checkRoomAccess,
    getUserRooms,
    createRoom,
    addUserToRoom,
    isGroupRoom,
    getDirectRoom
  };
}
