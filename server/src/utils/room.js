// server/services/room.js

const { promisify } = require("util");
const { getSocketIdsForUser } = require("../sockets/index.js");

module.exports = function createRoomService(db) {
  // Promisify podstawowych metod SQLite
  const get = promisify(db.get).bind(db);
  const all = promisify(db.all).bind(db);
  const run = promisify(db.run).bind(db);

  function notifyUsersRoomCreated(io, userIds, room) {
    userIds.forEach(userId => {
      const socketId = getSocketIdsForUser(userId)[0]; // Twoja funkcja mapująca userId → socketId
      if (socketId) {
        io.to(socketId).emit('roomCreated', room);
      }
    });
  }

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
  async function createRoom(name, user, isGroup) {
    return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO rooms (room_name, created_by, is_group) VALUES (?, ?, ?)",
      [name, user.user_id, isGroup],
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
    try {
      // Check if the user is already in the room
      const existingMember = await get(
        "SELECT * FROM room_members WHERE user_id = ? AND room_id = ?",
        [userId, roomId]
      );

      if (existingMember) {
        return { success: false, message: "User is already in the room" };
      }

      // Add the user to the room
      await run(
        "INSERT INTO room_members (user_id, room_id) VALUES (?, ?)",
        [userId, roomId]
      );

      return { success: true, message: "User added to the room successfully" };
    } catch (error) {
      console.error("Error adding user to room:", error);
      return { success: false, message: "Failed to add user to the room" };
    }
  }

  async function getUserRoomsWithLastMessages(userId) {
    const sql = `
      SELECT 
        r.room_id,
        r.room_name,
        r.is_group,
        r.avatar AS group_avatar,
        m.content AS last_message,
        m.sent_at AS last_message_date,
        m.fileUrl AS last_file_url,
        sender.username AS last_sender_username,
        CASE 
          WHEN r.is_group = 1 THEN NULL 
          ELSE (
            SELECT u2.user_id 
            FROM room_members rm2 
            JOIN users u2 ON u2.user_id = rm2.user_id 
            WHERE rm2.room_id = r.room_id AND rm2.user_id != ?
            LIMIT 1
          )
        END AS other_user_id,
        CASE 
          WHEN r.is_group = 1 THEN NULL 
          ELSE (
            SELECT u2.username 
            FROM room_members rm2 
            JOIN users u2 ON u2.user_id = rm2.user_id 
            WHERE rm2.room_id = r.room_id AND rm2.user_id != ?
            LIMIT 1
          )
        END AS other_username,
        CASE 
          WHEN r.is_group = 1 THEN NULL 
          ELSE (
            SELECT u2.avatar 
            FROM room_members rm2 
            JOIN users u2 ON u2.user_id = rm2.user_id 
            WHERE rm2.room_id = r.room_id AND rm2.user_id != ?
            LIMIT 1
          )
        END AS other_avatar
      FROM rooms r
      JOIN room_members rm ON rm.room_id = r.room_id AND rm.user_id = ?
      LEFT JOIN (
        SELECT m1.*, u.username
        FROM messages m1
        JOIN users u ON u.user_id = m1.sender_id
        JOIN (
          SELECT chat_id, MAX(sent_at) AS max_created
          FROM messages
          GROUP BY chat_id
        ) latest ON latest.chat_id = m1.chat_id AND latest.max_created = m1.sent_at
      ) m ON m.chat_id = r.room_id
      LEFT JOIN users sender ON sender.user_id = m.sender_id
      ORDER BY m.sent_at DESC
    `;

    const rows = await all(sql, [userId, userId, userId, userId]);

    return rows.map(row => ({
      room_id: row.room_id,
      room_name: row.room_name,
      is_group: row.is_group,
      avatar: row.is_group ? row.group_avatar : null,
      last_message: row.last_message,
      last_message_date: row.last_message_date,
      last_file_url: row.last_file_url,
      last_sender_username: row.last_sender_username,
      user: row.is_group
        ? null
        : {
            user_id: row.other_user_id,
            username: row.other_username,
            avatar: row.other_avatar
          }
    }));
  }

  /**
   * Sprawdza, czy dany pokój to pokój grupowy (is_group = 1).
   */
  async function isGroupRoom(roomId) {
    return await get(
      "SELECT * FROM rooms WHERE room_id = ? AND is_group = 1",
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
    notifyUsersRoomCreated,
    checkRoomAccess,
    getUserRooms,
    createRoom,
    addUserToRoom,
    isGroupRoom,
    getDirectRoom,
    getUserRoomsWithLastMessages
  };
}
