import "./FriendsView.css";
import FriendCard from "./FriendCard";
import FriendRequestCard from "./FriendRequestCard";
import { useState, useEffect } from "react";

export default function FriendsView() {
    const token = localStorage.getItem("token");
    const [friends, setFriends] = useState([]);
    const [username, setUsername] = useState("");
    const [status, setStatus] = useState('');
    const [friendRequests, setFriendRequests] = useState([]);

    function handleFriendResponse(senderId) {
        setFriendRequests(prev => prev.filter(req => req.sender_id !== senderId));
    }

    async function fetchFriendRequests() {
        try {
            const res = await fetch("http://localhost:3001/friend-requests", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`, 
            },
            });

            const data = await res.json();

            if (!res.ok) {
            throw new Error(data?.error || "Failed to fetch friend requests");
            }

            console.log("Friend requests:", data);
            setFriendRequests(data);
        } catch (error) {
            console.error("Error fetching friend requests:", error);
            setStatus("Could not load friend requests");
        }
    }

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
      console.log(data);
      console.log(res);
      if (res.ok) {
        setStatus("Friend request sent!");
        setUsername("");
        onFriendAdded(); 
      } else {
        setStatus(data.error || "Error sending request");
      }
    } catch (e) {
      setStatus("Network error");
    }
  }



    function handleKeyDown(e) {
        if (e.key === "Enter") {
            e.preventDefault();
            sendFriendRequest();
            }
    }

  async function fetchFriends() {
      try {
        const res = await fetch("http://localhost:3001/friends", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch friends");
        const data = await res.json();
        setFriends(data);
      } catch (err) {
        console.log(err.message);
      }
    }
    useEffect(() => {
        fetchFriendRequests();
        fetchFriends();
    }, []);

  return (
    <div className="friends-view">
      <h2>Friends</h2>

      <input type="text" placeholder="Search users..." className="search-input" onChange={(e) => setUsername(e.target.value)} onKeyDown={handleKeyDown}/>
        <p>{status}</p>
      {friendRequests.length > 0 && (
        <>
          <h4>Friend Requests</h4>
          <div className="friend-list">
            {friendRequests.map((req) => (
              <FriendRequestCard key={req.sender_id} user={req} onResponse={handleFriendResponse} token={token} />
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
