import Chat from "../chat/Chat";
import FriendList from "../friends/FriendList";
import FriendsView from "../friends/FriendsView";
import SettingsBlock from "../settings/SettingsBlock";

export default function RightPanel({user, setUser, onLogout, selectedChat, onSelectedChat, onSelectedChatUpdate, activeView}) {

  return (
    <div className="right-panel">
      {activeView === "chat" && <FriendList user={user} token={user.token} onSelectedChat={onSelectedChat} selectedChat={selectedChat} /> }
      {activeView === "chat" && <Chat user={user} token={user.token} onLogout={onLogout}  setUser={setUser} selectedChat={selectedChat} onSelectedChatUpdate={onSelectedChatUpdate}/>}
      {activeView === "friends" && <FriendsView token={user.token} />}
      {activeView === "settings" && <SettingsBlock onLogout={onLogout} user={user} setUser={setUser}/>}
    </div>
  );
}
