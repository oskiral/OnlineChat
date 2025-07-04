import { useEffect, useState } from "react";

export default function FriendRequests({ token, onAccept, onReject }) {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3001/friend-requests", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then(setRequests)
      .catch(console.error);
  }, [token]);

  const handleAccept = (senderId) => {
    fetch("http://localhost:3001/friend-requests/accept", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ senderId }),
    }).then(() => {
      setRequests((prev) => prev.filter((r) => r.sender_id !== senderId));
      onAccept && onAccept(senderId);
    });
  };

  const handleReject = (senderId) => {
    fetch("http://localhost:3001/friend-requests/reject", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ senderId }),
    }).then(() => {
      setRequests((prev) => prev.filter((r) => r.sender_id !== senderId));
      onReject && onReject(senderId);
    });
  };

  return (
    <div>
      <h3>Friend Requests</h3>
      {requests.length === 0 ? (
        <p>No pending requests</p>
      ) : (
        <ul>
          {requests.map((req) => (
            <li key={req.sender_id}>
              <img src={req.avatar || "../media/default.jpg"} alt="avatar" width={32} /> {req.username}
              <button onClick={() => handleAccept(req.sender_id)}>Accept</button>
              <button onClick={() => handleReject(req.sender_id)}>Reject</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
