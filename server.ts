// server.ts - نسخه اصلاح شده
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt, { JwtPayload } from 'jsonwebtoken';

interface OnlineUser {
  userId: string;
  userName: string;
}

interface AuthenticatedSocket extends Socket {
  userId: string;
  userName: string;
}

interface ChatMessage {
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
}

// تطبیق با ساختار JWT ایجاد شده در NextAuth
interface JwtTokenPayload extends JwtPayload {
  sub: string;        // user ID در NextAuth به عنوان sub ذخیره می‌شود
  userId: string;     // custom field
  name: string;       // نام کاربر
  email?: string;     // ایمیل کاربر
  role?: string;      // نقش کاربر
  sessionId?: string; // شناسه جلسه
}

// تنظیمات پورت
const SOCKET_PORT = parseInt(process.env.SOCKET_PORT || '3001', 10);

// Online users storage
const onlineUsers = new Map<string, OnlineUser>();

// JWT secret - باید با NEXTAUTH_SECRET یکسان باشد
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-key';

// Create HTTP server (فقط برای Socket.IO)
const httpServer = createServer();

// Create Socket.IO server
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"], // Next.js URLs
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["*"]
  },
  transports: ['websocket', 'polling'], // صراحت در تنظیم transport ها
  allowEIO3: true // سازگاری با نسخه‌های قدیمی
});

// Authentication middleware - بهبود یافته
io.use(async (socket: Socket, next: (err?: Error) => void) => {
  try {
    console.log('🔐 Starting socket authentication...');
    console.log('🔍 Auth object:', socket.handshake.auth);
    console.log('🔍 Headers:', socket.handshake.headers);

    // دریافت token از منابع مختلف
    let token: string | null = null;

    // روش 1: از auth.token
    if (socket.handshake.auth.token) {
      token = socket.handshake.auth.token;
      console.log('📝 Token found in auth.token');
    }
    // روش 2: از auth.authorization
    else if (socket.handshake.auth.authorization) {
      const authHeader = socket.handshake.auth.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
        console.log('📝 Token found in auth.authorization');
      } else {
        token = authHeader;
        console.log('📝 Token found in auth.authorization (without Bearer)');
      }
    }
    // روش 3: از headers
    else if (socket.handshake.headers.authorization) {
      const authHeader = socket.handshake.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
        console.log('📝 Token found in headers.authorization');
      }
    }

    if (!token) {
      console.log('❌ No authentication token provided');
      return next(new Error('Authentication token required'));
    }

    console.log('🔍 Token (first 20 chars):', token.substring(0, 20) + '...');
    console.log('🔍 Using JWT_SECRET:', JWT_SECRET ? 'Available' : 'Missing');

    // تایید JWT token
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'] // اطمینان از استفاده از الگوریتم درست
    }) as JwtTokenPayload;

    console.log('🔍 Decoded token payload:', {
      sub: decoded.sub,
      userId: decoded.userId,
      name: decoded.name,
      email: decoded.email,
      role: decoded.role,
      iat: decoded.iat,
      exp: decoded.exp,
      iss: decoded.iss,
      aud: decoded.aud
    });

    // بررسی اعتبار payload
    const userId = decoded.sub || decoded.userId; // sub اولویت دارد
    const userName = decoded.name;

    if (!userId) {
      console.log('❌ Invalid token: missing user ID (sub or userId)');
      return next(new Error('Invalid token: missing user identification'));
    }

    if (!userName) {
      console.log('❌ Invalid token: missing user name');
      return next(new Error('Invalid token: missing user name'));
    }

    // بررسی انقضای token
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      console.log('❌ Token expired');
      return next(new Error('Token expired'));
    }

    // بررسی issuer و audience (اختیاری ولی توصیه می‌شود)
    if (decoded.iss && decoded.iss !== 'your-app-name') {
      console.log('⚠️ Warning: Token issuer mismatch');
    }

    if (decoded.aud && decoded.aud !== 'socket-io') {
      console.log('⚠️ Warning: Token audience mismatch');
    }

    // اضافه کردن اطلاعات کاربر به socket
    (socket as AuthenticatedSocket).userId = userId;
    (socket as AuthenticatedSocket).userName = userName;
    
    console.log('✅ Socket authentication successful');
    console.log(`👤 User: ${userName} (ID: ${userId})`);
    
    next();
  } catch (error) {
    console.error('❌ Socket authentication failed:', error);
    
    // ارائه پیام خطای مفصل‌تر
    if (error instanceof jwt.JsonWebTokenError) {
      console.error('🔍 JWT Error details:', error.message);
      if (error.message.includes('invalid signature')) {
        return next(new Error('Invalid token signature - check JWT_SECRET'));
      } else if (error.message.includes('malformed')) {
        return next(new Error('Malformed JWT token'));
      } else if (error.message.includes('expired')) {
        return next(new Error('Token expired'));
      }
    }
    
    next(new Error('Authentication failed'));
  }
});

