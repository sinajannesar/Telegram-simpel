import { Server } from "socket.io";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken"; // مطمئن شوید این پکیج نصب شده: npm install jsonwebtoken

// این متغیرها باید خارج از تابع handler تعریف شوند تا حالت خود را حفظ کنند
let ioInstance; // برای نگهداری نمونه سرور Socket.IO
const onlineUsersMap = new Map(); // نگهداری کاربران آنلاین: socket.id -> { userId, userName }

// کلید مخفی JWT - باید با NEXTAUTH_SECRET شما در فایل .env.local یکی باشد
const JWT_SECRET = process.env.NEXTAUTH_SECRET;

function initializeSocketIO() {
    // سرور Socket.IO با تنظیمات مسیر و CORS
    // به جای پاس دادن مستقیم httpServer، از آپشن path استفاده می‌کنیم.
    // Socket.IO روی این مسیر در سرور HTTP فعلی Next.js گوش خواهد داد.
    ioInstance = new Server({
        path: "/api/socket/socket.io", // کلاینت باید به این مسیر وصل شود
        cors: {
            origin: process.env.NEXT_PUBLIC_URL || "http://localhost:3000",
            methods: ["GET", "POST"],
        },
        // addTrailingSlash: false, // برای Next.js با path سفارشی گاهی لازم است
    });

    console.log("*-* Socket.IO server initializing with App Router structure... *-*");

    // میدل‌ور احراز هویت برای هر اتصال جدید سوکت
    ioInstance.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (token && JWT_SECRET) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                // اطمینان حاصل کنید که توکن JWT شما شامل userId و name است
                socket.user = decoded; // مثلا: { userId: '123', name: 'نام کاربر', ... }
                next();
            } catch (error) {
                console.error("Socket Auth Error:", error.message);
                next(new Error("Authentication error: Invalid token"));
            }
        } else if (!token) {
            next(new Error("Authentication required: No token provided"));
        } else if (!JWT_SECRET) { // بررسی وجود JWT_SECRET
             next(new Error("Server configuration error: JWT_SECRET is not set"));
        }
    });

    // مدیریت رویدادهای اتصال کلاینت‌ها
    ioInstance.on('connection', (socket) => {
        // این شرط برای اطمینان از اجرای موفقیت‌آمیز میدل‌ور احراز هویت است
        if (!socket.user || !socket.user.userId || !socket.user.name) {
            console.warn("User connected without complete authentication data. Disconnecting.", socket.user);
            socket.disconnect(true); // قطع اتصال اگر اطلاعات کاربر کامل نیست
            return;
        }

        const { userId, name: userName } = socket.user; // استخراج نام از فیلد name در توکن

        console.log('کاربر جدید متصل شد:', socket.id, '- کاربر:', userId, 'نام:', userName);

        // اضافه کردن کاربر به لیست آنلاین‌ها
        onlineUsersMap.set(socket.id, {
            userId: userId,
            userName: userName
        });

        // ارسال لیست به‌روز شده کاربران آنلاین برای همه کلاینت‌ها
        // آرایه‌ای از آبجکت‌های کاربر { userId, userName } ارسال می‌شود
        ioInstance.emit('online-users', Array.from(onlineUsersMap.values()));

        // مدیریت پیام‌های چت
        socket.on('chat-message', (msg) => {
            if (socket.user) { // اطمینان از وجود socket.user
                ioInstance.emit('chat-message', {
                    userId: socket.user.userId,
                    userName: socket.user.name || 'کاربر ناشناس', // ارسال نام کاربر
                    message: msg,
                });
            }
        });

        // مدیریت قطع اتصال کاربر
        socket.on('disconnect', () => {
            const disconnectedUser = onlineUsersMap.get(socket.id);
            console.log('کاربر قطع اتصال شد:', socket.id, '- کاربر:', disconnectedUser?.userName);
            
            onlineUsersMap.delete(socket.id); // حذف کاربر از لیست
            
            // ارسال لیست به‌روز شده برای همه
            ioInstance.emit('online-users', Array.from(onlineUsersMap.values()));
        });
    });

    console.log("Socket.IO server setup complete and listening on path /api/socketio/socket.io/");
}

// این Route Handler (مثلاً GET) برای اطمینان از راه‌اندازی سرور Socket.IO است.
// کلاینت‌ها مستقیماً به این GET request برای چت وصل نمی‌شوند، بلکه به path مشخص شده در new Server().
export async function GET(req) {
    if (!JWT_SECRET) {
        console.error("CRITICAL: NEXTAUTH_SECRET (JWT_SECRET) is not defined. Socket.IO cannot operate securely.");
        return NextResponse.json(
            { success: false, message: "Server misconfiguration: JWT_SECRET is missing." },
            { status: 500 }
        );
    }

    if (!ioInstance) {
        initializeSocketIO();
    } else {
        console.log("Socket.IO instance already exists.");
    }

    return NextResponse.json({ success: true, message: "Socket.IO server is active or has been initialized." });
}