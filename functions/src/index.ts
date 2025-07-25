import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

admin.initializeApp()

export const handleQueueCleanup = functions
  .region('europe-west1')
  .database.ref('/presence/{userId}')
  .onDelete(async (snapshot, context) => {
    const userId = context.params.userId
    const queueRef = admin.firestore().collection('queue')
    const query = queueRef.where('uid', '==', userId)

    try {
      const snapshot = await query.get()

      if (snapshot.empty) {
        console.log(`No queue entry found for user ${userId}.`)
        return null
      }

      const deletePromises = snapshot.docs.map((doc) => doc.ref.delete())
      await Promise.all(deletePromises)

      console.log(`Queue entries for user ${userId} deleted.`)
    } catch (error) {
      console.error(`Error deleting queue entry for user ${userId}:`, error)
    }

    return null
  })
