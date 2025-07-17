import React, { useState } from "react";
import Avatar from "../ui/Avatar";
import "../../styles/UserSettings.css";

export default function UserSettings({ user }) {
    const [username, setUsername] = useState(user?.username || "");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [message, setMessage] = useState("");

    const handleUsernameChange = async (e) => {
        e.preventDefault();
        // Simulate API call
        if (username.trim() === "") {
            setMessage("Username cannot be empty.");
            return;
        }
        // Here you would call your API to update the username
        setMessage("Username updated successfully!");
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (!currentPassword || !newPassword) {
            setMessage("Please fill in both password fields.");
            return;
        }
        // Here you would call your API to update the password
        setMessage("Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
    };

    const onAvatarUpload = (avatarUrl) => {
        // Here you would handle avatar upload logic
        setMessage("Avatar updated successfully!");
    };

    return (
        <div className="settings-container-form">
            <h2>Account Settings</h2>

            <form onSubmit={handleUsernameChange} className="settings-form">
                <label>Change Username</label>
                <input
                    type="text"
                    placeholder="New username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <button type="submit">Update Username</button>
            </form>

            <form className="settings-form">
                <label>Change Avatar</label>
                <Avatar user={user} token={user.token} onUpload={onAvatarUpload}/>
            </form>

            <form onSubmit={handlePasswordChange} className="settings-form">
                <label>Change Password</label>
                <input
                    type="password"
                    placeholder="Current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                />
                <button type="submit">Update Password</button>
            </form>

            {message && <p className="settings-message">{message}</p>}
        </div>
    );
}
