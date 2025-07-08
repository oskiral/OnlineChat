import React, { useState } from "react";
import "./FriendSearch.css";

export default function FriendSearch({ token }) {
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState("");

  async function sendFriendRequest() {
    if (!username.trim()) {
      setStatus("Please enter a username");
      return;
    }
    setStatus("Sending request…");

    try {
      const res = await fetch("http://localhost:3001/friend-requests/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ recieverUsername: username.trim() }),
      });

      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        console.error("Failed to parse JSON:", jsonErr);
        throw new Error(`Server returned ${res.status}`);
      }

      if (res.ok) {
        setStatus("✅ Friend request sent!");
        setUsername("");
      } else {
        console.warn("API error:", data);
        setStatus(data.error || `Error ${res.status}`);
      }
    } catch (err) {
      console.error("Request failed:", err);
      setStatus(err.message.includes("Failed to fetch") 
        ? "Network error – please check server & CORS" 
        : err.message);
    }
  }

  return (
    <div className="friend-search">
      <input
        type="text"
        placeholder="Enter friend username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="friend-search-input"
        onKeyDown={(e) => e.key === "Enter" && sendFriendRequest()}
      />
      <button onClick={sendFriendRequest} className="friend-search-button">
        +
      </button>
      <div className="friend-search-status">{status}</div>
    </div>
  );
}