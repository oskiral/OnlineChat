import { API_BASE_URL, API_ENDPOINTS } from "../../constants";

export default function FriendRequestCard({ user, token, onResponse }) {

    async function handleAccept() {
        try {
        const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.FRIENDS.ACCEPT_REQUEST}`, {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ senderId: user.sender_id }),
        });

        if (res.ok) {
            onResponse(user.sender_id, true); // true means accepted
        } else {
            console.error("Accept failed");
        }
        } catch (err) {
        console.error("Network error during accept", err);
        }
    }

    async function handleDecline() {
        try {
        const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.FRIENDS.DECLINE_REQUEST}`, {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ senderId: user.sender_id }),
        });

        if (res.ok) {
            onResponse(user.sender_id, false); // false means declined
        } else {
            console.error("Decline failed");
        }
        } catch (err) {
        console.error("Network error during decline", err);
        }
    }
    return (
    <div className="friend-card">
      <img src={user.avatar || "/media/default.jpg"} width={50} height={50} className="avatar-request" />
      <span className="username">{user.username}</span>
      <div className="actions">
        <button className="accept" onClick={handleAccept}>Accept</button>
        <button className="decline" onClick={handleDecline}>Decline</button>
      </div>
    </div>
  );
}
