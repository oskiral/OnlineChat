import React, { useState, useEffect } from "react";
import { useSocket } from "../utils/socketProvider";
import "./FriendsView.css";
import FriendCard from "./FriendCard";
import FriendRequestCard from "./FriendRequestCard";

export default function FriendsView() {
  const token = localStorage.getItem("token");
  const socket = useSocket();
  const [friends, setFriends] = useState([]);
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState("");
  const [friendRequests, setFriendRequests] = useState([]);

  // Fetch pending requests
  async function fetchFriendRequests() {
    try {
      const res = await fetch("http://localhost:3001/api/friends/friendRequests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch requests");
      setFriendRequests(data);
    } catch (err) {
      console.error(err);
      setStatus("Could not load friend requests");
    }
  }

  // Fetch confirmed friends
  async function fetchFriends() {
    try {
      const res = await fetch("http://localhost:3001/api/friends/getFriends", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch friends");
      setFriends(await res.json());
    } catch (err) {
      console.error(err);
    }
  }

  // Send a new friend request
  async function sendFriendRequest() {
    if (!username.trim()) {
      setStatus("Please enter a username");
      return;
    }
    setStatus("Sending request...");
    try {
      const res = await fetch("http://localhost:3001/api/friends/friendRequests/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ recieverUsername: username.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("Friend request sent!");
        setUsername("");
        // refresh the request list
        fetchFriendRequests();
      } else {
        setStatus(data.error || "Error sending request");
      }
    } catch {
      setStatus("Network error");
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      sendFriendRequest();
    }
  }

  function handleFriendResponse(senderId) {
    setFriendRequests((prev) =>
      prev.filter((req) => req.sender_id !== senderId)
    );
  }

  // initial data load
  useEffect(() => {
    fetchFriendRequests();
    fetchFriends();
  }, []);

  // Listen for real-time friend-added events
  useEffect(() => {
    if (!socket) return;

    const onFriendAdded = ({ friendId }) => {
      // 1) Remove from pending requests if present
      setFriendRequests((prev) =>
        prev.filter((req) => req.sender_id !== friendId)
      );
      // 2) Fetch the new friend's details and add to list
      fetch(`http://localhost:3001/users/${friendId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((newFriend) => {
          setFriends((prev) => {
            if (prev.some((f) => f.user_id === newFriend.user_id)) return prev;
            return [...prev, newFriend];
          });
        })
        .catch(console.error);
    };

    socket.on("friend-added", onFriendAdded);
    return () => {
      socket.off("friend-added", onFriendAdded);
    };
  }, [socket, token]);

  return (
    <div className="friends-view">
      <h2>Friends</h2>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search users..."
          className="search-input"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="search-button" onClick={sendFriendRequest}>
          send
        </button>
        <p className="status-message">{status}</p>
      </div>

      {friendRequests.length > 0 && (
        <>
          <h4>Friend Requests</h4>
          <div className="friend-list">
            {friendRequests.map((req) => (
              <FriendRequestCard
                key={req.sender_id}
                user={req}
                onResponse={handleFriendResponse}
                token={token}
              />
            ))}
          </div>
        </>
      )}

      <h4>Friends</h4>
      <div className="friend-list">
        {friends.map((friend) => (
          <FriendCard key={friend.user_id} user={friend} />
        ))}
      </div>
    </div>
  );
}
