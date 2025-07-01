import "./Chat.css";
import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

export default function Chat({ user, token }) {
    const [messages, setMessages] = useState([]);
    const messagesEndRef = useRef(null);

    const socketRef = useRef();
    
    useEffect(() => {
        socketRef.current = io("http://localhost:3001", {
            auth: { token }
        });

        // Fetch existing messages from the server when the component mounts
        socketRef.current.emit("getMessages");

        // Listen for the initial messages from the server
        socketRef.current.on("messages", (messages) => {
            setMessages(messages);
        });

        // Listen for new messages from the server
        socketRef.current.on("newMessage", (message) => {
            setMessages((prev) => [...prev, message]);
        });

        // Cleanup function to remove the event listener when the component unmounts
        return () => {
            socketRef.current.off("newMessage");
            socketRef.current.off("messages");
        };
    }, [token]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

   function handleSendMessage() {
        const input = document.querySelector(".chat-input input");
        const content = input.value.trim();
        if (!content) return;

        // Turn the button into a loading state
        // to prevent multiple clicks while sending the message
        const btnSendMessage = document.getElementById("send-message-btn");
        btnSendMessage.disabled = true;
        btnSendMessage.textContent = "Sending...";
        input.value = "";

       // Emit the new message to the server
        socket.emit("newMessage", { user: user.username, content });

        // Simulate a network delay
        setTimeout(() => {
            btnSendMessage.disabled = false;
            btnSendMessage.textContent = "Send";
        }, 2000);
    }

    return (
        <div className="chat-component">
            <div className="chat-header">
                <h1>Realtime Chat</h1>
                <p>Stay connected with your friends!</p>
        </div>
      {messages.length > 0 ? (
        <ul className="chat-messages">
          {messages.map(message => (
            <li key={message.id}>
              <strong>{message.user}</strong>: {message.content}
            </li>
          ))}
          <div ref={messagesEndRef} />
        </ul>
      ) : (
        <p>No messages found.</p>
      )}
      <div className="chat-input">
        <input type="text" placeholder="Type your message..." />
        <button id="send-message-btn" onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
}