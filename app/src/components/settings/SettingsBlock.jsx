import "../../styles/Settings.css"
import { LogOut } from "lucide-react";
import { useSocket } from "../../contexts/SocketProvider";
import { API_BASE_URL, API_ENDPOINTS } from "../../constants";
import UserSettings from "./UserSettings";

export default function SettingsBlock({onLogout, user, setUser}) {
    const token = user.token;
    const { socket } = useSocket();

    function handleLogout() {
        if (!socket?.id) {
            alert("Socket not ready");
            return;
        }

        fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.LOGOUT}`, {
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
        <div className="settings-container">
            <UserSettings user={user} setUser={setUser}/>
            <div className="logout-btn" onClick={handleLogout}><LogOut size={18} />LOG OUT</div>
        </div>
    )
}
