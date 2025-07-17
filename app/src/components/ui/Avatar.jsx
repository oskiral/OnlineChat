import resizeImage from "../../utils/resizeImage";
import "../../styles/Avatar.css";
import { useRef } from "react";

export default function Avatar({ user, onUpload, token}) {
    const fileInputRef = useRef(null);
    
    async function unUploadAvatar() {
    // Ustaw awatar na defaultowy lokalnie
    onUpload(null);

    // Wyślij request do backendu, by zresetować avatar w DB
    const res = await fetch("http://localhost:3001/api/user/removeAvatar", {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        alert("Failed to remove avatar");
    }
    }

    async function handleAvatarChange(event) {
        let file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("Please upload a valid image file.");
            return;
        }

        const resized = await resizeImage(file, {
            maxWidth: 100,
            maxHeight: 100,
            forceSize: true
        });

        if (resized) {
            file = resized;
        }

        const formData = new FormData();
        formData.append("avatar", file);

        const res = await fetch("http://localhost:3001/api/user/uploadAvatar", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: formData
        });

        const data = await res.json();
        if (res.ok) {
            onUpload(data.fileUrl);
        } else {
            alert("Upload failed");
        }
    }

    function triggerFileInput() {
        fileInputRef.current.click();
    }

    return (
        <div className="avatar-component">
            <img
                src={user.avatar || "../media/default.jpg"}
                alt="User Avatar"
                className="avatar"
                onClick={triggerFileInput}
                style={{ cursor: "pointer" }}
                title="Click to change avatar"
            />
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleAvatarChange}
            />
            <button onClick={unUploadAvatar}>Remove Avatar</button>
        </div>
    );
}
