import { useState, useEffect } from "react";
import Chat from "../Components/Chat"
import Login from "../Components/Login"
import UserPanel from "../Components/UserPanel"

function App() {
  const [user, setUser] = useState(null);

  // Check for existing user in localStorage on initial render
  // If found, set the user state with username and token
  useEffect(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    if (token && username) {
      setUser({ username, token });
    }
  }, []);

  function handleLogin(userData) {
    setUser(userData);
    localStorage.setItem('token', userData.token);
    localStorage.setItem('username', userData.username);
  }

  function handleLogout() {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('username');
  }

  return (
    <>
      <h1>Realtime Chat</h1>
      <p>Welcome to the chat application!</p>
      <p>Feel free to send messages and interact with others.</p>
      
      {user ? (
        <>
          <UserPanel user={user} onLogout={handleLogout} />
          <Chat user={user.username} token={user.token} />
        </>
      ) : (
        <Login onLogin={handleLogin} />
      )}
      <footer>
        <p>© 2025 Realtime Chat. All rights reserved.</p>
      </footer>
    </>
  )
}

export default App
