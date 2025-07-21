import { useState, useEffect } from "react";
import { API_BASE_URL, API_ENDPOINTS } from "../../constants";

export default function CreateGroup({ token, onGroupCreated }) {
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [friends, setFriends] = useState([]);

  const fetchFriends = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.FRIENDS.GET}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch friends");
      const data = await response.json();
      setFriends(data);
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  };

  const createGroup = async () => {
    if (!groupName || selectedUsers.length === 0) {
      alert("Please provide a group name and select at least one friend.");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.GROUPS.CREATE}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: groupName,
            memberIds: selectedUsers,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to create group");

      const newGroup = await response.json();
      alert(`Group '${newGroup.name}' created successfully!`);
      onGroupCreated(newGroup);
    } catch (error) {
      console.error("Error creating group:", error);
      alert("Failed to create group. Please try again.");
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  return (
    <div className="create-group">
      <h2>Create Group</h2>
      <input
        type="text"
        placeholder="Group Name"
        value={groupName}
        onChange={(e) => setGroupName(e.target.value)}
      />
      <div className="friend-selection">
        {friends.map((friend) => (
          <label key={friend.id}>
            <input
              type="checkbox"
              value={friend.id}
              checked={selectedUsers.includes(friend.id)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedUsers((prev) => [...prev, friend.id]);
                } else {
                  setSelectedUsers((prev) =>
                    prev.filter((id) => id !== friend.id)
                  );
                }
              }}
            />
            {friend.username}
          </label>
        ))}
      </div>
      <button onClick={createGroup}>Create Group</button>
    </div>
  );
}
