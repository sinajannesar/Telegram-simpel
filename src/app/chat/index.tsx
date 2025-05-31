import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { GetServerSideProps } from 'next';
import useSocket from '@/hooks/useSocket';

interface Message {
  id: number;
  value: string;
}

interface ChatOneProps {
  messages: Message[];
}

const ChatOne: React.FC<ChatOneProps> = ({ messages: initialMessages = [] }) => {
  const [field, setField] = useState<string>('');
  const [newMessage, setNewMessage] = useState<number>(0);
  const [messages, setMessages] = useState<Message[]>(initialMessages);

  const socket = useSocket({
      eventName: 'message.chat1',
      callback: (message: Message) => {
        setMessages(messages => [...messages, message])
      }
    })

 useSocket({
     eventName: 'message.chat2',
     callback: () => {
       setNewMessage(newMessage => newMessage + 1)
     }
   })

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!field.trim()) return;

    const message: Message = {
      id: Date.now(),
      value: field,
    };

    socket.emit('message.chat1', message);
    setField('');
    setMessages((prevMessages) => [...prevMessages, message]);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-gray-800 rounded-2xl shadow-2xl p-6 space-y-6">
        {/* Header with Navigation */}
        <div className="flex justify-between items-center border-b border-gray-700 pb-4">
          <Link href="/">
            <a className="text-xl font-semibold text-blue-400 hover:text-blue-300 transition">
              Chat One
            </a>
          </Link>
          <Link href="/clone">
            <a className="text-xl font-semibold text-blue-400 hover:text-blue-300 transition">
              {`Chat Two${newMessage > 0 ? ` (${newMessage} new)` : ''}`}
            </a>
          </Link>
        </div>

        {/* Messages List */}
        <div className="h-96 overflow-y-auto space-y-4 p-4 bg-gray-900 rounded-lg">
          {messages.length === 0 ? (
            <p className="text-gray-400 text-center">No messages yet...</p>
          ) : (
            <ul className="space-y-3">
              {messages.map((message) => (
                <li
                  key={message.id}
                  className="p-3 bg-gray-700 rounded-lg shadow-sm hover:bg-gray-600 transition"
                >
                  {message.value}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="Type a message..."
            value={field}
            onChange={(e) => setField(e.target.value)}
            className="flex-1 p-3 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 text-white placeholder-gray-400"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 rounded-lg hover:bg-blue-600 transition text-white font-semibold"
          >
            Send
          </button>
        </form>
      </div>
    </main>
  );
};

// Server-side props with TypeScript
export const getServerSideProps: GetServerSideProps<ChatOneProps> = async () => {
  const response = await fetch('http://localhost:3000/messages/chat1');
  const messages: Message[] = await response.json();

  return {
    props: {
      messages,
    },
  };
};

export default ChatOne;