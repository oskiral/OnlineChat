import "./Chat.css";
import { useEffect, useState } from "react";

export default function Chat() {
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        // Fetch messages from the server
        fetch('http://localhost:3001/messages')
            .then(response => response.json())
            .then(data => setMessages(data))
            .catch(error => console.error('Error fetching messages:', error));
    }, []);

    function handleSendMessage() {
        const btnSendMessage = document.getElementById('send-message-btn');
        btnSendMessage.disabled = true; // Disable the button to prevent multiple clicks
        btnSendMessage.textContent = 'Sending...'; // Change button text to indicate sending
        document.querySelector('.chat-input input').value = ''; // Clear the input field

        // Simulate sending a message
        setTimeout(() => {
            btnSendMessage.disabled = false; // Re-enable the button
            btnSendMessage.textContent = 'Send'; // Reset button text
        }, 2000);

        const user = 'oskar'; // Example user
        const content = document.querySelector('.chat-input input').value; // Get message content from input
        fetch('http://localhost:3001/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user, content }),
        })
            .then(response => response.json())
            .then(data => {
                setMessages(prevMessages => [...prevMessages, data]);
            })
            .catch(error => console.error('Error sending message:', error));
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