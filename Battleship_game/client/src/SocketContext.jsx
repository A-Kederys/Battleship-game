import React, { createContext, useContext, useEffect } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const socket = io("http://localhost:8080");

  useEffect(() => {
    socket.connect();
    /*
    socket.on("connect", () => {
      console.log(`Connected to server with ID: ${socket.id}`);
    });
    */

    return () => {
      socket.disconnect();
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};