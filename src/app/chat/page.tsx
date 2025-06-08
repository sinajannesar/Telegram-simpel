// app.tsx یا کامپوننت والد شما
"use client";
import React, { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import ChatPage from "@/components/page";

const App = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [username, setUsername] = useState<string>("");
  const [roomId, setRoomId] = useState<string>("");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  
  // استفاده از useRef برای جلوگیری از re-creation
  const socketRef = useRef<Socket | null>(null);

  // تنها یکبار socket بسازید
  useEffect(() => {
    // اگر socket قبلاً ساخته شده، دوباره نسازید
    if (socketRef.current) return;

    const newSocket = io("http://localhost:3001", {
      transports: ["websocket"], // فقط websocket استفاده کنید
    });

    newSocket.on("connect", () => {
      console.log("Connected to server");
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from server");
      setIsConnected(false);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Cleanup function
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []); // خالی بگذارید - فقط یکبار اجرا شود

  // Join room function
  const joinRoom = (username: string, roomId: string) => {
    if (socketRef.current && username && roomId) {
      setUsername(username);
      setRoomId(roomId);
      socketRef.current.emit("join_room", roomId);
    }
  };

  if (!socket || !isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4">Connecting to server...</p>
        </div>
      </div>
    );
  }

  if (!username || !roomId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center">Join Chat</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const user = formData.get("username") as string;
              const room = formData.get("roomId") as string;
              if (user && room) {
                joinRoom(user, room);
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                name="username"
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room ID
              </label>
              <input
                name="roomId"
                type="text" 
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter room ID"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Join Chat
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <ChatPage 
      socket={socket} 
      username={username} 
      roomId={roomId} 
    />
  );
};

export default App;