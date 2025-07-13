import { useState } from "react";
import "./UserSettings.css";

export default function UserSettings() {
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("token");

  const handleUsernameChange = async (e) => {
    // e.preventDefault();
    // try {
    //   await axios.patch(
    //     "/api/user/username",
    //     { username },
    //     { headers: { Authorization: `Bearer ${token}` } }
    //   );
    //   setMessage("Username updated!");
    // } catch {
    //   setMessage("Error updating username.");
    // }
    console.log("test");
  };

  const handleAvatarChange = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("avatar", avatar);

    try {
      await axios.patch("/api/user/avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      setMessage("Avatar updated!");
    } catch {
      setMessage("Error updating avatar.");
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    try {
      await axios.patch(
        "/api/user/password",
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("Password updated!");
    } catch {
      setMessage("Error updating password.");
    }
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

      <form onSubmit={handleAvatarChange} className="settings-form">
        <label>Change Avatar</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setAvatar(e.target.files[0])}
        />
        <button type="submit">Update Avatar</button>
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
