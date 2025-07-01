import "./UserPanel.css"; 
export default function UserPanel({ user, onLogout }) {
    return (
        <div className="user-panel">
            <>
                <p>Welcome, {user.username}!</p>
                <button onClick={onLogout}>Logout</button>
            </>
        </div>
    );
}
// This component displays the user's username and a logout button.