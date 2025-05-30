import express, { Request, Response } from 'express';
import { createServer, Server as HttpServer } from 'http';
import { Server as SocketIoServer, Socket } from 'socket.io';
import next, {NextApiHandler } from 'next';

const port: number = parseInt(process.env.PORT || '3000', 10);
const dev: boolean = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const nextHandler: NextApiHandler = nextApp.getRequestHandler();

interface Message {
  user: string; 
  text: string;
  timestamp: number;
}

interface MessagesDB {
  [key: string]: Message[]; 
}

const messages: MessagesDB = {
  chat1: [],
  chat2: [],
};

nextApp.prepare().then(() => {
  const app = express();
  const server: HttpServer = createServer(app);
  const io: SocketIoServer = new SocketIoServer(server);

  // socket.io server
  io.on('connection', (socket: Socket) => {
    console.log('A user connected:', socket.id);

    socket.on('message.chat1', (data: Message) => {
      messages['chat1'].push(data);
      socket.broadcast.emit('message.chat1', data); 
    });

    socket.on('message.chat2', (data: Message) => {
      messages['chat2'].push(data);
      socket.broadcast.emit('message.chat2', data); 
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  app.get('/messages/:chat', (req: Request, res: Response) => {
    const chatName: string = req.params.chat;
    if (messages[chatName]) {
      res.json(messages[chatName]);
    } else {
      res.status(404).json({ error: 'Chat not found' });
    }
  });

  app.all('*', (req: Request, res: Response) => {
    return nextHandler(req, res);
  });

  server.listen(port, (err?: any) => { // err can be undefined or an Error object
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});