import { useEffect, useRef, useState, type SetStateAction } from 'react'
import { auth, db } from '../firebase/firebase'
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  getDocs,
  type DocumentData,
} from 'firebase/firestore'

export default function ChatRoom({
  roomId,
  onSkip,
  onLeave,
}: {
  roomId: string
  onSkip: () => void
  onLeave: (roomId: SetStateAction<null | string>) => void
}) {
  const currentUserId = auth.currentUser?.uid
  const [messages, setMessages] = useState<DocumentData[]>([])
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const selfLeavingRef = useRef(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // ⏳ Listen for new messages
  useEffect(() => {
    const messagesRef = collection(db, 'rooms', roomId, 'messages')
    const unsubscribe = onSnapshot(messagesRef, (snap) => {
      const msgs = snap.docs.map((d) => d.data())
      setMessages(msgs)
      setTimeout(() => {
        scrollToBottom()
      }, 100) // Delay to ensure DOM updates
    })
    return () => unsubscribe()
  }, [roomId])

  // 👥 Listen for user leaving
  useEffect(() => {
    if (!roomId) return

    const roomRef = doc(db, 'rooms', roomId)

    const unsubscribe = onSnapshot(roomRef, (snapshot) => {
      console.log('Room snapshot:', snapshot.exists())
      if (selfLeavingRef.current) {
        console.log('Room deleted by self, ignoring leave logic.')
        return
      }
      if (!snapshot.exists()) {
        onSkip()
        console.log('Room deleted, leaving...')
        // findMatch((newRoomId: string) => {
        //   console.log('New room found:', newRoomId)

        //   onLeave(newRoomId)
        // })
      }
    })

    return unsubscribe
  }, [roomId])

  // 🧹 Handle tab close / refresh
  useEffect(() => {
    const handleBeforeUnload = async () => {
      await handleLeave()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  // 💬 Send message
  const sendMessage = async () => {
    if (!input.trim()) return
    const messagesRef = collection(db, 'rooms', roomId, 'messages')
    await addDoc(messagesRef, {
      sender: currentUserId,
      text: input.trim(),
      createdAt: Date.now(),
    })
    setInput('')
  }

  // 🚪 Leave handler
  const handleLeave = async () => {
    if (!roomId) return

    // Delete the room
    selfLeavingRef.current = true
    await deleteDoc(doc(db, 'rooms', roomId))

    // Optional: delete all messages if needed
    const messagesRef = collection(db, 'rooms', roomId, 'messages')
    const messagesSnapshot = await getDocs(messagesRef)
    const deletePromises = messagesSnapshot.docs.map((doc) =>
      deleteDoc(doc.ref)
    )
    await Promise.all(deletePromises)

    onLeave(null)
  }

  return (
    <div className='chat-room max-w-md mx-auto flex flex-col h-[90vh] bg-white shadow-lg rounded-xl overflow-hidden border'>
      {/* Header */}
      <div className='chat-header flex justify-between items-center p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white'>
        <h2 className='text-xl font-semibold'>Chat Room</h2>
        <button
          onClick={handleLeave}
          className='bg-white text-purple-600 px-3 py-1 rounded-md text-sm hover:bg-gray-100 transition'
        >
          Leave
        </button>
      </div>

      {/* Body */}
      <div className='chat-body flex-1 overflow-y-auto px-4 py-2 space-y-2 bg-gray-50'>
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[75%] px-4 py-2 rounded-lg text-sm shadow-md ${
              msg.sender === currentUserId
                ? 'ml-auto bg-purple-500 text-white'
                : 'mr-auto bg-gray-200 text-gray-800'
            }`}
          >
            {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className='chat-input p-4 bg-white border-t flex gap-2'>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') sendMessage()
          }}
          placeholder='Type a message'
          className='flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400'
        />
        <button
          onClick={sendMessage}
          className='bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm transition'
        >
          Send
        </button>
      </div>
    </div>
  )
}
