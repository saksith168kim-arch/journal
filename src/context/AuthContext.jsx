// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth'
import { auth, googleProvider } from '../lib/firebase'

// Keep the user logged in after closing & reopening the browser
setPersistence(auth, browserLocalPersistence).catch(() => { })

const AuthContext = createContext(null)

function SplashScreen() {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#090e18',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 20, zIndex: 9999,
    }}>
      {/* Logo */}
      <div style={{
        width: 56, height: 56, borderRadius: 16,
        background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 32px rgba(59,130,246,0.4)',
        animation: 'tl-pulse 1.8s ease-in-out infinite',
      }}>
        <svg width="24" height="24" viewBox="0 0 14 14" fill="none">
          <polyline points="0,11 4,6 8,9 14,2" stroke="#fff" strokeWidth="2.5"
            fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Brand name */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#e2e8f0', letterSpacing: '-0.03em', fontFamily: 'system-ui, sans-serif' }}>
          TradeLog
        </div>
        <div style={{ fontSize: 10, color: '#2a3a50', letterSpacing: '0.18em', marginTop: 3, textTransform: 'uppercase', fontFamily: 'system-ui, sans-serif' }}>
          PRO
        </div>
      </div>

      {/* Spinner dots */}
      <div style={{ display: 'flex', gap: 7, marginTop: 8 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 7, height: 7, borderRadius: '50%',
            background: '#3b82f6',
            animation: `tl-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>

      <style>{`
        @keyframes tl-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 32px rgba(59,130,246,0.4); }
          50%       { transform: scale(1.06); box-shadow: 0 0 48px rgba(59,130,246,0.65); }
        }
        @keyframes tl-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40%            { transform: translateY(-8px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  const loginWithGoogle = () => signInWithPopup(auth, googleProvider)

  const loginWithEmail = (email, password) =>
    signInWithEmailAndPassword(auth, email, password)

  const registerWithEmail = async (email, password, displayName) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName })
    return cred
  }

  const logout = () => signOut(auth)

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, loginWithEmail, registerWithEmail, logout }}>
      {loading ? <SplashScreen /> : children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)