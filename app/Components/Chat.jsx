import "./Chat.css";
import resizeImage from "../utils/resizeImage";
import { useEffect, useState, useRef, useContext } from "react";
import { SocketContext } from "../utils/socketProvider";

export default function Chat({ user, token, onLogout, setUser, selectedChat }) {
  const [fileName, setFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const socket = useContext(SocketContext);
  const [inputValue, setInputValue] = useState("");

useEffect(() => {
  console.log("Socket from context:", socket);
}, [socket]);

  useEffect(() => {
  if (!socket || !selectedChat) return;

  // Prośba o pobranie wiadomości
  socket.emit("getMessages", {
    chatId: selectedChat.user.user_id,
    isGroup: selectedChat.type === "group",
  });

  // Obsługa listy wiadomości (całości)
  const handleMessages = (messages) => {
    console.log("Received messages:", messages);
    setMessages(messages);
  };

  // Obsługa pojedynczej nowej wiadomości
  const handleNewMessage = (msg) => {
    console.log("Received new message:", msg);
    setMessages((prev) => [...prev, msg]);
  };

  socket.on("messages", handleMessages); // event z backendu dla listy
  socket.on("newMessage", handleNewMessage); // pojedyncze wiadomości
  socket.on("forceLogout", onLogout);

  return () => {
    socket.off("messages", handleMessages);
    socket.off("newMessage", handleNewMessage);
    socket.off("forceLogout", onLogout);
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
    console.log("selectedChat on send:", selectedChat);

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
          <label htmlFor="file-upload" className="custom-file-upload">
            Choose File
          </label>
          <input id="file-upload" type="file" accept="image/*,application/pdf" onChange={handleFileChange} />
        </div>
        <button id="send-message-btn" onClick={handleSendMessage}>
          Send
        </button>
      </div>
    </div>
  );
}
