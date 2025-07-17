const express = require('express');
const friendsController = require("../controllers/friendsController");
const authenticate = require("../middleware/authenticate");
const router = express.Router();

router.get("/getFriendsWithLastMessage", authenticate, friendsController.getFriendsWithLastMessage);
router.get("/getFriends", authenticate, friendsController.getFriends);
router.get("/friendRequests", authenticate, friendsController.getFriendRequests);
router.post("/friendRequests/send", authenticate, friendsController.friendRequestSend);
router.post("/friendRequests/accept", authenticate, friendsController.friendRequestAccept);
router.post("/friendRequests/decline", authenticate, friendsController.friendRequestDecline);

module.exports = router;