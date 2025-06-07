// server.ts (در root پروژه)
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);
// Create Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();
// Online users storage
const onlineUsers = new Map();
// JWT secret
const JWT_SECRET = process.env.NEXTAUTH_SECRET;
app.prepare().then(() => {
    // Create HTTP server
    const httpServer = createServer(async (req, res) => {
        try {
            const parsedUrl = parse(req.url, true);
            await handle(req, res, parsedUrl);
        }
        catch (err) {
            console.error('Error occurred handling', req.url, err);
            res.statusCode = 500;
            res.end('internal server error');
        }
    });
    // Create Socket.IO server
    const io = new Server(httpServer, {
        cors: {
            origin: process.env.NEXT_PUBLIC_URL || "http://localhost:3000",
            methods: ["GET", "POST"],
            credentials: true
        }
    });
    // Authentication middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication token required'));
            }
            if (!JWT_SECRET) {
                return next(new Error('Server configuration error'));
            }
            const decoded = jwt.verify(token, JWT_SECRET);
            if (!decoded.userId || !decoded.name) {
                return next(new Error('Invalid token payload'));
            }
            socket.userId = decoded.userId;
            socket.userName = decoded.name;
            next();
        }
        catch (error) {
            console.error('Socket authentication error:', error);
            next(new Error('Authentication failed'));
        }
    });
    // Handle Socket.IO connections
    io.on('connection', (socket) => {
        const authSocket = socket;
        console.log(`✅ User connected: ${authSocket.userName} (${authSocket.userId})`);
        // Add user to online users
        onlineUsers.set(socket.id, {
            userId: authSocket.userId,
            userName: authSocket.userName
        });
        // Broadcast updated online users list
        io.emit('online-users', Array.from(onlineUsers.values()));
        // Handle chat messages
        socket.on('chat-message', (message) => {
            if (!message || !message.trim())
                return;
            const chatMessage = {
                userId: authSocket.userId,
                userName: authSocket.userName,
                message: message.trim(),
                timestamp: new Date().toISOString()
            };
            console.log(`💬 Message from ${authSocket.userName}: ${message}`);
            // Broadcast message to all connected clients
            io.emit('chat-message', chatMessage);
        });
        // Handle private messages (optional feature)
        socket.on('private-message', ({ recipientId, message }) => {
            const recipientSocket = Array.from(io.sockets.sockets.values())
                .find(s => s.userId === recipientId);
            if (recipientSocket) {
                recipientSocket.emit('private-message', {
                    senderId: authSocket.userId,
                    senderName: authSocket.userName,
                    message,
                    timestamp: new Date().toISOString()
                });
            }
        });
        // Handle typing indicators (optional feature)
        socket.on('typing', () => {
            socket.broadcast.emit('user-typing', {
                userId: authSocket.userId,
                userName: authSocket.userName
            });
        });
        socket.on('stop-typing', () => {
            socket.broadcast.emit('user-stop-typing', {
                userId: authSocket.userId
            });
        });
        // Handle disconnection
        socket.on('disconnect', (reason) => {
            console.log(`❌ User disconnected: ${authSocket.userName} (${authSocket.userId}) - Reason: ${reason}`);
            // Remove user from online users
            onlineUsers.delete(socket.id);
            // Broadcast updated online users list
            io.emit('online-users', Array.from(onlineUsers.values()));
        });
    });
    // Start server
    httpServer
        .once('error', (err) => {
        console.error('❌ Server error:', err);
        process.exit(1);
    })
        .listen(port, () => {
        console.log(`🚀 Ready on http://${hostname}:${port}`);
        console.log(`🔌 Socket.IO server is running`);
    });
});
