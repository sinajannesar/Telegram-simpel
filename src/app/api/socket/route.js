import { Server } from "socket.io";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";


let io = null;

export async function GET(req) {
    if (!io) {
        console.log("Starting Socket.IO server...");

        const httpServer = req.nextServer; // <--- THIS IS THE PROBLEM
        io = new Server(httpServer, {
            cors: {
                origin: process.env.NEXT_PUBLIC_URL || "http://localhost:3000",
                methods: ["GET", "POST"],
            },
        });
        // ... rest of your server setup (io.use, io.on)
    }
    return NextResponse.json({ message: "Socket.IO server running" });
}

// ذخیره کاربران آنلاین
const onlineUsers = new Map(); // Keep this outside if you want it to persist across calls

export default function SocketHandler(req, res) {
    if (!res.socket.server.io) {
        console.log("*First use, starting Socket.IO server...");
        const io = new Server(res.socket.server, {
            // path: "/socket.io/", // Default path, client doesn't need to specify it then
            cors: {
                origin: process.env.NEXT_PUBLIC_URL || "http://localhost:3000",
                methods: ["GET", "POST"],
            },
        });

        io.use((socket, next) => {
            const token = socket.handshake.auth.token;
            if (token) {
                try {
                    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);
                    socket.user = decoded; // Store user info
                    next();
                } catch (error) {
                    console.error("Socket Auth Error:", error.message);
                    next(new Error("Authentication error"));
                }
            } else {
                next(new Error("Authentication required"));
            }
        });

        io.on("connection", (socket) => {
            console.log("A user connected:", socket.id, "User:", socket.user.userId);

            onlineUsers.set(socket.id, socket.user.userId);
            io.emit("online-users", Array.from(onlineUsers.values()));

            socket.on("chat-message", (msg) => {
                const userId = socket.user.userId; // Get userId from the authenticated socket
                io.emit("chat-message", { userId, message: msg });
            });

            socket.on("disconnect", () => {
                console.log("User disconnected:", socket.id);
                onlineUsers.delete(socket.id);
                io.emit("online-users", Array.from(onlineUsers.values()));
            });
        });

        res.socket.server.io = io;
    } else {
        console.log("Socket.IO already running.");
    }
    res.end();
}