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
  const [userOpen, setUserOpen] = useState(false)
  const userRef = useRef(null)
  const mobileUserRef = useRef(null)

  useEffect(() => {
    function onDown(e) {
      const inDesktop = userRef.current && userRef.current.contains(e.target)
      const inMobile = mobileUserRef.current && mobileUserRef.current.contains(e.target)
      if (!inDesktop && !inMobile) setUserOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  async function handleLogout() {
    await logout()
    navigate('/auth')
  }

  const NAV = [
    {
      to: '/', label: t('nav_journal'),
      icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.6" /><path d="M6.5 7h7M6.5 10h7M6.5 13h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
    },
    {
      to: '/new', label: t('nav_new_trade'),
      icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.6" /><path d="M10 7v6M7 10h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
    },
    {
      to: '/analytics', label: t('nav_analytics'),
      icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 15l4-5 3.5 3.5L15 7l2 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /><path d="M3 15h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
    },
    {
      to: '/tools', label: 'Tools',
      icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M15.5 2a2.5 2.5 0 0 1 0 5L5 17a2 2 0 1 1-2.83-2.83L12.5 4A2.5 2.5 0 0 1 15.5 2z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
    },
  ]

  return (
    <div style={{ fontFamily: 'var(--font-ui)', background: 'var(--bg-base)', color: 'var(--text-pri)', minHeight: '100vh', overflowX: 'hidden', width: '100%' }}>

      {/* ════════════════════════════════
          DESKTOP NAV  (≥ 640 px)
      ════════════════════════════════ */}
      <header className="nav-desktop" style={{
        background: 'var(--bg-panel)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 1px 0 var(--border)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 12, height: 56, padding: '0 20px',
          maxWidth: 1400, margin: '0 auto', width: '100%', boxSizing: 'border-box',
        }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: 'var(--grad-accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow-btn)',
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <polyline points="0,11 4,6 8,9 14,2" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-pri)', whiteSpace: 'nowrap' }}>
              TradeLog
            </span>
          </div>

          {/* Nav pill */}
          <nav style={{
            display: 'flex', gap: 2, flex: 1, maxWidth: 600,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 10, padding: 3,
          }}>
            {NAV.map(({ to, label }) => (
              <NavLink key={to} to={to} end={to === '/'}
                style={({ isActive }) => ({
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 5, padding: '6px 10px', borderRadius: 7,
                  textDecoration: 'none', whiteSpace: 'nowrap', transition: 'all 0.15s',
                  fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-ui)',
                  background: isActive ? 'var(--grad-accent)' : 'transparent',
                  color: isActive ? '#fff' : 'var(--text-sec)',
                  boxShadow: isActive ? 'var(--shadow-btn)' : 'none',
                })}
              >
                {({ isActive }) => (
                  <>
                    <span style={{ display: 'flex', opacity: isActive ? 1 : 0.55 }}>
                      <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        {to === '/' && <><rect x="3" y="3" width="14" height="14" rx="3" /><path d="M6.5 7h7M6.5 10h7M6.5 13h4" /></>}
                        {to === '/new' && <><circle cx="10" cy="10" r="7.5" /><path d="M10 7v6M7 10h6" /></>}
                        {to === '/analytics' && <><path d="M3 15l4-5 3.5 3.5L15 7l2 2.5" /><path d="M3 15h14" /></>}
                        {to === '/tools' && <path d="M15.5 2a2.5 2.5 0 0 1 0 5L5 17a2 2 0 1 1-2.83-2.83L12.5 4A2.5 2.5 0 0 1 15.5 2z" />}
                      </svg>
                    </span>
                    {label}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Right controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>

            {/* Open trades badge */}
            {openCount > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 6, padding: '4px 10px',
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--col-win)', boxShadow: '0 0 6px var(--col-win)' }} />
                <span style={{ color: 'var(--text-mut)', fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
                  {openCount} OPEN
                </span>
              </div>
            )}

            {/* Theme */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '5px 9px',
            }}>
              {Object.entries(THEMES).map(([key, th]) => (
                <button key={key} onClick={() => switchTheme(key)} title={th.name} style={{
                  width: 18, height: 18, borderRadius: '50%', padding: 0,
                  border: theme === key ? '2px solid var(--acc-main)' : '1px solid var(--border)',
                  background: th.vars?.['--bg-panel'] ?? '#111',
                  cursor: 'pointer', transition: 'all 0.15s',
                  boxShadow: theme === key ? '0 0 8px var(--acc-main)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9,
                }}>{th.emoji}</button>
              ))}
            </div>

            {/* Language */}
            <div style={{
              display: 'flex', background: 'var(--bg-card)',
              border: '1px solid var(--border)', borderRadius: 8, padding: 3, gap: 2,
            }}>
              {[{ code: 'en', label: 'EN' }, { code: 'km', label: 'KH' }].map(({ code, label }) => (
                <button key={code} onClick={() => setLang(code)} style={{
                  padding: '4px 10px', borderRadius: 5, border: 'none', cursor: 'pointer',
                  fontSize: 11, fontWeight: 700, transition: 'all 0.15s', fontFamily: 'var(--font-ui)',
                  background: lang === code ? 'var(--acc-main)' : 'transparent',
                  color: lang === code ? '#fff' : 'var(--text-mut)',
                }}>{label}</button>
              ))}
            </div>

            {/* Avatar */}
            <div style={{ position: 'relative' }} ref={userRef}>
              <button onClick={() => setUserOpen(o => !o)} style={{
                width: 32, height: 32, borderRadius: 9,
                background: 'var(--grad-accent)', border: 'none', padding: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: 'var(--shadow-btn)',
              }}>
                {user?.photoURL
                  ? <img src={user.photoURL} style={{ width: 32, height: 32, borderRadius: 9 }} alt="" />
                  : <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>
                    {(user?.displayName || user?.email || 'U')[0].toUpperCase()}
                  </span>
                }
              </button>
              {userOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                  background: 'var(--bg-panel)', border: '1px solid var(--border)',
                  borderRadius: 12, padding: '6px 0', width: 210,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 200,
                }}>
                  <div style={{ padding: '10px 16px', fontSize: 11, color: 'var(--text-dim)', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                    {user?.email}
                  </div>
                  <button onClick={() => { handleLogout(); setUserOpen(false) }}
                    style={{ width: '100%', textAlign: 'left', padding: '9px 16px', fontSize: 13, color: 'var(--text-mut)', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--col-loss)'; e.currentTarget.style.background = 'var(--bg-hover)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-mut)'; e.currentTarget.style.background = 'transparent' }}
                  >{t('nav_sign_out')}</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ════════════════════════════════
          MOBILE TOP BAR  (< 640 px)
      ════════════════════════════════ */}
      <header className="nav-mobile-top" style={{
        background: 'var(--bg-panel)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 100,
        display: 'none', width: '100%', boxSizing: 'border-box',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: 52, padding: '0 14px', width: '100%', boxSizing: 'border-box',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'var(--grad-accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <polyline points="0,11 4,6 8,9 14,2" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-pri)' }}>TradeLog</span>
          </div>

          {/* Right: theme + lang + avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 1, minWidth: 0 }}>
            {/* Theme dots */}
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 7, padding: '3px 6px' }}>
              {Object.entries(THEMES).map(([key, th]) => (
                <button key={key} onClick={() => switchTheme(key)} style={{
                  width: 16, height: 16, borderRadius: '50%', padding: 0,
                  border: theme === key ? '2px solid var(--acc-main)' : '1px solid var(--border)',
                  background: th.vars?.['--bg-panel'] ?? '#111',
                  cursor: 'pointer',
                  boxShadow: theme === key ? '0 0 5px var(--acc-main)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8,
                }}>{th.emoji}</button>
              ))}
            </div>

            {/* Language */}
            <div style={{ display: 'flex', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 7, padding: 2, gap: 1 }}>
              {[{ code: 'en', label: 'EN' }, { code: 'km', label: 'KH' }].map(({ code, label }) => (
                <button key={code} onClick={() => setLang(code)} style={{
                  padding: '3px 8px', borderRadius: 5, border: 'none', cursor: 'pointer',
                  fontSize: 10, fontWeight: 700, transition: 'all 0.15s', fontFamily: 'var(--font-ui)',
                  background: lang === code ? 'var(--acc-main)' : 'transparent',
                  color: lang === code ? '#fff' : 'var(--text-mut)',
                }}>{label}</button>
              ))}
            </div>

            {/* Avatar */}
            <div style={{ position: 'relative' }} ref={mobileUserRef}>
              <button onClick={() => setUserOpen(o => !o)} style={{
                width: 30, height: 30, borderRadius: 8,
                background: 'var(--grad-accent)', border: 'none', padding: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}>
                {user?.photoURL
                  ? <img src={user.photoURL} style={{ width: 30, height: 30, borderRadius: 8 }} alt="" />
                  : <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>
                    {(user?.displayName || user?.email || 'U')[0].toUpperCase()}
                  </span>
                }
              </button>
              {userOpen && (
                <div style={{
                  position: 'fixed', right: 14, top: 60,
                  background: 'var(--bg-panel)', border: '1px solid var(--border)',
                  borderRadius: 12, padding: '6px 0', width: 200,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 999,
                }}>
                  <div style={{ padding: '8px 14px', fontSize: 11, color: 'var(--text-dim)', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                    {user?.email}
                  </div>
                  <button onClick={() => { handleLogout(); setUserOpen(false) }}
                    style={{ width: '100%', textAlign: 'left', padding: '9px 14px', fontSize: 13, color: 'var(--text-mut)', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--col-loss)'; e.currentTarget.style.background = 'var(--bg-hover)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-mut)'; e.currentTarget.style.background = 'transparent' }}
                  >{t('nav_sign_out')}</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="page-main" style={{ width: '100%', maxWidth: 1400, margin: '0 auto', padding: '24px 32px', boxSizing: 'border-box', overflowX: 'hidden', minWidth: 0 }}>
        {children}
      </main>

      {/* ════════════════════════════════
          MOBILE BOTTOM TAB BAR (< 640 px)
      ════════════════════════════════ */}
      <nav className="nav-mobile-bottom" style={{
        display: 'none',
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        background: 'var(--bg-panel)',
        borderTop: '1px solid var(--border)',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.35)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        <div style={{ display: 'flex', alignItems: 'stretch' }}>
          {NAV.map(({ to, label, icon }) => (
            <NavLink key={to} to={to} end={to === '/'}
              style={({ isActive }) => ({
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 3, padding: '10px 4px 8px',
                textDecoration: 'none', transition: 'all 0.15s',
                color: isActive ? 'var(--acc-main)' : 'var(--text-mut)',
                borderTop: isActive ? '2px solid var(--acc-main)' : '2px solid transparent',
                background: isActive ? 'var(--acc-subtle)' : 'transparent',
              })}
            >
              {({ isActive }) => (
                <>
                  <span style={{
                    display: 'flex',
                    transform: isActive ? 'translateY(-1px) scale(1.1)' : 'scale(1)',
                    transition: 'transform 0.15s',
                  }}>{icon}</span>
                  <span style={{
                    fontSize: 10, fontWeight: isActive ? 700 : 500,
                    fontFamily: 'var(--font-ui)', whiteSpace: 'nowrap',
                    letterSpacing: isActive ? '0.01em' : 0,
                  }}>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        html, body { overflow-x: hidden; max-width: 100vw; }
        @media (max-width: 639px) {
          .nav-desktop        { display: none !important; }
          .nav-mobile-top     { display: block !important; }
          .nav-mobile-bottom  { display: block !important; }
          .page-main          { padding: 12px 12px 90px 12px !important; overflow-x: hidden !important; }
        }
        @media (min-width: 640px) {
          .nav-desktop        { display: block !important; }
          .nav-mobile-top     { display: none !important; }
          .nav-mobile-bottom  { display: none !important; }
        }
      `}</style>
    </div>
  )
}