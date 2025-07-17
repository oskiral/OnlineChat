import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { API_BASE_URL, API_ENDPOINTS, SOCKET_EVENTS } from "../constants";

export const SocketContext = createContext({
  socket: null,
  friends: [],
  setFriends: () => {},
  userStatus: new Map(), // userId -> { status, lastSeen }
  setUserStatus: () => {},
});

export function SocketProvider({ token, children, setUser, setFriends }) {
  const [socket, setSocket] = useState(null);
  const [userStatus, setUserStatus] = useState(new Map());

  useEffect(() => {
    if (!token) {

      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const newSocket = io(API_BASE_URL, {
      auth: { token },
      autoConnect: true,
    });

    newSocket.on("connect", () => {
      console.log("✅ Socket connected:", newSocket.id);
    });

    newSocket.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err.message);
    });

    newSocket.on("friend-added", async ({ friendId }) => {
      console.log("📬 friend-added received:", friendId);

      try {
        const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USER.GET_USER(friendId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch friend");

        const newFriend = await res.json();

        setFriends((prev) => {
          if (prev.find((f) => f.user_id === newFriend.user_id)) return prev;
          return [...prev, newFriend];
        });
      } catch (err) {
        console.error("Error fetching friend:", err);
      }
    });

    newSocket.on("forceLogout", () => {
      console.warn("🔒 Force logout triggered by server");
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      setUser(null);
      newSocket.disconnect();
    });

    // Obsługa statusu użytkowników
    newSocket.on(SOCKET_EVENTS.USER_STATUS_CHANGED, ({ userId, status, lastSeen }) => {
      console.log(`📊 User ${userId} status changed to ${status}`);
      setUserStatus(prev => {
        const newStatus = new Map(prev);
        newStatus.set(userId, { status, lastSeen });
        return newStatus;
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket, userStatus, setUserStatus }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
}
