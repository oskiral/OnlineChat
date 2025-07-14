import Chat from "./Chat";
import FriendList from "./FriendList";
import FriendsView from "./FriendsView";
import SettingsBlock from "./SettingsBlock";

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