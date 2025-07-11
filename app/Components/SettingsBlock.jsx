import "./Settings.css"
import { LogOut } from "lucide-react";
import { useSocket } from "../utils/socketProvider";

export default function SettingsBlock({onLogout}) {
    
    const token = localStorage.getItem("token");
    const socket = useSocket();

    function handleLogout() {
        console.log(socket.id);
        if (!socket?.id) {
        alert("Socket not ready");
        return;
        }

        fetch("http://localhost:3001/api/auth/logout", {
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
            <div className="logout-btn" onClick={handleLogout}><LogOut size={18} />LOG OUT</div>
        </div>
    )
}