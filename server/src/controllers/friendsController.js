const db = require("../config/database");

exports.getFriendsWithLastMessage = async (req, res) => {
  const userId = req.user.user_id;

  try {
    const friendships = await new Promise((resolve, reject) => {
      const sql = `SELECT user1_id, user2_id FROM friendships WHERE user1_id = ? OR user2_id = ?`;
      db.all(sql, [userId, userId], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });

    const friendIds = friendships.map(f => (f.user1_id === userId ? f.user2_id : f.user1_id));
    if (friendIds.length === 0) return res.json([]);

    const placeholders = friendIds.map(() => "?").join(",");
    const friends = await new Promise((resolve, reject) => {
      const sql = `SELECT user_id, username, avatar FROM users WHERE user_id IN (${placeholders})`;
      db.all(sql, friendIds, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });


    const enrichedFriends = await Promise.all(friends.map(async (friend) => {
      const lastMessage = await new Promise((resolve) => {
        const sql = `
          SELECT r.room_id, m.content, m.fileUrl, m.sent_at, u.username AS senderUsername
          FROM messages m
          JOIN users u ON u.user_id = m.sender_id
          JOIN rooms r ON room_id = m.chat_id
          WHERE m.chat_id = (
            SELECT r.room_id
            FROM rooms r
            JOIN room_members rm1 ON rm1.room_id = r.room_id AND rm1.user_id = ?
            JOIN room_members rm2 ON rm2.room_id = r.room_id AND rm2.user_id = ?
            WHERE r.is_group = 0
            LIMIT 1
          )
          ORDER BY m.sent_at DESC
          LIMIT 1
        `;

        db.get(sql, [userId, friend.user_id], (err, row) => {
          if (err || !row) return resolve(null);
          resolve(row);
        });
      });
      const emptyMessages = [
        "No messages yet",
        "Start the conversation",
        "Say hello!",
        "Be the first to message",
        "Break the ice!"
      ];

      return {
        ...friend,
        last_message: lastMessage?.content ? lastMessage?.content?.slice(0, 20) + (lastMessage?.content?.length > 20 ? "..." : "") : emptyMessages[Math.floor(Math.random() * emptyMessages.length)],
        last_message_date: lastMessage?.sent_at || null,
        last_file_url: lastMessage?.fileUrl || null,
        last_sender_username: lastMessage?.senderUsername || null,
        room_id : lastMessage?.room_id || null
      };
    }));

    enrichedFriends.sort((a, b) => {
      const dateA = a.last_message_date ? new Date(a.last_message_date) : 0;
      const dateB = b.last_message_date ? new Date(b.last_message_date) : 0;
      return dateB - dateA;
    });
    res.json(enrichedFriends);
  } catch (err) {
    console.error("Error in /friends-with-last-message:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getFriendRequests = (req, res) => {
  const userId = req.user.user_id;

  const sql = `
    SELECT fr.sender_id, u.username, u.avatar
    FROM friend_requests fr
    JOIN users u ON fr.sender_id = u.user_id
    WHERE fr.receiver_id = ? AND fr.status = 'pending'
  `;

  db.all(sql, [userId], (err, rows) => {
    if (err) {
      console.error("Error fetching friend requests:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(rows);
  });
};

exports.getFriends = async (req, res) => {
  const userId = req.user.user_id;

  if (!userId) {
    return res.status(400).json({ error: "Invalid userId" });
  }

  try {
    const friendships = await new Promise((resolve, reject) => {
      const sql = `SELECT user1_id, user2_id FROM friendships WHERE user1_id = ? OR user2_id = ?`;
      db.all(sql, [userId, userId], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });

    const friendIds = friendships.map(f => (f.user1_id === userId ? f.user2_id : f.user1_id));

    if (friendIds.length === 0) return res.json([]);

    const placeholders = friendIds.map(() => '?').join(',');
    const users = await new Promise((resolve, reject) => {
      const sql = `SELECT user_id, username, avatar FROM users WHERE user_id IN (${placeholders})`;
      db.all(sql, friendIds, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });

    console.log(users);
    res.json(users);

  } catch (err) {
    console.error('Error fetching friends:', err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.friendRequestSend = async (req, res) => {
  const senderId = req.user.user_id;
  const { recieverUsername } = req.body;

  if (!recieverUsername) {
    return res.status(400).json({ error: "Invalid recieverUsername" });
  }

  try {
    // Pobierz user_id po username
    const receiverUser = await new Promise((resolve, reject) => {
      db.get("SELECT user_id FROM users WHERE username = ?", [recieverUsername], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });

    if (!receiverUser) {
      return res.status(404).json({ error: "Receiver user not found" });
    }

    const recieverId = receiverUser.user_id;

    if (recieverId === senderId) {
      return res.status(400).json({ error: "Cannot add yourself as friend" });
    }
    const existing = await new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM friend_requests 
        WHERE (sender_id = ? AND receiver_id = ?) 
           OR (sender_id = ? AND receiver_id = ?)
        LIMIT 1
      `;
      db.get(sql, [senderId, recieverId, recieverId, senderId], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });

    if (existing) {
      if (existing.status === "pending" || existing.status === "accepted") {
        return res.status(400).json({ error: "Friend request already exists or users are already friends" });
      }

      if (existing.status === "rejected") {
        // Aktualizuj status z 'rejected' na 'pending'
        const updated = await new Promise((resolve, reject) => {
          const sql = `
            UPDATE friend_requests
            SET sender_id = ?, receiver_id = ?, status = 'pending', created_at = datetime('now')
            WHERE frequest_id = ?
          `;
          db.run(sql, [senderId, recieverId, existing.frequest_id], function (err) {
            if (err) return reject(err);
            resolve(this.changes);
          });
        });

        return res.json({ success: true, message: "Friend request re-sent" });
      }
    }

    // Jeśli nie ma żadnego zaproszenia, utwórz nowe
    await db.run(
      `INSERT INTO friend_requests (sender_id, receiver_id) VALUES (?, ?)`,
      [senderId, recieverId]
    );

    res.status(201).json({ success: true, message: "Friend request sent" });
  } catch (err) {
    console.error("Error sending friend request:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.friendRequestAccept = async (req, res) => {
  const recieverId = req.user.user_id;
  const {senderId} = req.body;

  try {
    const updated = await new Promise((resolve,reject) => {
    const sql = `
      UPDATE friend_requests 
      SET status = 'accepted' 
      WHERE sender_id = ? AND receiver_id = ? AND status = 'pending'
    `;

    db.run(sql, [senderId, recieverId], function(err) {
      if (err) resolve(err);
      resolve(this.changes);
    });
    });

    if (updated === 0) {
      return res.status(400).json({ error: 'No pending friend request found' });
    }

    const [user1, user2] = senderId < recieverId ? [senderId, recieverId] : [recieverId, senderId];

    await new Promise((resolve,reject) => {
      const sql = `INSERT INTO friendships (user1_id, user2_id) VALUES (?, ?)`;
      db.run(sql, [user1, user2], function(err) {
        if (err) return reject(err);
        resolve(this.lastID);
      });
    });

    emitToUser(io, recieverId, 'friend-added', { friendId: senderId });
    emitToUser(io, senderId, 'friend-added', { friendId: recieverId });
    res.json({success: true, message:"Friend request accepted"});

  } catch (err) {

    console.error("Accept friend request error: ", err);
    res.status(500).json({error: "Server error"});
  }
};

exports.friendRequestDecline = async (req, res) => {
  const receiverId = req.user.user_id;
  const {senderId} = req.body;

  try {
    const updated = await new Promise((resolve, reject) => {
      const sql = `
        UPDATE friend_requests 
        SET status = 'rejected' 
        WHERE sender_id = ? AND receiver_id = ? AND status = 'pending'
      `;
      db.run(sql, [senderId, receiverId], function(err) {
        if (err) return reject(err);
        resolve(this.changes);
      });
    });

    if (updated === 0) {
      return res.status(400).json({error: "No pending friend request found"});
    }

    res.json({success: true, message: "Friend request rejected"});
  } catch (err) {
    console.error("Reject friend request error:", err);
    res.status(500).json({error: "Server error"});
  }
};