// src/components/layout/Layout.jsx
import { useState, useRef, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LanguageContext'
import { useTheme, THEMES } from '../../context/ThemeContext'

export default function Layout({ children, openCount = 0 }) {
  const { user, logout } = useAuth()
  const { lang, setLang, t } = useLang()
  const { theme, switchTheme } = useTheme()
  const navigate = useNavigate()
  const [themeOpen, setThemeOpen] = useState(false)
  const themeRef = useRef(null)

  // Close when clicking outside
  useEffect(() => {
    function onDown(e) {
      if (themeRef.current && !themeRef.current.contains(e.target)) {
        setThemeOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  async function handleLogout() {
    await logout()
    navigate('/auth')
  }

  const NAV = [
    { to: '/', label: t('nav_journal') },
    { to: '/new', label: t('nav_new_trade') },
    { to: '/analytics', label: t('nav_analytics') },
  ]

  const currentTheme = THEMES[theme]

  return (
    <div className="bg-bg-base text-text-primary flex flex-col">
      {/* Top Nav */}
      <header className="theme-header border-b border-border sticky top-0 z-40">
        <div className="w-full px-4 sm:px-8 flex items-center justify-between h-14">

          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 theme-grad">
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <polyline points="0,11 4,6 8,9 14,2" stroke="#060c16" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-[16px] font-extrabold text-text-primary hidden sm:block">Trading Journal</span>
          </div>

          {/* Nav */}
          <nav className="flex flex-1 justify-center items-center gap-2 sm:gap-4 px-2 sm:px-0">
            {NAV.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center justify-center px-4 py-2 sm:py-2.5 rounded-lg text-[13px] font-bold transition-all duration-200 ${isActive
                    ? 'bg-accent-green/10 text-accent-green shadow-[inset_0_0_0_1px_rgba(0,229,160,0.2)]'
                    : 'text-text-muted hover:bg-bg-hover hover:text-text-primary'
                  }`
                }
              >
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {/* Open count */}
            <div className="hidden sm:flex items-center gap-1.5 mr-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--acc-main)', boxShadow: '0 0 6px var(--acc-main)' }} />
              <span className="text-[11px] text-text-dim">{openCount} {t('nav_open')}</span>
            </div>

            {/* ── Theme Picker ── */}
            <div className="relative" ref={themeRef}>
              <button
                onClick={() => setThemeOpen((o) => !o)}
                title="Change theme"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border hover:border-accent-green transition-colors cursor-pointer text-text-muted hover:text-text-primary text-[11px] font-semibold"
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ color: 'var(--acc-main)' }}>
                  <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="11" cy="11" r="3.5" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="11" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                <span className="hidden sm:block">{currentTheme.name}</span>
                <svg width="8" height="8" viewBox="0 0 10 10" fill="none"
                  className={`transition-transform duration-200 ${themeOpen ? 'rotate-180' : ''}`}>
                  <path d="M1 3l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {/* VS Code-style flat list dropdown */}
              {themeOpen && (
                <div
                  className="absolute right-0 top-full mt-1 z-50 overflow-hidden"
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-l)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
                    minWidth: '220px',
                    borderRadius: '4px',
                  }}
                >
                  {/* Header bar */}
                  <div className="px-3 py-2 text-[11px] font-semibold"
                    style={{ background: 'var(--bg-hover)', color: 'var(--text-dim)', borderBottom: '1px solid var(--border)' }}>
                    Select Color Theme
                  </div>

                  {/* List */}
                  <div className="py-1 max-h-64 overflow-y-auto">
                    {Object.entries(THEMES).map(([key, th]) => {
                      const isActive = theme === key
                      const subtitles = {
                        default: 'Default Dark',
                        dark: 'Pure Black',
                        ocean: 'Ocean Blue',
                        forest: 'Forest Green',
                        rose: 'Rose Pink',
                      }
                      return (
                        <button
                          key={key}
                          onClick={() => { switchTheme(key); setThemeOpen(false) }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-[12px] cursor-pointer border-none text-left transition-colors"
                          style={{
                            background: isActive ? 'var(--acc-main)' : 'transparent',
                            color: isActive ? '#060c16' : 'var(--text-pri)',
                          }}
                          onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'var(--bg-hover)' } }}
                          onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent' } }}
                        >
                          <span className="font-medium flex-1">{th.name}</span>
                          <span className="text-[10px] opacity-60">{subtitles[key]}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Language Toggle */}
            <div className="flex items-center rounded-lg overflow-hidden border border-border text-[11px] font-semibold">
              <button
                onClick={() => setLang('en')}
                className="px-2.5 py-1 transition-colors cursor-pointer border-none"
                style={{ background: lang === 'en' ? 'var(--acc-main)' : 'transparent', color: lang === 'en' ? '#060c16' : 'var(--text-mut)' }}
              >EN</button>
              <button
                onClick={() => setLang('km')}
                className="px-2.5 py-1 transition-colors cursor-pointer border-none"
                style={{ background: lang === 'km' ? 'var(--acc-main)' : 'transparent', color: lang === 'km' ? '#060c16' : 'var(--text-mut)' }}
              >KH</button>
            </div>

            {/* User avatar */}
            <div className="relative group">
              <button className="flex items-center gap-2 bg-bg-card border border-border rounded-lg px-2.5 py-1.5 cursor-pointer">
                {user?.photoURL
                  ? <img src={user.photoURL} className="w-5 h-5 rounded-full" alt="" />
                  : <div className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold"
                    style={{ background: 'var(--acc-main)22', color: 'var(--acc-main)' }}>
                    {(user?.displayName || user?.email || 'U')[0].toUpperCase()}
                  </div>
                }
                <span className="hidden sm:block text-[12px] text-text-muted max-w-[100px] truncate">
                  {user?.displayName || user?.email}
                </span>
              </button>
              <div className="absolute right-0 top-full mt-1 bg-bg-panel border border-border rounded-xl py-1.5 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-xl z-50">
                <div className="px-4 py-2 text-[11px] text-text-dark border-b border-border mb-1">
                  {user?.email}
                </div>
                <button onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-[12px] text-text-muted hover:text-accent-red transition-colors cursor-pointer bg-transparent border-none">
                  {t('nav_sign_out')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="w-full px-4 sm:px-8 py-4">
        {children}
      </main>
    </div>
  )
}
