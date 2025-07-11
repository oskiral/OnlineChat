const jwt = require('jsonwebtoken');
const {JWT_SECRET} = require("../config/config");
const db = require("../config/database");

module.exports = function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err || !decoded?.username || !decoded?.sessionId) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const currentIp = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || 'unknown';

    db.get(
      `SELECT u.*, s.ip_address FROM users u 
       JOIN sessions s ON u.user_id = s.user_id 
       WHERE u.username = ? AND s.session_uuid = ? AND s.logout_time IS NULL`,
      [decoded.username, decoded.sessionId],
      (err, user) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (!user) return res.status(401).json({ error: "Session inactive or user not found" });

        
        if (user.ip_address !== currentIp) {
          return res.status(401).json({ error: "IP address mismatch" });
        }

        req.user = user;
        req.sessionId = decoded.sessionId;
        next();
      }
    );
  });
}