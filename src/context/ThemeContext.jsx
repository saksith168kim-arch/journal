// src/context/ThemeContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'

export const THEMES = {
  dark: {
    name: 'Dark',
    emoji: '🌙',
    dots: ['#0e1628', '#00e5a0', '#1a2a40'],
    vars: {
      '--bg-base':    '#060c16',
      '--bg-panel':   '#0e1628',
      '--bg-card':    '#080f1c',
      '--bg-hover':   '#0d1828',
      '--border':     '#1a2a40',
      '--border-l':   '#1e3a55',
      '--acc-main':   '#00e5a0',
      '--acc-header': '#0a1020',
      '--text-pri':   '#c8d8e8',
      '--text-mut':   '#4a6a8a',
      '--text-dim':   '#2a4a6a',
      '--text-drk':   '#1a2a3a',
      '--grad-a':     '#00e5a0',
      '--grad-b':     '#00b8ff',
    },
  },
  light: {
    name: 'Light',
    emoji: '☀️',
    dots: ['#ffffff', '#00a575', '#e2e8f0'],
    vars: {
      '--bg-base':    '#f0f4f8',
      '--bg-panel':   '#ffffff',
      '--bg-card':    '#f8fafc',
      '--bg-hover':   '#e8f0f8',
      '--border':     '#d0dae8',
      '--border-l':   '#9aafc8',
      '--acc-main':   '#008f68',
      '--acc-header': '#1a2a40',
      '--text-pri':   '#0f172a',
      '--text-mut':   '#334155',
      '--text-dim':   '#64748b',
      '--text-drk':   '#94a3b8',
      '--grad-a':     '#008f68',
      '--grad-b':     '#0284c7',
    },
  },
  system: {
    name: 'System',
    emoji: '💻',
    dots: ['#94a3b8', '#00e5a0', '#64748b'],
    vars: null, // applied dynamically based on OS preference
  },
}

// Dark and Light vars for System auto-detection
const SYSTEM_VARS = {
  dark:  THEMES.dark.vars,
  light: THEMES.light.vars,
}

const ThemeContext = createContext(null)

function applyVars(vars) {
  const root = document.documentElement
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v))
}

function applyTheme(key) {
  if (key === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    applyVars(prefersDark ? SYSTEM_VARS.dark : SYSTEM_VARS.light)
  } else {
    const theme = THEMES[key]
    if (theme?.vars) applyVars(theme.vars)
  }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('ag_theme')
    return saved && THEMES[saved] ? saved : 'dark'
  })

  // Apply on change
  useEffect(() => { applyTheme(theme) }, [theme])
  // Apply on first render
  useEffect(() => { applyTheme(theme) }, [])

  // If System theme: listen for OS changes
  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme('system')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  function switchTheme(key) {
    setTheme(key)
    localStorage.setItem('ag_theme', key)
  }

  return (
    <ThemeContext.Provider value={{ theme, switchTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be inside <ThemeProvider>')
  return ctx
}
