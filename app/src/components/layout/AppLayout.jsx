import Sidebar from "./Sidebar";
import RightPanel from "./RightPanel";

export default function AppLayout({user, setUser, onLogout, selectedChat, activeView, setActiveView, onSelectedChat, onSelectedChatUpdate}) {
    return (
        <div className="app-layout">
        <Sidebar setActiveView={setActiveView} activeView={activeView}/>
        <RightPanel activeView={activeView} user={user} setUser={setUser} onLogout={onLogout} selectedChat={selectedChat} onSelectedChat={onSelectedChat} onSelectedChatUpdate={onSelectedChatUpdate} />
        </div>
    )
}
