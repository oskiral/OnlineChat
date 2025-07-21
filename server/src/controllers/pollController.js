exports.createPoll = async (req, res) => {
  const { question, options } = req.body;
  const userId = req.user.id;

  if (!question || !Array.isArray(options) || options.length < 2) {
    return res.status(400).json({ error: "Invalid poll data" });
  }

  try {
    const poll = await Poll.create({
      question,
      options,
      creatorId: userId,
    });

    res.status(201).json(poll);
  } catch (error) {
    console.error("Error creating poll:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getPolls = async (req, res) => {
  try {
    const polls = await Poll.findAll({
      include: [{ model: User, as: 'creator' }],
    });

    res.status(200).json(polls);
  } catch (error) {
    console.error("Error fetching polls:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.votePoll = async (req, res) => {
    try {
        const { pollId, optionId } = req.body;
        const userId = req.user.id;

        // Check if the poll exists
        const poll = await Poll.findByPk(pollId);
        if (!poll) {
            return res.status(404).json({ error: "Poll not found" });
        }

        // Check if the user has already voted
        const hasVoted = await Vote.findOne({ where: { pollId, userId } });
        if (hasVoted) {
            return res.status(400).json({ error: "User has already voted" });
        }

        // Cast the vote
        await Vote.create({ pollId, optionId, userId });
        res.status(201).json({ message: "Vote cast successfully" });
    } catch (error) {
        console.error("Error voting on poll:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

// you think how should poll look in db?
// Poll model
// id: UUID (primary key)
// question: STRING
// options: ARRAY of STRING
// creatorId: UUID (foreign key to User)
// createdAt: TIMESTAMP
// updatedAt: TIMESTAMP
