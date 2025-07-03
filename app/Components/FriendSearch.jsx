import React, { useState } from "react";

export default function FriendSearch({ token, onFriendAdded }) {
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState("");

  async function sendFriendRequest() {
    if (!username.trim()) {
      setStatus("Please enter a username");
      return;
    }
    setStatus("Sending request...");
    try {
      const res = await fetch("http://localhost:3001/friend-requests/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ recieverUsername: username }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("Friend request sent!");
        setUsername("");
        onFriendAdded(); // odśwież listę znajomych
      } else {
        setStatus(data.error || "Error sending request");
      }
    } catch (e) {
      setStatus("Network error");
    }
  }

  return (
    <div style={{ display: "flex", marginBottom: 20 }}>
      <input
        type="text"
        placeholder="Enter friend username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{ flexGrow: 1, padding: "8px", fontSize: 16 }}
      />
      <button onClick={sendFriendRequest} style={{ marginLeft: 8, padding: "8px 12px" }}>
        +
      </button>
      <div style={{ marginLeft: 12, color: "red", minWidth: 150 }}>{status}</div>
    </div>
  );
}