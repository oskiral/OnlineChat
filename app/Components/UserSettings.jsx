import { useState } from "react";
import "./UserSettings.css";
import Avatar from "./Avatar";

export default function UserSettings({user, setUser}) {
  const [username, setUsername] = useState("");
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

  function onAvatarUpload(newAvatarUrl) {
    // change it localy
    // setUser(prev => ({ ...prev, avatar: newAvatarUrl }));
  }

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
