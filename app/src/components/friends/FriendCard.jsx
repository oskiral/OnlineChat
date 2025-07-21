import { MoreVertical } from "lucide-react";
import { useState } from "react";

export default function FriendCard({ user, onCreateGroup }) {
  const [showMenu, setShowMenu] = useState(false);

  const handleCreateGroup = () => {
    setShowMenu(false);
    onCreateGroup(user);
  };

  return (
    <div className="friend-card">
      <img src={user.avatar || "/media/default.jpg"} className="avatar-friend-card" />
      <span className="username">{user.username}</span>
      <div className="menu-container">
        <MoreVertical 
          className="menu-icon" 
          onClick={() => setShowMenu(!showMenu)}
        />
        {showMenu && (
          <div className="friend-menu">
            <div className="menu-item" onClick={handleCreateGroup}>
              Create Group Chat
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
