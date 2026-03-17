// src/pages/AuthPage.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'

export default function AuthPage() {
  const { loginWithGoogle, loginWithEmail, registerWithEmail, user } = useAuth()
  const { lang, setLang, t } = useLang()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  const inp = {
    width: '100%',
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    color: 'var(--text-pri)',
    fontSize: 14,
    padding: '12px 16px',
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: 'var(--font-ui)',
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await loginWithEmail(email, password)
      } else {
        await registerWithEmail(email, password, name)
      }
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message.replace('Firebase: ', '').replace(/\(auth.*\)\.?/, ''))
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setError('')
    try {
      await loginWithGoogle()
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Language switcher */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
          <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', fontSize: 12, fontWeight: 600 }}>
            {['en', 'km'].map((l) => (
              <button key={l} onClick={() => setLang(l)} style={{
                padding: '6px 14px', border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                background: lang === l ? 'var(--grad-accent)' : 'transparent',
                color: lang === l ? '#fff' : 'var(--text-mut)',
              }}>{l === 'en' ? 'EN' : 'KH'}</button>
            ))}
          </div>
        </div>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', marginBottom: 36 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'var(--grad-accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-btn)',
          }}>
            <svg width="18" height="18" viewBox="0 0 14 14" fill="none">
              <polyline points="0,11 4,6 8,9 14,2" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: 'var(--text-pri)', letterSpacing: -0.5 }}>{t('brand_name')}</span>
          <span style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 4, letterSpacing: '0.1em' }}>PRO</span>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: 32,
          boxShadow: 'var(--shadow-panel)',
        }}>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: 'var(--text-pri)', marginBottom: 6 }}>
            {mode === 'login' ? t('welcome_back') : t('create_account')}
          </h1>
          <p style={{ color: 'var(--text-mut)', fontSize: 13, marginBottom: 24 }}>
            {mode === 'login' ? t('sign_in_sub') : t('register_sub')}
          </p>

          {/* Google button */}
          <button onClick={handleGoogle} style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10,
            padding: '12px 16px', color: 'var(--text-pri)', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', transition: 'border-color 0.2s', marginBottom: 20, fontFamily: 'var(--font-ui)',
          }}
            onMouseOver={e => e.currentTarget.style.borderColor = 'var(--acc-main)'}
            onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {t('google_btn')}
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ color: 'var(--text-dim)', fontSize: 11, letterSpacing: '0.08em' }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {mode === 'register' && (
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-mut)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{t('label_name')}</label>
                <input style={inp} type="text" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} required
                  onFocus={e => e.target.style.borderColor = 'var(--acc-main)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              </div>
            )}
            <div>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--text-mut)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{t('label_email')}</label>
              <input style={inp} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required
                onFocus={e => e.target.style.borderColor = 'var(--acc-main)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--text-mut)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{t('label_password')}</label>
              <input style={inp} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required
                onFocus={e => e.target.style.borderColor = 'var(--acc-main)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>

            {error && (
              <div style={{
                background: 'var(--col-loss-bg)', border: '1px solid var(--col-loss)',
                borderRadius: 8, padding: '10px 14px', color: 'var(--col-loss)', fontSize: 12, opacity: 0.9,
              }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', background: 'var(--grad-accent)', border: 'none', borderRadius: 10,
              color: '#fff', fontWeight: 700, fontSize: 14, padding: '13px 16px',
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
              transition: 'all 0.15s', boxShadow: 'var(--shadow-btn)', fontFamily: 'var(--font-ui)',
            }}>
              {loading ? t('btn_please_wait') : mode === 'login' ? t('btn_sign_in') : t('btn_create_account')}
            </button>
          </form>

          <p style={{ textAlign: 'center', color: 'var(--text-mut)', fontSize: 12, marginTop: 20 }}>
            {mode === 'login' ? t('no_account') : t('have_account')}{' '}
            <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
              style={{ color: 'var(--acc-main)', textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'var(--font-ui)', fontSize: 12 }}>
              {mode === 'login' ? t('sign_up') : t('sign_in_link')}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
