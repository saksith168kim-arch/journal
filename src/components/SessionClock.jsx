// src/components/SessionClock.jsx
import { useState, useEffect } from 'react'

const SESSIONS = [
    { key: 'sydney', name: 'Sydney', flag: '🇦🇺', open: 21, close: 6, color: '#a78bfa', pairs: 'AUD · NZD' },
    { key: 'tokyo', name: 'Tokyo', flag: '🇯🇵', open: 0, close: 9, color: '#fbbf24', pairs: 'JPY · AUD' },
    { key: 'london', name: 'London', flag: '🇬🇧', open: 7, close: 16, color: '#60a5fa', pairs: 'EUR · GBP · XAU' },
    { key: 'newyork', name: 'New York', flag: '🇺🇸', open: 12, close: 21, color: '#34d399', pairs: 'USD · CAD · XAU' },
]

function isOpen(s, h, m) {
    const now = h + m / 60
    return s.open < s.close ? now >= s.open && now < s.close : now >= s.open || now < s.close
}

function countdown(s, h, m) {
    const now = h * 60 + m
    const open = s.open * 60
    const close = s.close * 60
    if (isOpen(s, h, m)) {
        let d = close - now; if (d < 0) d += 1440
        return { label: 'Closes', mins: d }
    } else {
        let d = open - now; if (d < 0) d += 1440
        return { label: 'Opens', mins: d }
    }
}

function fmtMins(n) {
    const h = Math.floor(n / 60), m = n % 60
    return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export default function SessionClock() {
    const [now, setNow] = useState(new Date())

    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 30000)
        return () => clearInterval(t)
    }, [])

    const h = now.getUTCHours()
    const m = now.getUTCMinutes()
    const s = now.getUTCSeconds()
    const utc = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`

    const openSessions = SESSIONS.filter(s => isOpen(s, h, m))
    const overlap = openSessions.length >= 2

    return (
        <div style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            padding: '12px 16px',
            marginBottom: 16,
        }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-sec)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Market Sessions
                    </span>
                    {overlap && (
                        <span style={{
                            fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 4,
                            background: 'var(--col-win-bg)', color: 'var(--col-win)',
                            textTransform: 'uppercase', letterSpacing: '0.06em',
                        }}>⚡ Overlap</span>
                    )}
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-mut)' }}>
                    {utc} <span style={{ fontSize: 10, opacity: 0.6 }}>UTC</span>
                </span>
            </div>

            {/* Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {SESSIONS.map(session => {
                    const open = isOpen(session, h, m)
                    const { label, mins } = countdown(session, h, m)

                    return (
                        <div key={session.key} style={{
                            background: open ? `${session.color}12` : 'var(--bg-card)',
                            border: `1px solid ${open ? session.color + '50' : 'var(--border)'}`,
                            borderRadius: 10, padding: '10px 12px',
                            transition: 'all 0.3s',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                                <span style={{ fontSize: 15 }}>{session.flag}</span>
                                <span style={{
                                    fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 4,
                                    background: open ? `${session.color}20` : 'var(--bg-hover)',
                                    color: open ? session.color : 'var(--text-dim)',
                                    textTransform: 'uppercase', letterSpacing: '0.05em',
                                }}>{open ? 'OPEN' : 'CLOSED'}</span>
                            </div>

                            <div style={{ fontSize: 12, fontWeight: 700, color: open ? 'var(--text-pri)' : 'var(--text-sec)', marginBottom: 2 }}>
                                {session.name}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 6 }}>
                                {session.pairs}
                            </div>
                            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 600, color: open ? session.color : 'var(--text-dim)' }}>
                                {label} in {fmtMins(mins)}
                            </div>
                        </div>
                    )
                })}
            </div>

            <style>{`
        @media (max-width: 500px) {
          .session-grid { grid-template-columns: repeat(2,1fr) !important; }
        }
      `}</style>
        </div>
    )
}