import Sidebar from "./Sidebar";
import FriendsPage from "./FriendsPage";
import FriendList from "./FriendList";
import Chat from "./Chat";

export default function AppLayout({user, setUser, handleLogout, selectedChat, onSelectedChat}) {
    return (
        <div className="app-layout">
        <Sidebar />
        <FriendList token={user.token} onSelectedChat={onSelectedChat} selectedChat={selectedChat} />
        <Chat user={user} token={user.token} onLogout={handleLogout}  setUser={setUser} selectedChat={selectedChat}/>
        </div>
    )
}