// src/pages/SettingsPage.jsx
import { useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { updateProfile, updatePassword, updateEmail, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import Layout from '../components/layout/Layout'

function Section({ title, children }) {
  return (
    <div style={{
      background: 'var(--bg-panel)', border: '1px solid var(--border)',
      borderRadius: 14, padding: '24px 28px', marginBottom: 20,
    }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-pri)', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-sec)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '10px 14px',
  background: 'var(--bg-card)', border: '1px solid var(--border)',
  borderRadius: 9, color: 'var(--text-pri)',
  fontSize: 14, fontFamily: 'var(--font-ui)',
  outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.15s',
}

export default function SettingsPage() {
  const { user, userProfile } = useAuth()

  // Profile state
  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [photoURL, setPhotoURL]       = useState(user?.photoURL || '')
  const [profileMsg, setProfileMsg]   = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)

  // Email state
  const [newEmail, setNewEmail]       = useState(user?.email || '')
  const [emailPass, setEmailPass]     = useState('')
  const [emailMsg, setEmailMsg]       = useState(null)
  const [emailLoading, setEmailLoading] = useState(false)

  // Password state
  const [currentPass, setCurrentPass] = useState('')
  const [newPass, setNewPass]         = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [passMsg, setPassMsg]         = useState(null)
  const [passLoading, setPassLoading] = useState(false)

  const isGoogle = user?.providerData?.[0]?.providerId === 'google.com'

  // ── Save profile ──────────────────────────────────────────────────────────
  async function handleSaveProfile(e) {
    e.preventDefault()
    setProfileLoading(true)
    setProfileMsg(null)
    try {
      await updateProfile(auth.currentUser, {
        displayName: displayName.trim(),
        photoURL: photoURL.trim() || null,
      })
      // Also update Firestore
      await setDoc(doc(db, 'users', user.uid), {
        displayName: displayName.trim(),
        photoURL: photoURL.trim() || '',
      }, { merge: true })
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' })
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message })
    } finally {
      setProfileLoading(false)
    }
  }

  // ── Save email ────────────────────────────────────────────────────────────
  async function handleSaveEmail(e) {
    e.preventDefault()
    if (!emailPass) { setEmailMsg({ type: 'error', text: 'Enter your current password to confirm.' }); return }
    setEmailLoading(true)
    setEmailMsg(null)
    try {
      const credential = EmailAuthProvider.credential(user.email, emailPass)
      await reauthenticateWithCredential(auth.currentUser, credential)
      await updateEmail(auth.currentUser, newEmail.trim())
      await setDoc(doc(db, 'users', user.uid), { email: newEmail.trim() }, { merge: true })
      setEmailMsg({ type: 'success', text: 'Email updated! Check your inbox to verify.' })
      setEmailPass('')
    } catch (err) {
      setEmailMsg({ type: 'error', text: err.message })
    } finally {
      setEmailLoading(false)
    }
  }

  // ── Save password ─────────────────────────────────────────────────────────
  async function handleSavePassword(e) {
    e.preventDefault()
    if (newPass !== confirmPass) { setPassMsg({ type: 'error', text: 'Passwords do not match.' }); return }
    if (newPass.length < 6)      { setPassMsg({ type: 'error', text: 'Password must be at least 6 characters.' }); return }
    setPassLoading(true)
    setPassMsg(null)
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPass)
      await reauthenticateWithCredential(auth.currentUser, credential)
      await updatePassword(auth.currentUser, newPass)
      setPassMsg({ type: 'success', text: 'Password changed successfully!' })
      setCurrentPass(''); setNewPass(''); setConfirmPass('')
    } catch (err) {
      setPassMsg({ type: 'error', text: err.message })
    } finally {
      setPassLoading(false)
    }
  }

  const Msg = ({ msg }) => msg ? (
    <div style={{
      marginTop: 12, padding: '10px 14px', borderRadius: 8, fontSize: 13,
      background: msg.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
      border: `1px solid ${msg.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
      color: msg.type === 'success' ? '#22c55e' : '#ef4444',
    }}>
      {msg.text}
    </div>
  ) : null

  const SaveBtn = ({ loading, label = 'Save Changes' }) => (
    <button type="submit" disabled={loading} style={{
      padding: '10px 24px', borderRadius: 9, border: 'none',
      background: loading ? 'var(--bg-card)' : 'var(--grad-accent)',
      color: loading ? 'var(--text-dim)' : '#fff',
      fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-ui)',
      cursor: loading ? 'not-allowed' : 'pointer',
      boxShadow: loading ? 'none' : 'var(--shadow-btn)',
      transition: 'all 0.2s',
    }}>
      {loading ? 'Saving...' : label}
    </button>
  )

  return (
    <Layout openCount={0}>
      <div style={{ maxWidth: 620 }}>

        {/* Page header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-pri)', marginBottom: 4 }}>Settings</div>
          <div style={{ fontSize: 14, color: 'var(--text-sec)' }}>Manage your account information</div>
        </div>

        {/* ── Profile section ── */}
        <Section title="Profile">
          {/* Avatar preview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16,
              background: 'var(--grad-accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', flexShrink: 0,
              border: '2px solid var(--border)',
            }}>
              {photoURL
                ? <img src={photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                : <span style={{ color: '#fff', fontSize: 24, fontWeight: 800 }}>
                    {(displayName || user?.email || 'U')[0].toUpperCase()}
                  </span>
              }
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-pri)' }}>{displayName || 'No name set'}</div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>{user?.email}</div>
              {userProfile?.role && (
                <span style={{
                  display: 'inline-block', marginTop: 6,
                  fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                  padding: '2px 8px', borderRadius: 4,
                  background: userProfile.role === 'pro' ? 'rgba(245,197,24,0.15)' : 'var(--bg-card)',
                  color: userProfile.role === 'pro' ? '#f5c518' : 'var(--text-dim)',
                  border: `1px solid ${userProfile.role === 'pro' ? '#f5c51844' : 'var(--border)'}`,
                }}>
                  {userProfile.role}
                </span>
              )}
            </div>
          </div>

          <form onSubmit={handleSaveProfile}>
            <Field label="Display Name">
              <input
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Your name"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--acc-main)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </Field>
            <Field label="Photo URL">
              <input
                value={photoURL}
                onChange={e => setPhotoURL(e.target.value)}
                placeholder="https://example.com/photo.jpg"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--acc-main)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 5 }}>
                Paste a direct image URL for your avatar
              </div>
            </Field>
            <SaveBtn loading={profileLoading} />
            <Msg msg={profileMsg} />
          </form>
        </Section>

        {/* ── Email section (email/password users only) ── */}
        {!isGoogle && (
          <Section title="Change Email">
            <form onSubmit={handleSaveEmail}>
              <Field label="New Email Address">
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'var(--acc-main)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </Field>
              <Field label="Current Password (to confirm)">
                <input
                  type="password"
                  value={emailPass}
                  onChange={e => setEmailPass(e.target.value)}
                  placeholder="••••••••"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'var(--acc-main)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </Field>
              <SaveBtn loading={emailLoading} label="Update Email" />
              <Msg msg={emailMsg} />
            </form>
          </Section>
        )}

        {/* ── Password section (email/password users only) ── */}
        {!isGoogle && (
          <Section title="Change Password">
            <form onSubmit={handleSavePassword}>
              <Field label="Current Password">
                <input
                  type="password"
                  value={currentPass}
                  onChange={e => setCurrentPass(e.target.value)}
                  placeholder="••••••••"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'var(--acc-main)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </Field>
              <Field label="New Password">
                <input
                  type="password"
                  value={newPass}
                  onChange={e => setNewPass(e.target.value)}
                  placeholder="Min. 6 characters"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'var(--acc-main)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </Field>
              <Field label="Confirm New Password">
                <input
                  type="password"
                  value={confirmPass}
                  onChange={e => setConfirmPass(e.target.value)}
                  placeholder="••••••••"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'var(--acc-main)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </Field>
              <SaveBtn loading={passLoading} label="Change Password" />
              <Msg msg={passMsg} />
            </form>
          </Section>
        )}

        {/* Google users notice */}
        {isGoogle && (
          <Section title="Account Security">
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 16px', borderRadius: 10,
              background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <div style={{ fontSize: 13, color: 'var(--text-sec)' }}>
                You signed in with Google. Email and password are managed by your Google account.
              </div>
            </div>
          </Section>
        )}

        {/* ── Account info (read-only) ── */}
        <Section title="Account Info">
          {[
            { label: 'User ID', value: user?.uid },
            { label: 'Account Type', value: userProfile?.role?.toUpperCase() || 'FREE' },
            { label: 'Member Since', value: userProfile?.createdAt?.toDate ? userProfile.createdAt.toDate().toLocaleDateString() : '—' },
          ].map(({ label, value }) => (
            <div key={label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 0', borderBottom: '1px solid var(--border)',
            }}>
              <span style={{ fontSize: 13, color: 'var(--text-sec)' }}>{label}</span>
              <span style={{ fontSize: 13, color: 'var(--text-pri)', fontFamily: 'var(--font-mono)', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {value}
              </span>
            </div>
          ))}
        </Section>

      </div>
    </Layout>
  )
}
