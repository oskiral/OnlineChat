import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

export const SocketContext = createContext({
  socket: null,
  friends: [],
  setFriends: () => {},
});

export function SocketProvider({ token, children, setUser, setFriends }) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!token) {

      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const newSocket = io("http://localhost:3001", {
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
        const res = await fetch(`http://localhost:3001/users/${friendId}`, {
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

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, [token]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}