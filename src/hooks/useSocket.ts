import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketOptions<T = string> {
  eventName: string;
  callback: (data: T) => void;
}

const socket: Socket = io(); 

export default function useSocket<T = string>({ eventName, callback }: UseSocketOptions<T>): Socket {
  useEffect(() => {
    socket.on(eventName, callback);

    return () => {
      socket.off(eventName, callback);
    };
  }, [eventName, callback]);

  return socket;
}