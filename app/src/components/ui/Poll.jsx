import { useState } from "react";
import "../../styles/Poll.css";

export default function Poll({ 
  question, 
  options, 
  onVote, 
  allowMultiple = false, 
  showResults = false, 
  results = {},
  userVotes = [],
  totalVotes = 0,
  createdBy,
  timeLeft
}) {
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [hasVoted, setHasVoted] = useState(userVotes.length > 0);

  const handleOptionSelect = (option, index) => {
    if (hasVoted && !showResults) return;
    
    if (allowMultiple) {
      setSelectedOptions(prev => 
        prev.includes(index) 
          ? prev.filter(i => i !== index)
          : [...prev, index]
      );
    } else {
      setSelectedOptions([index]);
    }
  };

  const handleVote = () => {
    if (selectedOptions.length === 0) return;
    
    const votedOptions = selectedOptions.map(index => options[index]);
    onVote(votedOptions);
    setHasVoted(true);
  };

  const getPercentage = (option) => {
    if (totalVotes === 0) return 0;
    return Math.round((results[option] || 0) / totalVotes * 100);
  };

  return (
    <div className="poll">
      <div className="poll-header">
        <h3 className="poll-title">{question}</h3>
        {createdBy && (
          <div className="poll-meta">
            <span className="poll-author">by {createdBy}</span>
            {timeLeft && <span className="poll-time">• {timeLeft}</span>}
          </div>
        )}
      </div>

      <div className="poll-options">
        {options.map((option, index) => {
          const isSelected = selectedOptions.includes(index);
          const isUserVote = userVotes.includes(option);
          const percentage = getPercentage(option);
          const voteCount = results[option] || 0;

          return (
            <div 
              key={index} 
              className={`poll-option ${isSelected ? 'selected' : ''} ${isUserVote ? 'user-voted' : ''}`}
              onClick={() => handleOptionSelect(option, index)}
            >
              <div className="poll-option-content">
                <span className="poll-option-text">{option}</span>
                {showResults && (
                  <div className="poll-option-stats">
                    <span className="poll-percentage">{percentage}%</span>
                    <span className="poll-votes">({voteCount})</span>
                  </div>
                )}
              </div>
              
              {showResults && (
                <div 
                  className="poll-option-bar"
                  style={{ width: `${percentage}%` }}
                />
              )}
              
              {isUserVote && <div className="user-vote-indicator">✓</div>}
            </div>
          );
        })}
      </div>

      {!hasVoted && !showResults && (
        <div className="poll-actions">
          <button 
            className={`poll-vote-btn ${selectedOptions.length === 0 ? 'disabled' : ''}`}
            onClick={handleVote}
            disabled={selectedOptions.length === 0}
          >
            Vote{allowMultiple && selectedOptions.length > 1 ? ` (${selectedOptions.length})` : ''}
          </button>
          {allowMultiple && (
            <span className="poll-hint">Select multiple options</span>
          )}
        </div>
      )}

      {showResults && (
        <div className="poll-summary">
          <span className="poll-total-votes">
            {totalVotes} vote{totalVotes !== 1 ? 's' : ''} total
          </span>
        </div>
      )}
    </div>
  );
}