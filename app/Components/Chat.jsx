import "./Chat.css";
import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

export default function Chat({ user, token }) {
    const [fileName, setFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const socketRef = useRef();

  useEffect(() => {
    socketRef.current = io("http://localhost:3001", {
      auth: { token },
    });

    socketRef.current.emit("getMessages");

    socketRef.current.on("messages", (messages) => {
      setMessages(messages);
    });

    socketRef.current.on("newMessage", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socketRef.current.off("newMessage");
      socketRef.current.off("messages");
      socketRef.current.disconnect();
    };
  }, [token]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  function handleFileChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setSelectedFile(file);
  }

  async function handleSendMessage() {
    const btnSendMessage = document.getElementById("send-message-btn");
    btnSendMessage.disabled = true;
    btnSendMessage.textContent = "Sending...";

    const input = document.querySelector('input[type="text"]');
    const content = input.value.trim();

    if (!content && !selectedFile) {
      btnSendMessage.disabled = false;
      btnSendMessage.textContent = "Send";
      return;
    }

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
      } catch (error) {
        console.error("Error uploading file:", error);
        alert("File upload failed, please try again.");
        btnSendMessage.disabled = false;
        btnSendMessage.textContent = "Send";
        return;
      }
    }

    // Wyślij username jako string, nie obiekt user
    socketRef.current.emit("newMessage", {
      user: user.username || user, 
      content,
      fileUrl,
    });

    input.value = "";
    setSelectedFile(null);

    // Reset input file
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = "";

    btnSendMessage.disabled = false;
    btnSendMessage.textContent = "Send";
  }

  function handleKeyDown(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    handleSendMessage();
  }}

  return (
    <div className="chat-component">
      <div className="chat-header">
        <h1>Realtime Chat</h1>
        <p>Stay connected with your friends!</p>
      </div>
      {messages.length > 0 ? (
        <ul className="chat-messages">
          {messages.map((msg) => (
            <li key={msg.id}>
              <strong>{msg.user}</strong>: {msg.content}{" "}
              {msg.fileUrl && (
                /\.(jpeg|jpg|gif|png)$/i.test(msg.fileUrl) ? (
                  <img
                    src={msg.fileUrl}
                    alt="uploaded"
                    style={{ maxWidth: "200px" }}
                  />
                ) : (
                  <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
                    Download file
                  </a>
                )
              )}
            </li>
          ))}
          <div ref={messagesEndRef} />
        </ul>
      ) : (
        <p className="no-messages">No messages yet. Start the conversation!</p>
      )}
      <div className="chat-input">
        <input type="text" placeholder="Type your message..." onKeyDown={handleKeyDown} />
         <div className="file-input-wrapper">
            <label htmlFor="file-upload" className="custom-file-upload">
                Wybierz plik
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
