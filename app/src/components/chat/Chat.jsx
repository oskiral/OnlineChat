import { useEffect, useState, useRef } from "react";
import { useSocket } from "../../contexts/SocketProvider";
import resizeImage from "../../utils/resizeImage";
import { API_BASE_URL, API_ENDPOINTS } from "../../constants";
import "../../styles/Chat.css";

export default function Chat({ user, token, onLogout, setUser, selectedChat }) {
  const [fileName, setFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesRead, setMessagesRead] = useState(false);
  const messagesEndRef = useRef(null);
  const socket = useSocket();
  const [inputValue, setInputValue] = useState("");
  const inputFileRef = useRef(null);

  const [readBy, setReadBy] = useState(new Set());

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    console.log("🎯 Chat useEffect triggered - socket:", !!socket, "selectedChat:", !!selectedChat);
    
    if (!socket || !selectedChat) {
      console.log("⚠️ Missing dependencies - socket:", !!socket, "selectedChat:", !!selectedChat);
      return;
    }

    console.log("🎯 Chat useEffect triggered for:", selectedChat.user.username, "chatId:", selectedChat.room_id);

    // Clear messages when switching chats
    setMessages([]);

    socket.emit("messagesRead", { chatId: selectedChat.room_id });

    if (selectedChat && socket) {
      socket.emit("markMessagesRead", {
        chatId: selectedChat.room_id,
      });
    }

    console.log("📡 Requesting messages for chat:", selectedChat.room_id);
    socket.emit("getMessages", { chatId: selectedChat.room_id });

    const handleMessages = ({ chatId, messages }) => {
      console.log("📥 Received messages response:", { chatId, messageCount: messages.length });
      console.log("📋 Full messages data:", messages);
      console.log("📋 Messages preview:", messages.slice(-3).map(m => ({
        id: m.message_id,
        sender: m.sender_username || m.username,
        content: m.content?.substring(0, 50) + '...'
      })));
      
      if (String(chatId) === String(selectedChat.room_id)) {
        console.log("✅ Setting messages for chat:", chatId);
        console.log("📝 Messages being set:", messages);
        setMessages(messages);
        console.log("✅ Messages set successfully");
        socket.emit("markMessagesRead", { chatId: selectedChat.room_id });
      } else {
        console.log("⚠️ Received messages for different chat, ignoring");
      }
    };

  const handleNew = (msg) => {
    console.log("📥 Received newMessage:", msg);
    
    if (!msg.sender_id && msg.user?.user_id) {
      msg.sender_id = msg.user.user_id;
    }
    if (String(msg.chat_id) !== String(selectedChat.room_id)) return;
    
    // Check if this message is from current user (our own message echoed back)
    if (msg.sender_id === user.user_id) {
      console.log("🔄 Received our own message from server");
      
      setMessages((prev) => {
        // Look for the most recent temporary message
        const tempMessageIndex = prev.findIndex(m => 
          m.message_id && 
          m.message_id.toString().startsWith('temp-') &&
          m.content === msg.content &&
          m.sender_id === user.user_id
        );
        
        if (tempMessageIndex !== -1) {
          console.log("✅ Replacing temporary message with server response");
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
          console.log("⚠️ Duplicate message detected, ignoring");
          return prev;
        }
        
        console.log("⚠️ No temp message found but adding anyway (edge case)");
        return [...prev, {
          ...msg,
          username: msg.sender_username || user.username
        }];
      });
      return;
    }
    
    // Message from another user
    console.log("📨 Adding message from other user");
    setMessages((prev) => {
      // Check for duplicates from other users too
      const duplicateExists = prev.some(m => 
        m.message_id === msg.message_id ||
        (m.content === msg.content && 
         m.sender_id === msg.sender_id && 
         Math.abs(new Date(m.sent_at) - new Date(msg.sent_at)) < 5000)
      );
      
      if (duplicateExists) {
        console.log("⚠️ Duplicate message from other user, ignoring");
        return prev;
      }
      
      return [...prev, {
        ...msg,
        username: msg.sender_username || msg.username
      }];
    });
  };

  function onMessagesReadConfirmation({ chatId }) {
    if (chatId === selectedChat.room_id) {
      setReadBy(new Set());
    }
  }

  function onMessageReadBy({ chatId, readerId }) {
    if (chatId !== selectedChat.room_id) return;
    setReadBy(prev => new Set([...prev, readerId]));
  }

  socket.on("messagesReadConfirmation", onMessagesReadConfirmation);
  socket.on("messageReadBy", onMessageReadBy);

  socket.on("messages", handleMessages);
  socket.on("newMessage", handleNew);

  console.log("🔗 Socket listeners attached for chat:", selectedChat.room_id);

  return () => {
    console.log("🧹 Cleaning up socket listeners for chat:", selectedChat.room_id);
    socket.off("messagesReadConfirmation", onMessagesReadConfirmation);
    socket.off("messageReadBy", onMessageReadBy);
    socket.off("messages", handleMessages);
    socket.off("newMessage", handleNew);
  };
}, [socket, selectedChat, user.user_id]);


  useEffect(() => {
    console.log("📊 Messages state changed:", messages.length, messages);
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleFileChange(event) {
    const file = event.target.files[0];
    if (!file) return;

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

    // Tworzymy tymczasowe ID wiadomości lokalnie (może timestamp lub UUID)
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    
    console.log("📤 Sending message with tempId:", tempId, "content:", content);

    // Dodajemy lokalnie wiadomość do stanu - optimistic update
    const optimisticMessage = {
      message_id: tempId,         // tymczasowe ID, zastąpi je backend po potwierdzeniu
      chat_id: selectedChat.room_id,
      sender_id: user.user_id,
      username: user.username,
      sender_username: user.username,  // Add both for consistency
      content,
      fileUrl,
      sent_at: new Date().toISOString(),
    };
    
    console.log("📝 Adding optimistic message:", optimisticMessage);
    
    setMessages(prev => [...prev, optimisticMessage]);

    // Emitujemy wiadomość do serwera
    socket.emit("newMessage", {
      chatId: selectedChat.room_id,
      isGroup: selectedChat.type === "group",
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
      <div className="chat-placeholder"><h3>Select a chat to start messaging</h3></div>
    </div>
    )
  }
  const lastMessage = messages[messages.length - 1];
  const lastMessageReadByOther =
    lastMessage &&
    lastMessage.sender_id === user.user_id &&
    Array.from(readBy).some(id => id !== user.user_id);

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-user-info">
          <img src={selectedChat.user.avatar || "../media/default.jpg"} className="chat-avatar" />
          <div className="more-info">
            <div className="chat-username">{selectedChat.user.username}</div>
            <div className="chat-status">Online</div>
          </div>
        </div>
        <div className="chat-header-menu">
          <div className="menu-option">
              <img src="/media/options.svg" alt="Options" className="sidebar-icon" />
          </div>
        </div>
      </div>

      <div className="chat-messages">
        {console.log("🎨 Rendering messages, count:", messages.length, "messages:", messages)}
        {console.log("👤 Current user:", user)}
        {messages.length === 0 && <div>No messages yet...</div>}
        {messages.map((msg, i) => {
          const isMine = msg.sender_id === user.user_id;
          console.log("🎨 Rendering message:", i, {
            message_id: msg.message_id,
            sender_id: msg.sender_id,
            user_id: user.user_id,
            isMine: isMine,
            content: msg.content?.substring(0, 30) + '...'
          });
          return (
            <div key={`${msg.message_id}-${i}`} className={"chat-message " + (isMine ? "message-mine" : "message-other")}>
              <div className="chat-message-content">{msg.content}</div>
              {msg.fileUrl && (
                /\.(jpeg|jpg|gif|png)$/i.test(msg.fileUrl) ? (
                  <img src={msg.fileUrl} className="chat-img" alt="attachment" />
                ) : (
                  <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">Download file</a>
                )
              )}
              {i === messages.length - 1 && lastMessageReadByOther && (
                <div className="read-receipt">✔️ Read</div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <input
          className="chat-text-input"
          placeholder="Type a message..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="file-input-wrapper">
        <input onChange={handleFileChange} accept="image/*,application/pdf" type="file" className="file-upload-input" ref={inputFileRef}  />
        <div className="file-upload-btn" onClick={clickFileInput}><img src="../media/image-down.svg" alt="Upload" /></div>
      </div>
        <button className="chat-send-btn" onClick={handleSendMessage}>
          Send
        </button> 
      </div>
    </div>
  );
}
