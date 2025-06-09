"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { Socket } from "socket.io-client";
import { useRouter } from "next/navigation";

// --- آیکون‌های SVG ---
const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" /></svg>
);
const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
);
const JoinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);

interface IMsgData { roomId: string | number; user: string; msg: string; time: string; }
interface UserData { id: number; email: string; firstname: string; lastname: string; roomId: string | number; }
interface ChatPageProps { socket: Socket; username: string; roomId: string; }

const Message = React.memo(({ user, msg, isCurrentUser }: { user: string; msg: string; isCurrentUser: boolean; }) => (
  <div className={`flex items-start gap-3 mb-5 animate-message-in ${isCurrentUser ? "justify-end" : "justify-start"}`}>
    <div className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm shadow-md ${isCurrentUser ? "bg-gradient-to-br from-sky-500 to-blue-600 text-white" : "bg-gray-700 text-gray-200"} ${isCurrentUser ? "order-2" : "order-1"}`}>
      {user.split(' ').map(name => name.charAt(0)).join('').toUpperCase()}
    </div>
    <div className={`relative max-w-xs md:max-w-md p-3 rounded-2xl shadow-lg ${isCurrentUser ? "bg-blue-600/80 rounded-br-lg" : "bg-gray-800/80 rounded-bl-lg"} ${isCurrentUser ? "order-1" : "order-2"}`}>
      <p className="text-sm font-medium text-white/70 mb-1">{user}</p>
      <p className="text-base text-white/95 break-words">{msg}</p>
    </div>
  </div>
));
Message.displayName = 'Message';

const ChatPage = ({ socket, roomId }: ChatPageProps) => {
  const router = useRouter();
  const [currentMsg, setCurrentMsg] = useState<string>("");
  const [chat, setChat] = useState<IMsgData[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [currentRoomId, setCurrentRoomId] = useState<string>(roomId);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const currentMsgRef = useRef<string>("");

  useEffect(() => { currentMsgRef.current = currentMsg; }, [currentMsg]);
  useEffect(() => { const storedUser = localStorage.getItem('user'); if (storedUser) { try { const parsedUser: UserData = JSON.parse(storedUser); setUserData(parsedUser); setCurrentRoomId(parsedUser.roomId.toString()); socket.emit('join_room', parsedUser.roomId); } catch (error) { console.error('Error parsing user data:', error); router.push('/authregister/login'); } } else { router.push('/authregister/login'); } }, [socket, router]);
  const sendData = useCallback(async (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); if (!userData) return; const messageText = currentMsgRef.current; if (!messageText?.trim()) return; const displayName = `${userData.firstname} ${userData.lastname}`; const msgData: IMsgData = { roomId: userData.roomId, user: displayName, msg: messageText, time: `${new Date().getHours()}:${new Date().getMinutes().toString().padStart(2, "0")}` }; await socket.emit("send_msg", msgData); setChat((prev) => [...prev, msgData]); setCurrentMsg(""); }, [userData, socket]);
  useEffect(() => { const receiveMsgHandler = (data: IMsgData) => { setChat((prev) => [...prev, data]); }; socket.on("receive_msg", receiveMsgHandler); return () => { socket.off("receive_msg", receiveMsgHandler); }; }, [socket]);
  useEffect(() => { if (chatContainerRef.current) { chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight; } }, [chat]);
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { setCurrentMsg(e.target.value); }, []);
  const handleRoomChange = useCallback((newRoomId: string) => { if (!userData) return; socket.emit('leave_room', userData.roomId); socket.emit('join_room', newRoomId); const updatedUser = { ...userData, roomId: newRoomId }; setUserData(updatedUser); setCurrentRoomId(newRoomId); localStorage.setItem('user', JSON.stringify(updatedUser)); setChat([]); }, [userData, socket]);
  const handleLogout = useCallback(() => { localStorage.removeItem('user'); socket.disconnect(); router.push('/authregister/login'); }, [router, socket]);

  if (!userData) {
    return <div className="h-screen w-full flex items-center justify-center bg-gray-900"><p className="text-white">Loading User Data...</p></div>;
  }

  const displayName = `${userData.firstname} ${userData.lastname}`;

  return (
    <div className="h-screen w-full flex items-center justify-center bg-gray-900 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900/80 to-blue-900 bg-[size:200%_200%] animate-gradient-flow" />
      <div className="relative z-10 flex flex-col w-full max-w-4xl h-[95vh] max-h-[900px] bg-black/30 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10">
        <header className="flex-shrink-0 p-4 border-b border-white/10 flex justify-between items-center">
          <div>
            <p className="text-lg font-bold text-white tracking-wider">Room: <span className="text-sky-300">{currentRoomId}</span></p>
            <p className="text-sm text-gray-300/80">Logged in as <span className="font-semibold text-white">{displayName}</span></p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <input type="text" placeholder="New Room ID" value={currentRoomId} onChange={(e) => setCurrentRoomId(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && currentRoomId.trim()) { handleRoomChange(currentRoomId.trim()); } }} className="w-32 pl-3 pr-8 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
              <button onClick={() => currentRoomId.trim() && handleRoomChange(currentRoomId.trim())} className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-sky-300 hover:text-white transition"><JoinIcon /></button>
            </div>
            <button onClick={handleLogout} className="p-2 text-gray-300 hover:text-red-400 hover:bg-white/10 rounded-full transition-colors duration-200"><LogoutIcon /></button>
          </div>
        </header>
        <main ref={chatContainerRef} className="flex-1 p-6 overflow-y-auto custom-scrollbar">
          {chat.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400/80"><p className="text-lg">No Messages Yet</p><p className="text-sm">Start the conversation!</p></div>
          ) : (
            chat.map((message, index) => (<Message key={`${message.user}-${message.time}-${index}`} user={message.user} msg={message.msg} isCurrentUser={message.user === displayName} />))
          )}
        </main>
        <footer className="flex-shrink-0 p-4 border-t border-white/10">
          <form onSubmit={sendData} className="flex items-center gap-3">
            <input type="text" name="message" value={currentMsg} onChange={handleInputChange} placeholder="Type a message..." className="flex-1 p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all" aria-label="Message input" />
            <button type="submit" className="p-3 bg-gradient-to-br from-sky-500 to-blue-600 text-white rounded-lg shadow-lg hover:scale-105 hover:shadow-blue-500/50 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed" disabled={!currentMsg.trim()} aria-label="Send Message"><SendIcon /></button>
          </form>
        </footer>
      </div>
    </div>
  );
};

export default ChatPage;