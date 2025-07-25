import resizeImage from "../../utils/resizeImage";
import { API_BASE_URL, API_ENDPOINTS } from "../../constants";
import "../../styles/Avatar.css";
import { useRef } from "react";

// type: "user" | "group"
// entity: user or group object
export default function Avatar({ entity, type = "user", onUpload, token, hideRemove = false, isEditable = true }) {
    const fileInputRef = useRef(null);

    // Determine endpoints and default image
    const isGroup = type === "group";
    
    // Helper function to get proper avatar URL
    const getAvatarUrl = (avatar, defaultImage) => {
        if (!avatar) return defaultImage;
        // If avatar already has protocol, use as-is, otherwise add API_BASE_URL
        if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
            return avatar;
        }
        return `${API_BASE_URL}${avatar}`;
    };
    
    const avatarUrl = isGroup ? 
        getAvatarUrl(entity.avatar, "/media/default.jpg") : 
        getAvatarUrl(entity.avatar, "/media/default.jpg");
    const uploadEndpoint = isGroup ? API_ENDPOINTS.GROUP.UPLOAD_AVATAR(entity.room_id) : API_ENDPOINTS.USER.UPLOAD_AVATAR;
    const removeEndpoint = isGroup ? API_ENDPOINTS.GROUP?.REMOVE_AVATAR?.(entity.room_id) : API_ENDPOINTS.USER.REMOVE_AVATAR;
    const altText = isGroup ? "Group Avatar" : "User Avatar";
    const titleText = isGroup ? "Click to change group photo" : "Click to change avatar";

    async function unUploadAvatar() {
        onUpload(null);
        const res = await fetch(`${API_BASE_URL}${removeEndpoint}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: isGroup ? JSON.stringify({ groupId: entity.room_id }) : undefined
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
        const res = await fetch(`${API_BASE_URL}${uploadEndpoint}`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: formData
        });
    }

    function triggerFileInput(e) {
        if (!isEditable) return;
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    }

    return (
        <div className="avatar-component">
            <img
                src={avatarUrl}
                alt={altText}
                className="avatar"
                onClick={triggerFileInput}
                style={{ 
                    cursor: isEditable ? "pointer" : "default",
                    pointerEvents: "auto",
                    userSelect: "none"
                }}
                title={isEditable ? titleText : ""}
            />
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleAvatarChange}
            />
            {!hideRemove && isEditable && (
                <button onClick={unUploadAvatar}>{isGroup ? "Remove Group Photo" : "Remove Avatar"}</button>
            )}
        </div>
    );
}
