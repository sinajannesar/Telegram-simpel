"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { Socket } from "socket.io-client";

// Interface for message data
interface IMsgData {
  roomId: string | number;
  user: string;
  msg: string;
  time: string;
}

// Interface for component props
interface ChatPageProps {
  socket: Socket;
  username: string;
  roomId: string | number;
}

// Component to render individual messages
const Message = React.memo(({
  user,
  msg,
  isCurrentUser,
}: {
  user: string;
  msg: string;
  isCurrentUser: boolean;
}) => (
  <div
    className={`flex ${
      isCurrentUser ? "justify-end" : "justify-start"
    } mb-4 animate-slideIn`}
  >
    <div
      className={`flex items-center gap-2 max-w-[70%] ${
        isCurrentUser ? "flex-row-reverse" : ""
      }`}
    >
      <span
        className={`flex items-center justify-center w-8 h-8 rounded-full ${
          isCurrentUser ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"
        } font-bold`}
      >
        {user.charAt(0).toUpperCase()}
      </span>
      <div
        className={`p-3 rounded-lg ${
          isCurrentUser ? "bg-blue-400" : "bg-gray-800"
        }`}
      >
        <p className="text-sm">{msg}</p>
      </div>
    </div>
  </div>
));

Message.displayName = 'Message';

const ChatPage = ({ socket, username, roomId }: ChatPageProps) => {
  const [currentMsg, setCurrentMsg] = useState<string>("");
  const [chat, setChat] = useState<IMsgData[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Handle sending messages - Using useRef to maintain current message
  const currentMsgRef = useRef<string>("");
  
  // Update ref when currentMsg changes
  useEffect(() => {
    currentMsgRef.current = currentMsg;
  }, [currentMsg]);

  const sendData = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      
      const messageText = currentMsgRef.current;
      
      if (!messageText?.trim()) return; // Prevent sending empty messages

      const msgData: IMsgData = {
        roomId,
        user: username,
        msg: messageText,
        time: `${new Date().getHours()}:${new Date()
          .getMinutes()
          .toString()
          .padStart(2, "0")}`,
      };

      await socket.emit("send_msg", msgData);
      setChat((prev) => [...prev, msgData]); // Add sent message to chat immediately
      setCurrentMsg(""); // Clear input
    },
    [roomId, username, socket] // No currentMsg dependency needed
  );



  // Handle receiving messages
  useEffect(() => {
    const receiveMsgHandler = (data: IMsgData) => {
      setChat((prev) => [...prev, data]);
    };
    socket.on("receive_msg", receiveMsgHandler);

    return () => {
      socket.off("receive_msg", receiveMsgHandler);
    };
  }, [socket]);

  // Auto-scroll to the latest message
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chat]);

  // Optimized input handler
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentMsg(e.target.value);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl flex flex-col h-[80vh]">
        {/* Header */}
        <div className="p-4 border-b">
          <p className="text-lg font-semibold text-gray-800">
            Chat Room: <span className="font-bold">{roomId}</span> | User:{" "}
            <span className="font-bold">{username}</span>
          </p>
        </div>

        {/* Chat Messages */}
        <div
          ref={chatContainerRef}
          className="flex-1 p-4 overflow-y-auto"
          aria-live="polite"
        >
          {chat.length === 0 ? (
            <p className="text-center text-gray-500">No messages yet...</p>
          ) : (
            chat.map((message, index) => (
              <Message
                key={`${message.user}-${message.time}-${index}`}
                user={message.user}
                msg={message.msg}
                isCurrentUser={message.user === username}
              />
            ))
          )}
        </div>

        {/* Message Input Form */}
        <form onSubmit={sendData} className="p-4 border-t">
          <div className="flex gap-2">
            <input
              type="text"
              name="message"
              value={currentMsg}
              onChange={handleInputChange}
              placeholder="Type your message..."
              className="flex-1 text-sky-950 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Message input"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={!currentMsg.trim()}
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;