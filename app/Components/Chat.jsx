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
  const inputFileRef = useRef(null);

  const [readBy, setReadBy] = useState(new Set());

 useEffect(() => {
  if (!socket || !selectedChat) return;

  socket.emit("messagesRead", { chatId: selectedChat.room_id });

  if (selectedChat && socket) {
    socket.emit("markMessagesRead", {
      chatId: selectedChat.room_id,
    });
  }

  socket.emit("getMessages", { chatId: selectedChat.room_id });

  const handleMessages = ({ chatId, messages }) => {
    setMessages(messages);
    socket.emit("markMessagesRead", { chatId: selectedChat.room_id });
  };

  const handleNew = (msg) => {
    if (!msg.sender_id && msg.user?.user_id) {
      msg.sender_id = msg.user.user_id;
    }
    if (String(msg.chat_id) !== String(selectedChat.room_id)) return;
    setMessages((prev) => [...prev, msg]);
  };

  function onMessagesReadConfirmation({ chatId }) {
    console.log(1);
    console.log(chatId);
    if (chatId === selectedChat.room_id) {
      console.log(2);
      setReadBy(new Set());
    }
  }

  function onMessageReadBy({ chatId, readerId }) {
    console.log(3);
    if (chatId !== selectedChat.room_id) return;
    console.log(4);
    setReadBy(prev => new Set([...prev, readerId]));
  }

  socket.on("messagesReadConfirmation", onMessagesReadConfirmation);
  socket.on("messageReadBy", onMessageReadBy);

  socket.on("messages", handleMessages);
  socket.on("newMessage", handleNew);

  return () => {
    socket.off("messagesReadConfirmation", onMessagesReadConfirmation);
    socket.off("messageReadBy", onMessageReadBy);
    socket.off("messages", handleMessages);
    socket.off("newMessage", handleNew);
  };
}, [socket, selectedChat]);


  useEffect(() => {
    console.log(messages);
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

    // Tworzymy tymczasowe ID wiadomości lokalnie (może timestamp lub UUID)
    const tempId = `temp-${Date.now()}`;

    // Dodajemy lokalnie wiadomość do stanu - optimistic update
    setMessages(prev => [
      ...prev,
      {
        message_id: tempId,         // tymczasowe ID, zastąpi je backend po potwierdzeniu
        chat_id: selectedChat.room_id,
        sender_id: user.user_id,
        username: user.username,
        content,
        fileUrl,
        sent_at: new Date().toISOString(),
      }
    ]);

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
        {messages.map((msg, i) => (
          <div key={msg.message_id} className={"chat-message " + (msg.sender_id === user.user_id ? "message-mine" : "message-other")}>
            {/* <div className="chat-message-user">{msg.username || msg.user || "Unknown"}</div> */}
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
        ))}
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
        {/* <div className="file-input-wrapper">
        <label htmlFor="fileUpload" className="chat-file-label">
          {selectedFile ? "File ready" : "Attach"}
        </label>
        <input
          type="file"
          id="fileUpload"
          className="chat-file-input"
          onChange={handleFileChange}
        />
        </div>*/}
        <div class="file-input-wrapper">
        <input onChange={handleFileChange} accept="image/*,application/pdf" type="file" class="file-upload-input" ref={inputFileRef}  />
        <div class="file-upload-btn" onClick={clickFileInput}><img src="../media/image-down.svg" alt="Upload" /></div>
      </div>
        <button className="chat-send-btn" onClick={handleSendMessage}>
          Send
        </button> 
      </div>
    </div>
  );
}
