import { useState } from "react";
import "../../styles/Poll.css";

export default function Poll({ 
  poll,
  onVote,
  showResults = false,
  currentUserId
}) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasVoted, setHasVoted] = useState(poll.userVotes && poll.userVotes.length > 0);

  const handleOptionSelect = (optionIndex) => {
    if (hasVoted) return;
    setSelectedOption(optionIndex);
  };

  const handleVote = () => {
    if (selectedOption === null) return;
    
    onVote(poll.poll_id, selectedOption);
    setHasVoted(true);
  };

  const getVoteCount = (optionIndex) => {
    const vote = poll.votes?.find(v => v.option_id === optionIndex);
    return vote ? vote.vote_count : 0;
  };

  const getPercentage = (optionIndex) => {
    if (!poll.totalVotes || poll.totalVotes === 0) return 0;
    const voteCount = getVoteCount(optionIndex);
    return Math.round((voteCount / poll.totalVotes) * 100);
  };

  const isUserVote = (optionIndex) => {
    return poll.userVotes && poll.userVotes.includes(optionIndex);
  };

  return (
    <div className="poll">
      <div className="poll-header">
        <h3 className="poll-title">{poll.question}</h3>
        <div className="poll-meta">
          <span className="poll-author">by {poll.creator_username}</span>
          <span className="poll-time">• {new Date(poll.created_at).toLocaleString()}</span>
        </div>
      </div>

      <div className="poll-options">
        {poll.options.map((option, index) => {
          const isSelected = selectedOption === index;
          const isCurrentUserVote = isUserVote(index);
          const percentage = getPercentage(index);
          const voteCount = getVoteCount(index);

          return (
            <div 
              key={index} 
              className={`poll-option ${isSelected ? 'selected' : ''} ${isCurrentUserVote ? 'user-voted' : ''} ${hasVoted || showResults ? 'disabled' : ''}`}
              onClick={() => handleOptionSelect(index)}
            >
              <div className="poll-option-content">
                <span className="poll-option-text">{option}</span>
                {(showResults || hasVoted) && (
                  <div className="poll-option-stats">
                    <span className="poll-percentage">{percentage}%</span>
                    <span className="poll-votes">({voteCount})</span>
                  </div>
                )}
              </div>
              
              {(showResults || hasVoted) && (
                <div 
                  className="poll-option-bar"
                  style={{ width: `${percentage}%` }}
                />
              )}
              
              {isCurrentUserVote && <div className="user-vote-indicator">✓</div>}
            </div>
          );
        })}
      </div>

      {!hasVoted && !showResults && (
        <div className="poll-actions">
          <button 
            className={`poll-vote-btn ${selectedOption === null ? 'disabled' : ''}`}
            onClick={handleVote}
            disabled={selectedOption === null}
          >
            Vote
          </button>
        </div>
      )}

      {(showResults || hasVoted) && (
        <div className="poll-summary">
          <span className="poll-total-votes">
            {poll.totalVotes || 0} vote{(poll.totalVotes || 0) !== 1 ? 's' : ''} total
          </span>
        </div>
      )}
    </div>
  );
}