const db = require("../config/database");

exports.createPoll = async (req, res) => {
  const { question, options, chatId } = req.body;
  const userId = req.user.user_id;

  if (!question || !Array.isArray(options) || options.length < 2) {
    return res.status(400).json({ error: "Invalid poll data" });
  }

  if (!chatId) {
    return res.status(400).json({ error: "Chat ID is required" });
  }

  try {
    // Check if user is member of the chat/group
    const isMember = await new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM room_members WHERE room_id = ? AND user_id = ?`,
        [chatId, userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!isMember) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    // Check if it's a group chat
    const room = await new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM rooms WHERE room_id = ? AND is_group = 1`,
        [chatId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!room) {
      return res.status(400).json({ error: "Polls can only be created in group chats" });
    }

    // Create the poll
    const pollId = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO polls (question, options, creator_id, chat_id) VALUES (?, ?, ?, ?)`,
        [question, JSON.stringify(options), userId, chatId],
        function (err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    // Get the created poll with creator info
    const poll = await new Promise((resolve, reject) => {
      db.get(
        `SELECT p.*, u.username as creator_username 
         FROM polls p 
         JOIN users u ON p.creator_id = u.user_id 
         WHERE p.poll_id = ?`,
        [pollId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (poll) {
      poll.options = JSON.parse(poll.options);
    }

    res.status(201).json(poll);
  } catch (error) {
    console.error("Error creating poll:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getPolls = async (req, res) => {
  const { chatId } = req.query;
  const userId = req.user.user_id;

  if (!chatId) {
    return res.status(400).json({ error: "Chat ID is required" });
  }

  try {
    // Check if user is member of the chat
    const isMember = await new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM room_members WHERE room_id = ? AND user_id = ?`,
        [chatId, userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!isMember) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    const polls = await new Promise((resolve, reject) => {
      db.all(
        `SELECT p.*, u.username as creator_username 
         FROM polls p 
         JOIN users u ON p.creator_id = u.user_id 
         WHERE p.chat_id = ?
         ORDER BY p.created_at DESC`,
        [chatId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    // Parse options and add vote counts
    for (const poll of polls) {
      poll.options = JSON.parse(poll.options);
      
      // Get vote counts for each option
      const votes = await new Promise((resolve, reject) => {
        db.all(
          `SELECT option_id, COUNT(*) as vote_count 
           FROM votes 
           WHERE poll_id = ? 
           GROUP BY option_id`,
          [poll.poll_id],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      });

      // Get user's votes
      const userVotes = await new Promise((resolve, reject) => {
        db.all(
          `SELECT option_id FROM votes WHERE poll_id = ? AND user_id = ?`,
          [poll.poll_id, userId],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows.map(row => row.option_id));
          }
        );
      });

      poll.votes = votes;
      poll.userVotes = userVotes;
      poll.totalVotes = votes.reduce((sum, vote) => sum + vote.vote_count, 0);
    }

    res.status(200).json(polls);
  } catch (error) {
    console.error("Error fetching polls:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.votePoll = async (req, res) => {
  try {
    const { pollId, optionIndex } = req.body;
    const userId = req.user.user_id;

    if (pollId === undefined || optionIndex === undefined) {
      return res.status(400).json({ error: "Poll ID and option index are required" });
    }

    // Check if the poll exists
    const poll = await new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM polls WHERE poll_id = ?`,
        [pollId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!poll) {
      return res.status(404).json({ error: "Poll not found" });
    }

    // Check if user is member of the chat
    const isMember = await new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM room_members WHERE room_id = ? AND user_id = ?`,
        [poll.chat_id, userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!isMember) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    // Check if the user has already voted
    const hasVoted = await new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM votes WHERE poll_id = ? AND user_id = ?`,
        [pollId, userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (hasVoted) {
      return res.status(400).json({ error: "User has already voted" });
    }

    // Validate option index
    const options = JSON.parse(poll.options);
    if (optionIndex < 0 || optionIndex >= options.length) {
      return res.status(400).json({ error: "Invalid option index" });
    }

    // Cast the vote
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO votes (poll_id, option_id, user_id) VALUES (?, ?, ?)`,
        [pollId, optionIndex, userId],
        function (err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    res.status(201).json({ message: "Vote cast successfully" });
  } catch (error) {
    console.error("Error voting on poll:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
