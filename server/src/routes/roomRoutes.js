const express = require('express');
const roomController = require("../controllers/roomController");
const authenticate = require("../middleware/authenticate");
const router = express.Router();

router.get("/", authenticate, roomController.getRooms);
router.post("/", authenticate, roomController.postRooms);
router.post("/createGroup", authenticate, roomController.createGroupRoom);
router.post("/addToGroup", authenticate, roomController.addToGroupRoom);

module.exports = router;