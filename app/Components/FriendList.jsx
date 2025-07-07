import React, { useEffect, useState } from "react";

export default function FriendList({ token, onSelectedChat, selectedChat }) {
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

  async function handleFriendClick(friend) {
    try {
      const res = await fetch("http://localhost:3001/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ memberId: friend.user_id }), // Tworzy direct room
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
      setError("Failed to start chat");
    }
  }

  return (
    // <div className="friends-list">
    //   <h2>Friends</h2>
    //   <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
    //     {friends.map((f) => (
    //       <li
    //         key={f.user_id}
    //         onClick={() => {handleFriendClick(f)}}
    //         className={
    //           "friend-item" +
    //           (selectedChat?.type === "dm" && selectedChat.user.user_id === f.user_id
    //             ? " selected"
    //             : "")
    //         }
    //       >
    //         <img src={f.avatar || "../media/default.jpg"} alt="" />
    //         <span>{f.username}</span>
    //       </li>
    //     ))}
    //   </ul>
    // </div>
    <div className="chat-page">
    <div className="chats-header">
      <h1>Messages</h1>
    </div>
    <div className="chat-list">
      {friends.map((f) => (
        
      <div
      className={"chat-preview" + (selectedChat?.type === "dm" && selectedChat.user.user_id === f.user_id ? " selected" : "")}
      onClick={() => {handleFriendClick(f)}}
      key={f.user_id}
      >
        <div className="chat-avatar">
          <img src={f.avatar || "/media/default.jpg"} alt="User" />
        </div>
        <div className="chat-info">
          <strong>{f.username}</strong>
          <p>Hey, are you coming?</p>
        </div>
      </div>
      ))}

    {/* <div class="chat-preview active">
      <div class="chat-avatar">
        <img src="/media/default.jpg" alt="User" />
      </div>
      <div class="chat-info">
        <strong>Jane</strong>
        <p>I'll send the file now.</p>
      </div>
    </div> */}
    </div>
    </div>
  );
}
