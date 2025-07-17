import "../../styles/UserPanel.css";
import Avatar from "./Avatar";
import { useSocket } from "../../contexts/SocketProvider";

export default function UserPanel({ user, setUser, onLogout, token}) {
    

    function unUploadAvatar() {
        fetch("http://localhost:3001/unUploadAvatar", {
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

    const socket = useSocket();
    function handleLogout() {
        if (!socket?.id) {
        alert("Socket not ready");
        return;
        }

        fetch("http://localhost:3001/logout", {
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
