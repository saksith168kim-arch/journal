// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, googleProvider, db } from '../lib/firebase'

setPersistence(auth, browserLocalPersistence).catch(() => { })

const AuthContext = createContext(null)

function SplashScreen() {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#050B14',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 20, zIndex: 9999,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 16,
        background: 'linear-gradient(135deg, #32E6D5, #0EA5E9)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 32px rgba(50,230,213,0.4)',
        animation: 'tl-pulse 1.8s ease-in-out infinite',
      }}>
        <svg width="24" height="24" viewBox="0 0 14 14" fill="none">
          <polyline points="0,11 4,6 8,9 14,2" stroke="#03121A" strokeWidth="2.6"
            fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#e2e8f0', letterSpacing: '-0.03em', fontFamily: 'system-ui, sans-serif' }}>
          AI Trading Journal
        </div>
        <div style={{ fontSize: 10, color: '#3b556b', letterSpacing: '0.18em', marginTop: 3, textTransform: 'uppercase', fontFamily: 'system-ui, sans-serif' }}>
          PRO
        </div>
      </div>
      <div style={{ display: 'flex', gap: 7, marginTop: 8 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 7, height: 7, borderRadius: '50%',
            background: '#32E6D5',
            animation: `tl-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
      <style>{`
        @keyframes tl-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 32px rgba(50,230,213,0.4); }
          50%       { transform: scale(1.06); box-shadow: 0 0 48px rgba(50,230,213,0.65); }
        }
        @keyframes tl-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40%            { transform: translateY(-8px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

async function syncUserProfile(firebaseUser) {
  const ref = doc(db, 'users', firebaseUser.uid)
  const snap = await getDoc(ref)

  if (!snap.exists()) {
    const profile = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName || '',
      photoURL: firebaseUser.photoURL || '',
      role: 'free',
      tradeLimit: 10,
      subscribedUntil: null,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    }
    await setDoc(ref, profile)
    return profile
  } else {
    const data = snap.data()
    await setDoc(ref, { lastLogin: serverTimestamp() }, { merge: true })
    return data
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getRedirectResult(auth).then(async (cred) => {
      if (cred?.user) {
        const profile = await syncUserProfile(cred.user)
        setUserProfile(profile)
      }
    }).catch(() => {})

    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        const profile = await syncUserProfile(u)
        setUser(u)
        setUserProfile(profile)
      } else {
        setUser(null)
        setUserProfile(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const loginWithGoogle = async () => {
    await signInWithRedirect(auth, googleProvider)
  }

  const loginWithEmail = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    const profile = await syncUserProfile(cred.user)
    setUserProfile(profile)
    return cred
  }

  const registerWithEmail = async (email, password, displayName) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName })
    const profile = await syncUserProfile(cred.user)
    setUserProfile(profile)
    return cred
  }

  const logout = () => {
    setUserProfile(null)
    return signOut(auth)
  }

  const isAdmin = userProfile?.role === 'admin'
  const isPro = userProfile?.role === 'pro' || userProfile?.role === 'admin'
  const isFree = userProfile?.role === 'free'

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      loading,
      isAdmin,
      isPro,
      isFree,
      loginWithGoogle,
      loginWithEmail,
      registerWithEmail,
      logout,
    }}>
      {loading ? <SplashScreen /> : children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)