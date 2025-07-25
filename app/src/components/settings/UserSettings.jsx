import React, { useState } from "react";
import Avatar from "../ui/Avatar";
import "../../styles/UserSettings.css";
import { API_BASE_URL, API_ENDPOINTS } from "../../constants";

export default function UserSettings({ user, setUser }) {
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
    
        fetch(`${API_BASE_URL}${API_ENDPOINTS.USER.UPDATE_USERNAME}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${user.token}`,
            },
            body: JSON.stringify({ username }),
        })
        .then((response) => {
            if (response.ok) {
                // Update username in global state
                setUser(prevUser => ({
                    ...prevUser,
                    username: username
                }));
                setMessage("Username updated successfully!");
            } else {
                setMessage("Failed to update username.");
            }
        })
        .catch((error) => {
            console.error("Error updating username:", error);
            setMessage("Error updating username.");
        });
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (!currentPassword || !newPassword) {
            setMessage("Please fill in both password fields.");
            return;
        }
    
        fetch(`${API_BASE_URL}${API_ENDPOINTS.USER.CHANGE_PASSWORD}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${user.token}`,
            },
            body: JSON.stringify({ currentPassword, newPassword }),
        })
        .then((response) => {
            if (response.ok) {
                setMessage("Password updated successfully!");
            } else {
                setMessage("Failed to update password.");
            }
        })
        .catch((error) => {
            console.error("Error updating password:", error);
            setMessage("Error updating password.");
        });

        setCurrentPassword("");
        setNewPassword("");
    };

    const onAvatarUpload = (avatarUrl) => {
        // Update user's avatar in the global state
        setUser(prevUser => ({
            ...prevUser,
            avatar: avatarUrl
        }));
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

            <div className="settings-form">
                <label>Change Avatar</label>

                <Avatar entity={user} type="user" token={user.token} onUpload={onAvatarUpload}/>
            </div>

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
