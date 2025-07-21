import React, { useState } from "react";
import FriendSearch from "./FriendSearch";
import FriendList from "./FriendList";

export default function FriendsPage({onSelectedChat, selectedChat}) {
  const token = localStorage.getItem("token");
  const [refreshList, setRefreshList] = useState(false);

  function handleFriendAdded() {
    setRefreshList((r) => !r);
  }

  return (
    // <div style={{ maxWidth: 600, margin: "auto", padding: 20 }}>
    //   <h2>Add Friend</h2>
    //   <FriendSearch token={token} onFriendAdded={handleFriendAdded} />
    //   <h2>Your Friends</h2>
    //   {/* Przeładuj listę po dodaniu */}
    //   <FriendList key={refreshList} token={token} onSelectedChat={onSelectedChat} selectedChat={selectedChat} />
    // </div>
      <></>
  );
}
