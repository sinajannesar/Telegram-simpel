// Updated ChatPage component with improved authentication handling
'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { redirect } from 'next/navigation';

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

export default function ChatPage() {
  const { data: session, status } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState<string[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<'pending' | 'authenticated' | 'failed'>('pending');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Socket connection effect
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.accessToken) {
      console.log('❌ No access token, redirecting to login');
      redirect('/login');
      return;
    }

    console.log('🔌 Initializing Socket.IO connection...');
    console.log('🎫 Token status:', session.accessToken ? 'Available' : 'Missing');
    console.log('👤 User info:', {
      id: session.user?.id,
      name: session.user?.name,
      email: session.user?.email
    });
    
    // Debug: Parse and log JWT token structure
    if (session.accessToken) {
      try {
        const tokenParts = session.accessToken.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          console.log('🔍 JWT Token payload:', {
            sub: payload.sub,
            userId: payload.userId,
            name: payload.name,
            email: payload.email,
            iat: payload.iat ? new Date(payload.iat * 1000).toLocaleString() : 'N/A',
            exp: payload.exp ? new Date(payload.exp * 1000).toLocaleString() : 'N/A',
            iss: payload.iss,
            aud: payload.aud
          });
          
          // Check if token is expired
          if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
            console.error('❌ JWT token is expired!');
            setConnectionError('Token expired. Please login again.');
            return;
          }
        }
      } catch (e) {
        console.error('❌ Failed to parse JWT token:', e);
        setConnectionError('Invalid token format');
        return;
      }
    }

    // Initialize socket connection with comprehensive auth
    const newSocket = io('http://localhost:3001', {
      auth: {
        token: session.accessToken,
        // Fallback auth methods
        authorization: `Bearer ${session.accessToken}`,
        userId: session.user?.id,
        userName: session.user?.name,
        userEmail: session.user?.email
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      autoConnect: true,
      // Extra headers for authentication fallback
      extraHeaders: {
        'Authorization': `Bearer ${session.accessToken}`,
        'X-User-ID': session.user?.id || '',
        'X-User-Name': session.user?.name || '',
        'X-User-Email': session.user?.email || ''
      }
    });

    // Connection event handlers with detailed logging
    newSocket.on('connect', () => {
      console.log('✅ Connected to Socket.IO server');
      console.log('🆔 Socket ID:', newSocket.id);
      console.log('🚀 Transport type:', newSocket.io.engine.transport.name);
      setIsConnected(true);
      setConnectionError(null);
      setAuthStatus('pending'); // Wait for authentication confirmation
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from Socket.IO server. Reason:', reason);
      setIsConnected(false);
      setAuthStatus('pending');
      
      if (reason === 'io server disconnect') {
        // Server forcefully disconnected the socket
        setConnectionError('Server disconnected the connection');
        newSocket.connect();
      } else if (reason === 'transport close') {
        setConnectionError('Connection lost. Attempting to reconnect...');
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket.IO Connection Error:', error.message);
      console.error('🔍 Full error details:', error);
      setIsConnected(false);
      setAuthStatus('failed');
      
      // Handle specific error types
      if (error.message.includes('Authentication') || 
          error.message.includes('authentication') ||
          error.message.includes('Unauthorized') ||
          error.message.includes('Invalid token') ||
          error.message.includes('Token expired')) {
        setConnectionError('Authentication failed. Please refresh the page or login again.');
        console.error('💡 Auth Error: Check JWT token validity and server configuration');
      } else if (error.message.includes('xhr poll error') || 
                 error.message.includes('websocket error')) {
        setConnectionError('Cannot connect to server. Please check if the server is running on port 3001.');
        console.error('💡 Connection Error: Verify Socket.IO server is running');
      } else if (error.message.includes('timeout')) {
        setConnectionError('Connection timeout. Please check your internet connection.');
      } else {
        setConnectionError(`Connection error: ${error.message}`);
      }
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Successfully reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
      setConnectionError(null);
      setAuthStatus('pending');
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('🔄 Reconnection attempt failed:', error.message);
      setConnectionError(`Reconnection failed: ${error.message}`);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('🔄 All reconnection attempts exhausted');
      setIsConnected(false);
      setAuthStatus('failed');
      setConnectionError('Failed to reconnect after multiple attempts. Please refresh the page.');
    });

    // Authentication success confirmation from server
    newSocket.on('authenticated', (data) => {
      console.log('✅ Server confirmed authentication:', data);
      setAuthStatus('authenticated');
      setConnectionError(null);
    });

    // Authentication error from server
    newSocket.on('authentication_error', (error) => {
      console.error('❌ Server authentication error:', error);
      setAuthStatus('failed');
      setConnectionError(`Server authentication failed: ${error.message || error}`);
    });

    // Server shutdown notification
    newSocket.on('server-shutdown', (data) => {
      console.log('🛑 Server is shutting down:', data.message);
      setConnectionError('Server is shutting down. Please wait and refresh the page.');
    });

    // Chat event handlers
    newSocket.on('chat-message', (message: ChatMessage) => {
      console.log('📨 Received chat message:', {
        from: message.userName,
        preview: message.message.substring(0, 30) + (message.message.length > 30 ? '...' : ''),
        timestamp: message.timestamp
      });
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('online-users', (users: OnlineUser[]) => {
      console.log('👥 Online users updated. Count:', users.length);
      console.log('👥 Users list:', users.map(u => u.userName));
      setOnlineUsers(users);
    });

    // Typing indicators
    newSocket.on('user-typing', ({ userId, userName }: { userId: string; userName: string }) => {
      if (userId !== session.user?.id) {
        console.log('✍️ User typing:', userName);
        setIsTyping(prev => {
          if (!prev.includes(userName)) {
            return [...prev, userName];
          }
          return prev;
        });
      }
    });

    newSocket.on('user-stop-typing', ({ userId }: { userId: string }) => {
      if (userId !== session.user?.id) {
        setIsTyping(prev => {
          const user = onlineUsers.find(u => u.userId === userId);
          const userName = user?.userName;
          if (userName) {
            console.log('✍️ User stopped typing:', userName);
            return prev.filter(name => name !== userName);
          }
          return prev;
        });
      }
    });

    setSocket(newSocket);

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up Socket.IO connection');
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      newSocket.disconnect();
    };
  }, [session?.accessToken, session?.user?.id, session?.user?.name, session?.user?.email, status, onlineUsers]);

  // Handle sending messages
  const handleSendMessage = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !socket || !isConnected || authStatus !== 'authenticated') {
      console.log('❌ Cannot send message:', {
        hasMessage: !!newMessage.trim(),
        hasSocket: !!socket,
        isConnected,
        authStatus
      });
      return;
    }

    console.log('📤 Sending message:', newMessage.substring(0, 50) + (newMessage.length > 50 ? '...' : ''));
    socket.emit('chat-message', newMessage.trim());
    setNewMessage('');
    
    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socket.emit('stop-typing');
  }, [newMessage, socket, isConnected, authStatus]);

  // Handle typing indicators
  const handleTyping = useCallback(() => {
    if (!socket || !isConnected || authStatus !== 'authenticated') return;

    socket.emit('typing');
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop-typing');
    }, 1000);
  }, [socket, isConnected, authStatus]);

  // Handle manual reconnection
  const handleReconnect = useCallback(() => {
    if (socket && !isConnected) {
      console.log('🔄 Manual reconnection attempt initiated by user');
      setConnectionError('Attempting to reconnect...');
      socket.connect();
    }
  }, [socket, isConnected]);

  // Format timestamp for display
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Loading state
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="text-lg text-gray-700 mb-2">در حال بارگذاری...</div>
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  // No session - redirect
  if (!session) {
    redirect('/login');
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-100" dir="rtl">
      {/* Sidebar - Online Users */}
      <div className="w-64 bg-white border-l border-gray-200 p-4">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            کاربران آنلاین ({onlineUsers.length})
          </h2>
          <div className={`text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
            {isConnected ? '🟢 متصل' : '🔴 قطع شده'}
          </div>
          {connectionError && (
            <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-xs text-red-700">
              {connectionError}
              <button
                onClick={handleReconnect}
                className="ml-2 text-red-800 hover:text-red-900 underline"
              >
                تلاش مجدد
              </button>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          {onlineUsers.map(user => (
            <div
              key={user.userId}
              className={`p-2 rounded-lg flex items-center space-x-2 space-x-reverse ${
                user.userId === session.user?.id 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-50'
              }`}
            >
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">{user.userName}</span>
              {user.userId === session.user?.id && (
                <span className="text-xs text-blue-600">(شما)</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <h1 className="text-xl font-semibold text-gray-800">چت عمومی</h1>
          <p className="text-sm text-gray-600">خوش آمدید، {session.user?.name}</p>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.userId === session.user?.id ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.userId === session.user?.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-800 border'
                }`}
              >
                {message.userId !== session.user?.id && (
                  <div className="text-xs font-semibold mb-1 text-gray-600">
                    {message.userName}
                  </div>
                )}
                <div className="text-sm">{message.message}</div>
                <div
                  className={`text-xs mt-1 ${
                    message.userId === session.user?.id
                      ? 'text-blue-200'
                      : 'text-gray-500'
                  }`}
                >
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))}
          
          {/* Typing Indicators */}
          {isTyping.length > 0 && (
            <div className="flex justify-start">
              <div className="bg-gray-200 px-4 py-2 rounded-lg">
                <div className="text-xs text-gray-600">
                  {isTyping.join(', ')} در حال تایپ...
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          <form onSubmit={handleSendMessage} className="flex space-x-2 space-x-reverse">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              placeholder="پیام خود را بنویسید..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!isConnected}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || !isConnected}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              ارسال
            </button>
          </form>
          
          {!isConnected && (
            <div className="text-center text-red-600 text-sm mt-2">
              {connectionError || 'در حال تلاش برای اتصال مجدد...'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}