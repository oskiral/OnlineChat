import React, { useState, useEffect } from "react";
import FriendSearch from "./FriendSearch";
import FriendRequests from "./FriendRequests";
import "../../styles/FriendsView.css";

export default function FriendsView() {
  return (
    <div className="friends-view">
      <h1>Friends</h1>
      <FriendSearch />
      <FriendRequests />
    </div>
  );
}
