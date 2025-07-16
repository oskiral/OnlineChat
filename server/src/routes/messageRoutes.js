const express = require('express');
const messageController = require("../controllers/messageController");
const authenticate = require("../middleware/authenticate");
const router = express.Router();
const upload = require("../middleware/uploadFile");

router.post("/upload", upload.single("file"), authenticate, messageController.upload);
router.get("/unread-counts", authenticate, messageController.unreadCounts);

module.exports = router;