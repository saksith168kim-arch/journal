// src/components/layout/Layout.jsx
import { useState, useRef, useEffect, useCallback, memo } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LanguageContext'
import { useTheme } from '../../context/ThemeContext'

// ─── Constants ────────────────────────────────────────────────────────────────
const SB_FULL = 230
const SB_MINI = 56
const EASE    = 'cubic-bezier(.4,0,.2,1)'
// Brand accent — kept as a constant because it's the app's identity color,
// independent of the light/dark theme palette.
const ACCENT  = '#32E6D5'

// ─── NAV (stable, module-level) ───────────────────────────────────────────────
const NAV = [
  { to: '/dashboard', label: 'Journal',
    icon: <svg width="17" height="17" viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.5"/><path d="M6.5 7h7M6.5 10h7M6.5 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
  { to: '/new', label: 'New Trade',
    icon: <svg width="17" height="17" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5"/><path d="M10 7v6M7 10h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
  { to: '/analytics', label: 'Analytics',
    icon: <svg width="17" height="17" viewBox="0 0 20 20" fill="none"><path d="M3 15l4-5 3.5 3.5L15 7l2 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
  { to: '/tools', label: 'Tools',
    icon: <svg width="17" height="17" viewBox="0 0 20 20" fill="none"><path d="M15.5 2a2.5 2.5 0 0 1 0 5L5 17a2 2 0 1 1-2.83-2.83L12.5 4A2.5 2.5 0 0 1 15.5 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { to: '/discipline', label: 'Discipline',
    icon: <svg width="17" height="17" viewBox="0 0 20 20" fill="none"><path d="M10 2l2.4 4.8L18 7.6l-4 3.9.9 5.5L10 14.4l-4.9 2.6.9-5.5-4-3.9 5.6-.8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
]

const ADMIN_ICON = <svg width="17" height="17" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5"/><path d="M10 7v3l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>

const EXTRA = [
  { to: '/upgrade', label: 'Upgrade', badge: 'PRO', accent: true,
    icon: <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><path d="M10 2l2.4 4.8L18 7.6l-4 3.9.9 5.5L10 14.4l-4.9 2.6.9-5.5-4-3.9 5.6-.8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { to: '/support', label: 'Support',
    icon: <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5"/><path d="M10 10.5v.5M10 7a2 2 0 1 1 0 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
  { to: '/settings', label: 'Settings',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
]

// ─── Global CSS ───────────────────────────────────────────────────────────────
// All colors here use CSS variables so they respond to theme switching.
const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; }
  html, body { overflow-x: hidden; }

  /* Nav link hover */
  .sb-link { transition: all 0.15s ease !important; }
  .sb-link:not([style*="linear-gradient"]):hover { background: var(--bg-hover) !important; }
  .sb-link:hover .sb-icon { color: var(--text-sec) !important; }
  .sb-link:hover .sb-label { color: var(--text-pri) !important; }

  /* Extra link hover */
  .sb-extra:hover { background: var(--bg-hover) !important; }

  /* Collapse toggle hover */
  .sb-toggle:hover { background: ${ACCENT} !important; color: #0a0f0e !important; border-color: ${ACCENT} !important; }

  /* User btn hover */
  .sb-user-btn:hover { background: var(--bg-hover) !important; border-color: var(--border-l) !important; }

  /* Sign-out hover */
  .sb-signout:hover { background: var(--col-loss-bg) !important; }

  /* Theme btn hover */
  .sb-theme-btn:hover { border-color: ${ACCENT} !important; color: ${ACCENT} !important; }

  /* Tooltip */
  .sb-tip-wrap { position: relative; }
  .sb-tip {
    position: absolute; left: calc(100% + 10px); top: 50%;
    transform: translateY(-50%);
    background: var(--bg-card); border: 1px solid var(--border);
    border-radius: 7px; padding: 5px 10px;
    font-size: 12px; color: var(--text-pri);
    white-space: nowrap; z-index: 999; pointer-events: none;
    opacity: 0; transition: opacity 0.12s;
    box-shadow: var(--shadow-panel);
    font-family: var(--font-ui);
  }
  .sb-tip::before {
    content: '';
    position: absolute; right: 100%; top: 50%;
    transform: translateY(-50%);
    border: 5px solid transparent;
    border-right-color: var(--border);
  }
  .sb-tip-wrap:hover .sb-tip { opacity: 1 !important; }

  /* Scrollbars */
  nav::-webkit-scrollbar { width: 0; }
  .page-main::-webkit-scrollbar { width: 4px; }
  .page-main::-webkit-scrollbar-track { background: transparent; }
  .page-main::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
  .page-main::-webkit-scrollbar-thumb:hover { background: var(--border-l); }

  /* Live dot animation */
  @keyframes ping { 0%{transform:scale(1);opacity:.5} 100%{transform:scale(2.2);opacity:0} }

  /* Responsive */
  @media (max-width: 639px) {
    .sidebar-desktop { display: none !important; }
    .mobile-topbar   { display: flex !important; }
    .page-main       { margin-left: 0 !important; padding: 64px 14px 24px !important; }
  }
  @media (min-width: 640px) {
    .sidebar-desktop { display: block !important; }
    .mobile-topbar   { display: none !important; }
  }
`

// ─── Tiny components ──────────────────────────────────────────────────────────
const LiveDot = memo(() => (
  <span style={{ position: 'relative', display: 'inline-flex', width: 7, height: 7, flexShrink: 0 }}>
    <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: ACCENT, opacity: 0.5, animation: 'ping 2s ease-out infinite' }}/>
    <span style={{ position: 'relative', width: 7, height: 7, borderRadius: '50%', background: ACCENT, display: 'block' }}/>
  </span>
))

function Tip({ label, children, disabled }) {
  if (disabled) return children
  return (
    <div className="sb-tip-wrap">
      {children}
      <div className="sb-tip">{label}</div>
    </div>
  )
}

// ─── NavItem ──────────────────────────────────────────────────────────────────
const NavItem = memo(function NavItem({ to, label, icon, openCount, collapsed, isMobile, onClose, badge, accent }) {
  const inner = (
    <NavLink
      to={to}
      end={to === '/dashboard'}
      onClick={isMobile ? onClose : undefined}
      className="sb-link"
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center',
        gap: collapsed ? 0 : 10,
        padding: collapsed ? '10px 0' : '9px 14px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderRadius: 10,
        margin: collapsed ? '2px 7px' : '2px 10px',
        textDecoration: 'none',
        color: isActive ? '#03121A' : 'var(--text-sec)',
        background: isActive
          ? 'linear-gradient(135deg, #32E6D5, #0EA5E9)'
          : 'transparent',
        borderLeft: 'none',
        outline: 'none',
        boxShadow: isActive ? '0 2px 12px rgba(50,230,213,0.35)' : 'none',
      })}
    >
      {({ isActive }) => (
        <>
          <span className="sb-icon" style={{
            display: 'flex', flexShrink: 0,
            color: isActive ? '#03121A' : 'var(--text-mut)',
            transition: 'color 0.15s',
          }}>{icon}</span>

          <span className="sb-label" style={{
            overflow: 'hidden', whiteSpace: 'nowrap',
            maxWidth: collapsed ? 0 : 140,
            opacity: collapsed ? 0 : 1,
            transition: `max-width 0.26s ${EASE}, opacity 0.18s ease`,
            flex: 1, fontSize: 13.5, fontWeight: isActive ? 600 : 400,
            letterSpacing: '-0.01em',
            color: isActive ? '#03121A' : 'var(--text-sec)',
          }}>{label}</span>

          {!collapsed && to === '/dashboard' && openCount > 0 && (
            <span style={{
              fontSize: 9, fontWeight: 700,
              background: isActive ? ACCENT : 'rgba(50,230,213,0.15)',
              color: isActive ? '#0a0f0e' : ACCENT,
              borderRadius: 5, padding: '2px 6px',
              letterSpacing: '0.04em', fontFamily: 'monospace',
            }}>{openCount}</span>
          )}
          {!collapsed && badge && (
            <span style={{
              fontSize: 9, fontWeight: 600,
              background: accent ? 'rgba(50,230,213,0.1)' : 'var(--bg-hover)',
              color: accent ? ACCENT : 'var(--text-dim)',
              border: `1px solid ${accent ? 'rgba(50,230,213,0.22)' : 'var(--border)'}`,
              borderRadius: 4, padding: '2px 6px',
              letterSpacing: '0.06em', fontFamily: 'monospace',
            }}>{badge}</span>
          )}
        </>
      )}
    </NavLink>
  )
  return collapsed ? <Tip label={label}>{inner}</Tip> : inner
})

// ─── SidebarInner ─────────────────────────────────────────────────────────────
const SidebarInner = memo(function SidebarInner({
  collapsed, setCollapsed, isMobile, onClose,
  openCount, isAdmin,
  user, userOpen, setUserOpen, userRef,
  lang, setLang,
  theme, switchTheme,
  t, handleLogout,
}) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%',
      background: 'var(--bg-panel)',
      borderRight: '1px solid var(--border)',
      overflow: 'hidden',
    }}>

      {/* ── Logo ── */}
      <div style={{
        padding: collapsed ? '0' : '18px 14px 14px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: collapsed ? 0 : 9,
        transition: `padding 0.26s ${EASE}`,
        minHeight: 56,
      }}>

        {/* Logo mark — hidden in mini mode */}
        <div style={{
          width: 32, height: 32, borderRadius: 9, overflow: 'hidden', flexShrink: 0,
          background: 'rgba(50,230,213,0.1)',
          border: '1px solid rgba(50,230,213,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          maxWidth: collapsed ? 0 : 32,
          opacity: collapsed ? 0 : 1,
          transition: `max-width 0.26s ${EASE}, opacity 0.18s ease`,
        }}>
          <img src="/Navlogo.png" alt="AI Trading Journal"
            style={{ width: 32, height: 32, objectFit: 'cover' }}
            onError={e => { e.target.style.display = 'none' }}
          />
        </div>

        {/* Brand text — hidden in mini mode */}
        <div style={{
          overflow: 'hidden', whiteSpace: 'nowrap',
          maxWidth: collapsed ? 0 : 172,
          opacity: collapsed ? 0 : 1,
          transition: `max-width 0.26s ${EASE}, opacity 0.18s ease`,
          flex: collapsed ? '0 0 0' : 1,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-pri)', letterSpacing: '-0.03em', lineHeight: 1.15, whiteSpace: 'nowrap' }}>
            AI Trading Journal
          </div>
          <div style={{ fontSize: 9, color: ACCENT, letterSpacing: '0.1em', fontFamily: 'monospace', textTransform: 'uppercase', marginTop: 1 }}>
            Terminal
          </div>
        </div>

        {/* Live dot — hidden in mini mode */}
        {!collapsed && <LiveDot />}

        {/* Collapse toggle — always visible, centered when mini */}
        <button
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            marginLeft: collapsed ? 0 : 'auto',
            flexShrink: 0,
            width: 28, height: 28, borderRadius: 7,
            background: 'transparent',
            border: '1px solid var(--border)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-mut)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-sec)'; e.currentTarget.style.borderColor = 'var(--border-l)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-mut)'; e.currentTarget.style.borderColor = 'var(--border)' }}
        >
          {collapsed ? (
            /* Expand — arrow pointing right */
            <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1.5" y="1.5" width="15" height="15" rx="3"/>
              <line x1="6" y1="1.5" x2="6" y2="16.5"/>
              <path d="M9.5 7l2.5 2-2.5 2"/>
            </svg>
          ) : (
            /* Collapse — arrow pointing left */
            <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1.5" y="1.5" width="15" height="15" rx="3"/>
              <line x1="6" y1="1.5" x2="6" y2="16.5"/>
              <path d="M8.5 7l-2.5 2 2.5 2"/>
            </svg>
          )}
        </button>
      </div>

      {/* ── Section label ── */}
      <div style={{
        overflow: 'hidden',
        maxHeight: collapsed ? 0 : 32,
        opacity: collapsed ? 0 : 1,
        transition: `max-height 0.26s ${EASE}, opacity 0.18s ease`,
        padding: collapsed ? 0 : '12px 14px 2px',
        fontSize: 9, fontWeight: 600,
        color: 'var(--text-dim)',
        letterSpacing: '0.18em', textTransform: 'uppercase',
        fontFamily: 'monospace', flexShrink: 0,
      }}>Navigate</div>

      {/* ── Nav ── */}
      <nav style={{ flex: 1, overflowY: 'auto', paddingBottom: 8, paddingTop: collapsed ? 10 : 4 }}>
        {NAV.map(item => (
          <NavItem key={item.to} {...item} openCount={openCount} collapsed={collapsed} isMobile={isMobile} onClose={onClose} />
        ))}

        {isAdmin && (
          <NavItem to="/admin" label="Admin" icon={ADMIN_ICON} collapsed={collapsed} isMobile={isMobile} onClose={onClose} />
        )}

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--border)', margin: collapsed ? '10px 8px' : '10px 12px' }} />

        {/* Extra links — now real NavLinks */}
        {EXTRA.map(({ to, label, icon, badge, accent }) => (
          <NavItem
            key={to}
            to={to}
            label={label}
            icon={icon}
            badge={badge}
            accent={accent}
            collapsed={collapsed}
            isMobile={isMobile}
            onClose={onClose}
          />
        ))}
      </nav>

      {/* ── Theme + Lang ── */}
      <div style={{
        overflow: 'hidden',
        maxHeight: collapsed ? 0 : 52,
        opacity: collapsed ? 0 : 1,
        transition: `max-height 0.26s ${EASE}, opacity 0.18s ease`,
        padding: collapsed ? 0 : '8px 12px',
        borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
      }}>
        {/* Theme toggle */}
        <button
          className="sb-theme-btn"
          onClick={() => switchTheme(theme === 'midnight' ? 'light' : 'midnight')}
          title={theme === 'midnight' ? 'Switch to Light mode' : 'Switch to Dark mode'}
          style={{
            width: 30, height: 30, borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--bg-card)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-mut)', flexShrink: 0, transition: 'all 0.15s',
          }}
        >
          {theme === 'midnight'
            ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
            : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          }
        </button>

        {/* Lang */}
        <div style={{ display: 'flex', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 2, gap: 2 }}>
          {[{ code: 'in', label: 'EN' }, { code: 'km', label: 'KH' }].map(({ code, label }) => (
            <button key={code} onClick={() => setLang(code)} style={{
              padding: '3px 9px', borderRadius: 6, border: 'none', cursor: 'pointer',
              fontSize: 10, fontWeight: 600, fontFamily: 'monospace',
              background: lang === code ? 'rgba(50,230,213,0.15)' : 'transparent',
              color: lang === code ? ACCENT : 'var(--text-dim)',
              transition: 'all 0.15s', letterSpacing: '0.06em',
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* ── User ── */}
      <div style={{
        padding: collapsed ? '8px 7px 12px' : '8px 10px 12px',
        borderTop: '1px solid var(--border)',
        flexShrink: 0, position: 'relative',
        transition: 'padding 0.26s',
      }}  ref={userRef}>

        {collapsed ? (
          /* Collapsed avatar */
          <Tip label={user?.displayName || 'Trader'}>
            <div
              role="button" tabIndex={0}
              onClick={() => setUserOpen(o => !o)}
              onKeyDown={e => e.key === 'Enter' && setUserOpen(o => !o)}
              style={{
                width: 36, height: 36, borderRadius: 9, margin: '0 auto',
                background: 'rgba(50,230,213,0.1)',
                border: '1px solid rgba(50,230,213,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', cursor: 'pointer',
              }}
            >
              {user?.photoURL
                ? <img src={user.photoURL} style={{ width: 36, height: 36 }} alt="" />
                : <span style={{ color: ACCENT, fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>
                    {(user?.displayName || user?.email || 'U')[0].toUpperCase()}
                  </span>
              }
            </div>
          </Tip>
        ) : (
          /* Expanded user row */
          <button
            className="sb-user-btn"
            onClick={() => setUserOpen(o => !o)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 9,
              background: userOpen ? 'var(--bg-hover)' : 'transparent',
              border: `1px solid ${userOpen ? 'rgba(50,230,213,0.3)' : 'var(--border)'}`,
              borderRadius: 10, padding: '7px 9px',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {/* Avatar */}
            <div style={{
              width: 30, height: 30, borderRadius: 8, flexShrink: 0,
              background: 'rgba(50,230,213,0.1)',
              border: '1px solid rgba(50,230,213,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
            }}>
              {user?.photoURL
                ? <img src={user.photoURL} style={{ width: 30, height: 30 }} alt="" />
                : <span style={{ color: ACCENT, fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>
                    {(user?.displayName || user?.email || 'U')[0].toUpperCase()}
                  </span>
              }
            </div>

            {/* Name + email */}
            <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-pri)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
                {user?.displayName || 'Trader'}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                {user?.email}
              </div>
            </div>

            {/* FREE badge */}
            <span style={{
              fontSize: 8.5, fontWeight: 700, flexShrink: 0,
              background: 'var(--bg-hover)',
              border: '1px solid var(--border)',
              borderRadius: 4, padding: '2px 6px',
              color: 'var(--text-dim)', letterSpacing: '0.08em', fontFamily: 'monospace',
            }}>FREE</span>
          </button>
        )}

        {/* Dropdown */}
        {userOpen && (
          <div style={{
            position: 'absolute', bottom: 'calc(100% + 6px)',
            left: collapsed ? 54 : 10, right: collapsed ? 'auto' : 10,
            width: collapsed ? 190 : 'auto',
            background: 'var(--bg-panel)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '6px 0',
            boxShadow: 'var(--shadow-panel)', zIndex: 500,
          }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-pri)', marginBottom: 2 }}>{user?.displayName || 'Trader'}</div>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'monospace' }}>{user?.email}</div>
            </div>
            <button
              className="sb-signout"
  onMouseDown={() => { setUserOpen(false); handleLogout() }}
              style={{
                width: '100%', textAlign: 'left', padding: '8px 14px',
                fontSize: 12.5, color: 'var(--col-loss)',
                background: 'transparent', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-ui)',
                display: 'flex', alignItems: 'center', gap: 8,
                borderRadius: 8, transition: 'background 0.15s',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M13 10H3M7 6l-4 4 4 4M13 3h4v14h-4"/></svg>
              {t('nav_sign_out')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
})

// ─── Layout (default export) ──────────────────────────────────────────────────
export default function Layout({ children, openCount = 0 }) {
  const { user, logout, isAdmin } = useAuth()
  const { lang, setLang, t }      = useLang()
  const { theme, switchTheme }    = useTheme()
  const navigate                  = useNavigate()

  const [collapsed, setCollapsed]   = useState(false)
  const [userOpen, setUserOpen]     = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const userRef = useRef(null)
  const sbWidth = collapsed ? SB_MINI : SB_FULL

  useEffect(() => {
    function onDown(e) { if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  useEffect(() => {
    function onKey(e) {
      if (e.key !== 'Escape') return
      if (userOpen) setUserOpen(false)
      if (mobileOpen) setMobileOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [userOpen, mobileOpen])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

const handleLogout = useCallback(async () => {
  console.log('1. logout clicked')
  setMobileOpen(false)
  setUserOpen(false)
  console.log('2. calling logout...')
  await logout()
  console.log('3. logout done, navigating...')
  navigate('/')
}, [logout, navigate])
  const closeMobile  = useCallback(() => setMobileOpen(false), [])

  const sidebarProps = {
    collapsed, setCollapsed, isMobile: false, onClose: () => {},
    openCount, isAdmin,
    user, userOpen, setUserOpen, userRef,
    lang, setLang, theme, switchTheme,
    t, handleLogout,
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-base)', color: 'var(--text-pri)', fontFamily: 'var(--font-ui)', overflow: 'hidden' }}>
      <style>{GLOBAL_CSS}</style>

      {/* Desktop sidebar */}
      <aside className="sidebar-desktop" style={{
        width: sbWidth, flexShrink: 0,
        position: 'fixed', top: 0, left: 0, height: '100vh',
        zIndex: 100, overflowY: 'auto', overflowX: 'visible',
        transition: `width 0.26s ${EASE}`,
      }}>
        <SidebarInner {...sidebarProps} />
      </aside>

      {/* Mobile top bar */}
      <header className="mobile-topbar" style={{
        display: 'none', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        background: 'var(--bg-panel)', borderBottom: '1px solid var(--border)',
        height: 52, alignItems: 'center', justifyContent: 'space-between', padding: '0 14px',
      }}>
        <button onClick={() => setMobileOpen(true)} style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-mut)' }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-pri)' }}>AI Trading Journal</span>
        <div style={{ width: 34 }}/>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div onClick={closeMobile} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, backdropFilter: 'blur(4px)' }} />
      )}

      {/* Mobile drawer */}
      <aside style={{
        position: 'fixed', top: 0, left: 0, bottom: 0,
        width: SB_FULL, zIndex: 400,
        transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: `transform 0.22s ${EASE}`, overflowY: 'auto',
      }}>
        <SidebarInner {...sidebarProps} collapsed={false} isMobile={true} onClose={closeMobile} />
      </aside>

      {/* Main content */}
      <main className="page-main" style={{
        flex: 1, minWidth: 0,
        marginLeft: sbWidth,
        padding: '28px 32px',
        overflowY: 'auto', overflowX: 'hidden',
        boxSizing: 'border-box', height: '100vh',
        transition: `margin-left 0.26s ${EASE}`,
      }}>
        {children}
      </main>
    </div>
  )
}