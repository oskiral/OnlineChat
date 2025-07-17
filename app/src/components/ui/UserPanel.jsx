import "../../styles/UserPanel.css";
import { API_BASE_URL, API_ENDPOINTS } from "../../constants";
import Avatar from "./Avatar";
import { useSocket } from "../../contexts/SocketProvider";

export default function UserPanel({ user, setUser, onLogout, token}) {
    

    function unUploadAvatar() {
        fetch(`${API_BASE_URL}${API_ENDPOINTS.USER.UN_UPLOAD_AVATAR}`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        .then(async res => {
            if (res.ok) {
                setUser({ ...user, avatar: null });
            } else {
                const text = await res.text();
                alert(`Avatar removal failed: ${res.status} ${res.statusText} - ${text}`);
            }
        });
    }

    const { socket } = useSocket();
    function handleLogout() {
        if (!socket?.id) {
        alert("Socket not ready");
        return;
        }

        fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.LEGACY_LOGOUT}`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "x-socket-id": socket.id,
        },
        })
        .then(async (res) => {
            if (res.ok) {
            onLogout();
            } else {
            const text = await res.text();
            alert(`Logout failed: ${res.status} ${res.statusText} - ${text}`);
            }
        });
    }

    return (
        <div className="user-panel">
            <>
            <Avatar user={user} onUpload={(url) => setUser({ ...user, avatar: url })} token={token} unUploadAvatar={unUploadAvatar} />
                <p>Welcome, {user.username}!</p>
                <div className="btns">
                    <button onClick={handleLogout}>Logout</button>
                </div>
            </>
        </div>
    );
}
