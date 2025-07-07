import React, { useEffect, useState } from "react";

export default function FriendList({ token, onSelectedChat, selectedChat }) {
  const [friends, setFriends] = useState([]);
  const [error, setError] = useState("");

  async function fetchFriendsWithMessages() {
    try {
      const res = await fetch("http://localhost:3001/friends-with-last-message", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch friends");
      const data = await res.json();
      setFriends(data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    fetchFriendsWithMessages();
  }, []);

  async function handleFriendClick(friend) {
    try {
      const res = await fetch("http://localhost:3001/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ memberId: friend.user_id }),
      });

      if (!res.ok) throw new Error("Failed to create or fetch room");
      const room = await res.json();

      onSelectedChat({
        room_id: room.room_id,
        user: friend,
        type: room.is_group ? "group" : "direct",
      });
    } catch (err) {
      console.error("Error starting chat:", err);
      setError("Could not open chat");
    }
  }

  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (friends.length === 0) return <div>No friends yet</div>;

  return (
    <div className="chat-page">
      <div className="chats-header">
        <h1>Messages</h1>
      </div>
      <div className="chat-list">
        {friends.map((f) => (
          <div
            key={f.user_id}
            className={
              "chat-preview" +
              (selectedChat?.user.user_id === f.user_id ? " active" : "")
            }
            onClick={() => handleFriendClick(f)}
          >
            <div className="chat-avatar">
              <img src={f.avatar || "/media/default.jpg"} alt="User" />
            </div>
            <div className="chat-info">
              <strong>{f.username}</strong>
              <p className="last-message">
                {f.last_message
                  ? f.last_message
                  : f.last_file_url
                    ? /\.(jpe?g|png|gif|webp)$/i.test(f.last_file_url)
                      ? `${f.last_sender_username} sent a photo.`
                      : `${f.last_sender_username} sent a file.`
                    : "No messages yet..."}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
