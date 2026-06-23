// src/pages/AuthPage.jsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'

const C = {
  bg: '#050B14',
  primary: '#32E6D5',
  secondary: '#0EA5E9',
  muted: '#94A3B8',
  pos: '#34D399',
  glow: 'rgba(50,230,213,0.25)',
  border: 'rgba(255,255,255,0.08)',
}

function ZoqiraLogo({ size = 34 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.28,
      background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, boxShadow: `0 6px 20px -6px ${C.glow}`,
    }}>
      <svg width={size * 0.54} height={size * 0.54} viewBox="0 0 14 14" fill="none">
        <polyline points="0,11 4,6 8,9 14,2" stroke="#03121A" strokeWidth="2.6"
          fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

export { ZoqiraLogo }

const Spark = ({ stroke = C.primary }) => (
  <svg width="100%" height="40" viewBox="0 0 160 40" preserveAspectRatio="none">
    <defs>
      <linearGradient id="ath-fill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
        <stop offset="100%" stopColor={stroke} stopOpacity="0" />
      </linearGradient>
    </defs>
    <polygon points="0,40 0,30 20,24 40,27 64,14 88,19 112,8 140,12 160,5 160,40" fill="url(#ath-fill)" />
    <polyline points="0,30 20,24 40,27 64,14 88,19 112,8 140,12 160,5" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

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
  const [showPw, setShowPw] = useState(false)
  const [focusField, setFocusField] = useState(null)
  const googleLoading = useRef(false)

useEffect(() => {
  if (!loading && user) navigate('/dashboard', { replace: true })
}, [user, loading, navigate])

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
  } catch (err) {
    setError(err.message.replace('Firebase: ', '').replace(/\(auth.*\)\.?/, ''))
    setLoading(false)
    return
  }
  navigate('/dashboard', { replace: true })
}

  async function handleGoogle() {
  if (googleLoading.current) return
  googleLoading.current = true
  setError('')
  setLoading(true)
  try {
    await loginWithGoogle()
    navigate('/dashboard', { replace: true })  // ← ADD THIS LINE
  } catch (err) {
    if (err.code !== 'auth/cancelled-popup-request' &&
        err.code !== 'auth/popup-closed-by-user') {
      setError(err.message)
    }
  } finally {
    setLoading(false)
    googleLoading.current = false
  }
}

  const inputStyle = (field) => ({
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${focusField === field ? 'rgba(50,230,213,0.6)' : C.border}`,
    boxShadow: focusField === field ? `0 0 0 3px rgba(50,230,213,0.12)` : 'none',
    borderRadius: 12,
    color: '#fff',
    fontSize: 14.5,
    padding: '13px 15px',
    outline: 'none',
    transition: 'border-color .2s, box-shadow .2s',
    fontFamily: 'inherit',
  })

  return (
    <div className="ath-page">
      <Styles />
      <div className="ath-ambient" aria-hidden />

      <nav className="ath-nav">
        <div className="ath-brand">
          <ZoqiraLogo size={32} />
          <span className="ath-brand__name">AI Trading Journal</span>
        </div>
        <div className="ath-nav__right">
          <span className="ath-nav__hint">{mode === 'login' ? 'No account?' : 'Have an account?'}</span>
          <button
            className="ath-btn ath-btn--ghost ath-btn--sm"
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
          >
            {mode === 'login' ? 'Start free trial' : 'Sign in'}
          </button>
          <div className="ath-lang">
            {['en', 'km'].map((l) => (
              <button key={l} onClick={() => setLang(l)} className={`ath-lang__btn ${lang === l ? 'active' : ''}`}>
                {l === 'en' ? 'EN' : 'KH'}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="ath-body">
        <motion.div
          className="ath-aside"
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="ath-eyebrow">AI Trading Journal</div>
          <h2 className="ath-aside__title">
            Trade with data,<br /><span className="ath-grad">not emotion.</span>
          </h2>
          <p className="ath-aside__sub">
            Track your trades, analyze performance, and build better trading habits — all in one powerful digital journal.
          </p>

          <motion.div
            className="ath-glass ath-mini"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="ath-mini__top">
              <div>
                <div className="ath-mini__cap">Portfolio Value</div>
                <div className="ath-mini__val">$91,134,765<span style={{ color: C.muted, fontSize: '0.6em' }}>.99</span></div>
              </div>
              <div className="ath-mini__pnl">+19.44%</div>
            </div>
            <Spark />
            <div className="ath-mini__stats">
              <div><span>Win Rate</span><strong>68.26%</strong></div>
              <div><span>Profit Factor</span><strong>2.45</strong></div>
              <div><span>Total Trades</span><strong>312</strong></div>
            </div>
          </motion.div>

          <div className="ath-trust">
            <div className="ath-avatars">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className="ath-avatar" style={{ background: `linear-gradient(135deg, hsl(${190 + i * 18} 80% 55%), hsl(${210 + i * 18} 80% 45%))` }} />
              ))}
            </div>
            <span>Trusted by <strong>12,000+</strong> traders worldwide</span>
          </div>
        </motion.div>

        <motion.div
          className="ath-cardwrap"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="ath-badge">
            <span className="ath-dot" />
            AI market engine · live now
          </div>

          <div className="ath-glass ath-card">
            <h1 className="ath-card__title">
              {mode === 'login' ? t('welcome_back') : t('create_account')}
            </h1>
            <p className="ath-card__sub">
              {mode === 'login' ? t('sign_in_sub') : t('register_sub')}
            </p>

            <button onClick={handleGoogle} className="ath-google" disabled={loading}>
              <svg width="17" height="17" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {loading ? 'Please wait...' : t('google_btn')}
            </button>

            <div className="ath-divider"><span>or</span></div>

            <form onSubmit={handleSubmit} className="ath-form">
              {mode === 'register' && (
                <div className="ath-field">
                  <label>{t('label_name')}</label>
                  <input style={inputStyle('name')} type="text" placeholder="John Doe" value={name}
                    onChange={e => setName(e.target.value)} required
                    onFocus={() => setFocusField('name')} onBlur={() => setFocusField(null)} />
                </div>
              )}
              <div className="ath-field">
                <label>{t('label_email')}</label>
                <input style={inputStyle('email')} type="email" placeholder="you@example.com" value={email}
                  onChange={e => setEmail(e.target.value)} required
                  onFocus={() => setFocusField('email')} onBlur={() => setFocusField(null)} />
              </div>
              <div className="ath-field">
                <div className="ath-field__row">
                  <label>{t('label_password')}</label>
                  {mode === 'login' && <a href="/forgot-password" className="ath-link">Forgot password?</a>}
                </div>
                <div style={{ position: 'relative' }}>
                  <input style={{ ...inputStyle('password'), paddingRight: 58 }} type={showPw ? 'text' : 'password'}
                    placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required
                    onFocus={() => setFocusField('password')} onBlur={() => setFocusField(null)} />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="ath-pw-toggle">
                    {showPw ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {error && <div className="ath-error">{error}</div>}

              <button type="submit" disabled={loading} className="ath-btn ath-btn--primary ath-submit">
                {loading ? t('btn_please_wait') : mode === 'login' ? t('btn_sign_in') : t('btn_create_account')}
              </button>
            </form>

            <p className="ath-switch">
              {mode === 'login' ? t('no_account') : t('have_account')}{' '}
              <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }} className="ath-link ath-link--btn">
                {mode === 'login' ? t('sign_up') : t('sign_in_link')}
              </button>
            </p>
          </div>

          <div className="ath-perks">
            {['No card required', '3 free signals daily', 'Cancel anytime'].map((item) => (
              <span key={item} className="ath-perk">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <polyline points="2,6 5,9 10,3" stroke={C.primary} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {item}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function Styles() {
  return (
    <style>{`
.ath-page * { box-sizing: border-box; }
.ath-page {
  min-height: 100vh; background: ${C.bg}; color: #fff; position: relative; overflow: hidden;
  display: flex; flex-direction: column;
  font-family: 'Inter','Segoe UI',system-ui,sans-serif; -webkit-font-smoothing: antialiased;
}
.ath-ambient { position: fixed; inset: 0; z-index: 0; pointer-events: none; }
.ath-ambient::before, .ath-ambient::after { content:''; position:absolute; border-radius:50%; filter: blur(90px); }
.ath-ambient::before { top:-12%; right:-8%; width:48vw; height:48vw; background: radial-gradient(circle, rgba(50,230,213,0.16), transparent 70%); }
.ath-ambient::after  { bottom:-16%; left:-8%; width:46vw; height:46vw; background: radial-gradient(circle, rgba(14,165,233,0.14), transparent 70%); }
.ath-glass { background: rgba(255,255,255,0.03); border: 1px solid ${C.border}; border-radius: 22px; backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }
.ath-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; font-weight: 600; border-radius: 12px; cursor: pointer; border: 1px solid transparent; font-family: inherit; transition: transform .2s, box-shadow .2s, background .2s; }
.ath-btn--sm { padding: 8px 16px; font-size: 13px; }
.ath-btn--ghost { color: #fff; background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.16); }
.ath-btn--ghost:hover { background: rgba(255,255,255,0.1); }
.ath-btn--primary { color: #03121A; background: linear-gradient(135deg, ${C.primary}, ${C.secondary}); box-shadow: 0 10px 30px -10px ${C.glow}; }
.ath-btn--primary:hover { transform: translateY(-1px); box-shadow: 0 16px 40px -10px rgba(50,230,213,0.55); }
.ath-btn--primary:disabled { opacity: .6; cursor: not-allowed; transform: none; }
.ath-nav { position: relative; z-index: 2; display: flex; align-items: center; justify-content: space-between; padding: 16px 28px; border-bottom: 1px solid ${C.border}; gap: 12px; flex-wrap: wrap; }
.ath-brand { display: inline-flex; align-items: center; gap: 10px; }
.ath-brand__name { font-size: 17px; font-weight: 700; letter-spacing: -.3px; }
.ath-nav__right { display: flex; align-items: center; gap: 12px; }
.ath-nav__hint { font-size: 13px; color: ${C.muted}; }
.ath-lang { display: flex; border: 1px solid rgba(255,255,255,0.12); border-radius: 9px; overflow: hidden; }
.ath-lang__btn { padding: 7px 12px; border: none; cursor: pointer; background: transparent; color: ${C.muted}; font-size: 11px; font-weight: 700; font-family: inherit; }
.ath-lang__btn.active { background: linear-gradient(135deg, ${C.primary}, ${C.secondary}); color: #03121A; }
.ath-body { position: relative; z-index: 2; flex: 1; display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 48px; align-items: center; max-width: 1140px; width: 100%; margin: 0 auto; padding: 48px 28px; }
.ath-eyebrow { font-size: 12px; font-weight: 700; letter-spacing: .2em; text-transform: uppercase; color: ${C.primary}; margin-bottom: 16px; }
.ath-aside__title { font-size: clamp(32px, 4vw, 48px); font-weight: 800; line-height: 1.08; letter-spacing: -1px; margin: 0 0 16px; }
.ath-grad { background: linear-gradient(90deg, ${C.primary}, ${C.secondary}); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; color: transparent; }
.ath-aside__sub { font-size: 16px; line-height: 1.7; color: ${C.muted}; max-width: 440px; margin: 0 0 28px; }
.ath-mini { padding: 20px; max-width: 420px; border-color: rgba(50,230,213,0.22); box-shadow: 0 30px 70px -40px ${C.glow}; }
.ath-mini__top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 4px; }
.ath-mini__cap { font-size: 12px; color: ${C.muted}; margin-bottom: 4px; }
.ath-mini__val { font-size: 26px; font-weight: 800; letter-spacing: -.5px; }
.ath-mini__pnl { color: ${C.pos}; font-weight: 700; font-size: 14px; background: rgba(52,211,153,0.12); border-radius: 8px; padding: 4px 10px; }
.ath-mini__stats { display: flex; gap: 18px; margin-top: 10px; }
.ath-mini__stats div { display: flex; flex-direction: column; }
.ath-mini__stats span { font-size: 11px; color: ${C.muted}; }
.ath-mini__stats strong { font-size: 15px; }
.ath-trust { display: flex; align-items: center; gap: 12px; margin-top: 26px; font-size: 14px; color: ${C.muted}; }
.ath-trust strong { color: #fff; }
.ath-avatars { display: flex; }
.ath-avatar { width: 32px; height: 32px; border-radius: 50%; border: 2px solid ${C.bg}; margin-left: -10px; display: inline-block; }
.ath-avatars .ath-avatar:first-child { margin-left: 0; }
.ath-cardwrap { width: 100%; max-width: 420px; margin: 0 auto; }
.ath-badge { display: inline-flex; align-items: center; gap: 7px; font-size: 11px; font-weight: 600; color: ${C.primary}; border: 1px solid rgba(50,230,213,0.3); background: rgba(50,230,213,0.06); border-radius: 20px; padding: 5px 14px; margin: 0 auto 16px; }
.ath-cardwrap { display: flex; flex-direction: column; align-items: center; }
.ath-dot { width: 6px; height: 6px; border-radius: 50%; background: ${C.primary}; animation: ath-pulse 1.5s infinite; }
.ath-card { width: 100%; padding: 32px 30px 28px; box-shadow: 0 40px 90px -50px ${C.glow}; }
.ath-card__title { font-size: 24px; font-weight: 800; letter-spacing: -.5px; margin: 0 0 6px; }
.ath-card__sub { color: ${C.muted}; font-size: 14px; margin: 0 0 24px; }
.ath-google { width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 12px 16px; color: #fff; font-size: 14px; font-weight: 600; cursor: pointer; transition: background .15s; font-family: inherit; }
.ath-google:hover { background: rgba(255,255,255,0.1); }
.ath-google:disabled { opacity: .6; cursor: not-allowed; }
.ath-divider { display: flex; align-items: center; gap: 12px; margin: 20px 0; }
.ath-divider::before, .ath-divider::after { content:''; flex: 1; height: 1px; background: rgba(255,255,255,0.1); }
.ath-divider span { color: rgba(255,255,255,0.3); font-size: 11px; }
.ath-form { display: flex; flex-direction: column; gap: 15px; }
.ath-field label { display: block; font-size: 11px; color: rgba(255,255,255,0.5); margin-bottom: 7px; }
.ath-field__row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 7px; }
.ath-field__row label { margin-bottom: 0; }
.ath-link { font-size: 11px; color: ${C.primary}; text-decoration: none; }
.ath-link:hover { text-decoration: underline; }
.ath-link--btn { background: none; border: none; cursor: pointer; font-family: inherit; font-size: 12px; padding: 0; }
.ath-pw-toggle { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: rgba(255,255,255,0.4); font-size: 11px; font-weight: 600; padding: 0; font-family: inherit; }
.ath-error { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.4); border-radius: 10px; padding: 10px 14px; color: #FCA5A5; font-size: 12.5px; }
.ath-submit { width: 100%; font-size: 14.5px; padding: 13px 16px; margin-top: 2px; }
.ath-switch { text-align: center; color: rgba(255,255,255,0.35); font-size: 12.5px; margin-top: 22px; }
.ath-perks { display: flex; align-items: center; justify-content: center; gap: 18px; margin-top: 20px; font-size: 11.5px; color: rgba(148,163,184,0.7); flex-wrap: wrap; }
.ath-perk { display: flex; align-items: center; gap: 6px; }
@keyframes ath-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
@media (max-width: 880px) {
  .ath-body { grid-template-columns: 1fr; gap: 36px; padding: 36px 22px; }
  .ath-aside { display: none; }
  .ath-nav__hint { display: none; }
}
@media (max-width: 480px) {
  .ath-brand__name { display: none; }
  .ath-card { padding: 26px 20px; }
}
    `}</style>
  )
}