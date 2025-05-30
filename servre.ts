import express, { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { createServer, Server as HttpServer,  } from 'http';
import { Server as SocketIoServer, Socket } from 'socket.io';
import next from 'next';
import { parse } from 'url';

const port: number = parseInt(process.env.PORT || '3000', 10);
const dev: boolean = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

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

  io.on('connection', (socket: Socket) => {
    console.log('A user connected:', socket.id);

    socket.on('message.chat1', (data: Message) => {
      if (!messages['chat1']) messages['chat1'] = [];
      messages['chat1'].push(data);
      socket.broadcast.emit('message.chat1', data);
    });

    socket.on('message.chat2', (data: Message) => {
      if (!messages['chat2']) messages['chat2'] = [];
      messages['chat2'].push(data);
      socket.broadcast.emit('message.chat2', data);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  app.get('/messages/:chat', (req: ExpressRequest, res: ExpressResponse) => {
    const chatName: string = req.params.chat;
    if (messages[chatName]) {
      res.json(messages[chatName]);
    } else {
      res.status(404).json({ error: 'Chat not found' });
    }
  });

  // Handle all other routes with Next.js
  app.all('*', (req: ExpressRequest, res: ExpressResponse) => {
    const parsedUrl = parse(req.url!, true);
    return handle(req, res, parsedUrl);
  });

  server.listen(port, (err?: Error) => {
    if (err) {
      console.error('Server startup error:', err);
      throw err;
    }
    console.log(`> Ready on http://localhost:${port}`);
  });
}).catch(ex => {
  console.error('Failed to prepare Next.js app:', ex.stack);
  process.exit(1);
});