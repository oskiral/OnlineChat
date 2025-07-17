import Chat from "../chat/Chat";
import FriendList from "../friends/FriendList";
import FriendsView from "../friends/FriendsView";
import SettingsBlock from "../settings/SettingsBlock";

export default function RightPanel({user, setUser, onLogout, selectedChat, onSelectedChat, activeView}) {

  return (
    <div className="right-panel">
      {activeView === "chat" && <FriendList user={user} token={user.token} onSelectedChat={onSelectedChat} selectedChat={selectedChat} /> }
      {activeView === "chat" && <Chat user={user} token={user.token} onLogout={onLogout}  setUser={setUser} selectedChat={selectedChat}/>}
      {activeView === "friends" && <FriendsView />}
      {activeView === "settings" && <SettingsBlock onLogout={onLogout} user={user} setUser={setUser}/>}
    </div>
  );
}