// Handle Socket.IO connections
io.on('connection', (socket: Socket) => {
  const authSocket = socket as AuthenticatedSocket;
  console.log(`✅ User connected: ${authSocket.userName} (${authSocket.userId})`);
  
  // اضافه کردن کاربر به لیست آنلاین
  onlineUsers.set(socket.id, {
    userId: authSocket.userId,
    userName: authSocket.userName
  });

  console.log(`👥 Total online users: ${onlineUsers.size}`);

  // ارسال لیست به‌روز شده کاربران آنلاین
  io.emit('online-users', Array.from(onlineUsers.values()));

  // ارسال پیام تایید اتصال به کلاینت
  socket.emit('authenticated', {
    userId: authSocket.userId,
    userName: authSocket.userName,
    message: 'Authentication successful'
  });

  // Handle chat messages
  socket.on('chat-message', (message: string) => {
    if (!message || !message.trim()) {
      console.log('⚠️ Empty message received from', authSocket.userName);
      return;
    }
    
    const chatMessage: ChatMessage = {
      userId: authSocket.userId,
      userName: authSocket.userName,
      message: message.trim(),
      timestamp: new Date().toISOString()
    };

    console.log(`💬 Message from ${authSocket.userName}: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`);
    
    // ارسال پیام به همه کلاینت‌های متصل
    io.emit('chat-message', chatMessage);
  });

  // Handle typing indicators
  socket.on('typing', () => {
    console.log(`✍️ ${authSocket.userName} is typing`);
    socket.broadcast.emit('user-typing', {
      userId: authSocket.userId,
      userName: authSocket.userName
    });
  });

  socket.on('stop-typing', () => {
    console.log(`✍️ ${authSocket.userName} stopped typing`);
    socket.broadcast.emit('user-stop-typing', {
      userId: authSocket.userId
    });
  });

  // Handle disconnection
  socket.on('disconnect', (reason: string) => {
    console.log(`❌ User disconnected: ${authSocket.userName} (${authSocket.userId}) - Reason: ${reason}`);
    
    // حذف کاربر از لیست آنلاین
    onlineUsers.delete(socket.id);
    console.log(`👥 Remaining online users: ${onlineUsers.size}`);
    
    // ارسال لیست به‌روز شده کاربران آنلاین
    io.emit('online-users', Array.from(onlineUsers.values()));
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error(`❌ Socket error for ${authSocket.userName}:`, error);
  });
});

// Handle server-level errors
io.engine.on('connection_error', (err) => {
  console.error('❌ Socket.IO connection error:', err.req);
  console.error('❌ Error code:', err.code);
  console.error('❌ Error message:', err.message);
  console.error('❌ Error context:', err.context);
});

// Start server
httpServer
  .once('error', (err) => {
    console.error('❌ HTTP Server error:', err);
    process.exit(1);
  })
  .listen(SOCKET_PORT, () => {
    console.log('🚀 Socket.IO Server Configuration:');
    console.log(`   📡 Server URL: http://localhost:${SOCKET_PORT}`);
    console.log(`   🔌 Socket.IO endpoint: http://localhost:${SOCKET_PORT}/socket.io/`);
    console.log(`   🌐 CORS enabled for: http://localhost:3000`);
    console.log(`   🔐 JWT Secret: ${JWT_SECRET ? '✅ Set' : '❌ Missing'}`);
    console.log(`   🚛 Transports: websocket, polling`);
    console.log('   ✅ Server ready for connections');
  });

// Handle graceful shutdown
const gracefulShutdown = (signal: string) => {
  console.log(`👋 ${signal} received, shutting down gracefully`);
  
  // اطلاع به همه کلاینت‌ها در مورد خاموش شدن سرور
  io.emit('server-shutdown', { message: 'Server is shutting down' });
  
  // بسته شدن تمام اتصالات
  io.close(() => {
    console.log('🔌 Socket.IO server closed');
    
    httpServer.close(() => {
      console.log('✅ HTTP server closed');
      process.exit(0);
    });
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});