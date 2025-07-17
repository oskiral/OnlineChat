import React, { useState, useEffect } from "react";
import { API_BASE_URL, API_ENDPOINTS } from "../../constants";
import FriendRequestCard from "./FriendRequestCard";

export default function FriendRequests({ token, onFriendAdded }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchFriendRequests();
  }, []);

  const fetchFriendRequests = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.FRIENDS.REQUESTS}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch friend requests");
      }

      const data = await response.json();
      setRequests(data);
    } catch (err) {
      console.error("Error fetching friend requests:", err);
      setError("Failed to load friend requests");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestResponse = (senderId, accepted) => {
    // Remove the request from the list
    setRequests(requests.filter(req => req.sender_id !== senderId));
    
    // If accepted, trigger friend list refresh
    if (accepted && onFriendAdded) {
      onFriendAdded();
    }
  };

  if (loading) {
    return (
      <div className="friend-requests">
        <h2>Friend Requests</h2>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="friend-requests">
        <h2>Friend Requests</h2>
        <p style={{ color: "#f56565" }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="friend-requests">
      <h2>Friend Requests</h2>
      {requests.length === 0 ? (
        <p>No pending friend requests</p>
      ) : (
        <div className="friend-requests-list">
          {requests.map((request) => (
            <FriendRequestCard
              key={request.sender_id}
              user={request}
              token={token}
              onResponse={handleRequestResponse}
            />
          ))}
        </div>
      )}
    </div>
  );
}
