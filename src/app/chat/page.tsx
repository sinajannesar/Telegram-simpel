"use client";
import React, { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useRouter } from "next/navigation";
import ChatPage from "@/components/chatpage/page";


const GlowingAurora = () => (
  <div className="relative flex h-40 w-40 items-center justify-center">
    <div
      className="absolute h-full w-full rounded-full bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 opacity-75 animate-aurora-pulse"
      style={{ animationDelay: '2s' }}
    />
    <div className="absolute h-3/4 w-3/4 rounded-full bg-gradient-to-r from-sky-400 to-cyan-300 opacity-80 animate-aurora-pulse" />
  </div>
);


interface LoadingScreenProps {
  title: string;
  message: string;
}

const UltimateLoadingScreen: React.FC<LoadingScreenProps> = ({ title, message }) => (
  <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-900 text-white overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900/80 to-blue-900 bg-[size:200%_200%] animate-gradient-flow" />
    
    <div className="relative z-10 flex flex-col items-center space-y-8 text-center p-4">
      <GlowingAurora />
      <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white" style={{ textShadow: '0 0 15px rgba(255,255,255,0.3)' }}>
          {title}
        </h1>
        <p className="mt-4 text-lg text-gray-300/80 tracking-wider">
          {message}
        </p>
      </div>
    </div>
  </div>
);



interface UserData {
  id: number;
  email: string;
  firstname: string;
  lastname: string;
  roomId: string | number;
}

const App = () => {
  const router = useRouter();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser: UserData = JSON.parse(storedUser);
        if (parsedUser.id && parsedUser.email && parsedUser.firstname && parsedUser.lastname) {
          if (!parsedUser.roomId) {
            parsedUser.roomId = `room_${parsedUser.id}`;
            localStorage.setItem('user', JSON.stringify(parsedUser));
          }
          setUserData(parsedUser);
          setTimeout(() => setIsLoading(false), 500); 
        } else {
          router.push('/authregister/login');
        }
      } catch  {
        localStorage.removeItem('user');
        router.push('/authregister/login');
      }
    } else {
      setIsLoading(false);
      router.push('/authregister/login');
    }
  }, [router]);

  useEffect(() => {
    if (socketRef.current) return;
    const newSocket = io("http://localhost:3001", { transports: ["websocket"] });
    newSocket.on("connect", () => setIsConnected(true));
    newSocket.on("disconnect", () => setIsConnected(false));
    socketRef.current = newSocket;
    setSocket(newSocket);
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  if (isLoading) {
    return (
      <UltimateLoadingScreen 
        title="Preparing Your Space"
        message="Crafting your personal environment..."
      />
    );
  }

  if (!socket || !isConnected) {
    return (
        <UltimateLoadingScreen 
            title="Waking Up The Servers"
            message="Connecting to the global network..."
        />
    );
  }

  if (!userData) {
    router.push('/authregister/login');
    return null; 
  }

  const displayName = `${userData.firstname} ${userData.lastname}`;
  const roomId = userData.roomId?.toString() || `room_${userData.id}`;

  return (
    <ChatPage 
      socket={socket} 
      username={displayName} 
      roomId={roomId} 
    />
  );
};

export default App;