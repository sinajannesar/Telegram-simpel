"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useSession } from "next-auth/react";
// import { data } from "framer-motion/client"; // This import should be removed if not used.
// import { Send, Wifi, WifiOff, Users } from "lucide-react"; // Uncomment if you want to use icons

const socket = io(process.env.NEXT_PUBLIC_URL || "http://localhost:3000", {
    path: "/api/socket/socket.io",
    auth: { token: null },
    autoConnect: false,
});

export default function Chat() {
    const { data: session, status } = useSession();
    const [isConnected, setIsConnected] = useState(socket.connected);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]); // Assumes this array contains names or objects like {id, name}
    const [input, setInput] = useState("");

    interface ChatMessage {
        userId: string;
        userName?: string; // User's name for better display
        message: string;
    }

    useEffect(() => {
        if (status === "authenticated" && session?.accessToken) {
            if (!socket.connected) {
                socket.auth = { token: session.accessToken };
                console.log("Connecting with token:", session.accessToken);
                socket.connect();
            }
        } else if (status === "unauthenticated") {
            if (socket.connected) {
                socket.disconnect();
            }
        }
        // console.log(session, "SESSION DATA DEBUG"); // For checking session
        // console.log(status, "AUTH STATUS DEBUG");  // For checking status

        const onConnect = () => {
            setIsConnected(true);
            console.log("Connected as user ID:", session?.user?.id);
        };
        const onDisconnect = () => setIsConnected(false);
        // The server should send the list of online users with an appropriate structure (e.g., an array of {id, name} objects)
        const onOnlineUsers = (users: any[]) => { // Replace 'any' with a more specific type
            // If users is just an array of names:
            // setOnlineUsers(users);
            // If it's an array of objects:
             setOnlineUsers(users.map(u => u.name || u.id)); // Example
        };
        const onChatMessage = (msg: ChatMessage) => setMessages((prev) => [...prev, msg]);

        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);
        socket.on("online-users", onOnlineUsers);
        socket.on("chat-message", onChatMessage);

        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
            socket.off("online-users", onOnlineUsers);
            socket.off("chat-message", onChatMessage);
        };
    }, [session, status]);

    const sendMessage = () => {
        if (input.trim() && socket.connected) {
            socket.emit("chat-message", input); // The server should also add userName to the message
            setInput("");
        }
    };

    if (status === "loading") {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
                <p className="text-xl">Loading user information...</p>
                {/* You can also use a beautiful loader here */}
            </div>
        );
    }

    if (status === "unauthenticated") {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-900 to-black text-white p-8 text-center">
                <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
                <p className="text-lg mb-6">Please log in to use the chat feature.</p>
                <a href="/login" className="px-6 py-3 font-semibold rounded-xl shadow-lg bg-gradient-to-r from-blue-700 to-purple-600 text-white hover:from-blue-600 hover:to-purple-500 transition-all duration-300 ease-in-out transform hover:scale-105">
                    Log In
                </a>
            </div>
        );
    }

    // === Start of the main chat UI ===
    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
            <div
                className="relative w-full max-w-2xl bg-gray-800/30 dark:bg-black/50 backdrop-blur-2xl rounded-3xl shadow-2xl border border-purple-500/30 transition-all duration-500 hover:shadow-[0_0_45px_rgba(168,85,247,0.5)] flex flex-col"
                // For height, you can use vh units or a fixed height
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
                        {/* Optional Wifi Icon based on connection status */}
                        {/* {isConnected ? <Wifi className="h-5 w-5 text-green-400" /> : <WifiOff className="h-5 w-5 text-red-400" />} */}
                        <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${isConnected ? 'bg-green-500/80' : 'bg-red-500/80'}`}>
                            {isConnected ? "Online" : "Offline"}
                        </span>
                    </div>
                </div>

                {/* User Info and Online Users */}
                <div className="p-3 px-5 text-xs md:text-sm text-gray-300 dark:text-gray-400 border-b border-purple-400/20 relative z-10 flex justify-between items-center">
                    <span>User: <span className="font-semibold text-purple-300">{session?.user?.name || "Anonymous"}</span></span>
                    <div className="flex items-center">
                        {/* <Users className="h-4 w-4 mr-1.5 text-purple-400"/> */}
                        <span>Online: <span className="font-semibold text-purple-300">{onlineUsers.length}</span></span>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-grow p-4 md:p-6 space-y-4 overflow-y-auto relative z-10 scrollbar-thin scrollbar-thumb-purple-500/40 scrollbar-track-gray-700/20 scrollbar-thumb-rounded-full">
                    {messages.length === 0 && (
                        <p className="text-center text-gray-400 dark:text-gray-500 py-10">
                            No messages yet. Be the first one!
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
                                            {msg.userName || msg.userId}
                                        </p>
                                    )}
                                    <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Message Input Area */}
                <div className="p-4 md:p-6 border-t border-purple-400/20 relative z-10">
                    <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex items-center space-x-3">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your message here..."
                            disabled={!isConnected}
                            className="flex-grow w-full px-5 py-3 bg-gray-700/50 dark:bg-gray-800/70 border-2 border-transparent focus:border-purple-500/70 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500/70 transition-all duration-300 text-gray-50 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || !isConnected}
                            className="p-3 md:px-5 md:py-3 font-semibold rounded-xl shadow-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-4 focus:ring-purple-400/50 transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center"
                        >
                            <span className="hidden md:inline">Send</span>
                            {/* <Send className="h-5 w-5 md:ml-2"/> */}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}