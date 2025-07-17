import React, { useEffect, useState } from "react";
import { useSocket } from "../../contexts/SocketProvider";
import { API_BASE_URL, API_ENDPOINTS } from "../../constants";

export default function FriendList({ user, token, onSelectedChat, selectedChat }) {
  const socket = useSocket();
  const [friends, setFriends] = useState([]);
  const [error, setError] = useState("");
  const [unreadCounts, setUnreadCounts] = useState({});

  async function fetchFriendsWithMessages() {
    try {
      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.FRIENDS.GET_FRIENDS_WITH_MESSAGES}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch friends");
      const data = await res.json();
      setFriends(data);
    } catch (err) {
      setError(err.message);
    }
  }

  async function fetchUnreadCounts() {
    try {
      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.MESSAGES.UNREAD_COUNTS}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch unread counts");
      const data = await res.json(); // [{ chat_id, unread_count }]
      const map = {};
      data.forEach(({ chat_id, unread_count }) => {
        map[chat_id] = unread_count;
      });
      setUnreadCounts(prev => {
        const updated = { ...prev };
        data.forEach(({ chat_id, unread_count }) => {
          updated[chat_id] = unread_count;
        });
        return updated;
      });
    } catch (err) {
      console.error("Unread counts fetch error", err);
    }
  }

  useEffect(() => {
    fetchFriendsWithMessages();
    fetchUnreadCounts();
  }, []);

  useEffect(() => {
    if (!socket) return;

    function onNewMessage(msg) {
      // Update unread counts only if the message is not from the current user
      if (msg.sender_id !== user.user_id) {
        setUnreadCounts(prev => {
          const prevCount = prev[msg.chat_id] || 0;
          return { ...prev, [msg.chat_id]: prevCount + 1 };
        });
      }

      // Update friends list with new last message
      setFriends(prevFriends => {
        const idx = prevFriends.findIndex(f => f.room_id === msg.chat_id);
        if (idx === -1) return prevFriends;

        const updated = [...prevFriends];
        const friend = { ...updated[idx] };

        // Update last message fields
        friend.last_message = msg.content || (msg.fileUrl ? "File" : "");
        friend.last_message_date = msg.sent_at || new Date().toISOString();
        friend.last_sender_username = msg.sender_username;
        friend.last_file_url = msg.fileUrl || null;

        // Move to top of the list
        updated.splice(idx, 1);
        updated.unshift(friend);

        return updated;
      });
    }

    function onUpdateUnreadCounts(data) {
      const map = {};
      data.forEach(({ chat_id, unread_count }) => {
        map[chat_id] = unread_count;
      });
      setUnreadCounts(map);
    }

    function onMessagesReadConfirmation({ chatId }) {
      setUnreadCounts(prev => ({ ...prev, [chatId]: 0 }));
    }

    socket.on("newMessage", onNewMessage);
    socket.on("updateUnreadCounts", onUpdateUnreadCounts);
    socket.on("messagesReadConfirmation", onMessagesReadConfirmation);

    return () => {
      socket.off("newMessage", onNewMessage);
      socket.off("updateUnreadCounts", onUpdateUnreadCounts);
      socket.off("messagesReadConfirmation", onMessagesReadConfirmation);
    };
  }, [socket]);

  async function handleFriendClick(friend) {
    try {
      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ROOMS}`, {
        method: "POST",
        headers:
        {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ memberId: friend.user_id }),
      });

      if (!res.ok) throw new Error("Failed to create or fetch room");
      const room = await res.json();

      socket.emit("messagesRead", { chatId: room.room_id });
      setUnreadCounts(prev => ({ ...prev, [room.room_id]: 0 }));

      onSelectedChat({
        room_id: room.room_id,
        user: friend,
        type: room.is_group ? "group" : "direct",
      });
    } catch (err) {
      console.error("Error starting chat:", err);
      setError("Could not open chat");
    }
  }

  if (error) {
    return (
      <div className="chat-empty chat-error">
        <p className="empty-icon">⚠️</p>
        <p className="empty-text">Error: {error}</p>
        <p className="empty-subtext">Please try again later.</p>
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="chat-empty">
        <p className="empty-icon">💬</p>
        <p className="empty-text">You have no friends yet.</p>
        <p className="empty-subtext">Send some invites to get started!</p>
      </div>
    );
  }

  return (
    <div className="chat-page">
      <div className="chats-header">
        <h1>Messages</h1>
      </div>
      <div className="chat-list">
        {friends.map((f) => (
          <div
            key={f.user_id}
            className={
              "chat-preview" +
              (selectedChat?.user.user_id === f.user_id ? " active" : "")
            }
            onClick={() => handleFriendClick(f)}
          >
            <div className="chat-avatar">
              <img src={f.avatar || "/media/default.jpg"} alt={f.username} />
            </div>
            <div className="chat-info">
              <strong>{f.username}</strong>
              <p className="last-message">
                {f.last_message
                  ? f.last_message
                  : f.last_file_url
                  ? /\.(jpe?g|png|gif|webp)$/i.test(f.last_file_url)
                    ? `${f.last_sender_username} sent a photo.`
                    : `${f.last_sender_username} sent a file.`
                  : "No messages yet..."}
              </p>
            </div>
            {unreadCounts[String(f.room_id)] > 0 && (
              <div className="chat-unread-indicator">{(unreadCounts[String(f.room_id)] > 99) ? "99+" : unreadCounts[String(f.room_id)]}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
