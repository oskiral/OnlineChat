const express = require('express');
const pollController = require("../controllers/pollController");
const authenticate = require("../middleware/authenticate");
const router = express.Router();

router.post("/", authenticate, pollController.createPoll);
router.get("/", authenticate, pollController.getPolls);
router.post("/vote", authenticate, pollController.votePoll);

module.exports = router;