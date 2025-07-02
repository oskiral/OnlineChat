import "./Chat.css";
import resizeImage from "../utils/resizeImage";
import { useEffect, useState, useRef, useContext } from "react";
import {SocketContext} from "../utils/socketProvider";

export default function Chat({ user, token, onLogout, setUser }) {
  const [fileName, setFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const socket =  useContext(SocketContext);

  useEffect(() => {
  if (!socket) return;

  socket.emit("getMessages");

  socket.on("messages", (messages) => {
    setMessages(messages);
  });

  socket.on("newMessage", (message) => {
    setMessages((prev) => [...prev, message]);
  });

  socket.on("forceLogout", () => {
    onLogout();
  });

  // socket.on("forceLogin", (userData) => {
  //   console.log("Chat component got forceLogin event:", userData);
  //   localStorage.setItem("token", userData.token);
  //   localStorage.setItem("username", userData.username);
  //   setUser(userData);
  // });

  return () => {
    socket.off("newMessage");
    socket.off("messages");
    socket.off("forceLogout");
    // socket.off("forceLogin");
  };
}, [socket]);

  
  // handler for file input change
  // This function resizes images if they are larger than 200px width
  async function handleFileChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.type.startsWith("image/")) {
        try {
            const resized = await resizeImage(file, { maxWidth: 200 });
            setSelectedFile(resized);
        } catch (err) {
            console.error("Image resize failed", err);
            setSelectedFile(file); // fallback to original
        }
    } else {
        setSelectedFile(file); // for PDFs or other types
    }
  }

  async function handleSendMessage() {

    if (!socket) {
      console.error("Socket is not connected");
      return;
    }
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

    socket.emit("newMessage", {
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
  }
}

  return (
    <div className="chat-component">
      <div className="chat-header">
        <h1>Realtime Chat</h1>
        <p>Stay connected with your friends!</p>
      </div>
      
      {messages.length > 0 ? (
        <ul className="chat-messages">
          {messages.map((msg) => (
            <li key={msg.message_id}>
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
                    {fileName || "Download file"}
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
                Chose File
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
