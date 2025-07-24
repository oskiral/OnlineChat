import { useState } from "react";
import "../../styles/Modal.css";

export default function CreatePollModal({ isOpen, onClose, onCreatePoll }) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);

  const handleAddOption = () => {
    if (options.length < 10) {
      setOptions([...options, ""]);
    }
  };

  const handleRemoveOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!question.trim()) {
      alert("Please enter a question");
      return;
    }

    const validOptions = options.filter(option => option.trim());
    if (validOptions.length < 2) {
      alert("Please provide at least 2 options");
      return;
    }

    onCreatePoll({
      question: question.trim(),
      options: validOptions
    });

    // Reset form
    setQuestion("");
    setOptions(["", ""]);
    onClose();
  };

  const handleCancel = () => {
    setQuestion("");
    setOptions(["", ""]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create Poll</h3>
          <button className="modal-close" onClick={handleCancel}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label htmlFor="poll-question">Question:</label>
            <input
              id="poll-question"
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What would you like to ask?"
              maxLength={200}
              required
            />
          </div>

          <div className="form-group">
            <label>Options:</label>
            {options.map((option, index) => (
              <div key={index} className="option-input-group">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  maxLength={100}
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    className="remove-option-btn"
                    onClick={() => handleRemoveOption(index)}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            
            {options.length < 10 && (
              <button
                type="button"
                className="add-option-btn"
                onClick={handleAddOption}
              >
                + Add Option
              </button>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" onClick={handleCancel} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Create Poll
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
