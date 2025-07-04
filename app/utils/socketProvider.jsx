import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

export const SocketContext = createContext(null);

export function SocketProvider({ token, children, setUser }) {
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

  
  newSocket.on("connect_error", (err) => {
    console.error("Socket connection error:", err.message);
  });

  setSocket(newSocket);

  newSocket.on("forceLogout", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setUser(null);
    newSocket.disconnect();
  });

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
