const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'chat.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database ' + err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

db.serialize(() => {

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // messages now reference chat_id, which can be group or direct chat rooms
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      message_id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      chat_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      fileUrl TEXT,
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      delivered BOOLEAN DEFAULT 0,
      FOREIGN KEY (sender_id) REFERENCES users(user_id),
      FOREIGN KEY (chat_id) REFERENCES rooms(room_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS message_reads (
      message_id INTEGER,
      user_id INTEGER,
      read_at DATETIME,
      PRIMARY KEY (message_id, user_id),
      FOREIGN KEY (message_id) REFERENCES messages(message_id),
      FOREIGN KEY (user_id) REFERENCES users(user_id)
);
    `)

  db.run(`
    CREATE TABLE IF NOT EXISTS rooms (
      room_id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_name TEXT,
      is_group BOOLEAN DEFAULT 0,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(user_id)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS room_members (
      room_member_id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (room_id) REFERENCES rooms(room_id),
      FOREIGN KEY (user_id) REFERENCES users(user_id)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      session_id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_uuid TEXT UNIQUE,
      user_id INTEGER NOT NULL,
      login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      logout_time DATETIME DEFAULT NULL,
      ip_address TEXT,
      user_agent TEXT,
      FOREIGN KEY (user_id) REFERENCES users(user_id)
    );  
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS friendships (
      friendship_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user1_id INTEGER NOT NULL,
      user2_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user1_id, user2_id),
      FOREIGN KEY(user1_id) REFERENCES users(user_id),
      FOREIGN KEY(user2_id) REFERENCES users(user_id)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS friend_requests (
      frequest_id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(sender_id, receiver_id),
      FOREIGN KEY(sender_id) REFERENCES users(user_id),
      FOREIGN KEY(receiver_id) REFERENCES users(user_id)
    );
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS polls (
      poll_id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      options TEXT NOT NULL, -- Store options as a JSON string
      creator_id INTEGER NOT NULL,
      chat_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (creator_id) REFERENCES users(user_id),
      FOREIGN KEY (chat_id) REFERENCES rooms(room_id)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS votes (
      vote_id INTEGER PRIMARY KEY AUTOINCREMENT,
      poll_id INTEGER NOT NULL,
      option_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (poll_id) REFERENCES polls(poll_id),
      FOREIGN KEY (user_id) REFERENCES users(user_id)
    );
  `);

});

module.exports = db;
