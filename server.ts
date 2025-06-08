import http from 'http'
import { Server } from 'socket.io'

// Define interfaces for type safety
interface MessageData {
  roomId: string
  message: string
  sender?: string
  timestamp?: number
}

// Create HTTP server
const httpServer = http.createServer()

// Initialize Socket.IO server with CORS configuration
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:3000', // Replace with your frontend URL
    methods: ['GET', 'POST'],
    allowedHeaders: ['my-custom-header'],
    credentials: true,
  },
})

// Handle socket connections
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id)
  
  // Handle joining a room
  socket.on('join_room', (roomId: string) => {
    socket.join(roomId)
    console.log(`user with id-${socket.id} joined room - ${roomId}`)
  })

  // Handle sending messages
  socket.on('send_msg', (data: MessageData) => {
    console.log(data, 'DATA')
    // This will send a message to a specific room ID
    socket.to(data.roomId).emit('receive_msg', data)
  })

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id)
  })
})

// Start server
const PORT: number = Number(process.env.PORT) || 3001
httpServer.listen(PORT, () => {
  console.log(`Socket.io server is running on port ${PORT}`)
})