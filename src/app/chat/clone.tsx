import { useState } from 'react'
import Link from 'next/link'
import { GetServerSideProps, NextPage } from 'next'
import useSocket from '@/hooks/useSocket'

interface Message {
  id: number
  value: string
}

interface ChatOneProps {
  messages?: Message[]
}

const ChatOne: NextPage<ChatOneProps> = (props) => {
  const [field, setField] = useState<string>('')
  const [newMessage, setNewMessage] = useState<number>(0)
  const [messages, setMessages] = useState<Message[]>(props.messages || [])

  const socket = useSocket({
    eventName: 'message.chat2',
    callback: (message: Message) => {
      setMessages(messages => [...messages, message])
    }
  })

  useSocket({
    eventName: 'message.chat1',
    callback: () => {
      setNewMessage(newMessage => newMessage + 1)
    }
  })

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    
    // Create message object
    const message: Message = {
      id: new Date().getTime(),
      value: field,
    }
    
    socket.emit('message.chat2', message)
    setField('')
    setMessages(messages => [...messages, message])
  }

  return (
    <main>
      <div>
        <Link href="/">
          <a>
            {`Chat One${
              newMessage > 0 ? ` ( ${newMessage} new message )` : ''
            }`}
          </a>
        </Link>
        <br />
        <Link href="/clone">
          <a>Chat Two</a>
        </Link>
        <ul>
          {messages.map((message: Message) => (
            <li key={message.id}>{message.value}</li>
          ))}
        </ul>
        <form onSubmit={handleSubmit}>
          <input
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField(e.target.value)}
            type="text"
            placeholder="Hello world!"
            value={field}
          />
          <button type="submit">Send</button>
        </form>
      </div>
    </main>
  )
}

export const getServerSideProps: GetServerSideProps<ChatOneProps> = async () => {
  try {
    const response = await fetch('http://localhost:3000/messages/chat2')
    const messages: Message[] = await response.json()
    
    return { 
      props: { 
        messages 
      } 
    }
  } catch (error) {
    console.error('Error fetching messages:', error)
    return { 
      props: { 
        messages: [] 
      } 
    }
  }
}

export default ChatOne