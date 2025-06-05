"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useSession } from "next-auth/react";

const socket = io(process.env.NEXT_PUBLIC_URL || "http://localhost:3000", {
    auth: { token: null },
});

export default function Chat() {
    const { data: session, status } = useSession();
    const [isConnected, setIsConnected] = useState(false);
    interface ChatMessage {
        userId: string;
        message: string;
    }

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
    const [input, setInput] = useState("");

    useEffect(() => {
        if (status === "authenticated" && session?.accessToken) {
            socket.auth = { token: session.accessToken };
            console.log(session.accessToken)
            socket.connect();
        }

        socket.on("connect", () => {
            setIsConnected(true);
            console.log("Connected as user:", session?.user?.id);
        });

        socket.on("disconnect", () => {
            setIsConnected(false);
        });

        socket.on("online-users", (users) => {
            setOnlineUsers(users);
        });

        socket.on("chat-message", (msg) => {
            setMessages((prev) => [...prev, msg]);
        });

        return () => {
            socket.off("connect");
            socket.off("disconnect");
            socket.off("online-users");
            socket.off("chat-message");
            socket.disconnect();
        };
    }, [session, status]);

    const sendMessage = () => {
        if (input.trim()) {
            socket.emit("chat-message", input);
            setInput("");
        }
    };

    if (status === "loading") {
        return <p>در حال بارگذاری...</p>;
    }

    useEffect(() => {
        if (status === "authenticated" && session?.accessToken) {
            if (!socket.connected) { // Connect only if not already connected
                socket.auth = { token: session.accessToken };
                console.log("Connecting with token:", session.accessToken);
                socket.connect();
            }
        } else if (status === "unauthenticated" && socket.connected) {
            socket.disconnect(); // Disconnect if user logs out
        }
        // ... rest of your listeners ...
    }, [session, status]); // Removed socket from dependencies here if it's globally defined

    return (
        <div>
            <h1>چت</h1>
            <p>وضعیت: {isConnected ? "متصل" : "قطع"}</p>
            <p>کاربر: {session?.user?.name} (ID: {session?.user?.id})</p>
            <p>کاربران آنلاین: {onlineUsers.join(", ")}</p>
            <div>
                {messages.map((msg, index) => (
                    <p key={index}>
                        {msg.userId}: {msg.message}
                    </p>
                ))}
            </div>
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") sendMessage();
                }}
            />
            <button onClick={sendMessage}>ارسال</button>
        </div>
    );
}