const db = require("../config/database.js");
const bcrypt = require('bcrypt');
const {v4: uuidv4} = require("uuid")
const jwt = require("jsonwebtoken");
const {userSockets} = require("../sockets/index.js");

const {JWT_SECRET} = require("../config/config.js");

exports.register = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  
  // Check if the username already exists in the database
  // This prevents duplicate usernames from being registered

  db.get("SELECT username FROM users WHERE username = ?", [username], async (err, row) => {
    if (err) return res.status(500).json({ error: 'Internal server error' });
    if (row) return res.status(400).json({ error: 'Username already exists' });
    
    // If the username is available, hash the password and store the user
    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert the new user into the database
      db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, hashedPassword], function(err) {
        if (err) return res.status(500).json({ error: 'Could not create user' });
        
        const userId = this.lastID; 
        const sessionId = uuidv4();
        
        // Generate a session ID and store session data in the database
        const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';


        // Insert session data into the database
        // This includes the session UUID, user ID, login time, IP address, and user
        // agent information for tracking user sessions
        // The session UUID is generated using uuidv4() to ensure uniqueness


        db.run("INSERT INTO sessions (session_uuid, user_id, login_time, ip_address, user_agent) VALUES (?, ?, datetime('now'), ?, ?)", 
          [sessionId, userId, ip, userAgent], function(err) {
            if (err) {
              return res.status(500).json({ error: 'Could not create session' });
            }
            const token = jwt.sign({ username, sessionId, user_id: userId }, JWT_SECRET, { expiresIn: '1h' });
            res.status(201).json({ username, token });
        });
      });
    } catch {
      res.status(500).json({ error: 'Error hashing password' });
    }
  });
};

// Login endpoint
// Validates user credentials and returns a JWT token
exports.login = async (req, res) => {

    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }


    db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Internal server error' });
        }
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const sessionUUID = uuidv4();
        const token = jwt.sign({ username: user.username, sessionId: sessionUUID, user_id: user.user_id }, JWT_SECRET, { expiresIn: '1h' });
  
        const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';

        db.run(`INSERT INTO sessions (session_uuid, user_id, login_time, ip_address, user_agent) VALUES (?, ?, datetime('now'), ?, ?)`, [sessionUUID, user.user_id, ip, userAgent], function(err) {
            if (err) {
                console.error('Error inserting session data:', err);
                return res.status(500).json({ error: 'Could not create session' });
            }
        });


        res.status(200).json({username: user.username, token });
    });
};

// endpoint to log out
exports.logout = (req, res) => {
  const sessionId = req.sessionId; // z authenticate
  const username = req.user.username;

  if (!sessionId || !username) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  db.run(
    "UPDATE sessions SET logout_time = datetime('now') WHERE session_uuid = ?",
    [sessionId],
    (err) => {
      if (err) {
        console.error('Error updating logout_time:', err);
        return res.status(500).json({ error: 'Could not log out' });
      }

      const socketsSet = userSockets.get(username);
      if (socketsSet) {
        socketsSet.forEach(socket => socket.emit("forceLogout"));
        setTimeout(() => {
          socketsSet.forEach(socket => socket.disconnect(true));
          userSockets.delete(username);
        }, 200);
      }

      return res.status(200).json({ message: 'Logged out from current session' });
    }
  );
};