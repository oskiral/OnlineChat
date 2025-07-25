const express = require('express');
const groupController = require("../controllers/groupController");
const authenticate = require("../middleware/authenticate");
const uploadAvatar = require("../middleware/uploadAvatar");
const router = express.Router();

router.get("/:groupId", authenticate, groupController.getGroup);
router.post("/:groupId/avatar", authenticate, uploadAvatar.single("avatar"), groupController.uploadGroupAvatar);

module.exports = router;