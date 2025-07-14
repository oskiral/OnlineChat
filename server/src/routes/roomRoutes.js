const express = require('express');
const roomController = require("../controllers/roomController");
const authenticate = require("../middleware/authenticate");
const router = express.Router();

router.get("/", authenticate, roomController.getRooms);
router.post("/", authenticate, roomController.postRooms);

module.exports = router;