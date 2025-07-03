import React, { useEffect, useState } from "react";

export default function FriendList({ token }) {
  const [friends, setFriends] = useState([]);
  const [error, setError] = useState("");

  async function fetchFriends() {
    setError("");
    try {
      const res = await fetch("http://localhost:3001/friends", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch friends");
      const data = await res.json();

      setFriends(data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    fetchFriends();
  }, []);

  if (error) {
    return <div style={{ color: "red" }}>Error: {error}</div>;
  }

  if (friends.length === 0) {
    return <div>No friends found</div>;
  }

  return (
    <ul style={{ listStyle: "none", paddingLeft: 0 }}>
      {friends.map((friend) => (
        <li key={friend.user_id} style={{ padding: "6px 0", borderBottom: "1px solid #eee" }}>
          {friend.username}
        </li>
      ))}
    </ul>
  );
}
