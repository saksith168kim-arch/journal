/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Inter', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
      },
      colors: {
        // All colours point to CSS variables so ThemeContext can swap them at runtime
        bg: {
          base:  'var(--bg-base)',
          panel: 'var(--bg-panel)',
          card:  'var(--bg-card)',
          hover: 'var(--bg-hover)',
        },
        border: {
          DEFAULT: 'var(--border)',
          light:   'var(--border-l)',
        },
        accent: {
          green:  'var(--acc-main)',
          red:    '#ff4d6d',
          blue:   '#7dd8ff',
          yellow: '#ffd166',
          orange: '#ff8c6d',
          lime:   '#c8f060',
          purple: '#c77dff',
        },
        text: {
          primary: 'var(--text-pri)',
          muted:   'var(--text-mut)',
          dim:     'var(--text-dim)',
          dark:    'var(--text-drk)',
        },
      },
    },
  },
  plugins: [],
}
