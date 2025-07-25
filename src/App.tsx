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
      <h1>Welcome {user.isAnonymous ? 'Guest' : user.email}</h1>

      {!roomId && !waiting && <button onClick={startChat}>Start Chat</button>}

      {waiting && (
        <>
          <p>Waiting for a match...</p>
          <button onClick={stopWaiting}>Cancel</button>
        </>
      )}

      {roomId && (
        <ChatRoom
          roomId={roomId}
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
