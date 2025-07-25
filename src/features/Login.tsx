import { useState } from 'react'
import { auth, signInWithGoogle, signInAsGuest } from '../firebase/firebase'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth'

export default function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleEmailAuth = async (e: { preventDefault: () => void }) => {
    e.preventDefault()
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        await createUserWithEmailAndPassword(auth, email, password)
      }
      onLogin()
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred')
      }
    }
  }

  const handleGoogle = async () => {
    try {
      await signInWithGoogle()
      onLogin()
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred')
      }
    }
  }

  const handleGuest = async () => {
    try {
      await signInAsGuest()
      onLogin()
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred')
      }
    }
  }

  return (
    <div className='container'>
      <h2>{isLogin ? 'Sign In' : 'Sign Up'}</h2>
      <form onSubmit={handleEmailAuth}>
        <input
          type='email'
          placeholder='Email'
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
        />
        <br />
        <input
          type='password'
          placeholder='Password'
          value={password}
          required
          onChange={(e) => setPassword(e.target.value)}
        />
        <br />
        <button type='submit'>{isLogin ? 'Sign In' : 'Sign Up'}</button>
      </form>

      <button onClick={handleGoogle}>Sign in with Google</button>
      <button onClick={handleGuest}>Continue as Guest</button>
      <p>
        {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
        <button onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? 'Sign Up' : 'Sign In'}
        </button>
      </p>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}
