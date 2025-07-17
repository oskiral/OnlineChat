import React, { useState } from "react";
import { API_BASE_URL, API_ENDPOINTS } from "../../constants";
import "../../styles/FriendSearch.css";

export default function FriendSearch({ token, onFriendAdded }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setMessage("Please enter a username to search");
      return;
    }

    setLoading(true);
    setMessage("");
    setSearchResults([]);

    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USER.SEARCH}?q=${searchQuery}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const results = await response.json();
      setSearchResults(results);
      
      if (results.length === 0) {
        setMessage("No users found");
      }
    } catch (error) {
      console.error("Search error:", error);
      setMessage("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendFriendRequest = async (username) => {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.FRIENDS.SEND_REQUEST}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ recieverUsername: username }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`Friend request sent to ${username}!`);
        // Remove user from results after sending request
        setSearchResults(searchResults.filter(user => user.username !== username));
        if (onFriendAdded) onFriendAdded();
      } else {
        setMessage(data.error || "Failed to send friend request");
      }
    } catch (error) {
      console.error("Send friend request error:", error);
      setMessage("Failed to send friend request. Please try again.");
    }
  };

  return (
    <div className="friend-search">
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          className="search-input"
        />
        <button 
          className="search-button" 
          onClick={handleSearch}
          disabled={loading}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>
      
      {message && (
        <div className="search-message" style={{ 
          color: message.includes("sent") ? "#22c55e" : "#f56565",
          margin: "1rem 0",
          padding: "0.5rem",
          borderRadius: "6px",
          background: message.includes("sent") ? "rgba(34, 197, 94, 0.1)" : "rgba(245, 101, 101, 0.1)"
        }}>
          {message}
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="search-results">
          <h3>Search Results:</h3>
          {searchResults.map((user) => (
            <div key={user.user_id} className="search-result-item">
              <img 
                src={user.avatar || "/media/default.jpg"} 
                alt={user.username}
                className="search-result-avatar"
              />
              <span className="search-result-username">{user.username}</span>
              <button 
                className="send-request-btn"
                onClick={() => handleSendFriendRequest(user.username)}
              >
                Add Friend
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
