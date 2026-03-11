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

  const inp = 'w-full bg-[#080f1c] border border-[#1a2a40] rounded-lg text-[#c8d8e8] text-[14px] px-4 py-3 outline-none focus:border-[#00e5a0] transition-colors'

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
    <div className="min-h-screen bg-[#060c16] flex items-center justify-center p-4">

      <div className="w-full max-w-md">
        {/* Language switcher on auth page */}
        <div className="flex justify-end mb-6">
          <div className="flex items-center rounded-lg overflow-hidden border border-[#1a2a40] text-[12px] font-semibold">
            <button
              onClick={() => setLang('en')}
              className={`px-3 py-1.5 transition-colors cursor-pointer border-none ${lang === 'en' ? 'bg-[#00e5a0] text-[#060c16]' : 'bg-transparent text-[#4a6a8a] hover:text-[#c8d8e8]'}`}
            >EN</button>
            <button
              onClick={() => setLang('km')}
              className={`px-3 py-1.5 transition-colors cursor-pointer border-none ${lang === 'km' ? 'bg-[#00e5a0] text-[#060c16]' : 'bg-transparent text-[#4a6a8a] hover:text-[#c8d8e8]'}`}
            >KH</button>
          </div>
        </div>

        <div className="flex items-center gap-3 justify-center mb-10">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#00e5a0,#00b8ff)' }}>
            <svg width="18" height="18" viewBox="0 0 14 14" fill="none">
              <polyline points="0,11 4,6 8,9 14,2" stroke="#060c16" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>{t('brand_name')}</span>
          <span className="text-[9px] text-[#2a4a6a] mt-1">PRO</span>
        </div>

        <div className="bg-[#0e1628] border border-[#1a2a40] rounded-2xl p-8">
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 6 }}>
            {mode === 'login' ? t('welcome_back') : t('create_account')}
          </h1>
          <p className="text-[#3a5a7a] text-[13px] mb-6">
            {mode === 'login' ? t('sign_in_sub') : t('register_sub')}
          </p>

          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 bg-[#080f1c] border border-[#1a2a40] rounded-lg py-3 text-[#c8d8e8] text-[13px] font-semibold hover:border-[#00e5a0] transition-colors mb-5 cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {t('google_btn')}
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-[#1a2a40]" />
            <span className="text-[#2a4a6a] text-[11px]">OR</span>
            <div className="flex-1 h-px bg-[#1a2a40]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-[11px] text-[#3a5a7a] uppercase mb-1.5">{t('label_name')}</label>
                <input className={inp} type="text" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} required />
              </div>
            )}
            <div>
              <label className="block text-[11px] text-[#3a5a7a] uppercase mb-1.5">{t('label_email')}</label>
              <input className={inp} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="block text-[11px] text-[#3a5a7a] uppercase mb-1.5">{t('label_password')}</label>
              <input className={inp} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>

            {error && (
              <div className="bg-[#2e0d1a] border border-[#ff4d6d33] rounded-lg px-4 py-2.5 text-[#ff4d6d] text-[12px]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00e5a0] text-[#060c16] font-bold text-[14px] py-3 rounded-lg hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? t('btn_please_wait') : mode === 'login' ? t('btn_sign_in') : t('btn_create_account')}
            </button>
          </form>

          <p className="text-center text-[#3a5a7a] text-[12px] mt-5">
            {mode === 'login' ? t('no_account') : t('have_account')}{' '}
            <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
              className="text-[#00e5a0] underline cursor-pointer bg-transparent border-none">
              {mode === 'login' ? t('sign_up') : t('sign_in_link')}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
