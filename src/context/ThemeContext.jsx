// src/context/ThemeContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'

export const THEMES = {
  dark: {
    name: 'Dark',
    emoji: '🌙',
    dots: ['#0d1117', '#3b82f6', '#1e2d3d'],
    vars: {
      // Backgrounds — deep navy-charcoal, not pure black
      '--bg-base': '#090e18',
      '--bg-panel': '#0d1420',
      '--bg-card': '#101828',
      '--bg-hover': '#141e2e',
      '--bg-row-alt': '#0b1219',
      '--bg-input': '#0d1520',

      // Borders — subtle blue-tinted separators
      '--border': '#1a2640',
      '--border-l': '#243450',
      '--border-focus': '#3b82f6',

      // Accent — electric blue (trust, finance, precision)
      '--acc-main': '#3b82f6',
      '--acc-glow': 'rgba(59,130,246,0.15)',
      '--acc-header': '#090e18',
      '--acc-subtle': 'rgba(59,130,246,0.08)',

      // Semantic colors
      '--col-win': '#22c55e',
      '--col-win-bg': 'rgba(34,197,94,0.10)',
      '--col-loss': '#ef4444',
      '--col-loss-bg': 'rgba(239,68,68,0.10)',
      '--col-warn': '#f59e0b',
      '--col-warn-bg': 'rgba(245,158,11,0.10)',
      '--col-long': '#22c55e',
      '--col-short': '#ef4444',

      // Typography
      '--text-pri': '#e2e8f0',
      '--text-sec': '#94a3b8',
      '--text-mut': '#4a6070',
      '--text-dim': '#2a3a50',
      '--text-inv': '#090e18',

      // Fonts
      '--font-ui': "'DM Sans', sans-serif",
      '--font-mono': "'DM Mono', 'Fira Code', monospace",
      '--font-display': "'DM Sans', sans-serif",

      // Shadows & glows
      '--shadow-card': '0 1px 3px rgba(0,0,0,0.5), 0 0 0 1px rgba(26,38,64,0.8)',
      '--shadow-panel': '0 4px 24px rgba(0,0,0,0.4)',
      '--shadow-btn': '0 0 20px rgba(59,130,246,0.25)',

      // Gradients
      '--grad-a': '#3b82f6',
      '--grad-b': '#6366f1',
      '--grad-hero': 'linear-gradient(135deg, #090e18 0%, #0d1828 50%, #0a1020 100%)',
      '--grad-card': 'linear-gradient(135deg, #101828 0%, #0d1420 100%)',
      '--grad-accent': 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',

      // Noise / texture overlay opacity
      '--noise-opacity': '0.025',
    },
  },

  light: {
    name: 'Light',
    emoji: '☀️',
    dots: ['#f8fafc', '#2563eb', '#e2e8f0'],
    vars: {
      '--bg-base': '#f1f5f9',
      '--bg-panel': '#ffffff',
      '--bg-card': '#f8fafc',
      '--bg-hover': '#f0f6ff',
      '--bg-row-alt': '#f8fafc',
      '--bg-input': '#ffffff',

      '--border': '#e2e8f0',
      '--border-l': '#cbd5e1',
      '--border-focus': '#2563eb',

      '--acc-main': '#2563eb',
      '--acc-glow': 'rgba(37,99,235,0.12)',
      '--acc-header': '#ffffff',
      '--acc-subtle': 'rgba(37,99,235,0.06)',

      '--col-win': '#16a34a',
      '--col-win-bg': 'rgba(22,163,74,0.08)',
      '--col-loss': '#dc2626',
      '--col-loss-bg': 'rgba(220,38,38,0.08)',
      '--col-warn': '#d97706',
      '--col-warn-bg': 'rgba(217,119,6,0.08)',
      '--col-long': '#16a34a',
      '--col-short': '#dc2626',

      '--text-pri': '#64748b',
      '--text-sec': '#334155',
      '--text-mut': '#64748b',
      '--text-dim': '#94a3b8',
      '--text-inv': '#ffffff',

      '--font-ui': "'DM Sans', sans-serif",
      '--font-mono': "'DM Mono', 'Fira Code', monospace",
      '--font-display': "'DM Sans', sans-serif",

      '--shadow-card': '0 1px 3px rgba(0,0,0,0.08), 0 0 0 1px rgba(226,232,240,1)',
      '--shadow-panel': '0 4px 24px rgba(0,0,0,0.06)',
      '--shadow-btn': '0 0 20px rgba(37,99,235,0.20)',

      '--grad-a': '#2563eb',
      '--grad-b': '#4f46e5',
      '--grad-hero': 'linear-gradient(135deg, #f1f5f9 0%, #e8f0fe 50%, #f0f4ff 100%)',
      '--grad-card': 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
      '--grad-accent': 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',

      '--noise-opacity': '0.015',
    },
  },

  midnight: {
    name: 'Midnight',
    emoji: '🌃',
    dots: ['#0a0a14', '#a78bfa', '#1a1a2e'],
    vars: {
      '--bg-base': '#07070f',
      '--bg-panel': '#0d0d1a',
      '--bg-card': '#101020',
      '--bg-hover': '#141428',
      '--bg-row-alt': '#09090f',
      '--bg-input': '#0d0d1c',

      '--border': '#1e1e38',
      '--border-l': '#28285a',
      '--border-focus': '#a78bfa',

      '--acc-main': '#a78bfa',
      '--acc-glow': 'rgba(167,139,250,0.15)',
      '--acc-header': '#07070f',
      '--acc-subtle': 'rgba(167,139,250,0.07)',

      '--col-win': '#34d399',
      '--col-win-bg': 'rgba(52,211,153,0.10)',
      '--col-loss': '#f87171',
      '--col-loss-bg': 'rgba(248,113,113,0.10)',
      '--col-warn': '#fbbf24',
      '--col-warn-bg': 'rgba(251,191,36,0.10)',
      '--col-long': '#34d399',
      '--col-short': '#f87171',

      '--text-pri': '#e8e8ff',
      '--text-sec': '#9090b8',
      '--text-mut': '#484870',
      '--text-dim': '#282850',
      '--text-inv': '#07070f',

      '--font-ui': "'DM Sans', sans-serif",
      '--font-mono': "'DM Mono', 'Fira Code', monospace",
      '--font-display': "'DM Sans', sans-serif",

      '--shadow-card': '0 1px 3px rgba(0,0,0,0.6), 0 0 0 1px rgba(30,30,56,0.8)',
      '--shadow-panel': '0 4px 32px rgba(0,0,0,0.5)',
      '--shadow-btn': '0 0 24px rgba(167,139,250,0.30)',

      '--grad-a': '#a78bfa',
      '--grad-b': '#ec4899',
      '--grad-hero': 'linear-gradient(135deg, #07070f 0%, #0e0e20 50%, #080814 100%)',
      '--grad-card': 'linear-gradient(135deg, #101020 0%, #0d0d1a 100%)',
      '--grad-accent': 'linear-gradient(135deg, #a78bfa 0%, #ec4899 100%)',

      '--noise-opacity': '0.03',
    },
  },

}

