import "./Chat.css";
import resizeImage from "../utils/resizeImage";
import { useEffect, useState, useRef, useContext } from "react";
import { SocketContext } from "../utils/socketProvider";

export default function Chat({ user, token, onLogout, setUser, selectedChat }) {
  const [fileName, setFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesRead, setMessagesRead] = useState(false);
  const messagesEndRef = useRef(null);
  const socket = useContext(SocketContext);
  const [inputValue, setInputValue] = useState("");

  // Debug all incoming socket events
  useEffect(() => {
    if (!socket) return;
    const logger = (eventName, ...args) =>
      console.log("[Socket event]", eventName, args);
    socket.onAny(logger);
    return () => {
      socket.offAny(logger);
    };
  }, [socket]);

  // Fetch & render messages, then mark as read
  useEffect(() => {
    if (!socket || !selectedChat) return;

    // 1) Pobierz historię
    socket.emit("getMessages", { chatId: selectedChat.room_id });

    // 2) Gdy dostaniesz historię, wywołaj markMessagesRead
    const handleMessages = (msgs) => {
      setMessages(msgs);
      socket.emit("markMessagesRead", { chatId: selectedChat.room_id });
    };

    // 3) Nowe pojedyncze wiadomości
    const handleNew = (msg) => setMessages((prev) => [...prev, msg]);

    // 4) Ktoś inny potwierdził odczyt
    const handleRead = ({ chatId }) => {
      console.log(chatId, "- ", selectedChat.room_id);
      if (String(chatId) === String(selectedChat.room_id)) {
        setMessagesRead(true);
      }
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

    console.log("wiadomosc emit", fileUrl);
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
      <div className="chat-component">
        <p>Select a friend to start chatting.</p>
      </div>
    );
  }

  return (
    <div className="chat-component">
      {messagesRead && <div className="read-indicator">Read by other user</div>}
      
      <div className="chat-header">
        <h1>Chat with {selectedChat.user.username}</h1>
        <p>Stay connected with your friends!</p>
      </div>

      {messages.length > 0 ? (
        <ul className="chat-messages">
          {messages.map((msg) => (
            <li key={msg.message_id}>
              <strong>{msg.username || msg.user || "Unknown"}</strong>: {msg.content}{" "}
              {msg.fileUrl &&
                (/\.(jpeg|jpg|gif|png)$/i.test(msg.fileUrl) ? (
                  <img src={msg.fileUrl} alt="uploaded" style={{ maxWidth: "200px" }} />
                ) : (
                  <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
                    {fileName || "Download file"}
                  </a>
                ))}
            </li>
          ))}
          <div ref={messagesEndRef} />
        </ul>
      ) : (
        <p className="no-messages">No messages yet.</p>
      )}

      <div className="chat-input">
        <input
          type="text"
          placeholder="Type your message..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="file-input-wrapper">
            <input type="file" id="fileUpload" accept="image/*,application/pdf" className="file-upload-input" onChange={handleFileChange} />
            <label htmlFor="fileUpload" className="file-upload-btn">{selectedFile ? "File Ready" : "Choose File"}</label>
        </div>
        <button id="send-message-btn" onClick={handleSendMessage}>
          Send
        </button>
      </div>
    </div>
  );
}
