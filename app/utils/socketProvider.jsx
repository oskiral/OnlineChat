import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

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
    });

    setSocket(newSocket);



    // handles forceLogout
    newSocket.on("forceLogout", () => {
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      setUser(null);
      newSocket.disconnect();
    });

    // handles forceLogin
    newSocket.on("forceLogin", (userData) => {
      console.log("forceLogin received:", userData);
      localStorage.setItem("token", userData.token);
      localStorage.setItem("username", userData.username);
      setUser(userData);
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
