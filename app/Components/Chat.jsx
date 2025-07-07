import { useEffect, useState, useRef, useContext } from "react";
import { SocketContext } from "../utils/socketProvider";
import resizeImage from "../utils/resizeImage";
import "./Chat.css";

export default function Chat({ user, token, onLogout, setUser, selectedChat }) {
  const [fileName, setFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesRead, setMessagesRead] = useState(false);
  const messagesEndRef = useRef(null);
  const socket = useContext(SocketContext);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (!socket || !selectedChat) return;

    socket.emit("getMessages", { chatId: selectedChat.room_id });

    const handleMessages = (msgs) => {
      setMessages(msgs);
      socket.emit("markMessagesRead", { chatId: selectedChat.room_id });
    };

    const handleNew = (msg) => setMessages((prev) => [...prev, msg]);
    const handleRead = ({ chatId }) => {
      if (String(chatId) === String(selectedChat.room_id)) setMessagesRead(true);
    };

    socket.on("messages", handleMessages);
    socket.on("newMessage", handleNew);
    socket.on("messagesRead", handleRead);

    return () => {
      socket.off("messages", handleMessages);
      socket.off("newMessage", handleNew);
      socket.off("messagesRead", handleRead);
    };
  }, [socket, selectedChat]);

  useEffect(() => {
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

  async function handleSendMessage() {
    if (!socket || !selectedChat) return;

    const content = inputValue.trim();
    if (!content && !selectedFile) return;

    let fileUrl = null;
    if (selectedFile) {
      try {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const response = await fetch("http://localhost:3001/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Upload failed");
        const data = await response.json();
        fileUrl = `http://localhost:3001${data.fileUrl}`;
      } catch (err) {
        alert("File upload failed.");
        return;
      }
    }

    socket.emit("newMessage", {
      chatId: selectedChat.room_id,
      isGroup: selectedChat.type === "group",
      user,
      content,
      fileUrl,
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
        {messages.map((msg) => (
          <div key={msg.message_id} className="chat-message">
            <div className="chat-message-user">{msg.username || msg.user || "Unknown"}</div>
            <div className="chat-message-content">{msg.content}</div>
            {msg.fileUrl && (
              /\.(jpeg|jpg|gif|png)$/i.test(msg.fileUrl) ? (
                <img src={msg.fileUrl} className="chat-img" alt="attachment" />
              ) : (
                <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">Download file</a>
              )
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-bar">
        <input
          className="chat-text-input"
          placeholder="Type a message..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <label htmlFor="fileUpload" className="chat-file-label">
          {selectedFile ? "File ready" : "Attach"}
        </label>
        <input
          type="file"
          id="fileUpload"
          className="chat-file-input"
          onChange={handleFileChange}
        />
        <button className="chat-send-btn" onClick={handleSendMessage}>
          Send
        </button>
      </div>
    </div>
  );
}
