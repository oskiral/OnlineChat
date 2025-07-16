require("dotenv").config();
const path = require('path');
const db = require("../config/database");
const fs = require('fs');

exports.uploadAvatar = async (req, res) => {
    
  
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  if (!req.user || !req.user.username) return res.status(401).json({ error: 'Invalid token payload' });
  
  // Construct the file URL based on the environment variable or default to localhost
  const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT}`;
  const fileUrl = `${baseUrl}/src//uploads/avatars/${req.file.filename}`;
  const username = req.user.username;
  


    // Check if the user exists in the database

    db.get("SELECT avatar FROM users WHERE username = ?", [username], (err, row) => {
      if (err) {
        console.error('DB error while fetching old avatar:', err);
        return res.status(500).json({ error: 'Database error' });
      }



      // If the user has an old avatar, delete it from the filesystem
      if (row && row.avatar) {
        const oldAvatarUrl = row.avatar;

        // Extract the relative path from the old avatar URL
        let relativeAvatarPath = null;
        try {
          const urlObj = new URL(oldAvatarUrl);
          relativeAvatarPath = urlObj.pathname.startsWith('/')
            ? urlObj.pathname.slice(1)
            : urlObj.pathname;
        } catch {
          
          // if the old avatar URL is not a full URL, assume it's a relative path
          relativeAvatarPath = oldAvatarUrl.startsWith('/')
            ? oldAvatarUrl.slice(1)
            : oldAvatarUrl;
        }

        const oldAvatarFullPath = path.join(__dirname, "..", "..", relativeAvatarPath);
        fs.unlink(oldAvatarFullPath, (err) => {
          if (err) {
            console.warn('Old avatar not deleted:', err.message);
          }
        });
      }


      // Update the user's avatar in the database
      db.run("UPDATE users SET avatar = ? WHERE username = ?", [fileUrl, username], function(err) {
        if (err) {
          console.error('Error updating avatar:', err);
          return res.status(500).json({ error: 'Could not update avatar' });
        }

        res.json({ fileUrl });
      });
    });
};





exports.removeAvatar = async (req, res) => {
    const username = req.user.username;

    // Usuń plik starego awatara z serwera jeśli istnieje
    db.get("SELECT avatar FROM users WHERE username = ?", [username], (err, row) => {
      if (err) return res.status(500).json({ error: 'Database error' });

      if (row && row.avatar) {
        const avatarPath = row.avatar.startsWith('http')
          ? new URL(row.avatar).pathname
          : row.avatar;
        const fullPath = path.join(__dirname, "..", "..", avatarPath.startsWith('/') ? avatarPath.slice(1) : avatarPath);

        fs.unlink(fullPath, (err) => {
          if (err) console.warn("Failed to delete avatar file:", err.message);
        });
      }

      // Zresetuj avatar w DB na null lub ścieżkę do defaultowego
      db.run("UPDATE users SET avatar = NULL WHERE username = ?", [username], (err) => {
        if (err) return res.status(500).json({ error: 'Could not reset avatar' });

        res.json({ message: 'Avatar removed' });
      });
    });
};


exports.me = async (req, res) => {
    const username = req.user?.username;
    if (!username) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    db.get("SELECT user_id, username, avatar FROM users WHERE username = ?", [username], (err, row) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (!row) return res.status(404).json({ error: 'User not found' });
      res.json(row);
    });
};


exports.userSearch = async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) {
    return res.status(400).json({error: "Query too short"});
  }

  try {
    const users = await new Promise((resolve, reject) => {
      const sql = `SELECT user_id, username, avatar FROM users WHERE username LIKE ? LIMIT 20`;
      db.all(sql, [`%${q}%`], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
    res.json(users);
  } catch (err) {
    console.error('Search users error: ', err);
    res.status(500).json({error: 'Server error'});
  }
};

exports.userById = async (req, res) => {
  const userId = req.params.id;

  const sql = `SELECT user_id, username, avatar FROM users WHERE user_id = ?`;
  db.get(sql, [userId], (err, row) => {
    if (err) {
      console.error("Error fetching user by ID:", err);
      return res.status(500).json({ error: "Database error" });
    }
    if (!row) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(row);
  });
};

// exports.changeUsername = async (req, res) => {}
// exports.changePassword = async (req, res) => {}