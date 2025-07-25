import { auth, db } from '../firebase/firebase'
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  onSnapshot,
  doc,
  setDoc,
} from 'firebase/firestore'

export const findMatch = async (onRoomCreated: (data: string) => void) => {
  const currentUser = auth.currentUser
  const queueRef = collection(db, 'queue')

  if (!currentUser) {
    throw new Error('User not authenticated')
  }

  // Look for someone else in the queue
  const q = query(queueRef, where('uid', '!=', currentUser.uid))
  const snapshot = await getDocs(q)

  if (!snapshot.empty) {
    const matchDoc = snapshot.docs[0]
    const matchUid = matchDoc.data().uid
    const roomId = `${currentUser.uid}_${matchUid}`

    // Create a room
    await setDoc(doc(db, 'rooms', roomId), {
      users: [currentUser.uid, matchUid],
      createdAt: Date.now(),
    })

    // Remove both from queue
    await deleteDoc(matchDoc.ref)

    return { roomId }
  } else {
    // Add to queue
    const queueDoc = await addDoc(queueRef, {
      uid: currentUser.uid,
      createdAt: Date.now(),
    })

    // Set up real-time listener for a room involving current user
    const unsub = onSnapshot(query(collection(db, 'rooms')), (snapshot) => {
      snapshot.forEach((doc) => {
        const data = doc.data()
        if (data.users.includes(currentUser.uid)) {
          onRoomCreated(doc.id)
          // Cleanup listener and queue
          deleteDoc(queueDoc)
          unsub()
        }
      })
    })

    return { waiting: true }
  }
}

export const cancelQueue = async () => {
  const uid = auth.currentUser?.uid
  if (!uid) return

  const queueQuery = query(collection(db, 'queue'), where('uid', '==', uid))
  const queueSnap = await getDocs(queueQuery)

  queueSnap.forEach((doc) => deleteDoc(doc.ref))
}
