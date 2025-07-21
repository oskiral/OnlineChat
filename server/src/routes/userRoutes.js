const express = require('express');
const userController = require("../controllers/userController");
const authenticate = require("../middleware/authenticate");
const uploadAvatar = require("../middleware/uploadAvatar");
const router = express.Router();


router.get("/me", authenticate, userController.me);
router.get("/search", authenticate, userController.userSearch);
router.post("/uploadAvatar", authenticate, uploadAvatar.single("avatar"),userController.uploadAvatar);
router.post("/removeAvatar", authenticate, userController.removeAvatar);

router.post("/changeUsername", authenticate, userController.changeUsername);
router.post("/changePassword", authenticate, userController.changePassword);

router.get("/:id", authenticate, userController.userById);

module.exports = router;