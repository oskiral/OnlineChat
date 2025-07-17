import React, { useState, useEffect } from "react";

export default function FriendRequests() {
  const [requests, setRequests] = useState([]);

  return (
    <div className="friend-requests">
      <h2>Friend Requests</h2>
      {requests.length === 0 ? (
        <p>No pending friend requests</p>
      ) : (
        requests.map((request) => (
          <div key={request.id} className="friend-request">
            {/* Friend request content */}
          </div>
        ))
      )}
    </div>
  );
}
