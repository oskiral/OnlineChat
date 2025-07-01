import "./Chat.css";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3001");


export default function Chat() {
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        // Fetch messages from the server
        fetch("http://localhost:3001/messages")
        .then((res) => res.json())
        .then(setMessages)
        .catch(console.error);

        // Listen for new messages from the server
        socket.on("newMessage", (message) => {
            setMessages((prev) => [...prev, message]);
        });

        // Cleanup function to remove the event listener when the component unmounts
        return () => {
            socket.off("newMessage");
        };
    }, []);

   function handleSendMessage() {
        const input = document.querySelector(".chat-input input");
        const content = input.value.trim();
        if (!content) return;

        const user = "oskar"; 

        // Turn the button into a loading state
        // to prevent multiple clicks while sending the message
        const btnSendMessage = document.getElementById("send-message-btn");
        btnSendMessage.disabled = true;
        btnSendMessage.textContent = "Sending...";
        input.value = "";

       // Emit the new message to the server
        socket.emit("newMessage", { user, content });

        // Simulate a network delay
        setTimeout(() => {
            btnSendMessage.disabled = false;
            btnSendMessage.textContent = "Send";
        }, 2000);
    }

    return (
        <div className="chat-component">
            <div className="chat-header">
                <h1>Chat Component</h1>
                <p>This is the chat component of the application.</p>
        </div>
      {messages.length > 0 ? (
        <ul className="chat-messages">
          {messages.map(message => (
            <li key={message.id}>
              <strong>{message.user}</strong>: {message.content}
            </li>
          ))}
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