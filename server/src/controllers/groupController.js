const db = require('../config/database');
const { getIoInstance } = require('../utils/ioInstance');


exports.getGroup = (req, res) => {
    const { groupId } = req.params;
    db.get(
        `SELECT * FROM rooms WHERE room_id = ? AND is_group = 1`,
        [groupId],
        (err, group) => {
            if (err) {
                console.error("Error fetching group:", err);
                return res.status(500).json({ message: "Internal server error" });
            }
            if (!group) {
                return res.status(404).json({ message: "Group not found" });
            }
            db.all(
                `SELECT u.user_id, u.username, u.avatar
                 FROM room_members rm
                 JOIN users u ON rm.user_id = u.user_id
                 WHERE rm.room_id = ?`,
                [groupId],
                (err, members) => {
                    if (err) {
                        console.error("Error fetching members:", err);
                        return res.status(500).json({ message: "Internal server error" });
                    }
                    group.members = members;
                    res.json(group);
                }
            );
        }
    );
};

exports.uploadGroupAvatar = (req, res) => {
    const { groupId } = req.params;
    const io = getIoInstance();
    console.log("📤 Upload group avatar request:", { groupId, hasFile: !!req.file, body: req.body });
    
    const fileUrl = req.file ? `/uploads/avatars/${req.file.filename}` : null;

    if (!fileUrl) {
        console.log("❌ No file uploaded");
        return res.status(400).json({ message: "No file uploaded" });
    }

    console.log("💾 Updating group avatar in database:", { groupId, fileUrl });
    
    db.run(
        `UPDATE rooms SET avatar = ? WHERE room_id = ? AND is_group = 1`,
        [fileUrl, groupId],
        function(err) {
            if (err) {
                console.error("Error updating group avatar:", err);
                return res.status(500).json({ message: "Internal server error" });
            }
            
            console.log("✅ Group avatar updated successfully, changes:", this.changes);
            
            // Notify all members of the group about avatar update
            if (io) {
                db.all(
                    `SELECT user_id FROM room_members WHERE room_id = ?`,
                    [groupId],
                    (err, members) => {
                        if (!err && members) {
                            members.forEach(member => {
                                io.to(`user:${member.user_id}`).emit('groupAvatarUpdated', {
                                    groupId: parseInt(groupId),
                                    avatar: fileUrl
                                });
                            });
                        }
                    }
                );
            }
            
            res.json({ message: "Group avatar updated successfully", fileUrl });
        }
    );
};