const ThemeContext = createContext(null)

function injectFonts() {
  if (document.getElementById('ag-fonts')) return
  const link = document.createElement('link')
  link.id = 'ag-fonts'
  link.rel = 'stylesheet'
  link.href = 'https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap'
  document.head.appendChild(link)
}

function applyVars(vars) {
  const root = document.documentElement
  const PINNED = ['--text-pri', '--text-sec', '--text-mut', '--text-dim', '--text-inv',
    '--col-win', '--col-win-bg', '--col-loss', '--col-loss-bg',
    '--col-warn', '--col-warn-bg', '--col-long', '--col-short']
  Object.entries(vars).forEach(([k, v]) => {
    if (!PINNED.includes(k)) root.style.setProperty(k, v)
  })
  // Apply fonts globally to root element
  root.style.fontFamily = vars['--font-ui'] || "'DM Sans', sans-serif"
}

function applyTheme(key) {
  injectFonts()
  const theme = THEMES[key]
  if (theme?.vars) applyVars(theme.vars)
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('ag_theme')
    return saved && THEMES[saved] ? saved : 'dark'
  })

  useEffect(() => { applyTheme(theme) }, [theme])
  useEffect(() => { applyTheme(theme) }, [])

  useEffect(() => {
    // Inject global font/base styles once
    if (document.getElementById('ag-global-styles')) return
    const style = document.createElement('style')
    style.id = 'ag-global-styles'
    style.textContent = `
      *, *::before, *::after { box-sizing: border-box; }
      html, body {
        font-family: var(--font-ui, 'DM Sans', sans-serif);
        background: var(--bg-base);
        color: var(--text-pri);
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      input, textarea, select, button {
        font-family: var(--font-ui, 'DM Sans', sans-serif);
      }
      /* Monospace for data: dates, numbers, symbols, prices */
      .font-mono, [data-mono] {
        font-family: var(--font-mono, 'DM Mono', monospace) !important;
      }
      /* Tailwind overrides for theme colors */
      .text-text-primary { color: var(--text-pri) !important; }
      .text-text-muted   { color: var(--text-mut) !important; }
      .text-text-dim     { color: var(--text-dim) !important; }
      .text-text-sec     { color: var(--text-sec) !important; }
      .text-accent-green { color: var(--col-win) !important; }
      .text-accent-red   { color: var(--col-loss) !important; }
      .text-accent-yellow { color: var(--col-warn) !important; }
      .text-accent-blue  { color: var(--acc-main) !important; }
      .bg-bg-base   { background: var(--bg-base) !important; }
      .bg-bg-panel  { background: var(--bg-panel) !important; }
      .bg-bg-card   { background: var(--bg-card) !important; }
      .bg-bg-hover  { background: var(--bg-hover) !important; }
      .border-border { border-color: var(--border) !important; }
      .hover\\:bg-bg-hover:hover { background: var(--bg-hover) !important; }
      .focus\\:border-accent-green:focus { border-color: var(--acc-main) !important; }
    `
    document.head.appendChild(style)
  }, [])

  function switchTheme(key) {
    setTheme(key)
    localStorage.setItem('ag_theme', key)
  }

  return (
    <ThemeContext.Provider value={{ theme, switchTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be inside <ThemeProvider>')
  return ctx
}