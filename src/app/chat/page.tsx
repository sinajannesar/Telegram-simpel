"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useSession } from "next-auth/react";

interface ChatMessage {
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
}

interface OnlineUser {
  userId: string;
  userName: string;
}

export default function Chat() {
  const { data: session, status } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [input, setInput] = useState("");
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (status === "authenticated" && session?.accessToken) {
      // Initialize socket connection
      const newSocket = io(process.env.NEXT_PUBLIC_URL || "http://localhost:3000", {
        auth: { token: session.accessToken },
        autoConnect: false,
      });

      // Connection handlers
      newSocket.on("connect", () => {
        console.log("Connected to Socket.IO server");
        setIsConnected(true);
        setConnectionError(null);
      });

      newSocket.on("disconnect", (reason) => {
        console.log("Disconnected from Socket.IO server:", reason);
        setIsConnected(false);
      });

      newSocket.on("connect_error", (error) => {
        console.error("Connection error:", error.message);
        setConnectionError(error.message);
        setIsConnected(false);
      });

      // Data handlers
      newSocket.on("online-users", (users: OnlineUser[]) => {
        setOnlineUsers(users);
      });

      newSocket.on("chat-message", (message: ChatMessage) => {
        setMessages((prev) => [...prev, message]);
      });

      // Connect socket
      newSocket.connect();
      setSocket(newSocket);

      // Cleanup function
      return () => {
        if (newSocket) {
          newSocket.disconnect();
          newSocket.removeAllListeners();
        }
      };
    } else if (status === "unauthenticated") {
      // Clean up socket if user is not authenticated
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [session, status, socket]);

  const sendMessage = () => {
    if (input.trim() && socket && isConnected) {
      socket.emit("chat-message", input.trim());
      setInput("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-xl">Loading user information...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-900 to-black text-white p-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
        <p className="text-lg mb-6">Please log in to use the chat feature.</p>
        <a 
          href="/authregister/login" 
          className="px-6 py-3 font-semibold rounded-xl shadow-lg bg-gradient-to-r from-blue-700 to-purple-600 text-white hover:from-blue-600 hover:to-purple-500 transition-all duration-300 ease-in-out transform hover:scale-105"
        >
          Log In
        </a>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div
        className="relative w-full max-w-4xl bg-gray-800/30 dark:bg-black/50 backdrop-blur-2xl rounded-3xl shadow-2xl border border-purple-500/30 transition-all duration-500 hover:shadow-[0_0_45px_rgba(168,85,247,0.5)] flex flex-col"
        style={{ height: 'calc(100vh - 80px)', maxHeight: '800px' }}
      >
        {/* Pulsing background effect */}
        <div className="absolute inset-0 rounded-3xl overflow-hidden -z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/5 to-blue-600/10 animate-pulse"></div>
        </div>

        {/* Chat Header */}
        <div className="p-5 md:p-6 border-b border-purple-400/20 relative z-10 flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            Chat Room
          </h1>
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${
              isConnected ? 'bg-green-500/80' : 'bg-red-500/80'
            }`}>
              {isConnected ? "Online" : "Offline"}
            </span>
          </div>
        </div>

        {/* User Info and Online Users */}
        <div className="p-3 px-5 text-xs md:text-sm text-gray-300 dark:text-gray-400 border-b border-purple-400/20 relative z-10">
          <div className="flex justify-between items-center mb-2">
            <span>User: <span className="font-semibold text-purple-300">{session?.user?.name || "Anonymous"}</span></span>
            <span>Online: <span className="font-semibold text-purple-300">{onlineUsers.length}</span></span>
          </div>
          
          {/* Online Users List */}
          {onlineUsers.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="text-xs text-gray-400">Online users:</span>
              {onlineUsers.map((user, ) => (
                <span 
                  key={user.userId} 
                  className={`px-2 py-1 rounded-full text-xs ${
                    user.userId === session?.user?.id 
                      ? 'bg-purple-600/50 text-purple-200' 
                      : 'bg-gray-600/50 text-gray-300'
                  }`}
                >
                  {user.userName} {user.userId === session?.user?.id && '(You)'}
                </span>
              ))}
            </div>
          )}

          {/* Connection Error */}
          {connectionError && (
            <div className="mt-2 text-red-400 text-xs">
              Connection Error: {connectionError}
            </div>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-grow p-4 md:p-6 space-y-4 overflow-y-auto relative z-10 scrollbar-thin scrollbar-thumb-purple-500/40 scrollbar-track-gray-700/20 scrollbar-thumb-rounded-full">
          {messages.length === 0 && (
            <p className="text-center text-gray-400 dark:text-gray-500 py-10">
              No messages yet. Be the first one to start the conversation!
            </p>
          )}
          
          {messages.map((msg, index) => {
            const isCurrentUser = msg.userId === session?.user?.id;
            return (
              <div key={index} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] md:max-w-[60%] px-4 py-2.5 rounded-2xl shadow-md transition-all duration-300 ${
                  isCurrentUser
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-br-lg'
                    : 'bg-gray-600/50 dark:bg-gray-700/70 text-gray-100 dark:text-gray-50 rounded-bl-lg'
                }`}>
                  {!isCurrentUser && (
                    <p className="text-xs font-semibold text-purple-300 dark:text-purple-400 mb-1">
                      {msg.userName}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Area */}
        <div className="p-4 md:p-6 border-t border-purple-400/20 relative z-10">
          <div className="flex items-center space-x-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message here..."
              disabled={!isConnected}
              className="flex-grow w-full px-5 py-3 bg-gray-700/50 dark:bg-gray-800/70 border-2 border-transparent focus:border-purple-500/70 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500/70 transition-all duration-300 text-gray-50 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || !isConnected}
              className="p-3 md:px-5 md:py-3 font-semibold rounded-xl shadow-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-4 focus:ring-purple-400/50 transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center"
            >
              <span>Send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}