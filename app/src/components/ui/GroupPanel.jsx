import "../../styles/GroupPanel.css";
import Avatar from "./Avatar";
import { useRef } from "react";
import { API_BASE_URL } from "../../constants";

export default function GroupPanel({ group, onUpload, token }) {
    const avatarRef = useRef(null);

    const handleChangeGroupPhoto = () => {
        
        if (avatarRef.current) {
            const fileInput = avatarRef.current.querySelector('input[type="file"]');
            if (fileInput) {
                fileInput.click();
            }
        }
    };

    return (
        <div className="group-panel">
            <div ref={avatarRef}>
                <Avatar entity={group} type="group" onUpload={onUpload} token={token} hideRemove={true} />
            </div>
            <h2 className="group-name">{group.name}</h2>
            <div className="change-group-photo">
                <button onClick={handleChangeGroupPhoto}>Change Group Photo</button>
            </div>

            <div className="group-members">
                <h3>Members</h3>
                <ul>
                    {group.members.map(member => (
                        <li key={member.user_id}>
                            <Avatar entity={member} type="user" token={token} hideRemove={true} isEditable={false} />
                            <span className="member-username">{member.username}</span>
                            <div className="group-member-options">
                                <img src="/media/options.svg" alt="member-options" />
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}