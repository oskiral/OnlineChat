import { MoreVertical } from "lucide-react";

export default function FriendCard({ user }) {
  return (
    <div className="friend-card">
      <img src={user.avatar || "/media/default.jpg"} className="avatar-friend-card" />
      <span className="username">{user.username}</span>
      <MoreVertical className="menu-icon" />
    </div>
  );
}
