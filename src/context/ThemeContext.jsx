// src/context/ThemeContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'

export const THEMES = {

  light: {
    name: 'Light',
    emoji: '☀️',
    dots: ['#f8fafc', '#2563eb', '#e2e8f0'],
    vars: {
      '--bg-base':     '#f8fafc',
      '--bg-panel':    '#ffffff',
      '--bg-card':     '#f8fafc',
      '--bg-hover':    '#f1f5f9',
      '--bg-row-alt':  '#f8fafc',
      '--bg-input':    '#ffffff',

      '--border':      '#e2e8f0',
      '--border-l':    '#cbd5e1',
      '--border-focus':'#2563eb',

      '--acc-main':    '#2563eb',
      '--acc-glow':    'rgba(37,99,235,0.12)',
      '--acc-header':  '#ffffff',
      '--acc-subtle':  '#eff6ff',

      '--col-win':     '#16a34a',
      '--col-win-bg':  '#f0fdf4',
      '--col-loss':    '#dc2626',
      '--col-loss-bg': '#fef2f2',
      '--col-warn':    '#d97706',
      '--col-warn-bg': '#fffbeb',
      '--col-long':    '#16a34a',
      '--col-short':   '#dc2626',

      '--text-pri':    '#0f172a',
      '--text-sec':    '#475569',
      '--text-mut':    '#64748b',
      '--text-dim':    '#94a3b8',
      '--text-inv':    '#ffffff',

      '--font-ui':     "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      '--font-mono':   "'Fira Code', 'JetBrains Mono', monospace",
      '--font-display':"'Inter', -apple-system, sans-serif",

      '--shadow-card': '0 1px 3px rgba(0,0,0,0.08), 0 0 0 1px rgba(226,232,240,1)',
      '--shadow-panel':'0 4px 16px rgba(0,0,0,0.08)',
      '--shadow-btn':  '0 0 20px rgba(37,99,235,0.20)',

      '--grad-a':      '#2563eb',
      '--grad-b':      '#3b82f6',
      '--grad-hero':   'linear-gradient(135deg, #f1f5f9 0%, #e8f0fe 50%, #f0f4ff 100%)',
      '--grad-card':   'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
      '--grad-accent': 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',

      '--noise-opacity':'0.015',
      '--cal-base':    '#f1f5f9',
      '--cal-day-bg':  '#ffffff',
      '--cal-border':  '#e2e8f0',
    },
  },

  midnight: {
    name: 'Midnight',
    emoji: '🌃',
    dots: ['#0a0a12', '#818cf8', '#1a1a2e'],
    vars: {
      '--bg-base':     '#0a0a12',
      '--bg-panel':    '#0f0f1c',
      '--bg-card':     '#13131f',
      '--bg-hover':    '#181828',
      '--bg-row-alt':  '#090910',
      '--bg-input':    '#161625',

      '--border':      '#1a1a2e',
      '--border-l':    '#252540',
      '--border-focus':'#4f46e5',

      '--acc-main':    '#818cf8',
      '--acc-glow':    'rgba(129,140,248,0.15)',
      '--acc-header':  '#0a0a12',
      '--acc-subtle':  'rgba(129,140,248,0.08)',

      '--col-win':     '#34d399',
      '--col-win-bg':  'rgba(52,211,153,0.10)',
      '--col-loss':    '#f87171',
      '--col-loss-bg': 'rgba(248,113,113,0.10)',
      '--col-warn':    '#fbbf24',
      '--col-warn-bg': 'rgba(251,191,36,0.10)',
      '--col-long':    '#34d399',
      '--col-short':   '#f87171',

      '--text-pri':    '#e2e8f0',
      '--text-sec':    '#9ca3af',
      '--text-mut':    '#6b7280',
      '--text-dim':    '#374151',
      '--text-inv':    '#0a0a12',

      '--font-ui':     "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      '--font-mono':   "'Fira Code', 'JetBrains Mono', monospace",
      '--font-display':"'Inter', -apple-system, sans-serif",

      '--shadow-card': '0 1px 3px rgba(0,0,0,0.6), 0 0 0 1px rgba(26,26,46,0.8)',
      '--shadow-panel':'0 4px 32px rgba(0,0,0,0.6)',
      '--shadow-btn':  '0 0 24px rgba(129,140,248,0.25)',

      '--grad-a':      '#4f46e5',
      '--grad-b':      '#818cf8',
      '--grad-hero':   'linear-gradient(135deg, #0a0a12 0%, #0e0e20 50%, #080814 100%)',
      '--grad-card':   'linear-gradient(135deg, #13131f 0%, #0f0f1c 100%)',
      '--grad-accent': 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',

      '--noise-opacity':'0.03',
      '--cal-base':    '#0a0a12',
      '--cal-day-bg':  '#0f0f1c',
      '--cal-border':  '#1a1a2e',
    },
  },

}

const ThemeContext = createContext(null)

function applyVars(vars) {
  const root = document.documentElement
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v))
}

function applyTheme(key) {
  const theme = THEMES[key]
  if (theme?.vars) applyVars(theme.vars)
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('ag_theme')
    return saved && THEMES[saved] ? saved : 'midnight'
  })

  useEffect(() => { applyTheme(theme) }, [theme])

  useEffect(() => {
    if (document.getElementById('ag-global-styles')) return
    const style = document.createElement('style')
    style.id = 'ag-global-styles'
    style.textContent = `
      *, *::before, *::after { box-sizing: border-box; }
      html, body {
        font-family: var(--font-ui, 'Inter', sans-serif);
        background: var(--bg-base);
        color: var(--text-pri);
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      input, textarea, select, button {
        font-family: var(--font-ui, 'Inter', sans-serif);
      }

      /* Mono font — clean zeros, no slash */
      .font-mono, [data-mono] {
        font-family: var(--font-mono) !important;
        font-variant-numeric: normal;
        font-feature-settings: "zero" 0, "ss01" 0;
      }

      .text-text-primary   { color: var(--text-pri) !important; }
      .text-text-muted     { color: var(--text-mut) !important; }
      .text-text-dim       { color: var(--text-dim) !important; }
      .text-text-sec       { color: var(--text-sec) !important; }
      .text-accent-green   { color: var(--col-win) !important; }
      .text-accent-red     { color: var(--col-loss) !important; }
      .text-accent-yellow  { color: var(--col-warn) !important; }
      .text-accent-blue    { color: var(--acc-main) !important; }

      .bg-bg-base   { background: var(--bg-base)  !important; }
      .bg-bg-panel  { background: var(--bg-panel) !important; }
      .bg-bg-card   { background: var(--bg-card)  !important; }
      .bg-bg-hover  { background: var(--bg-hover) !important; }
      .border-border { border-color: var(--border) !important; }

      .hover\\:bg-bg-hover:hover        { background: var(--bg-hover) !important; }
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