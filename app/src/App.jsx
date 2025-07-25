import { useState, useEffect } from "react";
import Login from "./components/auth/Login";
import AppLayout from "./components/layout/AppLayout";
import { SocketProvider } from "./contexts/SocketProvider";
import { API_BASE_URL, API_ENDPOINTS } from "./constants";


function App() {
  const [user, setUser] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('chat');

  useEffect(() => {
    async function fetchUser() {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USER.ME}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Unauthorized");

        const data = await res.json();
        if (data?.username) {
          setUser({ ...data, token }); // ustawia username, avatar i token
          localStorage.setItem("username", data.username);
        } else {
          throw new Error("Invalid user data");
        }
      } catch (err) {
        console.warn("Session expired or invalid:", err);
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);


  // Handle login by storing user data in local storage and updating state
  // This function is called from the Login component when the user successfully logs in.
  async function handleLogin(userData) {


    // Validate userData before proceeding
    if (!userData || !userData.token || !userData.username) {
      console.error("Invalid user data:", userData);
      return;
    }

    // Store token and username in local storage
    localStorage.setItem("token", userData.token);
    localStorage.setItem("username", userData.username);

    // Fetch user data from the server using the token
    // This ensures that we have the latest user information, including avatar.
    // If the token is invalid or expired, this will throw an error.
    try {
      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USER.ME}`, {
        headers: { Authorization: `Bearer ${userData.token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch user data");
      const data = await res.json();
      setUser({ ...data, token: userData.token });
    } catch {
      setUser({ user_id: userData.user_id, username: userData.username, token: userData.token, avatar: null });
    }
  }

  function handleLogout() {
    setUser(null);
    setSelectedChat(null);
    setActiveView('chat')
    localStorage.removeItem("token");
    localStorage.removeItem("username");
  }

  if (loading) return <div>Loading...</div>;

  return user ? (
    <SocketProvider token={user.token} username={user.username} setUser={setUser}>
      <AppLayout
        user={user}
        setUser={setUser}
        onLogout={handleLogout}
        onSelectedChat={(chat) => setSelectedChat(chat)}
        onSelectedChatUpdate={(updatedChat) => setSelectedChat(updatedChat)}
        selectedChat={selectedChat}
        activeView={activeView}
        setActiveView={setActiveView}
      />
    </SocketProvider>
  ) : (
    <Login onLogin={handleLogin} />
  );
}

export default App;
// This is the main application component that handles user authentication and displays either the chat interface or the login form.
// It uses local storage to persist user sessions and fetches user data from the server on initial load.
// The user panel allows the user to upload an avatar and log out, while the chat component
// provides the real-time messaging functionality.
