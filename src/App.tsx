import { useEffect, useState, type SetStateAction } from 'react'
import { auth } from './firebase/firebase'
import LoginPage from './features/Login'
import { findMatch, cancelQueue } from './utils/matchmake'
import ChatRoom from './features/Chatroom'
import type { User } from 'firebase/auth'

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [roomId, setRoomId] = useState<string | null>(null)
  const [waiting, setWaiting] = useState(false)

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setUser(u)
    })
    return unsub
  }, [])

  const startChat = async () => {
    const result = await findMatch((newRoomId: string) => {
      setRoomId(newRoomId)
      setWaiting(false)
    })

    if (result.roomId) {
      setRoomId(result.roomId)
      setWaiting(false)
    } else if (result.waiting) {
      setWaiting(true)
    }
  }
  const stopWaiting = async () => {
    await cancelQueue()
    setWaiting(false)
  }

  if (!user) {
    return (
      <LoginPage
        onLogin={() => {
          alert('Logged in')
        }}
      />
    )
  }

  return (
    <div className='container'>
      {!roomId && (
        <div className='flex flex-col items-center justify-center h-[100dvh] text-center'>
          {!roomId && !waiting && (
            <>
              <h1 className='text-2xl mb-4'>
                Welcome {user.isAnonymous ? 'Guest' : user.email}
              </h1>
              <button
                onClick={startChat}
                className='bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition'
              >
                Start Chat
              </button>
            </>
          )}

          {waiting && (
            <>
              <p className='text-lg mb-4'>Waiting for a match...</p>
              <button
                onClick={stopWaiting}
                className='bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition'
              >
                Cancel
              </button>
            </>
          )}
        </div>
      )}

      {roomId && (
        <ChatRoom
          roomId={roomId}
          onNext={() => {
            setRoomId(null)
            setWaiting(true)
            setTimeout(() => {
              startChat()
            }, 1000)
          }}
          onSkip={() => {
            setRoomId(null)
            setWaiting(true)
            startChat()
          }}
          onLeave={(roomId: SetStateAction<null | string>) => {
            setRoomId(roomId)
            if (roomId) {
              setWaiting(true)
            } else {
              setWaiting(false)
            }
          }}
        />
      )}
    </div>
  )
}
