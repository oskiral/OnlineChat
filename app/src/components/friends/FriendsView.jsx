import React, { useState, useEffect } from "react";
import FriendSearch from "./FriendSearch";
import FriendRequests from "./FriendRequests";
import "../../styles/FriendsView.css";

export default function FriendsView({ token }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleFriendAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="friends-view">
      <h1>Friends</h1>
      <FriendSearch token={token} onFriendAdded={handleFriendAdded} />
      <FriendRequests token={token} onFriendAdded={handleFriendAdded} key={refreshTrigger} />
    </div>
  );
}
