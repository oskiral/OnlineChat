const db = require("../config/database.js");
const createRoomService = require('./utils/room.js');
const roomService = createRoomService(db);


// get
exports.getRooms = (req, res) => {
  const user = req.user;
  roomService.getUserRoomsWithLastMessages(user)
  .then((rooms) => res.json())
  .catch(err => {
    console.log("Error fetching rooms of the user");
    res.status(500).json({error: "Failed to fetch the rooms"})
  })
}

// POST /rooms
// If `memberId` is provided (and `is_group` is falsy), we treat it as a direct chat.
// If `is_group` is true, we require a `name` and create a group room.
exports.postRooms = async (req, res) => {
  const { memberId, name, is_group } = req.body;
  const user = req.user;

  try {
    // —— DIRECT CHAT ——
    if (memberId && !is_group) {
      // 1) Check for existing direct room between these two users
      const existing = await roomService.getDirectRoom(user.user_id, memberId);
      if (existing) {
        roomService.notifyUsersRoomCreated(io, [user.user_id, memberId], existing);
        return res.status(200).json(existing);
      }

      // 2) Create the new direct room (no name, is_group = 0)
      const roomId = await roomService.createRoom(null, user, false);
      await roomService.addUserToRoom(user.user_id, roomId);
      await roomService.addUserToRoom(memberId, roomId);

      const newRoom = { room_id: roomId, is_group: 0, name: null };
      roomService.notifyUsersRoomCreated(io, [user.user_id, memberId], newRoom);
      return res.status(201).json(newRoom);
    }

    // —— GROUP CHAT (future) ——
    if (is_group) {
      if (!name || !name.trim()) {
        return res.status(400).json({ error: "Group name is required" });
      }
      // Create group room with name
      const roomId = await roomService.createRoom(name.trim(), user, true);
      await roomService.addUserToRoom(user.user_id, roomId);
      // In future you’ll add extra members here, e.g. req.body.memberIds

      const newRoom = { room_id: roomId, is_group: 1, name: name.trim() };
      roomService.notifyUsersRoomCreated(io, [user.user_id], newRoom);
      return res.status(201).json(newRoom);
    }

    // —— INVALID REQUEST ——
    res.status(400).json({
      error: "Invalid payload: provide either memberId (direct) or is_group + name (group)",
    });
  } catch (err) {
    console.error("Error creating/fetching room:", err);
    res.status(500).json({ error: "Could not create room" });
  }
};