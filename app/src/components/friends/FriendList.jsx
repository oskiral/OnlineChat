import React, { useEffect, useState } from "react";
import { useSocket } from "../../contexts/SocketProvider";
import { useUserStatus } from "../../hooks/useUserStatus";
import StatusIndicator from "../ui/StatusIndicator";
import Modal from "../ui/Modal";
import { API_BASE_URL, API_ENDPOINTS } from "../../constants";

export default function FriendList({ user, token, onSelectedChat, selectedChat }) {
  const { socket } = useSocket();
  const { getFriendsStatus } = useUserStatus();
  const [friends, setFriends] = useState([]);
  const [error, setError] = useState("");
  const [unreadCounts, setUnreadCounts] = useState({});
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [groupName, setGroupName] = useState("");
  const [selectedFriends, setSelectedFriends] = useState([]);

  async function fetchFriendsWithMessages() {
    try {
      // 1. Fetch all rooms (both direct chats and groups)
      const roomsRes = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ROOMS}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!roomsRes.ok) throw new Error("Failed to fetch rooms");
      const roomsData = await roomsRes.json();
      
      console.log("Raw rooms data:", roomsData);
      
      // 2. Fetch all friends (including those without rooms)
      const friendsRes = await fetch(`${API_BASE_URL}/api/friends/getFriends`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!friendsRes.ok) throw new Error("Failed to fetch friends");
      const friendsData = await friendsRes.json();
      
      console.log("Raw friends data:", friendsData);
      
      // 3. Process rooms data to create unified chat list
      const processedChats = roomsData
        .filter(room => room && room.room_id) // Filter out invalid rooms
        .map(room => {
          console.log("Processing room:", room);
          
          if (room.is_group === 1) {
            // Group chat
            return {
              room_id: room.room_id,
              room_name: room.room_name,
              username: room.room_name, // For display consistency
              avatar: room.avatar, // Include group avatar
              isGroup: true,
              last_message: room.last_message,
              last_message_date: room.last_message_date,
              last_file_url: room.last_file_url,
              last_sender_username: room.last_sender_username,
            };
          } else {
            // Direct chat
            return {
              room_id: room.room_id,
              user_id: room.user?.user_id,
              username: room.user?.username,
              avatar: room.user?.avatar,
              isGroup: false,
              last_message: room.last_message,
              last_message_date: room.last_message_date,
              last_file_url: room.last_file_url,
              last_sender_username: room.last_sender_username,
            };
          }
        });
      
      // 4. Find friends who don't have rooms yet
      const friendsInRooms = new Set();
      processedChats.forEach(chat => {
        if (!chat.isGroup && chat.user_id) {
          friendsInRooms.add(chat.user_id);
        }
      });
      
      const friendsWithoutRooms = friendsData
        .filter(friend => !friendsInRooms.has(friend.user_id))
        .map(friend => ({
          user_id: friend.user_id,
          username: friend.username,
          avatar: friend.avatar,
          isGroup: false,
          room_id: null, // No room yet - will be created when clicked
          last_message: null,
          last_message_date: null,
          last_file_url: null,
          last_sender_username: null,
        }));
      
      console.log("Friends without rooms:", friendsWithoutRooms);
      
      // 5. Combine rooms and friends without rooms
      const allChats = [...processedChats, ...friendsWithoutRooms];
      
      // Filter out invalid entries and deduplicate by user_id (for direct chats) or room_id (for groups)
      const validChats = allChats.filter(chat => 
        chat && 
        (chat.room_id || chat.user_id) && // Either has room_id or user_id
        (chat.username || chat.room_name)
      );
      
      // Deduplicate by room_id or user_id
      const uniqueChats = validChats.reduce((acc, chat) => {
        let existingIndex = -1;
        
        if (chat.isGroup && chat.room_id) {
          // For groups, deduplicate by room_id
          existingIndex = acc.findIndex(existing => existing.room_id === chat.room_id);
        } else if (!chat.isGroup && chat.user_id) {
          // For direct chats, deduplicate by user_id
          existingIndex = acc.findIndex(existing => 
            !existing.isGroup && existing.user_id === chat.user_id
          );
        }
        
        if (existingIndex === -1) {
          acc.push(chat);
        } else {
          // If duplicate found, prefer the one with room_id (existing conversation)
          if (chat.room_id && !acc[existingIndex].room_id) {
            acc[existingIndex] = chat;
          }
        }
        return acc;
      }, []);
      
      // Sort: rooms with messages first, then friends without rooms
      uniqueChats.sort((a, b) => {
        // Groups and chats with messages first
        if (a.last_message_date && !b.last_message_date) return -1;
        if (!a.last_message_date && b.last_message_date) return 1;
        
        // If both have messages, sort by date
        if (a.last_message_date && b.last_message_date) {
          return new Date(b.last_message_date) - new Date(a.last_message_date);
        }
        
        // If neither has messages, sort alphabetically
        return (a.username || a.room_name || '').localeCompare(b.username || b.room_name || '');
      });
      
      console.log("Valid chats:", validChats);
      console.log("Unique chats:", uniqueChats);
      
      setFriends(uniqueChats);
      
      // Get status for direct chat friends only
      const directChatFriends = uniqueChats.filter(chat => !chat.isGroup && chat.user_id);
      if (directChatFriends.length > 0) {
        const friendIds = directChatFriends.map(friend => friend.user_id);
        getFriendsStatus(friendIds);
      }
    } catch (err) {
      console.error("Error fetching chats:", err);
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

  // Clear unread count when a chat is selected
  useEffect(() => {
    if (selectedChat?.room_id) {
      console.log("🎯 Chat selected, clearing unread count for:", selectedChat.room_id);
      setUnreadCounts(prev => ({ ...prev, [selectedChat.room_id]: 0 }));
    }
  }, [selectedChat?.room_id]);

  useEffect(() => {
    if (!socket) return;

    function onNewMessage(msg) {
      console.log("🔔 FriendList received newMessage:", {
        chat_id: msg.chat_id,
        sender_id: msg.sender_id,
        user_id: user.user_id,
        content: msg.content?.substring(0, 30) + '...',
        selectedChatId: selectedChat?.room_id
      });

      // Update unread counts only if:
      // 1. Message is not from the current user
      // 2. The chat is not currently selected (user is not viewing it)
      const isFromCurrentUser = msg.sender_id === user.user_id;
      const isChatCurrentlySelected = selectedChat && String(selectedChat.room_id) === String(msg.chat_id);
      
      if (!isFromCurrentUser && !isChatCurrentlySelected) {
        console.log("📊 Updating unread count for chat:", msg.chat_id);
        setUnreadCounts(prev => {
          const prevCount = prev[msg.chat_id] || 0;
          const newCount = prevCount + 1;
          console.log("📊 Unread count updated:", { chat_id: msg.chat_id, prevCount, newCount });
          return { ...prev, [msg.chat_id]: newCount };
        });
      } else {
        console.log("📊 Not updating unread count:", { 
          isFromCurrentUser, 
          isChatCurrentlySelected,
          chat_id: msg.chat_id 
        });
      }

      // Update friends list with new last message
      setFriends(prevFriends => {
        const idx = prevFriends.findIndex(f => f.room_id === msg.chat_id);
        if (idx === -1) {
          console.log("⚠️ Message chat not found in friends list:", msg.chat_id);
          return prevFriends;
        }

        const updated = [...prevFriends];
        const friend = { ...updated[idx] };

        // Update last message fields
        friend.last_message = msg.content || (msg.fileUrl ? "File" : "");
        friend.last_message_date = msg.sent_at || new Date().toISOString();
        friend.last_sender_username = msg.sender_username || msg.username;
        friend.last_file_url = msg.fileUrl || null;

        // Move to top of the list
        updated.splice(idx, 1);
        updated.unshift(friend);

        console.log("📝 Updated friend/group in list:", {
          room_id: friend.room_id,
          name: friend.username || friend.room_name,
          isGroup: friend.isGroup,
          last_message: friend.last_message
        });

        return updated;
      });
    }

    function onUpdateUnreadCounts(data) {
      console.log("📊 Received unread counts update:", data);
      const map = {};
      data.forEach(({ chat_id, unread_count }) => {
        map[chat_id] = unread_count;
      });
      setUnreadCounts(map);
    }

    function onMessagesReadConfirmation({ chatId }) {
      console.log("✅ Messages read confirmation for chat:", chatId);
      setUnreadCounts(prev => ({ ...prev, [chatId]: 0 }));
    }

    function onFriendAdded({ friendId }) {
      console.log("🤝 Friend added event received, refreshing friends list. Friend ID:", friendId);
      // Refresh the friends list when a new friend is added
      fetchFriendsWithMessages();
    }

    function onGroupAvatarUpdated({ groupId, avatar }) {
      console.log("🖼️ Group avatar updated:", { groupId, avatar });
      setFriends(prevFriends => {
        return prevFriends.map(friend => {
          if (friend.isGroup && friend.room_id === groupId) {
            return { ...friend, avatar };
          }
          return friend;
        });
      });
    }

    socket.on("newMessage", onNewMessage);
    socket.on("updateUnreadCounts", onUpdateUnreadCounts);
    socket.on("messagesReadConfirmation", onMessagesReadConfirmation);
    socket.on("friend-added", onFriendAdded);
    socket.on("groupAvatarUpdated", onGroupAvatarUpdated);

    return () => {
      socket.off("newMessage", onNewMessage);
      socket.off("updateUnreadCounts", onUpdateUnreadCounts);
      socket.off("messagesReadConfirmation", onMessagesReadConfirmation);
      socket.off("friend-added", onFriendAdded);
      socket.off("groupAvatarUpdated", onGroupAvatarUpdated);
    };
  }, [socket, user.user_id, selectedChat?.room_id]);

  const handleCreateGroup = (friend) => {
    // Only allow group creation from direct chats, not from groups
    if (friend.isGroup) return;
    
    setSelectedFriend(friend);
    setSelectedFriends([friend.user_id]); // Pre-select the clicked friend
    setShowGroupModal(true);
  };

  const handleGroupSubmit = async () => {
    if (!groupName.trim() || selectedFriends.length === 0) {
      alert("Please provide a group name and select at least one friend.");
      return;
    }

    try {
      console.log("Creating group with:", {
        name: groupName,
        memberIds: selectedFriends,
      });

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ROOMS}/createGroup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: groupName,
          memberIds: selectedFriends,
        }),
      });

      console.log("Response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error("Error response:", errorData);
        throw new Error(`Failed to create group chat: ${response.status}`);
      }

      const newGroup = await response.json();
      console.log("Group created successfully:", newGroup);

      alert(`Group chat '${newGroup.name}' created successfully!`);
      setShowGroupModal(false);
      setGroupName("");
      setSelectedFriends([]);
      setSelectedFriend(null);
      
      // Switch to the new group chat
      onSelectedChat({
        room_id: newGroup.room_id,
        name: newGroup.name,
        type: "group",
        isGroup: true,
      });

      // Refresh friends list to show new group
      fetchFriendsWithMessages();
    } catch (error) {
      console.error("Error creating group chat:", error);
      alert(`Failed to create group chat: ${error.message}`);
    }
  };

  async function handleFriendClick(friendOrGroup) {
    try {
      if (friendOrGroup.isGroup) {
        // Handle group chat
        console.log("🎯 Opening group chat:", friendOrGroup.room_id);
        
        // Mark messages as read for this group
        if (socket) {
          socket.emit("messagesRead", { chatId: friendOrGroup.room_id });
        }
        setUnreadCounts(prev => ({ ...prev, [friendOrGroup.room_id]: 0 }));

        onSelectedChat({
          room_id: friendOrGroup.room_id,
          name: friendOrGroup.room_name || friendOrGroup.username,
          isGroup: true,
          type: "group"
        });
        return;
      }

      // Handle friend chat - create or get existing room
      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ROOMS}`, {
        method: "POST",
        headers:
        {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ memberId: friendOrGroup.user_id }),
      });

      if (!res.ok) throw new Error("Failed to create or fetch room");
      const room = await res.json();

      console.log("🎯 Opening direct chat:", room.room_id);
      
      if (socket) {
        socket.emit("messagesRead", { chatId: room.room_id });
      }
      setUnreadCounts(prev => ({ ...prev, [room.room_id]: 0 }));

      onSelectedChat({
        room_id: room.room_id,
        user: friendOrGroup,
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
        {friends.filter(f => f && (f.user_id || f.room_id) && (f.username || f.room_name)).map((f) => {
          // Determine if this chat is currently selected
          const isActive = selectedChat && (
            (f.room_id && selectedChat.room_id === f.room_id) ||
            (!f.room_id && !f.isGroup && selectedChat.user?.user_id === f.user_id)
          );
          
          // Generate unique key
          const chatKey = f.isGroup 
            ? `group-${f.room_id}` 
            : f.room_id 
              ? `direct-room-${f.room_id}` 
              : `direct-friend-${f.user_id}`;
          
          return (
            <div
              key={chatKey}
              className={
                "chat-preview" + (isActive ? " active" : "")
              }
              onClick={() => handleFriendClick(f)}
            >
              <div className="chat-avatar">
                <img 
                  src={f.isGroup 
                    ? (f.avatar 
                        ? (f.avatar.startsWith('http://') || f.avatar.startsWith('https://') 
                            ? f.avatar 
                            : `${API_BASE_URL}${f.avatar}`)
                        : "/media/default.jpg")
                    : (f.avatar 
                        ? (f.avatar.startsWith('http://') || f.avatar.startsWith('https://') 
                            ? f.avatar 
                            : `${API_BASE_URL}${f.avatar}`)
                        : "/media/default.jpg")
                  } 
                  alt={f.username || f.room_name || "Chat"} 
                />
                {!f.isGroup && f.user_id && (
                  <StatusIndicator userId={f.user_id} size="small" />
                )}
              </div>
              <div className="chat-info">
                <div className="chat-header">
                  <strong>{f.username || f.room_name}</strong>
                  {!f.isGroup && f.user_id && (
                    <StatusIndicator userId={f.user_id} showText={true} size="small" />
                  )}
                  {f.isGroup && (
                    <span className="group-indicator">Group</span>
                  )}
                </div>
                <p className="last-message">
                  {f.last_message
                    ? f.last_message
                    : f.last_file_url
                    ? /\.(jpe?g|png|gif|webp)$/i.test(f.last_file_url)
                      ? `${f.last_sender_username || "Someone"} sent a photo.`
                      : `${f.last_sender_username || "Someone"} sent a file.`
                    : f.room_id ? "No messages yet..." : "Start a conversation"}
                </p>
              </div>
              {f.room_id && unreadCounts[String(f.room_id)] > 0 && (
                <div className="chat-unread-indicator">{(unreadCounts[String(f.room_id)] > 99) ? "99+" : unreadCounts[String(f.room_id)]}</div>
              )}
              {!f.isGroup && (
                <div className="chat-menu" onClick={(e) => {
                  e.stopPropagation();
                  handleCreateGroup(f);
                }}>
                  ⋮
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {showGroupModal && (
        <Modal onClose={() => {
          setShowGroupModal(false);
          setGroupName("");
          setSelectedFriends([]);
          setSelectedFriend(null);
        }}>
          <h2>Create Group Chat</h2>
          <p>Creating group with: <strong>{selectedFriend?.username}</strong></p>
          
          <input
            type="text"
            placeholder="Group Name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
          
          <div className="friend-selection">
            <h4>Select additional friends:</h4>
            {friends
              .filter(friend => 
                friend && 
                !friend.isGroup && 
                friend.user_id && 
                friend.user_id !== selectedFriend?.user_id
              )
              .map((friend) => (
                <label key={friend.user_id} className="friend-checkbox">
                  <img 
                    src={friend.avatar || "/media/default.jpg"} 
                    alt={friend.username || "Friend"}
                    className="friend-avatar"
                  />
                  <div className="friend-info">
                    <div className="friend-username">{friend.username || "Unknown"}</div>
                    <div className="friend-status">Available to add</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedFriends.includes(friend.user_id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedFriends(prev => [...prev, friend.user_id]);
                      } else {
                        setSelectedFriends(prev => prev.filter(id => id !== friend.user_id));
                      }
                    }}
                  />
                </label>
              ))}
          </div>
          
          <div className="modal-buttons">
            <button onClick={handleGroupSubmit} className="create-btn">
              Create Group
            </button>
            <button onClick={() => setShowGroupModal(false)} className="cancel-btn">
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
