import { useEffect, useState, useRef } from "react";
import { useSocket } from "../../contexts/SocketProvider";
import resizeImage from "../../utils/resizeImage";
import { API_BASE_URL, API_ENDPOINTS, MESSAGE_LIMITS, FILE_LIMITS } from "../../constants";
import Poll from "../ui/Poll";
import CreatePollModal from "../ui/CreatePollModal";
import "../../styles/Chat.css";

export default function GroupChat({ selectedChat, user, token }) {
  const [fileName, setFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [polls, setPolls] = useState([]);
  const [showCreatePollModal, setShowCreatePollModal] = useState(false);
  const messagesEndRef = useRef(null);
  const [inputValue, setInputValue] = useState("");
  const inputFileRef = useRef(null);

  const { socket } = useSocket();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch polls when selectedChat changes
  useEffect(() => {
    if (selectedChat && selectedChat.room_id) {
      fetchPolls();
    }
  }, [selectedChat]);

  const fetchPolls = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.POLLS.GET}?chatId=${selectedChat.room_id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const pollsData = await response.json();
        setPolls(pollsData);
      } else {
        console.error("Failed to fetch polls");
      }
    } catch (error) {
      console.error("Error fetching polls:", error);
    }
  };

  const handleCreatePoll = async (pollData) => {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.POLLS.CREATE}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...pollData,
          chatId: selectedChat.room_id,
        }),
      });

      if (response.ok) {
        const newPoll = await response.json();
        setPolls(prev => [newPoll, ...prev]);
        
        // Emit poll created event via socket
        if (socket) {
          socket.emit("pollCreated", {
            chatId: selectedChat.room_id,
            poll: newPoll
          });
        }
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create poll");
      }
    } catch (error) {
      console.error("Error creating poll:", error);
      alert("Failed to create poll");
    }
  };

  const handleVotePoll = async (pollId, optionIndex) => {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.POLLS.VOTE}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pollId,
          optionIndex,
        }),
      });

      if (response.ok) {
        // Refresh polls to get updated vote counts
        fetchPolls();
        
        // Emit vote event via socket
        if (socket) {
          socket.emit("pollVoted", {
            chatId: selectedChat.room_id,
            pollId,
            optionIndex,
            userId: user.user_id
          });
        }
      } else {
        const error = await response.json();
        alert(error.error || "Failed to vote");
      }
    } catch (error) {
      console.error("Error voting on poll:", error);
      alert("Failed to vote");
    }
  };

  useEffect(() => {
    console.log("🎯 GroupChat useEffect triggered - socket:", !!socket, "selectedChat:", !!selectedChat);
    
    if (!socket || !selectedChat) {
      console.log("⚠️ Missing dependencies - socket:", !!socket, "selectedChat:", !!selectedChat);
      return;
    }

    console.log("🎯 GroupChat useEffect triggered for group:", selectedChat.name, "chatId:", selectedChat.room_id);

    // Clear messages when switching chats
    setMessages([]);

    socket.emit("messagesRead", { chatId: selectedChat.room_id });

    if (selectedChat && socket) {
      socket.emit("markMessagesRead", {
        chatId: selectedChat.room_id,
      });
    }

    console.log("📡 Requesting messages for group chat:", selectedChat.room_id);
    socket.emit("getMessages", { chatId: selectedChat.room_id });

    const handleMessages = ({ chatId, messages }) => {
      console.log("📥 Received group messages response:", { chatId, messageCount: messages.length });
      
      if (String(chatId) === String(selectedChat.room_id)) {
        console.log("✅ Setting group messages for chat:", chatId);
        setMessages(messages);
        socket.emit("markMessagesRead", { chatId: selectedChat.room_id });
      } else {
        console.log("⚠️ Received messages for different group chat, ignoring");
      }
    };

    const handleNew = (msg) => {
      console.log("📥 Received group newMessage:", msg);
      
      if (!msg.sender_id && msg.user?.user_id) {
        msg.sender_id = msg.user.user_id;
      }
      if (String(msg.chat_id) !== String(selectedChat.room_id)) return;
      
      // Check if this message is from current user (our own message echoed back)
      if (msg.sender_id === user.user_id) {
        console.log("🔄 Received our own group message from server");
        
        setMessages((prev) => {
          // Look for the most recent temporary message
          const tempMessageIndex = prev.findIndex(m => 
            m.message_id && 
            m.message_id.toString().startsWith('temp-') &&
            m.content === msg.content &&
            m.sender_id === user.user_id
          );
          
          if (tempMessageIndex !== -1) {
            console.log("✅ Replacing temporary group message with server response");
            const updatedMessages = [...prev];
            updatedMessages[tempMessageIndex] = {
              ...msg,
              username: msg.sender_username || user.username
            };
            return updatedMessages;
          }
          
          // If no temp message found, check if this exact message already exists
          const duplicateExists = prev.some(m => 
            m.message_id === msg.message_id || 
            (m.content === msg.content && 
             m.sender_id === msg.sender_id && 
             Math.abs(new Date(m.sent_at) - new Date(msg.sent_at)) < 5000)
          );
          
          if (duplicateExists) {
            console.log("⚠️ Duplicate group message detected, ignoring");
            return prev;
          }
          
          console.log("⚠️ No temp group message found but adding anyway (edge case)");
          return [...prev, {
            ...msg,
            username: msg.sender_username || user.username
          }];
        });
        return;
      }
      
      // Message from another user
      console.log("📨 Adding group message from other user");
      setMessages((prev) => {
        // Check for duplicates from other users too
        const duplicateExists = prev.some(m => 
          m.message_id === msg.message_id ||
          (m.content === msg.content && 
           m.sender_id === msg.sender_id && 
           Math.abs(new Date(m.sent_at) - new Date(msg.sent_at)) < 5000)
        );
        
        if (duplicateExists) {
          console.log("⚠️ Duplicate group message from other user, ignoring");
          return prev;
        }
        
        return [...prev, {
          ...msg,
          username: msg.sender_username || msg.username
        }];
      });
    };

    socket.on("messages", handleMessages);
    socket.on("newMessage", handleNew);
    
    // Poll socket listeners
    socket.on("pollCreated", ({ poll }) => {
      if (String(poll.chat_id) === String(selectedChat.room_id)) {
        setPolls(prev => [poll, ...prev]);
      }
    });

    socket.on("pollVoted", ({ pollId }) => {
      // Refresh polls when someone votes
      fetchPolls();
    });

    console.log("🔗 Socket listeners attached for group chat:", selectedChat.room_id);

    return () => {
      console.log("🧹 Cleaning up socket listeners for group chat:", selectedChat.room_id);
      socket.off("messages", handleMessages);
      socket.off("newMessage", handleNew);
      socket.off("pollCreated");
      socket.off("pollVoted");
    };
  }, [socket, selectedChat, user.user_id]);

  useEffect(() => {
    console.log("📊 Group messages state changed:", messages.length, messages);
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleFileChange(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Check file size
    if (file.size > FILE_LIMITS.MAX_SIZE) {
      alert(`File is too large! Maximum size is ${FILE_LIMITS.MAX_SIZE / (1024 * 1024)}MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`);
      return;
    }

    // Check file type
    if (!FILE_LIMITS.ALLOWED_TYPES.includes(file.type)) {
      alert(`File type not allowed! Allowed types: ${FILE_LIMITS.ALLOWED_TYPES.join(', ')}`);
      return;
    }

    if (file.type.startsWith("image/")) {
      try {
        const resized = await resizeImage(file, { maxWidth: 200 });
        setSelectedFile(resized);
      } catch {
        setSelectedFile(file);
      }
    } else {
      setSelectedFile(file);
    }

    setFileName(file.name);
  }

  function clickFileInput() {
    inputFileRef.current.click();
    document.querySelector('.file-upload-btn').classList.add('active');
  }

  async function handleSendMessage() {
    if (!socket || !selectedChat) return;

    const content = inputValue.trim();
    if (!content && !selectedFile) return;
    
    // Check message length limit
    if (content.length > MESSAGE_LIMITS.MAX_LENGTH) {
      alert(`Message is too long! Maximum ${MESSAGE_LIMITS.MAX_LENGTH} characters allowed. Your message has ${content.length} characters.`);
      return;
    }
    
    document.querySelector('.file-upload-btn').classList.remove('active');

    let fileUrl = null;
    if (selectedFile) {
      try {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.MESSAGES.UPLOAD}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) throw new Error("Upload failed");
        const data = await response.json();
        fileUrl = `${API_BASE_URL}${data.fileUrl}`;
      } catch (err) {
        alert("File upload failed.");
        return;
      }
    }

    // Create temporary message ID locally
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    
    console.log("📤 Sending group message with tempId:", tempId, "content:", content);

    // Add optimistic update for group message
    const optimisticMessage = {
      message_id: tempId,
      chat_id: selectedChat.room_id,
      sender_id: user.user_id,
      username: user.username,
      sender_username: user.username,
      content,
      fileUrl,
      sent_at: new Date().toISOString(),
    };
    
    console.log("📝 Adding optimistic group message:", optimisticMessage);
    
    setMessages(prev => [...prev, optimisticMessage]);

    // Emit message to server for group chat
    socket.emit("newMessage", {
      chatId: selectedChat.room_id,
      isGroup: true,
      user,
      content,
      fileUrl
    });

    setInputValue("");
    setSelectedFile(null);
    setFileName("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  }

  if (!selectedChat) {
    return (
      <div className="chat-window">
        <div className="chat-placeholder"><h3>Select a group chat to start messaging</h3></div>
      </div>
    )
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-user-info">
          <div className="chat-avatar">
            <img src="/media/default.jpg" alt="Group Avatar" />
          </div>
          <div className="more-info">
            <div className="chat-username">
              {selectedChat.name}
            </div>
            <div className="group-info">Group Chat</div>
          </div>
        </div>
        <div className="chat-header-menu">
          <div className="menu-option" onClick={() => setShowCreatePollModal(true)} title="Create Poll">
            <img src="/media/vote.svg" alt="Create Poll" className="sidebar-icon" />
          </div>
          <div className="menu-option">
            <img src="/media/options.svg" alt="Options" className="sidebar-icon" />
          </div>
        </div>
      </div>

      <div className="chat-messages">
        {console.log("🎨 Rendering group messages, count:", messages.length, "messages:", messages)}
        {console.log("👤 Current user:", user)}
        
        {/* Render polls first */}
        {polls.map((poll) => (
          <div key={`poll-${poll.poll_id}`} className="chat-message poll-message">
            <Poll 
              poll={poll}
              onVote={handleVotePoll}
              showResults={poll.userVotes && poll.userVotes.length > 0}
              currentUserId={user.user_id}
            />
          </div>
        ))}
        
        {messages.length === 0 && polls.length === 0 && <div>No messages yet...</div>}
        {messages.map((msg, i) => {
          const isMine = msg.sender_id === user.user_id;
          console.log("🎨 Rendering group message:", i, {
            message_id: msg.message_id,
            sender_id: msg.sender_id,
            user_id: user.user_id,
            isMine: isMine,
            content: msg.content?.substring(0, 30) + '...',
            username: msg.username || msg.sender_username
          });
          return (
            <div key={`${msg.message_id}-${i}`} className={"chat-message " + (isMine ? "message-mine" : "message-other")}>
              {!isMine && (
                <div className="message-sender">{msg.username || msg.sender_username}</div>
              )}
              <div className="chat-message-content">{msg.content}</div>
              {msg.fileUrl && (
                /\.(jpeg|jpg|gif|png)$/i.test(msg.fileUrl) ? (
                  <img src={msg.fileUrl} className="chat-img" alt="attachment" />
                ) : (
                  <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">Download file</a>
                )
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <div className="chat-input-container">
          <input
            className="chat-text-input"
            placeholder="Type a message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={MESSAGE_LIMITS.MAX_LENGTH}
          />
          <div className="character-counter">
            <span className={inputValue.length > MESSAGE_LIMITS.WARNING_THRESHOLD ? 'warning' : ''}>
              {inputValue.length}/{MESSAGE_LIMITS.MAX_LENGTH}
            </span>
          </div>
        </div>
        <div className="file-input-wrapper">
          <input onChange={handleFileChange} accept="image/*,application/pdf" type="file" className="file-upload-input" ref={inputFileRef} />
          <div className="file-upload-btn" onClick={clickFileInput}><img src="../media/image-down.svg" alt="Upload" /></div>
        </div>
        <button className="chat-send-btn" onClick={handleSendMessage}>
          Send
        </button> 
      </div>

      <CreatePollModal 
        isOpen={showCreatePollModal}
        onClose={() => setShowCreatePollModal(false)}
        onCreatePoll={handleCreatePoll}
      />
    </div>
  );
}
