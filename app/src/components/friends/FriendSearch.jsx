import React, { useState } from "react";
import "../../styles/FriendSearch.css";

export default function FriendSearch() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder="Search users..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="search-input"
      />
      <button className="search-button">Search</button>
    </div>
  );
}
