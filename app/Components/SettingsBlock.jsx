import "./Settings.css"
import { LogOut } from "lucide-react";
import { useSocket } from "../utils/socketProvider";
import UserSettings from "./UserSettings";

export default function SettingsBlock({onLogout, user}) {
    
    const token = user.token;
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
            <UserSettings user={user}/>
            <div className="logout-btn" onClick={handleLogout}><LogOut size={18} />LOG OUT</div>
        </div>
    )
}