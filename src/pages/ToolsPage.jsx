// src/pages/ToolsPage.jsx
import { useState, useEffect, useRef, useMemo } from 'react'
import Layout from '../components/layout/Layout'
import { useTrades } from '../hooks/useTrades'
import { useAuth } from '../context/AuthContext'
import { calcTrade } from '../lib/calc'

// ─── SHARED STYLES ────────────────────────────────────────────────────────────
const card = (extra = {}) => ({
    background: 'var(--bg-panel)', border: '1px solid var(--border)',
    borderRadius: 14, padding: 20, ...extra,
})
const label = { fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 6 }
const mono = { fontFamily: 'var(--font-mono)' }

// ─── INPUT ────────────────────────────────────────────────────────────────────
function Input({ label: lbl, value, onChange, placeholder, prefix, suffix, type = 'text', readOnly }) {
    return (
        <div>
            <div style={label}>{lbl}</div>
            <div style={{ display: 'flex', alignItems: 'center', background: readOnly ? 'var(--bg-base)' : 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                {prefix && <span style={{ padding: '0 10px', fontSize: 11, color: 'var(--text-dim)', borderRight: '1px solid var(--border)', alignSelf: 'stretch', display: 'flex', alignItems: 'center', background: 'var(--bg-base)', whiteSpace: 'nowrap' }}>{prefix}</span>}
                <input readOnly={readOnly} type={type} value={value} onChange={e => onChange?.(e.target.value)} placeholder={placeholder}
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', padding: '9px 12px', fontSize: 13, color: readOnly ? 'var(--text-sec)' : 'var(--text-pri)', ...mono }} />
                {suffix && <span style={{ padding: '0 10px', fontSize: 11, color: 'var(--text-dim)', borderLeft: '1px solid var(--border)', alignSelf: 'stretch', display: 'flex', alignItems: 'center', background: 'var(--bg-base)' }}>{suffix}</span>}
            </div>
        </div>
    )
}

function StatBox({ label: lbl, value, color, sub }) {
    return (
        <div style={{ background: 'var(--bg-card)', borderRadius: 10, padding: '12px 14px', flex: 1 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{lbl}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: color || 'var(--text-pri)', ...mono }}>{value}</div>
            {sub && <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 3 }}>{sub}</div>}
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. SESSION CLOCK
// ═══════════════════════════════════════════════════════════════════════════════
const SESSIONS = [
    { key: 'sydney', name: 'Sydney', flag: '🇦🇺', open: 21, close: 6, color: '#a78bfa', pairs: 'AUD · NZD', pip: 'Low volatility, range markets' },
    { key: 'tokyo', name: 'Tokyo', flag: '🇯🇵', open: 0, close: 9, color: '#fbbf24', pairs: 'JPY · AUD', pip: 'JPY pairs most active, tight spreads' },
    { key: 'london', name: 'London', flag: '🇬🇧', open: 7, close: 16, color: '#60a5fa', pairs: 'EUR · GBP · XAU', pip: 'Highest liquidity, best for XAU/USD' },
    { key: 'newyork', name: 'New York', flag: '🇺🇸', open: 12, close: 21, color: '#34d399', pairs: 'USD · CAD · XAU', pip: 'Volatile, major news impact' },
]
function sessOpen(s, h, m) {
    const n = h + m / 60
    return s.open < s.close ? n >= s.open && n < s.close : n >= s.open || n < s.close
}
function sessCountdown(s, h, m) {
    const now = h * 60 + m
    const target = sessOpen(s, h, m) ? s.close * 60 : s.open * 60
    let diff = target - now; if (diff <= 0) diff += 1440
    return { label: sessOpen(s, h, m) ? 'Closes in' : 'Opens in', h: Math.floor(diff / 60), m: diff % 60 }
}
function sessPct(s, h, m) {
    if (!sessOpen(s, h, m)) return 0
    const total = s.open < s.close ? (s.close - s.open) * 60 : (24 - s.open + s.close) * 60
    const target = (s.open < s.close ? s.close : s.close + 24) * 60
    let remaining = target - (h * 60 + m); if (remaining < 0) remaining += 1440
    return Math.max(0, Math.min(100, ((total - remaining) / total) * 100))
}

function SessionClock() {
    const [now, setNow] = useState(new Date())
    useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t) }, [])
    const h = now.getUTCHours(), m = now.getUTCMinutes(), s = now.getUTCSeconds()
    const utcStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    const openSessions = SESSIONS.filter(x => sessOpen(x, h, m))
    const isOverlap = openSessions.length >= 2

    // Next session opening
    const nextOpen = SESSIONS
        .filter(x => !sessOpen(x, h, m))
        .map(x => { const cd = sessCountdown(x, h, m); return { ...x, minsAway: cd.h * 60 + cd.m } })
        .sort((a, b) => a.minsAway - b.minsAway)[0]

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-pri)', margin: 0, letterSpacing: '-0.02em' }}>Market Sessions</h2>
                    <p style={{ fontSize: 12, color: 'var(--text-mut)', margin: '4px 0 0' }}>Live session tracker · All times in UTC</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-pri)', ...mono, letterSpacing: '0.04em', lineHeight: 1 }}>{utcStr}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                        {openSessions.length === 0 ? 'All sessions closed' : `${openSessions.length} session${openSessions.length > 1 ? 's' : ''} open`}
                    </div>
                </div>
            </div>

            {/* Session cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
                {SESSIONS.map(sess => {
                    const open = sessOpen(sess, h, m)
                    const cd = sessCountdown(sess, h, m)
                    const pct = sessPct(sess, h, m)
                    return (
                        <div key={sess.key} style={{
                            background: open ? `${sess.color}0d` : 'var(--bg-card)',
                            border: `1.5px solid ${open ? sess.color + '50' : 'var(--border)'}`,
                            borderRadius: 14, padding: 18, position: 'relative', overflow: 'hidden', transition: 'all 0.3s',
                        }}>
                            {/* Progress bar */}
                            {open && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'var(--bg-hover)' }}>
                                <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${sess.color}80, ${sess.color})`, transition: 'width 1s linear' }} />
                            </div>}

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: 22 }}>{sess.flag}</span>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: open ? 'var(--text-pri)' : 'var(--text-sec)' }}>{sess.name}</div>
                                        <div style={{ fontSize: 10, color: 'var(--text-dim)', ...mono }}>
                                            {String(sess.open).padStart(2, '0')}:00 – {String(sess.close).padStart(2, '0')}:00
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 20, background: open ? `${sess.color}18` : 'var(--bg-hover)', color: open ? sess.color : 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', border: `1px solid ${open ? sess.color + '40' : 'transparent'}` }}>
                                    {open && <div style={{ width: 5, height: 5, borderRadius: '50%', background: sess.color, animation: 'pulse 1.5s infinite' }} />}
                                    {open ? 'OPEN' : 'CLOSED'}
                                </div>
                            </div>

                            <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 10, lineHeight: 1.4 }}>{sess.pip}</div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: 11, color: open ? sess.color : 'var(--text-dim)', fontWeight: 600 }}>
                                    {cd.label}: <strong style={{ ...mono }}>{cd.h > 0 ? `${cd.h}h ` : ''}{cd.m}m</strong>
                                </span>
                                {open && <span style={{ fontSize: 10, color: 'var(--text-dim)', ...mono }}>{pct.toFixed(0)}%</span>}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Overlap + Next opening */}
            <div style={{ display: 'grid', gridTemplateColumns: isOverlap ? '1fr 1fr' : '1fr', gap: 12 }}>
                {isOverlap && (
                    <div style={{ background: '#fbbf2410', border: '1px solid #fbbf2435', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ fontSize: 24, flexShrink: 0 }}>⚡</div>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24', marginBottom: 3 }}>Overlap Active — Peak Liquidity</div>
                            <div style={{ fontSize: 11, color: 'var(--text-sec)' }}>
                                {openSessions.map(x => x.name).join(' + ')} — tightest spreads, best fills for XAU/USD, EUR/USD
                            </div>
                        </div>
                    </div>
                )}
                {nextOpen && (
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ fontSize: 24 }}>⏱</div>
                        <div>
                            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 2 }}>Next session opening</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-pri)' }}>
                                {nextOpen.flag} {nextOpen.name} in <span style={{ color: nextOpen.color, ...mono }}>{nextOpen.minsAway >= 60 ? `${Math.floor(nextOpen.minsAway / 60)}h ${nextOpen.minsAway % 60}m` : `${nextOpen.minsAway}m`}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
                
                /* AI ANALYZER STYLES */
                .ai-analyzer-container {
                  --ai-bg: #080c14; --ai-bg2: #0d1420; --ai-bg3: #111b2b; --ai-bg4: #162133;
                  --ai-border: #1e2f47; --ai-border2: #28405e; --ai-border3: #3a5570;
                  --ai-text: #dce8f7; --ai-text2: #7a9bb8; --ai-text3: #3d5a76;
                  --ai-green: #00e5a0; --ai-red: #ff4561; --ai-yellow: #f9c130; --ai-blue: #2d9cff; --ai-purple: #8b6fff;
                  --ai-pc: #8b6fff20;
                  font-family: 'Space Grotesk', sans-serif;
                }

                .ai-hdr { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 14px; }
                .ai-hdr-logo { display: flex; align-items: center; gap: 14px; }
                .ai-logo-mark { width: 42px; height: 42px; border-radius: 10px; background: linear-gradient(145deg, var(--ai-blue), var(--ai-purple)); display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 0 24px #2d9cff25; }
                .ai-hdr h1 { font-size: 21px; font-weight: 700; letter-spacing: -0.3px; margin: 0; color: var(--ai-text); }
                .ai-hdr-sub { font-family: var(--font-mono); font-size: 10px; color: var(--ai-text3); letter-spacing: 0.06em; margin-top: 3px; }
                .ai-badge { display: flex; align-items: center; gap: 7px; background: var(--ai-pc); border: 1px solid #8b6fff30; border-radius: 8px; padding: 6px 13px; font-size: 11px; font-weight: 700; color: var(--ai-purple); font-family: var(--font-mono); letter-spacing: 0.04em; }
                .ai-badge-dot { width: 6px; height: 6px; background: var(--ai-purple); border-radius: 50%; animation: ai-pulse 2s infinite; }
                
                @keyframes ai-pulse { 0%,100%{opacity:1;box-shadow:0 0 0 0 #8b6fff50} 60%{opacity:.5;box-shadow:0 0 0 4px transparent} }

                .ai-section { background: var(--ai-bg2); border: 1px solid var(--ai-border); border-radius: 12px; padding: 16px 18px; margin-bottom: 18px; }
                .ai-apikey-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 8px; }
                .ai-label { font-family: var(--font-mono); font-size: 10px; font-weight: 700; color: var(--ai-text3); letter-spacing: 0.06em; text-transform: uppercase; white-space: nowrap; }
                .ai-input { flex: 1; min-width: 200px; background: var(--ai-bg3); border: 1px solid var(--ai-border); border-radius: 8px; padding: 9px 13px; font-family: var(--font-mono); font-size: 12px; color: var(--ai-text); outline: none; transition: 0.2s; }
                .ai-input:focus { border-color: var(--ai-blue); box-shadow: 0 0 0 3px #2d9cff10; }
                .ai-hint { font-size: 11px; color: var(--ai-text3); line-height: 1.5; }
                .ai-hint a { color: var(--ai-blue); text-decoration: none; }

                .ai-mktabs { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px; }
                .ai-mtab { font-family: var(--font-mono); font-size: 11px; font-weight: 700; padding: 6px 16px; border-radius: 6px; border: 1px solid var(--ai-border); background: transparent; color: var(--ai-text3); cursor: pointer; letter-spacing: 0.06em; transition: 0.15s; }
                .ai-mtab.on { background: #2d9cff20; border-color: #2d9cff40; color: var(--ai-blue); }
                
                .ai-upload-zone { border: 1.5px dashed var(--ai-border2); border-radius: 14px; background: var(--ai-bg2); padding: 48px 24px; text-align: center; cursor: pointer; position: relative; transition: 0.2s; margin-bottom: 16px; }
                .ai-upload-zone:hover, .ai-upload-zone.drag { border-color: var(--ai-blue); background: #2d9cff08; }
                .ai-upload-icon { width: 52px; height: 52px; background: var(--ai-bg3); border-radius: 13px; border: 1px solid var(--ai-border2); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
                .ai-upload-title { font-size: 16px; font-weight: 600; margin-bottom: 6px; color: var(--ai-text); }
                .ai-upload-sub { font-family: var(--font-mono); font-size: 11px; color: var(--ai-text3); line-height: 1.6; }

                .ai-preview-wrap { position: relative; border-radius: 14px; overflow: hidden; border: 1px solid var(--ai-border); background: var(--ai-bg2); margin-bottom: 16px; }
                .ai-preview-wrap img { width: 100%; max-height: 340px; object-fit: contain; display: block; }
                .ai-preview-tag { position: absolute; top: 11px; left: 11px; font-family: var(--font-mono); font-size: 10px; font-weight: 700; letter-spacing: 0.06em; background: var(--ai-blue); color: #fff; padding: 3px 10px; border-radius: 4px; }
                .ai-remove-btn { position: absolute; top: 11px; right: 11px; width: 30px; height: 30px; background: #0d142099; border: 1px solid var(--ai-border2); border-radius: 7px; color: var(--ai-text2); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px; transition: 0.15s; backdrop-filter: blur(4px); }
                .ai-remove-btn:hover { background: #ff456120; border-color: var(--ai-red); color: var(--ai-red); }

                .ai-analyze-btn { width: 100%; padding: 16px; border: none; border-radius: 11px; font-family: var(--font-mono); font-size: 13px; font-weight: 700; cursor: pointer; letter-spacing: 0.06em; transition: all 0.25s; margin-bottom: 20px; background: linear-gradient(135deg, #2d9cff, #8b6fff); position: relative; overflow: hidden; color: #fff; }
                .ai-analyze-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 30px #2d9cff30; }
                .ai-analyze-btn:disabled { background: var(--ai-bg3); color: var(--ai-text3); cursor: not-allowed; }

                .ai-loading-overlay { position: absolute; inset: 0; background: #080c14cc; border-radius: 14px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; z-index: 10; backdrop-filter: blur(4px); }
                .ai-spinner { width: 40px; height: 40px; border: 2px solid var(--ai-border2); border-top-color: var(--ai-blue); border-radius: 50%; animation: ai-spin 1s linear infinite; }
                @keyframes ai-spin { to { transform: rotate(360deg); } }
                .ai-loading-text { font-family: var(--font-mono); font-size: 11px; color: var(--ai-text2); letter-spacing: 0.04em; }
                .ai-loading-steps { font-family: var(--font-mono); font-size: 10px; color: var(--ai-text3); display: flex; flex-direction: column; gap: 5px; align-items: center; }
                .ai-loading-step { opacity: 0.4; transition: opacity 0.3s; }
                .ai-loading-step.active { opacity: 1; color: var(--ai-blue); }
                .ai-loading-step.done { opacity: 0.6; color: var(--ai-green); }

                .ai-result-card { background: var(--ai-bg2); border: 1px solid var(--ai-border); border-radius: 14px; margin-bottom: 20px; overflow: hidden; animation: ai-fadeUp 0.4s ease; }
                @keyframes ai-fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
                .ai-result-header { padding: 16px 20px; border-bottom: 1px solid var(--ai-border); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
                .ai-signal-badge { font-family: var(--font-mono); font-size: 12px; font-weight: 700; padding: 6px 16px; border-radius: 6px; letter-spacing: 0.06em; }
                .ai-signal-buy { background: #00e5a020; border: 1px solid #00e5a040; color: var(--ai-green); }
                .ai-signal-sell { background: #ff456120; border: 1px solid #ff456140; color: var(--ai-red); }
                .ai-signal-neutral { background: #f9c13020; border: 1px solid #f9c13040; color: var(--ai-yellow); }
                
                .ai-metric-card { background: var(--ai-bg3); border: 1px solid var(--ai-border); border-radius: 10px; padding: 14px 16px; }
                .ai-metric-label { font-family: var(--font-mono); font-size: 10px; color: var(--ai-text3); letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 8px; }
                .ai-metric-value { font-size: 17px; font-weight: 700; letter-spacing: -0.3px; }
                
                .ai-modal-overlay { position: fixed; inset: 0; background: #00000095; backdrop-filter: blur(6px); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 16px; transition: opacity 0.25s; }
                .ai-modal { background: #0a111e; border: 1px solid var(--ai-border2); border-radius: 18px; width: 100%; max-width: 660px; max-height: 90vh; overflow-y: auto; position: relative; box-shadow: 0 32px 80px #00000090; }
                
                .ai-plan-card { background: var(--ai-bg3); border: 1px solid var(--ai-border); border-radius: 13px; padding: 20px 17px; text-align: center; position: relative; transition: all 0.2s; cursor: pointer; }
                .ai-plan-card.featured { border-color: #2d9cff40; background: #0c1928; }
                
                .ai-usage-bar { display: flex; align-items: center; gap: 12px; padding: 10px 16px; background: var(--ai-bg2); border: 1px solid var(--ai-border); border-radius: 9px; margin-bottom: 16px; flex-wrap: wrap; }
                .ai-udot { width: 8px; height: 8px; border-radius: 50%; border: 1px solid var(--ai-border2); }
                .ai-udot.used { background: var(--ai-blue); border-color: var(--ai-blue); box-shadow: 0 0 6px #2d9cff50; }
            `}</style>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. RISK CALCULATOR (professional grade)
// ═══════════════════════════════════════════════════════════════════════════════
const INSTRUMENTS = [
    { label: 'XAU/USD', group: 'Metals', pip: 0.01, pipVal: 1.0, contract: 100, decimals: 2, margin: 0.01 },
    { label: 'EUR/USD', group: 'Forex', pip: 0.0001, pipVal: 10, contract: 100000, decimals: 5, margin: 0.01 },
    { label: 'GBP/USD', group: 'Forex', pip: 0.0001, pipVal: 10, contract: 100000, decimals: 5, margin: 0.01 },
    { label: 'USD/JPY', group: 'Forex', pip: 0.01, pipVal: 9.1, contract: 100000, decimals: 3, margin: 0.01 },
    { label: 'AUD/USD', group: 'Forex', pip: 0.0001, pipVal: 10, contract: 100000, decimals: 5, margin: 0.01 },
    { label: 'USD/CAD', group: 'Forex', pip: 0.0001, pipVal: 7.5, contract: 100000, decimals: 5, margin: 0.01 },
    { label: 'EUR/GBP', group: 'Forex', pip: 0.0001, pipVal: 12.5, contract: 100000, decimals: 5, margin: 0.01 },
    { label: 'NZD/USD', group: 'Forex', pip: 0.0001, pipVal: 10, contract: 100000, decimals: 5, margin: 0.01 },
    { label: 'USD/CHF', group: 'Forex', pip: 0.0001, pipVal: 10.5, contract: 100000, decimals: 5, margin: 0.01 },
    { label: 'BTC/USD', group: 'Crypto', pip: 1, pipVal: 1, contract: 1, decimals: 1, margin: 0.1 },
    { label: 'ETH/USD', group: 'Crypto', pip: 0.1, pipVal: 0.1, contract: 1, decimals: 2, margin: 0.1 },
    { label: 'NAS100', group: 'Indices', pip: 1, pipVal: 1, contract: 1, decimals: 1, margin: 0.005 },
    { label: 'US30', group: 'Indices', pip: 1, pipVal: 1, contract: 1, decimals: 1, margin: 0.005 },
    { label: 'SPX500', group: 'Indices', pip: 0.1, pipVal: 1, contract: 1, decimals: 2, margin: 0.005 },
    { label: 'WTI/USD', group: 'Commodities', pip: 0.01, pipVal: 10, contract: 1000, decimals: 2, margin: 0.02 },
]

function RiskCalculator() {
    const [balance, setBalance] = useState('10000')
    const [riskPct, setRiskPct] = useState('1')
    const [entry, setEntry] = useState('')
    const [sl, setSl] = useState('')
    const [tp, setTp] = useState('')
    const [instrIdx, setInstrIdx] = useState(0)
    const [leverage, setLeverage] = useState('100')
    const [direction, setDirection] = useState('LONG')

    const inst = INSTRUMENTS[instrIdx]
    const bal = parseFloat(balance) || 0
    const rsk = parseFloat(riskPct) || 0
    const ep = parseFloat(entry) || 0
    const slp = parseFloat(sl) || 0
    const tpp = parseFloat(tp) || 0
    const lev = parseFloat(leverage) || 100

    const riskAmt = bal * (rsk / 100)
    const slDist = ep && slp ? Math.abs(ep - slp) : 0
    const slPips = slDist / inst.pip
    const lotSize = slPips > 0 ? riskAmt / (slPips * inst.pipVal) : 0
    const marginRequired = ep > 0 && lotSize > 0 ? (ep * inst.contract * lotSize * inst.margin) / lev : 0
    const pipValue = inst.pipVal * lotSize

    const tpDist = ep && tpp ? Math.abs(tpp - ep) : 0
    const tpPips = tpDist / inst.pip
    const rrRatio = slPips > 0 && tpPips > 0 ? tpPips / slPips : 0
    const tpProfit = tpPips * inst.pipVal * lotSize

    const rrTargets = [1, 1.5, 2, 3, 5].map(r => ({
        r, tp: ep && slp ? (direction === 'LONG' ? ep + slDist * r : ep - slDist * r) : 0,
        profit: riskAmt * r,
    }))

    const rrColor = rrRatio >= 2 ? '#34d399' : rrRatio >= 1 ? '#fbbf24' : '#f87171'

    const groups = [...new Set(INSTRUMENTS.map(i => i.group))]

    return (
        <div>
            <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-pri)', margin: 0, letterSpacing: '-0.02em' }}>Risk Calculator</h2>
                <p style={{ fontSize: 12, color: 'var(--text-mut)', margin: '4px 0 0' }}>Professional position sizing · Never risk more than you plan</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
                {/* LEFT: Inputs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={card()}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-sec)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Instrument</div>
                        <select value={instrIdx} onChange={e => setInstrIdx(Number(e.target.value))} style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-pri)', fontSize: 13, padding: '9px 12px', outline: 'none', fontFamily: 'var(--font-ui)', cursor: 'pointer', marginBottom: 12 }}>
                            {groups.map(g => (
                                <optgroup key={g} label={g}>
                                    {INSTRUMENTS.filter(i => i.group === g).map((ins, i) => (
                                        <option key={ins.label} value={INSTRUMENTS.indexOf(ins)}>{ins.label}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                        <div style={{ display: 'flex', gap: 4 }}>
                            {['LONG', 'SHORT'].map(d => (
                                <button key={d} onClick={() => setDirection(d)} style={{ flex: 1, padding: '8px', borderRadius: 8, border: `1.5px solid ${direction === d ? (d === 'LONG' ? '#34d399' : '#f87171') : 'var(--border)'}`, background: direction === d ? (d === 'LONG' ? '#34d39918' : '#f8717118') : 'transparent', color: direction === d ? (d === 'LONG' ? '#34d399' : '#f87171') : 'var(--text-sec)', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-ui)', transition: 'all 0.15s' }}>
                                    {d === 'LONG' ? '▲ LONG' : '▼ SHORT'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={card()}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-sec)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Account</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                            <Input label="Balance" value={balance} onChange={setBalance} placeholder="10000" prefix="$" />
                            <div>
                                <div style={label}>Risk %</div>
                                <div style={{ display: 'flex', gap: 3 }}>
                                    {['0.5', '1', '2', '3'].map(v => (
                                        <button key={v} onClick={() => setRiskPct(v)} style={{ flex: 1, padding: '9px 0', borderRadius: 7, border: `1.5px solid ${riskPct === v ? 'var(--acc-main)' : 'var(--border)'}`, background: riskPct === v ? 'var(--acc-subtle)' : 'var(--bg-card)', color: riskPct === v ? 'var(--acc-main)' : 'var(--text-sec)', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-ui)', transition: 'all 0.15s' }}>{v}%</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <Input label="Leverage" value={leverage} onChange={setLeverage} placeholder="100" prefix="1:" />
                    </div>

                    <div style={card()}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-sec)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Trade Levels</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <Input label="Entry Price" value={entry} onChange={setEntry} placeholder={inst.label.includes('JPY') ? '150.000' : inst.label === 'XAU/USD' ? '2350.00' : '1.08500'} />
                            <Input label="Stop Loss" value={sl} onChange={setSl} placeholder="Price at SL" suffix="→ SL" />
                            <Input label="Take Profit (optional)" value={tp} onChange={setTp} placeholder="Price at TP" suffix="→ TP" />
                        </div>
                    </div>
                </div>

                {/* RIGHT: Results */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* Main result */}
                    <div style={{ ...card(), background: lotSize > 0 ? 'var(--acc-subtle)' : 'var(--bg-panel)', border: `1.5px solid ${lotSize > 0 ? 'var(--acc-main)' : 'var(--border)'}` }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Lot Size to Trade</div>
                        <div style={{ fontSize: 44, fontWeight: 900, color: lotSize > 0 ? 'var(--acc-main)' : 'var(--text-dim)', ...mono, letterSpacing: '-0.03em', lineHeight: 1 }}>
                            {lotSize > 0 ? lotSize.toFixed(2) : '—'}
                        </div>
                        {lotSize > 0 && <div style={{ fontSize: 10, color: 'var(--text-mut)', marginTop: 4 }}>
                            Mini: {(lotSize * 10).toFixed(1)} · Micro: {(lotSize * 100).toFixed(0)} · Units: {Math.round(lotSize * inst.contract).toLocaleString()}
                        </div>}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                            <StatBox label="Risk $" value={riskAmt > 0 ? `$${riskAmt.toFixed(2)}` : '—'} color="var(--col-loss)" />
                            <StatBox label="SL Pips" value={slPips > 0 ? slPips.toFixed(1) : '—'} />
                            <StatBox label="Pip Value" value={pipValue > 0 ? `$${pipValue.toFixed(2)}` : '—'} />
                            <StatBox label="Margin Req." value={marginRequired > 0 ? `$${marginRequired.toFixed(2)}` : '—'} sub={`@ 1:${leverage} lev`} />
                        </div>
                    </div>

                    {/* TP / RR */}
                    {tp && tpPips > 0 && (
                        <div style={card()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-sec)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Your TP</div>
                                <div style={{ fontSize: 20, fontWeight: 900, color: rrColor, ...mono }}>{rrRatio.toFixed(2)}R</div>
                            </div>
                            <div style={{ height: 6, background: 'var(--bg-card)', borderRadius: 3, overflow: 'hidden', marginBottom: 10 }}>
                                <div style={{ height: '100%', width: `${Math.min(100, rrRatio / 5 * 100)}%`, background: rrColor, borderRadius: 3, transition: 'width 0.4s' }} />
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <StatBox label="TP Pips" value={tpPips.toFixed(1)} color={rrColor} />
                                <StatBox label="Profit" value={`+$${tpProfit.toFixed(2)}`} color="#34d399" />
                            </div>
                        </div>
                    )}

                    {/* RR Target levels */}
                    <div style={card()}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-sec)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>TP Targets by R:R</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {rrTargets.map(({ r, tp: tgt, profit }) => (
                                <div key={r} style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-card)', borderRadius: 9, gap: 12 }}>
                                    <span style={{ fontSize: 11, fontWeight: 800, color: r >= 2 ? '#34d399' : r >= 1.5 ? '#fbbf24' : 'var(--text-dim)', width: 28, ...mono }}>{r}R</span>
                                    <span style={{ flex: 1, fontSize: 12, color: 'var(--text-sec)', ...mono }}>{tgt > 0 ? tgt.toFixed(inst.decimals) : '—'}</span>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: profit > 0 ? '#34d399' : 'var(--text-dim)', ...mono }}>{profit > 0 ? `+$${profit.toFixed(2)}` : '—'}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. PROP FIRM TRACKER
// ═══════════════════════════════════════════════════════════════════════════════
function PropFirmTracker() {
    const DEFAULT_CONFIG = { balance: '100000', startBalance: '100000', dailyLoss: '5', maxDrawdown: '10', profitTarget: '10', daysTraded: '0', minTradingDays: '10', firm: 'FTMO' }
    const [config, setConfig] = useState(() => {
        try { return JSON.parse(localStorage.getItem('prop_config') || 'null') || DEFAULT_CONFIG } catch { return DEFAULT_CONFIG }
    })
    const [todayPnl, setTodayPnl] = useState('')
    const [currentBalance, setCurrentBalance] = useState('')
    const [history, setHistory] = useState(() => { try { return JSON.parse(localStorage.getItem('prop_history') || '[]') } catch { return [] } })

    useEffect(() => { localStorage.setItem('prop_config', JSON.stringify(config)) }, [config])
    useEffect(() => { localStorage.setItem('prop_history', JSON.stringify(history)) }, [history])

    const cfg = (k) => parseFloat(config[k]) || 0
    const startBal = cfg('startBalance')
    const currentBal = currentBalance ? parseFloat(currentBalance) : cfg('balance')
    const dailyLossAmt = startBal * (cfg('dailyLoss') / 100)
    const maxDrawdownAmt = startBal * (cfg('maxDrawdown') / 100)
    const profitTargetAmt = startBal * (cfg('profitTarget') / 100)

    const totalPnl = currentBal - startBal
    const totalPnlPct = startBal > 0 ? (totalPnl / startBal) * 100 : 0
    const drawdownFromPeak = Math.max(0, startBal - currentBal)
    const drawdownPct = startBal > 0 ? (drawdownFromPeak / startBal) * 100 : 0

    const todayPnlNum = parseFloat(todayPnl) || 0
    const dailyUsedPct = dailyLossAmt > 0 && todayPnlNum < 0 ? Math.min(100, Math.abs(todayPnlNum) / dailyLossAmt * 100) : 0
    const maxUsedPct = Math.min(100, drawdownPct / cfg('maxDrawdown') * 100)
    const profitUsedPct = Math.min(100, Math.max(0, totalPnlPct / cfg('profitTarget') * 100))
    const daysProgress = Math.min(100, cfg('daysTraded') / cfg('minTradingDays') * 100)

    const addDay = () => {
        if (!todayPnl) return
        setHistory(h => [...h, { date: new Date().toISOString().split('T')[0], pnl: todayPnlNum }])
        const newBal = (currentBalance ? parseFloat(currentBalance) : cfg('balance')) + todayPnlNum
        setConfig(c => ({ ...c, balance: String(newBal), daysTraded: String(cfg('daysTraded') + 1) }))
        setTodayPnl('')
        setCurrentBalance('')
    }

    const PBar = ({ pct, color, danger = 80 }) => (
        <div style={{ height: 6, background: 'var(--bg-card)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, borderRadius: 3, background: pct >= danger ? '#f87171' : pct >= danger * 0.7 ? '#fbbf24' : color, transition: 'width 0.5s ease' }} />
        </div>
    )

    const isBreaching = dailyUsedPct >= 100 || maxUsedPct >= 100
    const isPassing = profitUsedPct >= 100 && cfg('daysTraded') >= cfg('minTradingDays')

    return (
        <div>
            <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-pri)', margin: 0, letterSpacing: '-0.02em' }}>Prop Firm Tracker</h2>
                <p style={{ fontSize: 12, color: 'var(--text-mut)', margin: '4px 0 0' }}>Monitor your challenge rules, drawdown limits & profit targets in real-time</p>
            </div>

            {/* Status banner */}
            {(isBreaching || isPassing) && (
                <div style={{ background: isBreaching ? '#f8717115' : '#34d39915', border: `1px solid ${isBreaching ? '#f8717140' : '#34d39940'}`, borderRadius: 12, padding: '12px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 22 }}>{isBreaching ? '🚨' : '🏆'}</span>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: isBreaching ? '#f87171' : '#34d399' }}>{isBreaching ? 'RULE BREACH — Stop Trading Now' : 'Challenge Passed! Submit for Payout'}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-sec)', marginTop: 2 }}>{isBreaching ? 'You have hit your daily loss or max drawdown limit.' : 'Profit target reached with sufficient trading days.'}</div>
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
                {/* Config */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={card()}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-sec)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Challenge Setup</div>
                        <div style={{ marginBottom: 10 }}>
                            <div style={label}>Firm / Plan</div>
                            <select value={config.firm} onChange={e => setConfig(c => ({ ...c, firm: e.target.value }))} style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-pri)', fontSize: 12, padding: '9px 12px', outline: 'none', fontFamily: 'var(--font-ui)' }}>
                                {['FTMO', 'MyForexFunds', 'FundedNext', 'The5ers', 'E8 Funding', 'Topstep', 'Custom'].map(f => <option key={f}>{f}</option>)}
                            </select>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                            <Input label="Starting Balance" value={config.startBalance} onChange={v => setConfig(c => ({ ...c, startBalance: v }))} prefix="$" placeholder="100000" />
                            <Input label="Current Balance" value={config.balance} onChange={v => setConfig(c => ({ ...c, balance: v }))} prefix="$" placeholder="100000" />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
                            <Input label="Daily Loss %" value={config.dailyLoss} onChange={v => setConfig(c => ({ ...c, dailyLoss: v }))} suffix="%" placeholder="5" />
                            <Input label="Max DD %" value={config.maxDrawdown} onChange={v => setConfig(c => ({ ...c, maxDrawdown: v }))} suffix="%" placeholder="10" />
                            <Input label="Target %" value={config.profitTarget} onChange={v => setConfig(c => ({ ...c, profitTarget: v }))} suffix="%" placeholder="10" />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <Input label="Min. Trading Days" value={config.minTradingDays} onChange={v => setConfig(c => ({ ...c, minTradingDays: v }))} placeholder="10" />
                            <Input label="Days Traded" value={config.daysTraded} onChange={v => setConfig(c => ({ ...c, daysTraded: v }))} placeholder="0" />
                        </div>
                    </div>

                    {/* Log today */}
                    <div style={card()}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-sec)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Log Today's P&L</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <div style={{ flex: 1 }}>
                                <Input label="Today's P&L" value={todayPnl} onChange={setTodayPnl} placeholder="-250 or +500" prefix="$" />
                            </div>
                            <div style={{ alignSelf: 'flex-end' }}>
                                <button onClick={addDay} disabled={!todayPnl} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: todayPnl ? 'var(--grad-accent)' : 'var(--bg-card)', color: todayPnl ? '#fff' : 'var(--text-dim)', cursor: todayPnl ? 'pointer' : 'default', fontWeight: 700, fontSize: 12, fontFamily: 'var(--font-ui)' }}>Log Day</button>
                            </div>
                        </div>
                        {history.length > 0 && (
                            <div style={{ marginTop: 12 }}>
                                <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 6 }}>Recent days</div>
                                {history.slice(-5).reverse().map((d, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                                        <span style={{ color: 'var(--text-sec)', ...mono }}>{d.date}</span>
                                        <span style={{ fontWeight: 700, color: d.pnl >= 0 ? '#34d399' : '#f87171', ...mono }}>{d.pnl >= 0 ? '+' : ''}${d.pnl.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Meters */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                        { title: 'Daily Loss Limit', icon: '📅', used: Math.abs(Math.min(0, todayPnlNum)), limit: dailyLossAmt, pct: dailyUsedPct, color: '#f87171', sub: `$${Math.abs(Math.min(0, todayPnlNum)).toFixed(2)} of $${dailyLossAmt.toFixed(2)} used` },
                        { title: 'Max Drawdown', icon: '📉', used: drawdownFromPeak, limit: maxDrawdownAmt, pct: maxUsedPct, color: '#fb923c', sub: `$${drawdownFromPeak.toFixed(2)} of $${maxDrawdownAmt.toFixed(2)} (${drawdownPct.toFixed(1)}%)` },
                        { title: 'Profit Target', icon: '🎯', used: Math.max(0, totalPnl), limit: profitTargetAmt, pct: profitUsedPct, color: '#34d399', sub: `$${Math.max(0, totalPnl).toFixed(2)} of $${profitTargetAmt.toFixed(2)} (${totalPnlPct.toFixed(1)}%)` },
                        { title: 'Minimum Trading Days', icon: '📆', used: cfg('daysTraded'), limit: cfg('minTradingDays'), pct: daysProgress, color: '#60a5fa', sub: `${cfg('daysTraded')} of ${cfg('minTradingDays')} days completed`, isCount: true },
                    ].map(({ title, icon, used, limit, pct, color, sub, isCount }) => (
                        <div key={title} style={{ ...card(), background: pct >= 100 && !title.includes('Profit') && !title.includes('Days') ? '#f8717110' : 'var(--bg-panel)', border: `1px solid ${pct >= 100 && !title.includes('Profit') && !title.includes('Days') ? '#f8717140' : 'var(--border)'}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: 18 }}>{icon}</span>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-pri)' }}>{title}</span>
                                </div>
                                <div style={{ fontSize: 22, fontWeight: 900, color: pct >= 100 ? (title.includes('Profit') || title.includes('Days') ? '#34d399' : '#f87171') : pct >= 70 ? '#fbbf24' : color, ...mono }}>
                                    {pct.toFixed(0)}%
                                </div>
                            </div>
                            <PBar pct={pct} color={color} danger={title.includes('Profit') || title.includes('Days') ? 101 : 80} />
                            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 8 }}>{sub}</div>
                        </div>
                    ))}

                    {/* Account summary */}
                    <div style={card()}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-sec)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Account Summary</div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <StatBox label="Balance" value={`$${currentBal.toLocaleString()}`} />
                            <StatBox label="Total P&L" value={`${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(0)}`} color={totalPnl >= 0 ? '#34d399' : '#f87171'} />
                            <StatBox label="Return" value={`${totalPnlPct >= 0 ? '+' : ''}${totalPnlPct.toFixed(2)}%`} color={totalPnlPct >= 0 ? '#34d399' : '#f87171'} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. PRE-TRADE CHECKLIST
// ═══════════════════════════════════════════════════════════════════════════════
const DEFAULT_ITEMS = [
    { id: 1, text: 'Checked HTF (4H/Daily) trend direction', cat: 'Analysis' },
    { id: 2, text: 'Entry confirmed at key S/R, Order Block or FVG', cat: 'Analysis' },
    { id: 3, text: 'Risk:Reward is minimum 1:2', cat: 'Risk' },
    { id: 4, text: 'Stop loss is clearly defined & placed correctly', cat: 'Risk' },
    { id: 5, text: 'Position size calculated (not guessing)', cat: 'Risk' },
    { id: 6, text: 'No major news in the next 15 minutes', cat: 'Market' },
    { id: 7, text: 'Trading during the correct session for this pair', cat: 'Market' },
    { id: 8, text: 'This setup matches my strategy rules exactly', cat: 'Psychology' },
    { id: 9, text: 'I am NOT revenge trading after a loss', cat: 'Psychology' },
    { id: 10, text: 'I am calm, patient, and focused', cat: 'Psychology' },
]
const CAT_COLORS = { Analysis: '#60a5fa', Risk: '#f87171', Market: '#fbbf24', Psychology: '#a78bfa', Custom: '#34d399' }

function PreTradeChecklist() {
    const [items, setItems] = useState(() => {
        try { return JSON.parse(localStorage.getItem('ptc_v2') || 'null') || DEFAULT_ITEMS.map(i => ({ ...i, checked: false })) }
        catch { return DEFAULT_ITEMS.map(i => ({ ...i, checked: false })) }
    })
    const [newText, setNewText] = useState('')
    const [editId, setEditId] = useState(null)
    const [editText, setEditText] = useState('')
    const [filterCat, setFilterCat] = useState('All')

    useEffect(() => { localStorage.setItem('ptc_v2', JSON.stringify(items)) }, [items])

    const total = items.length
    const checked = items.filter(i => i.checked).length
    const pct = total > 0 ? Math.round(checked / total * 100) : 0
    const readyColor = pct === 100 ? '#34d399' : pct >= 75 ? '#fbbf24' : '#f87171'

    const cats = ['All', ...Object.keys(CAT_COLORS)]
    const visible = filterCat === 'All' ? items : items.filter(i => i.cat === filterCat)
    const catCounts = Object.keys(CAT_COLORS).reduce((acc, c) => ({ ...acc, [c]: items.filter(i => i.cat === c && i.checked).length + '/' + items.filter(i => i.cat === c).length }), {})

    const toggle = id => setItems(p => p.map(i => i.id === id ? { ...i, checked: !i.checked } : i))
    const remove = id => setItems(p => p.filter(i => i.id !== id))
    const add = () => { if (!newText.trim()) return; setItems(p => [...p, { id: Date.now(), text: newText.trim(), checked: false, cat: 'Custom' }]); setNewText('') }
    const reset = () => setItems(p => p.map(i => ({ ...i, checked: false })))
    const saveEdit = id => { setItems(p => p.map(i => i.id === id ? { ...i, text: editText } : i)); setEditId(null) }

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-pri)', margin: 0, letterSpacing: '-0.02em' }}>Pre-Trade Checklist</h2>
                    <p style={{ fontSize: 12, color: 'var(--text-mut)', margin: '4px 0 0' }}>Discipline is the edge · Run this before every single entry</p>
                </div>
                <button onClick={reset} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-sec)', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-ui)', fontWeight: 600 }}>Reset All</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                <div>
                    {/* Filter tabs */}
                    <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                        {cats.map(c => (
                            <button key={c} onClick={() => setFilterCat(c)} style={{ padding: '5px 12px', borderRadius: 20, border: `1px solid ${filterCat === c ? CAT_COLORS[c] || 'var(--acc-main)' : 'var(--border)'}`, background: filterCat === c ? `${CAT_COLORS[c] || 'var(--acc-main)'}18` : 'transparent', color: filterCat === c ? CAT_COLORS[c] || 'var(--acc-main)' : 'var(--text-dim)', cursor: 'pointer', fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-ui)', transition: 'all 0.15s', letterSpacing: '0.05em' }}>
                                {c}{c !== 'All' && catCounts[c] ? ` ${catCounts[c]}` : ''}
                            </button>
                        ))}
                    </div>

                    {/* Items */}
                    <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
                        {visible.map((item, i) => (
                            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: i < visible.length - 1 ? '1px solid var(--border)' : 'none', background: item.checked ? '#34d39906' : 'transparent', transition: 'background 0.2s' }}>
                                <button onClick={() => toggle(item.id)} style={{ width: 22, height: 22, borderRadius: 7, flexShrink: 0, cursor: 'pointer', border: `2px solid ${item.checked ? '#34d399' : 'var(--border)'}`, background: item.checked ? '#34d399' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                                    {item.checked && <svg width="11" height="11" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                </button>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 1 }}>
                                        <span style={{ fontSize: 8, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: `${CAT_COLORS[item.cat] || '#34d399'}18`, color: CAT_COLORS[item.cat] || '#34d399', textTransform: 'uppercase', letterSpacing: '0.07em', flexShrink: 0 }}>{item.cat}</span>
                                    </div>
                                    {editId === item.id
                                        ? <input autoFocus value={editText} onChange={e => setEditText(e.target.value)} onBlur={() => saveEdit(item.id)} onKeyDown={e => { if (e.key === 'Enter') saveEdit(item.id); if (e.key === 'Escape') setEditId(null) }} style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--acc-main)', borderRadius: 5, padding: '3px 7px', color: 'var(--text-pri)', fontSize: 12, outline: 'none', fontFamily: 'var(--font-ui)' }} />
                                        : <span onDoubleClick={() => { setEditId(item.id); setEditText(item.text) }} style={{ fontSize: 13, color: item.checked ? 'var(--text-dim)' : 'var(--text-pri)', textDecoration: item.checked ? 'line-through' : 'none', lineHeight: 1.4 }}>{item.text}</span>
                                    }
                                </div>
                                <button onClick={() => remove(item.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 16, padding: '0 2px', opacity: 0.4, flexShrink: 0 }} onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => e.currentTarget.style.opacity = '0.4'}>×</button>
                            </div>
                        ))}
                        <div style={{ display: 'flex', gap: 8, padding: 10, borderTop: '1px solid var(--border)' }}>
                            <input value={newText} onChange={e => setNewText(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder="Add your own rule..." style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text-pri)', fontSize: 12, outline: 'none', fontFamily: 'var(--font-ui)' }} />
                            <button onClick={add} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--grad-accent)', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-ui)' }}>Add</button>
                        </div>
                    </div>
                </div>

                {/* Score + breakdown */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ ...card(), border: `1.5px solid ${readyColor}40`, textAlign: 'center' }}>
                        <div style={{ fontSize: 64, fontWeight: 900, color: readyColor, ...mono, lineHeight: 1, marginBottom: 4 }}>{pct}%</div>
                        <div style={{ fontSize: 13, color: 'var(--text-sec)', marginBottom: 16 }}>{checked} of {total} complete</div>
                        <div style={{ height: 8, background: 'var(--bg-card)', borderRadius: 4, overflow: 'hidden', marginBottom: 14 }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${readyColor}80, ${readyColor})`, borderRadius: 4, transition: 'width 0.4s ease' }} />
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: readyColor }}>
                            {pct === 100 ? '✓ READY TO TRADE' : pct >= 75 ? '⚠ ALMOST READY' : '✗ NOT READY'}
                        </div>
                    </div>

                    {/* By category */}
                    <div style={card()}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-sec)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>By Category</div>
                        {Object.entries(CAT_COLORS).filter(([c]) => items.some(i => i.cat === c)).map(([cat, color]) => {
                            const total = items.filter(i => i.cat === cat).length
                            const done = items.filter(i => i.cat === cat && i.checked).length
                            const p = total > 0 ? done / total * 100 : 0
                            return (
                                <div key={cat} style={{ marginBottom: 10 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <span style={{ fontSize: 11, color: 'var(--text-sec)', fontWeight: 600 }}>{cat}</span>
                                        <span style={{ fontSize: 11, color: p === 100 ? color : 'var(--text-dim)', fontWeight: 700, ...mono }}>{done}/{total}</span>
                                    </div>
                                    <div style={{ height: 4, background: 'var(--bg-card)', borderRadius: 2 }}>
                                        <div style={{ height: '100%', width: `${p}%`, background: color, borderRadius: 2, transition: 'width 0.4s' }} />
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <div style={{ ...card(), background: 'var(--bg-card)' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>💡 Pro tip</div>
                        <div style={{ fontSize: 12, color: 'var(--text-sec)', lineHeight: 1.6 }}>Double-click any item to edit the text. Categories are color-coded. Your checklist auto-saves.</div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. EMOTION TAG
// ═══════════════════════════════════════════════════════════════════════════════
const EMOTIONS = [
    { key: 'disciplined', label: 'Disciplined', emoji: '🎯', color: '#34d399', desc: 'Followed the plan perfectly' },
    { key: 'confident', label: 'Confident', emoji: '💪', color: '#60a5fa', desc: 'Clear mind, strong conviction' },
    { key: 'patient', label: 'Patient', emoji: '🧘', color: '#a78bfa', desc: 'Waited for the right setup' },
    { key: 'calm', label: 'Calm', emoji: '😌', color: '#34d399', desc: 'Neutral and fully focused' },
    { key: 'fomo', label: 'FOMO', emoji: '😰', color: '#fbbf24', desc: 'Feared missing the move' },
    { key: 'hesitant', label: 'Hesitant', emoji: '😟', color: '#fb923c', desc: 'Doubted the setup' },
    { key: 'anxious', label: 'Anxious', emoji: '😬', color: '#fb923c', desc: 'Stressed about outcome' },
    { key: 'greedy', label: 'Greedy', emoji: '🤑', color: '#f87171', desc: 'Moved TP, added size' },
    { key: 'revenge', label: 'Revenge', emoji: '😤', color: '#f87171', desc: 'Trading to recover a loss' },
    { key: 'reckless', label: 'Reckless', emoji: '🎲', color: '#f87171', desc: 'Overrode rules, gambled' },
]
const POSITIVE_EMOTIONS = ['disciplined', 'confident', 'patient', 'calm']

function EmotionTag() {
    const { trades = [] } = useTrades()
    const [tags, setTags] = useState(() => { try { return JSON.parse(localStorage.getItem('emotion_tags_v2') || '{}') } catch { return {} } })
    const [selected, setSelected] = useState(null)
    const [note, setNote] = useState('')
    const [tradeId, setTradeId] = useState('')
    const [view, setView] = useState('tag') // tag | stats

    useEffect(() => { localStorage.setItem('emotion_tags_v2', JSON.stringify(tags)) }, [tags])

    const recentTrades = [...trades].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20)
    const save = () => {
        if (!selected || !tradeId) return
        setTags(p => ({ ...p, [tradeId]: { emotion: selected, note, date: new Date().toISOString() } }))
        setSelected(null); setNote(''); setTradeId('')
    }

    const taggedCount = Object.keys(tags).length
    const stats = EMOTIONS.map(em => {
        const count = Object.values(tags).filter(t => t.emotion === em.key).length
        const tids = Object.entries(tags).filter(([, t]) => t.emotion === em.key).map(([id]) => id)
        const tradePnls = tids.map(id => { const tr = trades.find(t => t.id === id); if (!tr) return 0; try { return calcTrade(tr).netPnl || 0 } catch { return 0 } })
        const totalPnl = tradePnls.reduce((s, n) => s + n, 0)
        const wins = tids.filter(id => { const tr = trades.find(t => t.id === id); return tr?.status === 'WIN' }).length
        const wr = count > 0 ? Math.round(wins / count * 100) : 0
        return { ...em, count, totalPnl, wr }
    }).filter(e => e.count > 0).sort((a, b) => b.count - a.count)

    const positiveTagPct = taggedCount > 0
        ? Math.round(Object.values(tags).filter(t => POSITIVE_EMOTIONS.includes(t.emotion)).length / taggedCount * 100)
        : 0

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-pri)', margin: 0, letterSpacing: '-0.02em' }}>Emotion Tag</h2>
                    <p style={{ fontSize: 12, color: 'var(--text-mut)', margin: '4px 0 0' }}>Your mindset drives your results · Track it trade by trade</p>
                </div>
                <div style={{ display: 'flex', gap: 4, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 3 }}>
                    {['tag', 'stats'].map(v => (
                        <button key={v} onClick={() => setView(v)} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: view === v ? 'var(--grad-accent)' : 'transparent', color: view === v ? '#fff' : 'var(--text-sec)', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-ui)', textTransform: 'capitalize' }}>{v}</button>
                    ))}
                </div>
            </div>

            {view === 'tag' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                    <div style={card()}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-sec)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Select Trade</div>
                        <select value={tradeId} onChange={e => setTradeId(e.target.value)} style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-pri)', fontSize: 12, padding: '9px 12px', outline: 'none', fontFamily: 'var(--font-ui)', marginBottom: 16, cursor: 'pointer' }}>
                            <option value="">— Choose a trade to tag —</option>
                            {recentTrades.map(tr => { let c = {}; try { c = calcTrade(tr) } catch { }; const tagged = tags[tr.id]; return <option key={tr.id} value={tr.id}>{tagged ? '✓ ' : ''}{tr.date} · {tr.symbol} · {tr.direction} · {c.netPnl >= 0 ? '+' : ''}${c.netPnl?.toFixed(2) ?? '0'}</option> })}
                        </select>

                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>How were you feeling?</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 16 }}>
                            {EMOTIONS.map(em => (
                                <button key={em.key} onClick={() => setSelected(em.key)} title={em.desc} style={{ padding: '10px 4px', borderRadius: 10, border: `2px solid ${selected === em.key ? em.color : 'transparent'}`, background: selected === em.key ? `${em.color}18` : 'var(--bg-card)', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}>
                                    <div style={{ fontSize: 22, marginBottom: 3 }}>{em.emoji}</div>
                                    <div style={{ fontSize: 8, fontWeight: 700, color: selected === em.key ? em.color : 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1.2 }}>{em.label}</div>
                                </button>
                            ))}
                        </div>

                        {selected && <div style={{ marginBottom: 8, padding: '8px 12px', background: `${EMOTIONS.find(e => e.key === selected)?.color}12`, borderRadius: 8, border: `1px solid ${EMOTIONS.find(e => e.key === selected)?.color}30` }}>
                            <div style={{ fontSize: 11, color: EMOTIONS.find(e => e.key === selected)?.color }}>💬 {EMOTIONS.find(e => e.key === selected)?.desc}</div>
                        </div>}

                        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="What were you thinking? What caused this emotion?" style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: 'var(--text-pri)', fontSize: 12, outline: 'none', resize: 'vertical', minHeight: 70, fontFamily: 'var(--font-ui)', boxSizing: 'border-box', marginBottom: 12 }} />
                        <button onClick={save} disabled={!selected || !tradeId} style={{ width: '100%', padding: '11px', borderRadius: 9, border: 'none', background: selected && tradeId ? 'var(--grad-accent)' : 'var(--bg-card)', color: selected && tradeId ? '#fff' : 'var(--text-dim)', cursor: selected && tradeId ? 'pointer' : 'default', fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-ui)' }}>Save Tag</button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {taggedCount > 0 && (
                            <div style={{ ...card(), background: positiveTagPct >= 60 ? '#34d39912' : '#fbbf2412', border: `1px solid ${positiveTagPct >= 60 ? '#34d39940' : '#fbbf2440'}` }}>
                                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 6 }}>Mental Health Score</div>
                                <div style={{ fontSize: 36, fontWeight: 900, color: positiveTagPct >= 60 ? '#34d399' : '#fbbf24', ...mono }}>{positiveTagPct}%</div>
                                <div style={{ fontSize: 11, color: 'var(--text-sec)', marginTop: 4 }}>of your trades tagged with positive emotions</div>
                                <div style={{ height: 5, background: 'var(--bg-hover)', borderRadius: 3, marginTop: 10, overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${positiveTagPct}%`, background: positiveTagPct >= 60 ? '#34d399' : '#fbbf24', borderRadius: 3 }} />
                                </div>
                            </div>
                        )}
                        <div style={card()}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-sec)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Recent Tags</div>
                            {Object.keys(tags).length === 0 ? <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>No tags yet — start tagging your trades</div>
                                : Object.entries(tags).slice(-6).reverse().map(([tid, tag]) => {
                                    const em = EMOTIONS.find(e => e.key === tag.emotion)
                                    const tr = trades.find(t => t.id === tid)
                                    return em && tr ? (
                                        <div key={tid} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                                            <span style={{ fontSize: 20 }}>{em.emoji}</span>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-pri)' }}>{tr.symbol} · {tr.date}</div>
                                                <div style={{ fontSize: 10, color: em.color }}>{em.label}{tag.note ? ` — ${tag.note.slice(0, 40)}${tag.note.length > 40 ? '…' : ''}` : ''}</div>
                                            </div>
                                        </div>
                                    ) : null
                                })
                            }
                        </div>
                    </div>
                </div>
            ) : (
                /* Stats view */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                    <div style={card()}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-sec)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Performance by Emotion</div>
                        {stats.length === 0 ? <div style={{ fontSize: 12, color: 'var(--text-dim)', textAlign: 'center', padding: '24px 0' }}>No tagged trades yet</div>
                            : stats.map(em => (
                                <div key={em.key} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                        <span style={{ fontSize: 20 }}>{em.emoji}</span>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-pri)', flex: 1 }}>{em.label}</span>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: em.color, ...mono }}>{em.count}x</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <StatBox label="Win Rate" value={`${em.wr}%`} color={em.wr >= 55 ? '#34d399' : '#f87171'} />
                                        <StatBox label="Net P&L" value={`${em.totalPnl >= 0 ? '+' : ''}$${em.totalPnl.toFixed(0)}`} color={em.totalPnl >= 0 ? '#34d399' : '#f87171'} />
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                    <div style={card()}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-sec)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Emotion Distribution</div>
                        {stats.length === 0 ? <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>No data yet</div>
                            : stats.map(em => {
                                const maxCount = Math.max(...stats.map(s => s.count))
                                return (
                                    <div key={em.key} style={{ marginBottom: 10 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <span style={{ fontSize: 12, color: 'var(--text-sec)' }}>{em.emoji} {em.label}</span>
                                            <span style={{ fontSize: 11, ...mono, color: em.color }}>{Math.round(em.count / taggedCount * 100)}%</span>
                                        </div>
                                        <div style={{ height: 5, background: 'var(--bg-card)', borderRadius: 3 }}>
                                            <div style={{ height: '100%', width: `${(em.count / maxCount) * 100}%`, background: em.color, borderRadius: 3, transition: 'width 0.4s' }} />
                                        </div>
                                    </div>
                                )
                            })
                        }
                    </div>
                </div>
            )}
        </div>
    )
}


// ═══════════════════════════════════════════════════════════════════════════════
// 6. DAILY JOURNAL (enhanced)
// ═══════════════════════════════════════════════════════════════════════════════
const MOODS = [
    { emoji: '😭', label: 'Terrible', color: '#f87171' },
    { emoji: '😕', label: 'Bad', color: '#fb923c' },
    { emoji: '😐', label: 'Neutral', color: '#fbbf24' },
    { emoji: '🙂', label: 'Good', color: '#34d399' },
    { emoji: '😄', label: 'Great', color: '#60a5fa' },
]
const FOCUS_TAGS = ['Disciplined', 'Patient', 'Broke Rules', 'Overtraded', 'News-driven', 'Trend day', 'Range day', 'High volatility', 'Low volume']

function DailyJournal() {
    const today = new Date().toISOString().split('T')[0]
    const [date, setDate] = useState(today)
    const [entries, setEntries] = useState(() => { try { return JSON.parse(localStorage.getItem('daily_journal_v2') || '{}') } catch { return {} } })
    const entry = entries[date] || { mood: null, market: '', plan: '', review: '', lessons: '', tags: [] }

    const update = (field, val) => {
        const updated = { ...entries, [date]: { ...entry, [field]: val } }
        setEntries(updated)
        localStorage.setItem('daily_journal_v2', JSON.stringify(updated))
    }
    const toggleTag = tag => { const cur = entry.tags || []; update('tags', cur.includes(tag) ? cur.filter(t => t !== tag) : [...cur, tag]) }

    const dates = Object.keys(entries).filter(d => { const e = entries[d]; return Object.values(e).some(v => v && v !== null && (typeof v === 'string' ? v.length > 0 : Array.isArray(v) ? v.length > 0 : true)) }).sort().reverse()

    const Textarea = ({ lbl, field, placeholder, rows = 3 }) => (
        <div style={{ marginBottom: 14 }}>
            <div style={label}>{lbl}</div>
            <textarea value={entry[field] || ''} onChange={e => update(field, e.target.value)} placeholder={placeholder} rows={rows}
                style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', color: 'var(--text-pri)', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'var(--font-ui)', boxSizing: 'border-box', lineHeight: 1.65, transition: 'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor = 'var(--acc-main)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
        </div>
    )

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-pri)', margin: 0, letterSpacing: '-0.02em' }}>Daily Journal</h2>
                    <p style={{ fontSize: 12, color: 'var(--text-mut)', margin: '4px 0 0' }}>Review · Reflect · Improve · Compound</p>
                </div>
                <input type="date" value={date} max={today} onChange={e => setDate(e.target.value)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-pri)', fontSize: 12, padding: '7px 12px', outline: 'none', fontFamily: 'var(--font-ui)', cursor: 'pointer' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                <div>
                    <div style={card()}>
                        {/* Mood */}
                        <div style={{ marginBottom: 18 }}>
                            <div style={label}>Mood & Mindset Today</div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {MOODS.map((mood, i) => (
                                    <button key={i} onClick={() => update('mood', i)} title={mood.label} style={{ flex: 1, padding: '8px 4px', borderRadius: 10, border: `2px solid ${entry.mood === i ? mood.color : 'transparent'}`, background: entry.mood === i ? `${mood.color}18` : 'var(--bg-card)', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s', filter: entry.mood !== null && entry.mood !== i ? 'grayscale(0.7) opacity(0.5)' : 'none' }}>
                                        <div style={{ fontSize: 22 }}>{mood.emoji}</div>
                                        <div style={{ fontSize: 8, color: entry.mood === i ? mood.color : 'var(--text-dim)', marginTop: 2, fontWeight: 700 }}>{mood.label}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tags */}
                        <div style={{ marginBottom: 16 }}>
                            <div style={label}>Session Tags</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {FOCUS_TAGS.map(tag => {
                                    const active = (entry.tags || []).includes(tag)
                                    return <button key={tag} onClick={() => toggleTag(tag)} style={{ padding: '4px 10px', borderRadius: 20, border: `1px solid ${active ? 'var(--acc-main)' : 'var(--border)'}`, background: active ? 'var(--acc-subtle)' : 'transparent', color: active ? 'var(--acc-main)' : 'var(--text-dim)', cursor: 'pointer', fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-ui)', transition: 'all 0.15s' }}>{tag}</button>
                                })}
                            </div>
                        </div>

                        <Textarea lbl="Market Conditions" field="market" placeholder="What type of day was it? Trending, ranging, volatile, choppy? News?" rows={2} />
                        <Textarea lbl="Trading Plan" field="plan" placeholder="What was your game plan? Which setups? Which pairs/sessions?" rows={3} />
                        <Textarea lbl="Trade Review" field="review" placeholder="Walk through your trades. What worked? What didn't? Any mistakes?" rows={3} />
                        <Textarea lbl="Lessons Learned" field="lessons" placeholder="What is the single most important lesson from today? What will you do differently?" rows={2} />
                    </div>
                </div>

                {/* Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {entry.mood !== null && (
                        <div style={{ ...card(), background: `${MOODS[entry.mood].color}12`, border: `1px solid ${MOODS[entry.mood].color}35`, textAlign: 'center' }}>
                            <div style={{ fontSize: 42, marginBottom: 6 }}>{MOODS[entry.mood].emoji}</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: MOODS[entry.mood].color }}>{MOODS[entry.mood].label} Day</div>
                            <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>{date}</div>
                        </div>
                    )}
                    <div style={card()}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-sec)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Past Entries ({dates.length})</div>
                        <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                            {dates.length === 0 ? <div style={{ fontSize: 12, color: 'var(--text-dim)', textAlign: 'center', padding: '20px 0' }}>No entries yet — start writing</div>
                                : dates.map(d => {
                                    const e = entries[d]
                                    return (
                                        <button key={d} onClick={() => setDate(d)} style={{ width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 10, border: `1px solid ${d === date ? 'var(--acc-main)' : 'transparent'}`, background: d === date ? 'var(--acc-subtle)' : 'transparent', cursor: 'pointer', marginBottom: 4, transition: 'all 0.15s' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                                <span style={{ fontSize: 11, fontWeight: 600, color: d === date ? 'var(--acc-main)' : 'var(--text-sec)', ...mono }}>{d}</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                                    {(e.tags || []).length > 0 && <span style={{ fontSize: 9, color: 'var(--text-dim)', background: 'var(--bg-hover)', padding: '2px 5px', borderRadius: 4 }}>{e.tags.length} tags</span>}
                                                    {e.mood !== null && <span style={{ fontSize: 14 }}>{MOODS[e.mood].emoji}</span>}
                                                </div>
                                            </div>
                                            {e.lessons && <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.lessons}</div>}
                                        </button>
                                    )
                                })
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 7. HEATMAP (enhanced)
// ═══════════════════════════════════════════════════════════════════════════════
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

function Heatmap() {
    const { trades = [] } = useTrades()
    const [metric, setMetric] = useState('pnl') // pnl | wr | count
    const [tooltip, setTooltip] = useState(null)

    const data = useMemo(() => {
        const map = {}
        trades.forEach(tr => {
            let c = {}; try { c = calcTrade(tr) } catch { return }
            if (!tr.date || c.netPnl === undefined) return
            const d = new Date(tr.date)
            const dayIdx = d.getDay()
            if (dayIdx === 0 || dayIdx === 6) return
            const day = DAYS[dayIdx - 1]
            const hour = d.getHours()
            const key = `${day}-${hour}`
            if (!map[key]) map[key] = { pnl: 0, count: 0, wins: 0 }
            map[key].pnl += c.netPnl
            map[key].count++
            if (tr.status === 'WIN') map[key].wins++
        })
        return map
    }, [trades])

    const allVals = Object.values(data)
    const maxPnl = Math.max(...allVals.map(d => Math.abs(d.pnl)), 1)
    const maxCount = Math.max(...allVals.map(d => d.count), 1)

    const cellColor = (cell) => {
        if (!cell) return 'var(--bg-hover)'
        if (metric === 'pnl') {
            const norm = cell.pnl / maxPnl
            return cell.pnl > 0
                ? `rgba(52,211,153,${Math.min(0.85, Math.abs(norm) * 0.7 + 0.15)})`
                : `rgba(248,113,113,${Math.min(0.85, Math.abs(norm) * 0.7 + 0.15)})`
        }
        if (metric === 'wr') {
            const wr = cell.count > 0 ? cell.wins / cell.count : 0
            return wr >= 0.6 ? `rgba(52,211,153,${wr * 0.8})` : wr >= 0.4 ? `rgba(251,191,36,${0.6})` : `rgba(248,113,113,${(1 - wr) * 0.7})`
        }
        if (metric === 'count') {
            const norm = cell.count / maxCount
            return `rgba(96,165,250,${norm * 0.8 + 0.1})`
        }
    }

    const dayStats = DAYS.map(day => {
        const dayTrades = trades.filter(tr => { const d = new Date(tr.date); return DAYS[d.getDay() - 1] === day })
        const pnl = dayTrades.reduce((s, tr) => { try { return s + (calcTrade(tr).netPnl || 0) } catch { return s } }, 0)
        const wins = dayTrades.filter(tr => tr.status === 'WIN').length
        const wr = dayTrades.length > 0 ? Math.round(wins / dayTrades.length * 100) : 0
        return { day, pnl, count: dayTrades.length, wr, avgPnl: dayTrades.length > 0 ? pnl / dayTrades.length : 0 }
    })

    const bestDay = dayStats.filter(d => d.count > 0).sort((a, b) => b.pnl - a.pnl)[0]
    const worstDay = dayStats.filter(d => d.count > 0).sort((a, b) => a.pnl - b.pnl)[0]

    // Best hour
    const hourStats = HOURS.map(hour => {
        const cells = DAYS.map(day => data[`${day}-${hour}`]).filter(Boolean)
        const pnl = cells.reduce((s, c) => s + c.pnl, 0)
        const count = cells.reduce((s, c) => s + c.count, 0)
        return { hour, pnl, count }
    })
    const bestHour = hourStats.filter(h => h.count > 0).sort((a, b) => b.pnl - a.pnl)[0]

    if (trades.length < 3) return (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-pri)', margin: '0 0 20px', letterSpacing: '-0.02em' }}>Performance Heatmap</h2>
            <div style={{ ...card(), textAlign: 'center', padding: 48 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-sec)', marginBottom: 6 }}>Not enough data yet</div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Log at least 3 trades to generate your performance heatmap</div>
            </div>
        </div>
    )

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-pri)', margin: 0, letterSpacing: '-0.02em' }}>Performance Heatmap</h2>
                    <p style={{ fontSize: 12, color: 'var(--text-mut)', margin: '4px 0 0' }}>When do you trade best? Data-driven timing insights</p>
                </div>
                <div style={{ display: 'flex', gap: 4, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 3 }}>
                    {[['pnl', 'P&L'], ['wr', 'Win %'], ['count', 'Volume']].map(([v, l]) => (
                        <button key={v} onClick={() => setMetric(v)} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: metric === v ? 'var(--grad-accent)' : 'transparent', color: metric === v ? '#fff' : 'var(--text-sec)', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-ui)' }}>{l}</button>
                    ))}
                </div>
            </div>

            {/* Insights row */}
            {(bestDay || bestHour) && (
                <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                    {bestDay && <div style={{ flex: 1, minWidth: 140, background: '#34d39912', border: '1px solid #34d39940', borderRadius: 10, padding: '10px 14px' }}>
                        <div style={{ fontSize: 9, fontWeight: 800, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Best Day</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-pri)', ...mono }}>{bestDay.day}</div>
                        <div style={{ fontSize: 11, color: '#34d399', ...mono }}>+${bestDay.pnl.toFixed(0)} · {bestDay.wr}% WR</div>
                    </div>}
                    {worstDay && worstDay !== bestDay && <div style={{ flex: 1, minWidth: 140, background: '#f8717112', border: '1px solid #f8717140', borderRadius: 10, padding: '10px 14px' }}>
                        <div style={{ fontSize: 9, fontWeight: 800, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Avoid Day</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-pri)', ...mono }}>{worstDay.day}</div>
                        <div style={{ fontSize: 11, color: '#f87171', ...mono }}>${worstDay.pnl.toFixed(0)} · {worstDay.wr}% WR</div>
                    </div>}
                    {bestHour && <div style={{ flex: 1, minWidth: 140, background: '#60a5fa12', border: '1px solid #60a5fa40', borderRadius: 10, padding: '10px 14px' }}>
                        <div style={{ fontSize: 9, fontWeight: 800, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Best Hour</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-pri)', ...mono }}>{String(bestHour.hour).padStart(2, '0')}:00 UTC</div>
                        <div style={{ fontSize: 11, color: '#60a5fa', ...mono }}>{bestHour.count} trades · +${bestHour.pnl.toFixed(0)}</div>
                    </div>}
                </div>
            )}

            {/* Day summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8, marginBottom: 16 }}>
                {dayStats.map(({ day, pnl, count, wr, avgPnl }) => (
                    <div key={day} style={{ background: pnl > 0 ? '#34d39912' : pnl < 0 ? '#f8717112' : 'var(--bg-card)', border: `1px solid ${pnl > 0 ? '#34d39940' : pnl < 0 ? '#f8717140' : 'var(--border)'}`, borderRadius: 10, padding: '12px 10px', textAlign: 'center' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-sec)', marginBottom: 6 }}>{day}</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: pnl > 0 ? '#34d399' : pnl < 0 ? '#f87171' : 'var(--text-dim)', ...mono }}>{pnl !== 0 ? `${pnl > 0 ? '+' : ''}$${Math.abs(pnl).toFixed(0)}` : '—'}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 3 }}>{count} trades</div>
                        {count > 0 && <div style={{ fontSize: 10, color: wr >= 60 ? '#34d399' : wr >= 40 ? '#fbbf24' : '#f87171', marginTop: 2, fontWeight: 700 }}>{wr}% WR</div>}
                    </div>
                ))}
            </div>

            {/* Hour heatmap */}
            <div style={{ ...card(), overflowX: 'auto' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-sec)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Hour × Day Grid</div>
                <div style={{ minWidth: 600, position: 'relative' }}>
                    {/* Hour labels */}
                    <div style={{ display: 'grid', gridTemplateColumns: '36px repeat(24, 1fr)', gap: 2, marginBottom: 2 }}>
                        <div />
                        {HOURS.map(h => <div key={h} style={{ fontSize: 8, color: 'var(--text-dim)', textAlign: 'center', ...mono }}>{String(h).padStart(2, '0')}</div>)}
                    </div>
                    {DAYS.map(day => (
                        <div key={day} style={{ display: 'grid', gridTemplateColumns: '36px repeat(24, 1fr)', gap: 2, marginBottom: 2 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-sec)', display: 'flex', alignItems: 'center' }}>{day}</div>
                            {HOURS.map(h => {
                                const cell = data[`${day}-${h}`]
                                const isActive = tooltip?.key === `${day}-${h}`
                                return (
                                    <div key={h}
                                        onMouseEnter={() => setTooltip({ key: `${day}-${h}`, day, h, cell })}
                                        onMouseLeave={() => setTooltip(null)}
                                        style={{ height: 24, borderRadius: 4, background: cellColor(cell), cursor: cell ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', border: isActive ? '1px solid var(--text-pri)' : '1px solid transparent', transition: 'all 0.1s' }}>
                                        {cell && cell.count > 1 && <span style={{ fontSize: 7, fontWeight: 800, color: 'rgba(255,255,255,0.8)', ...mono }}>{cell.count}</span>}
                                    </div>
                                )
                            })}
                        </div>
                    ))}

                    {/* Tooltip */}
                    {tooltip && tooltip.cell && (
                        <div style={{ position: 'fixed', background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', zIndex: 1000, pointerEvents: 'none', minWidth: 140 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-pri)', marginBottom: 6 }}>{tooltip.day} {String(tooltip.h).padStart(2, '0')}:00 UTC</div>
                            <div style={{ fontSize: 11, color: tooltip.cell.pnl >= 0 ? '#34d399' : '#f87171', ...mono }}>{tooltip.cell.pnl >= 0 ? '+' : ''}${tooltip.cell.pnl.toFixed(2)}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-sec)' }}>{tooltip.cell.count} trades · {Math.round(tooltip.cell.wins / tooltip.cell.count * 100)}% WR</div>
                        </div>
                    )}
                </div>

                {/* Legend */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, justifyContent: 'flex-end' }}>
                    {metric === 'pnl' && <>
                        <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>Loss</span>
                        {[0.7, 0.4, 0.2].map((v, i) => <div key={i} style={{ width: 14, height: 14, borderRadius: 3, background: `rgba(248,113,113,${v})` }} />)}
                        <div style={{ width: 14, height: 14, borderRadius: 3, background: 'var(--bg-hover)' }} />
                        {[0.2, 0.4, 0.7].map((v, i) => <div key={i} style={{ width: 14, height: 14, borderRadius: 3, background: `rgba(52,211,153,${v})` }} />)}
                        <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>Profit</span>
                    </>}
                    {metric === 'wr' && <>
                        <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>Low WR</span>
                        <div style={{ width: 14, height: 14, borderRadius: 3, background: 'rgba(248,113,113,0.7)' }} />
                        <div style={{ width: 14, height: 14, borderRadius: 3, background: 'rgba(251,191,36,0.6)' }} />
                        <div style={{ width: 14, height: 14, borderRadius: 3, background: 'rgba(52,211,153,0.7)' }} />
                        <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>High WR</span>
                    </>}
                    {metric === 'count' && <>
                        <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>Few trades</span>
                        <div style={{ width: 14, height: 14, borderRadius: 3, background: 'rgba(96,165,250,0.2)' }} />
                        <div style={{ width: 14, height: 14, borderRadius: 3, background: 'rgba(96,165,250,0.9)' }} />
                        <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>Many</span>
                    </>}
                </div>
            </div>
        </div>
    )
}



// ═══════════════════════════════════════════════════════════════════════════════
// 8. AI CHART ANALYZER  — powered by Claude (direct API)
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// AIChartAnalyzer — Upgraded with 9-Step Mega Prompt + Deep Result Display
// Drop this in place of your existing AIChartAnalyzer component.
// All existing state, Firebase, Telegram wiring is preserved.
// ─────────────────────────────────────────────────────────────────────────────

// Using shared styles 'mono' and 'card' from top of file
const AI_MARKETS = ['FOREX', 'CRYPTO', 'STOCKS', 'INDICES', 'COMMODITIES', 'FUTURES']
const AI_LOADING_STEPS = [
    'Scanning order-flow walls & bookmap layers…',
    'Detecting CHoCH / BOS market structure…',
    'Ranking key S/R levels by significance…',
    'Reading delta, volume & iceberg activity…',
    'Identifying PD arrays & HTF session bias…',
    'Building primary & secondary trade setups…',
    'Calculating risk architecture & TP allocation…',
    'Composing final signal…',
]


// ── Confidence pill colour ────────────────────────────────────────────────────
const confColor = (c) => c >= 70 ? '#34d399' : c >= 50 ? '#fbbf24' : '#f87171'

// ── Significance badge ────────────────────────────────────────────────────────
const SigBadge = ({ label, color }) => (
    <span style={{
        fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 4,
        background: `${color}20`, color, border: `1px solid ${color}40`,
        letterSpacing: '0.06em', textTransform: 'uppercase', ...mono,
    }}>{label}</span>
)

// ── Section header ────────────────────────────────────────────────────────────
const SectionHead = ({ icon, title }) => (
    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>{icon}</span>{title}
    </div>
)

// ── Modal shell (unchanged from original) ────────────────────────────────────
function AIModal({ show, onClose, children, maxWidth = 560 }) {
    if (!show) return null
    return (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 18, width: '100%', maxWidth, maxHeight: '90vh', overflowY: 'auto', animation: 'aiModalIn 0.22s ease' }}>
                {children}
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// BUILD MEGA PROMPT (9 structured steps)
// ─────────────────────────────────────────────────────────────────────────────
function buildMegaPrompt(market) {
    return `You are an elite institutional technical analyst specialising in order-flow, market structure, and precision trade construction. Analyse this ${market} trading chart following ALL 9 steps below. Be exhaustively detailed — this analysis is used by professional traders.

Return ONLY valid JSON (no markdown fences, no preamble):

{
  "signal": "BUY" | "SELL" | "NEUTRAL",
  "confidence": <integer 1–100>,
  "summary": "<2–3 sentence executive summary of the full thesis>",
  "timeframe": "<detected chart timeframe e.g. 15m, 1H, 4H, 1D>",
  "trend": "UPTREND" | "DOWNTREND" | "SIDEWAYS",
  "pattern": "<primary chart pattern name>",

  "step1_bookmap": {
    "walls": [
      {
        "id": 1,
        "type": "Primary" | "Secondary" | "Tertiary" | "Demand Base",
        "priceLevel": "<exact price>",
        "thickness": "Thin" | "Medium" | "Thick" | "Massive",
        "color": "Green" | "Red" | "Yellow" | "Blue" | "White",
        "description": "<what this wall represents, who placed it, likely intent>",
        "status": "Holding" | "Consumed" | "Partially Consumed" | "Untested"
      }
    ],
    "dominantSide": "Bid" | "Ask" | "Balanced",
    "overallOrderFlowBias": "<brief narrative of cumulative wall structure>"
  },

  "step2_marketStructure": {
    "choch": {
      "detected": true | false,
      "level": "<price if detected>",
      "description": "<CHoCH footprint detail — what broke, what confirmed it>"
    },
    "bos": {
      "detected": true | false,
      "level": "<price if detected>",
      "cascadeExplanation": "<BOS cascade — what price levels broke in sequence>"
    },
    "poc": "<Point of Control price>",
    "valueAreaHigh": "<VAH price>",
    "valueAreaLow": "<VAL price>",
    "priceVsValue": "Above Value" | "Below Value" | "In Value",
    "auctionPhase": "Balanced" | "Imbalanced — Trending" | "Transitioning",
    "auctionNarrative": "<2 sentence auction market theory explanation>"
  },

  "step3_keyLevels": [
    {
      "rank": <1–6>,
      "price": "<price>",
      "type": "Support" | "Resistance" | "POC" | "VAH" | "VAL" | "Pivot" | "Order Block" | "FVG",
      "significance": "Critical" | "Major" | "Minor",
      "colorCode": "#hex",
      "roleDescription": "<exactly what this level means for current price action>"
    }
  ],

  "step4_deltaVolume": {
    "icebergDetected": true | false,
    "icebergDescription": "<location, estimated size, likely side if detected>",
    "dominantSide": "Ask" | "Bid" | "Neutral",
    "dominantSideStrength": "Strong" | "Moderate" | "Weak",
    "footprintReading": "<cell-by-cell description of notable footprint candles>",
    "cumulativeDeltaTrend": "Diverging Bullish" | "Diverging Bearish" | "Confirming" | "Neutral",
    "volumeSpike": true | false,
    "volumeSpikeContext": "<what the spike occurred on if present>"
  },

  "step5_sessionAnalysis": {
    "detectedSession": "London" | "New York" | "Asian" | "London-NY Overlap" | "Unknown",
    "pdArrays": ["<PD array 1>", "<PD array 2>", "<PD array 3>"],
    "htfContext": "<higher-timeframe bias and structural context>",
    "sessionBias": "Bullish" | "Bearish" | "Neutral",
    "keySessionLevel": "<most important session level price>",
    "narrative": "<how the session context affects the current setup>"
  },

  "step6_momentum": {
    "rsi": "<value or range if visible>",
    "rsiCondition": "Overbought" | "Oversold" | "Neutral" | "Diverging",
    "macdCondition": "Bullish Cross" | "Bearish Cross" | "Bullish Histogram" | "Bearish Histogram" | "Not Visible",
    "ema": "<EMA stack description if visible>",
    "momentumBias": "Bullish" | "Bearish" | "Mixed"
  },

  "step7_indicators": [
    {
      "name": "<indicator name>",
      "reading": "<specific reading or value>",
      "sentiment": "BULLISH" | "BEARISH" | "NEUTRAL",
      "weight": "High" | "Medium" | "Low"
    }
  ],

  "step8_tradeSetups": [
    {
      "setupType": "Primary",
      "label": "Aggressive",
      "probability": 74,
      "entry": "<price>",
      "stopLoss": "<price>",
      "tp1": "<price>",
      "tp2": "<price>",
      "tp3": "<price>",
      "riskReward": "<e.g. 1:3.2>",
      "conditions": [
        "<simultaneous condition 1>",
        "<simultaneous condition 2>",
        "<simultaneous condition 3>",
        "<simultaneous condition 4>"
      ],
      "executionInstruction": "<exact step-by-step entry instruction>"
    },
    {
      "setupType": "Secondary",
      "label": "Conservative / Optimal R:R",
      "probability": 68,
      "entry": "<price>",
      "stopLoss": "<price>",
      "tp1": "<price>",
      "tp2": "<price>",
      "tp3": "<price>",
      "riskReward": "<e.g. 1:4.5>",
      "conditions": [
        "<simultaneous condition 1>",
        "<simultaneous condition 2>",
        "<simultaneous condition 3>",
        "<simultaneous condition 4>"
      ],
      "executionInstruction": "<exact step-by-step entry instruction>"
    },
    {
      "setupType": "Counter-trend",
      "label": "Counter-trend (only if wall consumed)",
      "probability": 14,
      "entry": "<price>",
      "stopLoss": "<price>",
      "tp1": "<price>",
      "tp2": "<price>",
      "tp3": "<price>",
      "riskReward": "<e.g. 1:2.1>",
      "conditions": [
        "<simultaneous condition 1>",
        "<simultaneous condition 2>",
        "<simultaneous condition 3>",
        "<simultaneous condition 4>"
      ],
      "executionInstruction": "<exact step-by-step entry instruction>"
    }
  ],

  "step9_riskArchitecture": {
    "hardStop": "<price and structural reason>",
    "invalidationConditions": [
      "<condition 1 that invalidates the trade>",
      "<condition 2 that invalidates the trade>",
      "<condition 3 that invalidates the trade>"
    ],
    "reassessmentTrigger": "<what price action or level triggers a full re-analysis>",
    "tp1Allocation": 60,
    "tp2Allocation": 30,
    "tp3RunnerAllocation": 10,
    "rrSummary": "<full risk-reward summary across all 3 TPs with expected value>"
  },

  "entry": "<best entry from primary setup>",
  "stopLoss": "<hard stop from step 9>",
  "tp1": "<TP1 from primary setup>",
  "tp2": "<TP2 from primary setup>",
  "tp3": "<TP3 from primary setup>",
  "riskReward": "<overall R:R>"
}`
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function AIChartAnalyzer({ aiPlan, setAiPlan, aiFreeCount, setAiFreeCount, aiUsageLoaded, aiHistory, setAiHistory }) {
    const auth = useAuth()
    const { user } = auth || {}
    const hasFullAccess = auth?.isPro || auth?.isAdmin || false

    // ── Use props from ToolsPage (persists across tab switches) ──
    const plan = aiPlan ?? 'free'
    const setPlan = setAiPlan ?? (() => { })
    const freeCount = aiFreeCount ?? 0
    const setFreeCount = setAiFreeCount ?? (() => { })
    const usageLoaded = aiUsageLoaded ?? false
    const history = aiHistory ?? []
    const setHistory = setAiHistory ?? (() => { })
    const fileInputRef = useRef(null)  // ← ADD THIS LINE
    const [market, setMarket] = useState('FOREX')
    const [imageData, setImageData] = useState(null)
    const [imageDataUrl, setImageDataUrl] = useState(null)
    const [imageMediaType, setImageMediaType] = useState('image/jpeg')
    const [loading, setLoading] = useState(false)
    const [loadingStep, setLoadingStep] = useState(0)
    const [result, setResult] = useState(null)
    const [error, setError] = useState(null)
    const [dragOver, setDragOver] = useState(false)
    const [showPaywall, setShowPaywall] = useState(false)
    const [showCheckout, setShowCheckout] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const [selectedPlan, setSelectedPlan] = useState(null)
    const [activeSetup, setActiveSetup] = useState(0)
    const [checkoutStep, setCheckoutStep] = useState('qr')
    const [paymentScreenshot, setPaymentScreenshot] = useState(null)
    const [notifySent, setNotifySent] = useState(false)

    // ── Firebase load (unchanged) ──────────────────────────────────────────────
    useEffect(() => {
        let unsubAuth = null
        import('firebase/auth').then(({ getAuth, onAuthStateChanged }) => {
            const authInstance = getAuth()
            unsubAuth = onAuthStateChanged(authInstance, async (user) => {
                if (!user) { setUsageLoaded(true); return }
                setUid(user.uid)
                try {
                    const { getFirestore, doc, getDoc } = await import('firebase/firestore')
                    const db = getFirestore()
                    const ref = doc(db, 'users', user.uid, 'aiUsage', 'data')
                    const snap = await getDoc(ref)
                    if (snap.exists()) {
                        const d = snap.data()
                        setPlan(d.plan || 'free')
                        setFreeCount(d.freeCount || 0)
                        setHistory(d.history || [])
                    }
                } catch (e) {
                    console.error('Load AI usage failed:', e)
                } finally {
                    setUsageLoaded(true)  // ← always mark as loaded
                }
            })
        })
        return () => { if (unsubAuth) unsubAuth() }
    }, [])

    const saveUsage = async (newCount, newPlan, newHistory) => {
        const currentUid = auth?.user?.uid || user?.uid
        if (!currentUid) {
            console.error('saveUsage: no uid found')
            return
        }
        try {
            const { getFirestore, doc, setDoc } = await import('firebase/firestore')
            const db = getFirestore()
            await setDoc(doc(db, 'users', currentUid, 'aiUsage', 'data'), {
                plan: newPlan,
                freeCount: newCount,
                history: newHistory
            }, { merge: true })
        } catch (e) { console.error('Save AI usage failed:', e) }
    }

    // ── Telegram helpers (unchanged) ───────────────────────────────────────────
    const BOT_TOKEN = "7224803885:AAH66bKhDqgJAYZwtPN3C1HW-7grY_GTX2s"
    const ADMIN_CHAT_ID = "473035185"
    const API = `https://api.telegram.org/bot${BOT_TOKEN}`

    const sendTelegramAlert = async () => {
        const planLabel = selectedPlan === 'yearly' ? 'Yearly Pro ($150/yr)' : 'Monthly Pro ($25/mo)'
        const time = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Phnom_Penh' })
        const text = ['🔔 *New Payment Notification*', '', `📦 Plan: ${planLabel}`, `🕐 Time: ${time}`, '', '✅ Please verify ABA payment then activate their account.'].join('\n')
        try {
            await fetch(`${API}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: ADMIN_CHAT_ID, text, parse_mode: 'Markdown' }) })
            if (paymentScreenshot) {
                const res = await fetch(paymentScreenshot); const blob = await res.blob()
                const form = new FormData(); form.append('chat_id', ADMIN_CHAT_ID); form.append('photo', blob, 'payment.jpg'); form.append('caption', `📸 Payment receipt — ${planLabel}`)
                await fetch(`${API}/sendPhoto`, { method: 'POST', body: form })
            }
        } catch (e) { console.error('Telegram alert failed:', e) }
        setNotifySent(true)
    }

    const sendAnalysisToTelegram = async (analysis, market, thumb) => {
        const se = analysis.signal === 'BUY' ? '🟢' : analysis.signal === 'SELL' ? '🔴' : '🟡'
        const time = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Phnom_Penh' })
        const primary = analysis.step8_tradeSetups?.[0]
        const risk = analysis.step9_riskArchitecture
        const text = [
            `${se} *AI Deep Analysis — ${market}*`, '',
            `📈 Signal: *${analysis.signal}* · ⭐ ${analysis.confidence}%`,
            `🕯 Pattern: ${analysis.pattern || '—'} · ⏱ ${analysis.timeframe || '—'}`,
            `〰 Trend: ${analysis.trend || '—'}`, '',
            `🎯 Entry: \`${primary?.entry || analysis.entry || '—'}\``,
            `🛑 Stop: \`${risk?.hardStop?.split(' ')[0] || analysis.stopLoss || '—'}\``,
            `✅ TP1: \`${primary?.tp1 || analysis.tp1 || '—'}\` TP2: \`${primary?.tp2 || analysis.tp2 || '—'}\` TP3: \`${primary?.tp3 || analysis.tp3 || '—'}\``,
            `⚡ R:R: ${primary?.riskReward || analysis.riskReward || '—'}`, '',
            `📝 ${analysis.summary || ''}`, '',
            `🏗 Structure: CHoCH ${analysis.step2_marketStructure?.choch?.detected ? '✓' : '✗'} · BOS ${analysis.step2_marketStructure?.bos?.detected ? '✓' : '✗'}`,
            `💧 Iceberg: ${analysis.step4_deltaVolume?.icebergDetected ? '⚠ Detected' : 'None'} · Delta: ${analysis.step4_deltaVolume?.cumulativeDeltaTrend || '—'}`,
            `🕐 ${time}`,
        ].join('\n')
        try {
            await fetch(`${API}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: ADMIN_CHAT_ID, text, parse_mode: 'Markdown' }) })
            if (thumb) {
                const res = await fetch(thumb); const blob = await res.blob()
                const form = new FormData(); form.append('chat_id', ADMIN_CHAT_ID); form.append('photo', blob, 'chart.jpg'); form.append('caption', `${se} ${market} ${analysis.signal} — ${analysis.pattern || 'Chart'}`)
                await fetch(`${API}/sendPhoto`, { method: 'POST', body: form })
            }
        } catch (e) { console.error('Telegram result alert failed:', e) }
    }

    const loadFile = (file) => {
        if (!file || !file.type.startsWith('image/')) return
        const reader = new FileReader()
        reader.onload = e => {
            setImageDataUrl(e.target.result); setImageData(e.target.result.split(',')[1])
            setImageMediaType(file.type === 'image/jpg' ? 'image/jpeg' : (file.type || 'image/png'))
            setResult(null); setError(null)
        }
        reader.readAsDataURL(file)
    }

    const removeImage = () => {
        setImageData(null); setImageDataUrl(null); setResult(null); setError(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    // ── Analysis ───────────────────────────────────────────────────────────────
    const startAnalysis = async () => {
        if (!imageData) return
        if (!usageLoaded) return
        if (!hasFullAccess && freeCount >= 5) { setShowPaywall(true); return }

        setLoading(true); setResult(null); setError(null); setLoadingStep(0)

        const stepTimer = setInterval(() => {
            setLoadingStep(s => { if (s < AI_LOADING_STEPS.length - 1) return s + 1; clearInterval(stepTimer); return s })
        }, 900)

        const mediaType = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(imageMediaType) ? imageMediaType : 'image/png'

        try {
            const response = await fetch('/api/ai-review', {
                method: 'POST',
                headers: { 'content-type': 'application/json', 'x-market': market },
                body: JSON.stringify({
                    model: 'claude-sonnet-4-20250514',
                    max_tokens: 8000,
                    messages: [{
                        role: 'user',
                        content: [
                            { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageData } },
                            { type: 'text', text: buildMegaPrompt(market) }
                        ]
                    }]
                })
            })

            clearInterval(stepTimer)
            if (!response.ok) { const err = await response.json().catch(() => ({})); throw new Error(err.error?.message || `API error ${response.status}`) }

            const data = await response.json()
            let rawText = data.content.map(b => b.text || '').join('').trim()
            rawText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim()

            let analysis
            try { analysis = JSON.parse(rawText) }
            catch { const m = rawText.match(/\{[\s\S]*\}/); if (m) analysis = JSON.parse(m[0]); else throw new Error('Could not parse AI response') }

            const newCount = !hasFullAccess ? freeCount + 1 : freeCount
            if (!hasFullAccess) setAiFreeCount(newCount)

            const entry = { id: Date.now(), market, signal: analysis.signal, pattern: analysis.pattern, confidence: analysis.confidence, thumb: imageDataUrl, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), date: new Date().toLocaleDateString(), analysis }
            const newHistory = [entry, ...history].slice(0, 20)
            setHistory(newHistory)
            await saveUsage(newCount, plan, newHistory)
            setResult(analysis)
            setActiveSetup(0)
            await sendAnalysisToTelegram(analysis, market, imageDataUrl)
        } catch (err) {
            clearInterval(stepTimer); setError(err.message)
        } finally {
            setLoading(false); setLoadingStep(0)
        }
    }

    const isPaid = plan !== 'free'
    const signalColor = result ? (result.signal === 'BUY' ? '#34d399' : result.signal === 'SELL' ? '#f87171' : '#fbbf24') : null

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div>
            {/* ── Header ── */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-pri)', margin: 0, letterSpacing: '-0.02em' }}>AI Chart Analyzer</h2>
                    <p style={{ fontSize: 12, color: 'var(--text-mut)', margin: '4px 0 0' }}>9-Step Deep Analysis · Order Flow · Market Structure · Precision Setups</p>
                </div>
                {isPaid && <span style={{ fontSize: 10, background: 'var(--acc-subtle)', color: 'var(--acc-main)', border: '1px solid var(--acc-main)40', borderRadius: 20, padding: '4px 12px', fontWeight: 700, ...mono }}>✦ PRO</span>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>

                {/* ── LEFT: controls ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                    {/* Market selector */}
                    <div style={card()}>
                        <SectionHead icon="◎" title="Market Type" />
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                            {AI_MARKETS.map(m => (
                                <button key={m} onClick={() => setMarket(m)} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 700, border: `1.5px solid ${market === m ? 'var(--acc-main)' : 'var(--border)'}`, background: market === m ? 'var(--acc-subtle)' : 'transparent', color: market === m ? 'var(--acc-main)' : 'var(--text-sec)', cursor: 'pointer', fontFamily: 'var(--font-ui)', transition: 'all 0.15s', letterSpacing: '0.05em' }}>{m}</button>
                            ))}
                        </div>
                    </div>

                    {/* Free usage bar */}
                    {!hasFullAccess && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: freeCount >= 5 ? '#f8717112' : 'var(--bg-card)', border: `1px solid ${freeCount >= 5 ? '#f8717140' : 'var(--border)'}`, borderRadius: 10, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: freeCount >= 5 ? '#f87171' : 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.07em', ...mono }}>Free</span>
                            <div style={{ display: 'flex', gap: 5 }}>
                                {[0, 1, 2, 3, 4].map(i => (
                                    <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i < freeCount ? (freeCount >= 5 ? '#f87171' : 'var(--acc-main)') : 'var(--border)', border: `1px solid ${i < freeCount ? (freeCount >= 5 ? '#f87171' : 'var(--acc-main)') : 'var(--border)'}`, boxShadow: i < freeCount ? `0 0 6px ${freeCount >= 5 ? '#f87171' : 'var(--acc-main)'}` : 'none' }} />
                                ))}
                            </div>
                            <span style={{ fontSize: 10, color: freeCount >= 5 ? '#f87171' : 'var(--text-sec)', fontWeight: freeCount >= 5 ? 700 : 400, ...mono }}>{freeCount} / 5 used</span>
                            <button onClick={() => setShowPaywall(true)} style={{ marginLeft: 'auto', background: freeCount >= 5 ? 'var(--grad-accent)' : 'none', border: 'none', color: freeCount >= 5 ? '#fff' : 'var(--acc-main)', cursor: 'pointer', fontSize: 11, fontWeight: freeCount >= 5 ? 800 : 400, textDecoration: freeCount >= 5 ? 'none' : 'underline', fontFamily: 'var(--font-ui)', padding: freeCount >= 5 ? '5px 12px' : '0', borderRadius: freeCount >= 5 ? 7 : 0 }}>{freeCount >= 5 ? '🔒 Upgrade →' : 'Upgrade for unlimited →'}</button>
                        </div>
                    )}

                    {/* Upload / locked */}
                    {!hasFullAccess && freeCount >= 5 ? (
                        <div onClick={() => { setSelectedPlan('monthly'); setShowCheckout(true) }} style={{ border: '2px dashed var(--acc-main)', borderRadius: 14, background: 'var(--acc-subtle)', padding: '36px 24px', textAlign: 'center', cursor: 'pointer' }}>
                            <div style={{ fontSize: 36, marginBottom: 10 }}>🔒</div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-pri)', marginBottom: 6 }}>Free limit reached</div>
                            <div style={{ fontSize: 12, color: 'var(--text-sec)', lineHeight: 1.6, marginBottom: 16 }}>You've used all 5 free analyses.<br />Upgrade for unlimited access.</div>
                            <div style={{ display: 'inline-block', background: 'var(--grad-accent)', color: '#fff', fontSize: 13, fontWeight: 800, padding: '10px 24px', borderRadius: 9 }}>Upgrade Now →</div>
                        </div>
                    ) : !imageDataUrl ? (
                        <div onDrop={e => { e.preventDefault(); setDragOver(false); loadFile(e.dataTransfer.files[0]) }} onDragOver={e => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)} onClick={() => fileInputRef.current?.click()} style={{ border: `2px dashed ${dragOver ? 'var(--acc-main)' : 'var(--border)'}`, borderRadius: 14, background: dragOver ? 'var(--acc-subtle)' : 'var(--bg-card)', padding: '40px 24px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files[0] && loadFile(e.target.files[0])} />
                            <div style={{ fontSize: 40, marginBottom: 10 }}>📈</div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-pri)', marginBottom: 5 }}>Drop your chart here</div>
                            <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.6, ...mono }}>PNG · JPG · WEBP · Any timeframe<br />TradingView · MT4/5 · Binance · Thinkorswim</div>
                        </div>
                    ) : (
                        <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                            <img src={imageDataUrl} alt="Chart" style={{ width: '100%', maxHeight: 260, objectFit: 'contain', display: 'block' }} />
                            <div style={{ position: 'absolute', top: 10, left: 10, background: 'var(--acc-main)', color: '#fff', fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 5, letterSpacing: '0.08em', ...mono }}>{market}</div>
                            <button onClick={removeImage} style={{ position: 'absolute', top: 10, right: 10, width: 28, height: 28, borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-sec)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                            {loading && (
                                <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,12,20,0.85)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                                    <div style={{ width: 36, height: 36, border: '2px solid var(--border)', borderTopColor: 'var(--acc-main)', borderRadius: '50%', animation: 'aiSpin 1s linear infinite' }} />
                                    <div style={{ fontSize: 10, color: 'var(--text-sec)', ...mono, letterSpacing: '0.06em' }}>DEEP ANALYSIS…</div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Loading steps */}
                    {loading && (
                        <div style={card({ padding: 16 })}>
                            {AI_LOADING_STEPS.map((step, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0', fontSize: 11 }}>
                                    <div style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, background: i < loadingStep ? '#34d39920' : i === loadingStep ? 'var(--acc-subtle)' : 'var(--bg-hover)', border: `1.5px solid ${i < loadingStep ? '#34d399' : i === loadingStep ? 'var(--acc-main)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: i < loadingStep ? '#34d399' : 'var(--acc-main)' }}>{i < loadingStep ? '✓' : i === loadingStep ? '●' : ''}</div>
                                    <span style={{ color: i < loadingStep ? '#34d399' : i === loadingStep ? 'var(--text-pri)' : 'var(--text-dim)', fontWeight: i === loadingStep ? 700 : 400 }}>{step}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Analyze button */}
                    {(hasFullAccess || freeCount < 5) && (
                        <button onClick={startAnalysis} disabled={!imageData || loading || !usageLoaded} style={{ width: '100%', padding: '14px', borderRadius: 11, border: 'none', background: imageData && !loading ? 'var(--grad-accent)' : 'var(--bg-card)', color: imageData && !loading ? '#fff' : 'var(--text-dim)', cursor: imageData && !loading ? 'pointer' : 'not-allowed', fontWeight: 800, fontSize: 13, fontFamily: 'var(--font-ui)', letterSpacing: '0.04em', transition: 'all 0.2s', opacity: loading ? 0.7 : 1 }}>
                            {!usageLoaded ? '⏳ Loading...' : loading ? '⏳ Running 9-Step Deep Analysis…' : '🔍 Deep Analyze — 9 Structured Steps'}
                        </button>
                    )}

                    <div style={{ fontSize: 10, color: 'var(--text-dim)', lineHeight: 1.6, padding: '10px 14px', background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)', borderLeft: '3px solid #fbbf24' }}>
                        ⚠️ AI analysis is for educational purposes only. Not financial advice. Always do your own research before trading.
                    </div>
                </div>

                {/* ── RIGHT: results ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                    {error && (
                        <div style={{ background: '#f8717112', border: '1px solid #f8717140', borderRadius: 12, padding: '16px 18px' }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#f87171', marginBottom: 6 }}>⚠ Analysis Failed</div>
                            <div style={{ fontSize: 11, color: 'var(--text-sec)', ...mono, lineHeight: 1.5 }}>{error}</div>
                        </div>
                    )}

                    {!result && !error && !loading && (
                        <div style={{ ...card(), textAlign: 'center', padding: '44px 24px', opacity: 0.55 }}>
                            <div style={{ fontSize: 46, marginBottom: 12 }}>🤖</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-sec)', marginBottom: 6 }}>Ready for deep analysis</div>
                            <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.7 }}>Upload a chart and click Analyze. You'll get 9 structured steps: order flow walls, market structure, key levels, delta/volume, session bias, momentum, 3 trade setups & full risk architecture.</div>
                        </div>
                    )}

                    {result && (() => {
                        const ms = result.step2_marketStructure || {}
                        const bm = result.step1_bookmap || {}
                        const dv = result.step4_deltaVolume || {}
                        const sa = result.step5_sessionAnalysis || {}
                        const mo = result.step6_momentum || {}
                        const kl = result.step3_keyLevels || []
                        const setups = result.step8_tradeSetups || []
                        const risk = result.step9_riskArchitecture || {}
                        const inds = result.step7_indicators || []
                        const activeS = setups[activeSetup] || setups[0] || {}
                        const setupProbColor = (p) => p >= 65 ? '#34d399' : p >= 40 ? '#fbbf24' : '#f87171'

                        return (
                            <>
                                {/* ── SIGNAL HEADER ── */}
                                <div style={{ ...card(), background: `${signalColor}0e`, border: `1.5px solid ${signalColor}40` }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>
                                                {result.signal === 'BUY' ? '📈' : result.signal === 'SELL' ? '📉' : '➡️'} {result.pattern || 'Chart Analysis'} · {result.timeframe}
                                            </div>
                                            <div style={{ fontSize: 13, color: 'var(--text-sec)', lineHeight: 1.5 }}>{result.summary}</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                                            <div style={{ background: `${signalColor}20`, border: `1.5px solid ${signalColor}60`, borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 800, color: signalColor, ...mono }}>{result.signal}</div>
                                            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 700, color: confColor(result.confidence), ...mono }}>★ {result.confidence}%</div>
                                        </div>
                                    </div>
                                    {/* confidence bar */}
                                    <div style={{ height: 4, background: 'var(--bg-hover)', borderRadius: 2, overflow: 'hidden', marginTop: 12 }}>
                                        <div style={{ height: '100%', width: `${result.confidence}%`, background: confColor(result.confidence), borderRadius: 2, transition: 'width 1.2s ease' }} />
                                    </div>
                                </div>

                                {/* ── STEP 1: BOOKMAP / ORDER FLOW ── */}
                                {bm.walls?.length > 0 && (
                                    <div style={card()}>
                                        <SectionHead icon="🧱" title="Step 1 — Bookmap Architecture" />
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            {bm.walls.map((w, i) => {
                                                const wc = w.color === 'Green' ? '#34d399' : w.color === 'Red' ? '#f87171' : w.color === 'Yellow' ? '#fbbf24' : w.color === 'Blue' ? '#60a5fa' : 'var(--text-sec)'
                                                const sc = w.status === 'Holding' ? '#34d399' : w.status === 'Consumed' ? '#f87171' : w.status === 'Partially Consumed' ? '#fbbf24' : 'var(--text-dim)'
                                                const thickMap = { Thin: 2, Medium: 4, Thick: 6, Massive: 9 }
                                                return (
                                                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 12px', background: `${wc}08`, border: `1px solid ${wc}25`, borderLeft: `${thickMap[w.thickness] || 3}px solid ${wc}`, borderRadius: 9 }}>
                                                        <div style={{ flexShrink: 0, textAlign: 'center' }}>
                                                            <div style={{ fontSize: 9, fontWeight: 800, color: wc, ...mono }}>{w.priceLevel}</div>
                                                            <div style={{ fontSize: 8, color: 'var(--text-dim)', marginTop: 2 }}>{w.type}</div>
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ display: 'flex', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                                                                <SigBadge label={w.thickness} color={wc} />
                                                                <SigBadge label={w.status} color={sc} />
                                                                <SigBadge label={w.color} color={wc} />
                                                            </div>
                                                            <div style={{ fontSize: 11, color: 'var(--text-sec)', lineHeight: 1.5 }}>{w.description}</div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                        {bm.overallOrderFlowBias && (
                                            <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--bg-hover)', borderRadius: 8, fontSize: 11, color: 'var(--text-sec)', lineHeight: 1.5 }}>
                                                <span style={{ fontWeight: 700, color: 'var(--text-pri)' }}>Dominant Side: {bm.dominantSide} · </span>{bm.overallOrderFlowBias}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ── STEP 2: MARKET STRUCTURE & AUCTION ── */}
                                <div style={card()}>
                                    <SectionHead icon="🏗" title="Step 2 — Market Structure & Auction" />
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                                        {[
                                            { label: 'CHoCH', val: ms.choch?.detected ? `✓ @ ${ms.choch?.level}` : '✗ Not detected', color: ms.choch?.detected ? '#34d399' : 'var(--text-dim)' },
                                            { label: 'BOS', val: ms.bos?.detected ? `✓ @ ${ms.bos?.level}` : '✗ Not detected', color: ms.bos?.detected ? '#f87171' : 'var(--text-dim)' },
                                            { label: 'POC', val: ms.poc || '—', color: '#fbbf24' },
                                            { label: 'Price vs Value', val: ms.priceVsValue || '—', color: ms.priceVsValue === 'Above Value' ? '#f87171' : ms.priceVsValue === 'Below Value' ? '#34d399' : '#fbbf24' },
                                        ].map(({ label, val, color }) => (
                                            <div key={label} style={{ background: 'var(--bg-hover)', borderRadius: 8, padding: '10px 12px' }}>
                                                <div style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{label}</div>
                                                <div style={{ fontSize: 12, fontWeight: 700, color, ...mono }}>{val}</div>
                                            </div>
                                        ))}
                                    </div>
                                    {/* VAH/VAL bar */}
                                    {ms.valueAreaHigh && ms.valueAreaLow && (
                                        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                                            <div style={{ flex: 1, background: '#f8717112', border: '1px solid #f8717130', borderRadius: 7, padding: '6px 10px', fontSize: 10, color: '#f87171', textAlign: 'center' }}>VAH<br /><strong style={mono}>{ms.valueAreaHigh}</strong></div>
                                            <div style={{ flex: 1, background: '#fbbf2412', border: '1px solid #fbbf2430', borderRadius: 7, padding: '6px 10px', fontSize: 10, color: '#fbbf24', textAlign: 'center' }}>POC<br /><strong style={mono}>{ms.poc || '—'}</strong></div>
                                            <div style={{ flex: 1, background: '#34d39912', border: '1px solid #34d39930', borderRadius: 7, padding: '6px 10px', fontSize: 10, color: '#34d399', textAlign: 'center' }}>VAL<br /><strong style={mono}>{ms.valueAreaLow}</strong></div>
                                        </div>
                                    )}
                                    {ms.choch?.detected && <div style={{ fontSize: 11, color: 'var(--text-sec)', lineHeight: 1.5, marginBottom: 6 }}><span style={{ color: '#34d399', fontWeight: 700 }}>CHoCH: </span>{ms.choch?.description}</div>}
                                    {ms.bos?.detected && <div style={{ fontSize: 11, color: 'var(--text-sec)', lineHeight: 1.5, marginBottom: 6 }}><span style={{ color: '#f87171', fontWeight: 700 }}>BOS: </span>{ms.bos?.cascadeExplanation}</div>}
                                    {ms.auctionNarrative && <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.5, padding: '8px 10px', background: 'var(--bg-hover)', borderRadius: 7 }}>{ms.auctionNarrative}</div>}
                                </div>

                                {/* ── STEP 3: KEY LEVELS ── */}
                                {kl.length > 0 && (
                                    <div style={card()}>
                                        <SectionHead icon="🎯" title="Step 3 — Key Levels (Ranked)" />
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            {kl.map((lvl, i) => {
                                                const sigColor = lvl.significance === 'Critical' ? '#f87171' : lvl.significance === 'Major' ? '#fbbf24' : '#60a5fa'
                                                return (
                                                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 12px', background: 'var(--bg-hover)', borderRadius: 8, borderLeft: `3px solid ${lvl.colorCode || sigColor}` }}>
                                                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: `${sigColor}20`, border: `1.5px solid ${sigColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: sigColor, flexShrink: 0 }}>{lvl.rank}</div>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 2 }}>
                                                                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-pri)', ...mono }}>{lvl.price}</span>
                                                                <SigBadge label={lvl.type} color={lvl.colorCode || sigColor} />
                                                                <SigBadge label={lvl.significance} color={sigColor} />
                                                            </div>
                                                            <div style={{ fontSize: 10, color: 'var(--text-dim)', lineHeight: 1.4 }}>{lvl.roleDescription}</div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* ── STEP 4: DELTA / VOLUME ── */}
                                <div style={card()}>
                                    <SectionHead icon="💧" title="Step 4 — Delta & Volume Analysis" />
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
                                        {[
                                            { label: 'Iceberg', val: dv.icebergDetected ? '⚠ Detected' : 'None', color: dv.icebergDetected ? '#fbbf24' : 'var(--text-dim)' },
                                            { label: 'Dominant Side', val: dv.dominantSide || '—', color: dv.dominantSide === 'Ask' ? '#f87171' : dv.dominantSide === 'Bid' ? '#34d399' : '#fbbf24' },
                                            { label: 'Delta Trend', val: dv.cumulativeDeltaTrend || '—', color: (dv.cumulativeDeltaTrend || '').includes('Bull') ? '#34d399' : (dv.cumulativeDeltaTrend || '').includes('Bear') ? '#f87171' : '#fbbf24' },
                                        ].map(({ label, val, color }) => (
                                            <div key={label} style={{ background: 'var(--bg-hover)', borderRadius: 8, padding: '10px', textAlign: 'center' }}>
                                                <div style={{ fontSize: 9, color: 'var(--text-dim)', marginBottom: 4 }}>{label}</div>
                                                <div style={{ fontSize: 11, fontWeight: 700, color }}>{val}</div>
                                            </div>
                                        ))}
                                    </div>
                                    {dv.icebergDescription && <div style={{ fontSize: 11, color: '#fbbf24', background: '#fbbf2410', border: '1px solid #fbbf2430', borderRadius: 8, padding: '8px 10px', marginBottom: 8, lineHeight: 1.5 }}>🧊 {dv.icebergDescription}</div>}
                                    {dv.footprintReading && <div style={{ fontSize: 11, color: 'var(--text-sec)', lineHeight: 1.5, marginBottom: 6 }}><span style={{ fontWeight: 700, color: 'var(--text-pri)' }}>Footprint: </span>{dv.footprintReading}</div>}
                                    {dv.volumeSpike && dv.volumeSpikeContext && <div style={{ fontSize: 11, color: '#f87171', background: '#f8717110', borderRadius: 7, padding: '7px 10px' }}>⚡ Volume Spike: {dv.volumeSpikeContext}</div>}
                                </div>

                                {/* ── STEP 5: SESSION + STEP 6: MOMENTUM (2-col) ── */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                    <div style={card({ padding: '14px' })}>
                                        <SectionHead icon="🕐" title="Session" />
                                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--acc-main)', marginBottom: 4 }}>{sa.detectedSession || '—'}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8 }}>Bias: <span style={{ color: sa.sessionBias === 'Bullish' ? '#34d399' : sa.sessionBias === 'Bearish' ? '#f87171' : '#fbbf24', fontWeight: 700 }}>{sa.sessionBias || '—'}</span></div>
                                        {sa.pdArrays?.length > 0 && sa.pdArrays.map((pd, i) => <div key={i} style={{ fontSize: 10, color: 'var(--text-sec)', lineHeight: 1.5, padding: '2px 0' }}>· {pd}</div>)}
                                        {sa.htfContext && <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 6, lineHeight: 1.5, borderTop: '1px solid var(--border)', paddingTop: 6 }}>{sa.htfContext}</div>}
                                    </div>
                                    <div style={card({ padding: '14px' })}>
                                        <SectionHead icon="⚡" title="Momentum" />
                                        {[
                                            { label: 'RSI', val: mo.rsi || '—', sub: mo.rsiCondition },
                                            { label: 'MACD', val: mo.macdCondition || '—', sub: null },
                                            { label: 'EMA', val: mo.ema || '—', sub: null },
                                        ].map(({ label, val, sub }) => (
                                            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border)', fontSize: 11 }}>
                                                <span style={{ color: 'var(--text-dim)' }}>{label}</span>
                                                <span style={{ color: 'var(--text-pri)', fontWeight: 600, ...mono, textAlign: 'right' }}>{val}{sub ? <span style={{ fontSize: 9, color: 'var(--text-dim)', display: 'block' }}>{sub}</span> : null}</span>
                                            </div>
                                        ))}
                                        <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700, color: mo.momentumBias === 'Bullish' ? '#34d399' : mo.momentumBias === 'Bearish' ? '#f87171' : '#fbbf24' }}>Overall: {mo.momentumBias || '—'}</div>
                                    </div>
                                </div>

                                {/* ── STEP 7: INDICATORS ── */}
                                {inds.length > 0 && (
                                    <div style={card()}>
                                        <SectionHead icon="📊" title="Step 7 — Indicators" />
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                            {(isPaid ? inds : inds.slice(0, 3)).map((ind, i) => {
                                                const c = ind.sentiment === 'BULLISH' ? '#34d399' : ind.sentiment === 'BEARISH' ? '#f87171' : '#fbbf24'
                                                return (
                                                    <div key={i} style={{ fontSize: 11, padding: '5px 10px', borderRadius: 7, background: `${c}12`, border: `1px solid ${c}30`, color: c, fontWeight: 600 }}>
                                                        {ind.name}: {ind.reading}
                                                        {ind.weight && <span style={{ fontSize: 9, opacity: 0.7, marginLeft: 4 }}>({ind.weight})</span>}
                                                    </div>
                                                )
                                            })}
                                            {!isPaid && inds.length > 3 && (
                                                <button onClick={() => setShowPaywall(true)} style={{ fontSize: 10, padding: '5px 10px', borderRadius: 7, background: 'transparent', border: '1px dashed var(--border)', color: 'var(--acc-main)', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>🔒 +{inds.length - 3} more → Upgrade</button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* ── STEP 8: TRADE SETUPS ── */}
                                <div style={card()}>
                                    <SectionHead icon="🎰" title="Step 8 — Trade Setup Construction" />
                                    {/* Setup tabs */}
                                    <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                                        {setups.map((s, i) => {
                                            const pc = setupProbColor(s.probability)
                                            return (
                                                <button key={i} onClick={() => setActiveSetup(i)} style={{ flex: 1, minWidth: 90, padding: '7px 10px', borderRadius: 9, border: `1.5px solid ${activeSetup === i ? pc : 'var(--border)'}`, background: activeSetup === i ? `${pc}18` : 'var(--bg-hover)', color: activeSetup === i ? pc : 'var(--text-dim)', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 10, fontWeight: 700, textAlign: 'center', transition: 'all 0.15s' }}>
                                                    {s.label || s.setupType}<br />
                                                    <span style={{ fontSize: 11, ...mono }}>{s.probability}%</span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                    {/* Active setup detail */}
                                    {activeS && (() => {
                                        const pc = setupProbColor(activeS.probability)
                                        return (
                                            <div style={{ background: `${pc}08`, border: `1px solid ${pc}25`, borderRadius: 10, padding: '14px' }}>
                                                {/* Price levels */}
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 12 }}>
                                                    {[
                                                        { label: 'SL', val: activeS.stopLoss, color: '#f87171' },
                                                        { label: 'Entry', val: activeS.entry, color: '#60a5fa' },
                                                        { label: 'TP1', val: activeS.tp1, color: '#34d399' },
                                                        { label: 'TP2', val: isPaid ? activeS.tp2 : '🔒', color: '#34d399' },
                                                        { label: 'TP3', val: isPaid ? activeS.tp3 : '🔒', color: '#34d39960' },
                                                    ].map(({ label, val, color }) => (
                                                        <div key={label} onClick={!isPaid && label.startsWith('TP') && label !== 'TP1' ? () => setShowPaywall(true) : undefined} style={{ background: `${color}15`, border: `1px solid ${color}30`, borderRadius: 7, padding: '8px 4px', textAlign: 'center', cursor: !isPaid && label.startsWith('TP') && label !== 'TP1' ? 'pointer' : 'default' }}>
                                                            <div style={{ fontSize: 9, fontWeight: 700, color, marginBottom: 3 }}>{label}</div>
                                                            <div style={{ fontSize: 9, fontWeight: 700, color, ...mono, wordBreak: 'break-all' }}>{val || '—'}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                                {/* R:R */}
                                                <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
                                                    <div style={{ padding: '5px 12px', borderRadius: 7, background: `${pc}20`, border: `1px solid ${pc}40`, fontSize: 12, fontWeight: 800, color: pc, ...mono }}>R:R {activeS.riskReward}</div>
                                                    <div style={{ padding: '5px 12px', borderRadius: 7, background: 'var(--bg-hover)', border: '1px solid var(--border)', fontSize: 11, fontWeight: 700, color: pc }}>Prob. {activeS.probability}%</div>
                                                </div>
                                                {/* Conditions */}
                                                {activeS.conditions?.length > 0 && (
                                                    <div style={{ marginBottom: 10 }}>
                                                        <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Simultaneous Conditions</div>
                                                        {activeS.conditions.map((c, i) => (
                                                            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '4px 0', fontSize: 11, color: 'var(--text-sec)', lineHeight: 1.4 }}>
                                                                <span style={{ color: pc, fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>{c}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {/* Execution */}
                                                {activeS.executionInstruction && (
                                                    <div style={{ padding: '10px 12px', background: 'var(--bg-hover)', borderRadius: 8, fontSize: 11, color: 'var(--text-sec)', lineHeight: 1.5, borderLeft: `3px solid ${pc}` }}>
                                                        <span style={{ fontWeight: 700, color: pc, display: 'block', marginBottom: 4 }}>Execution:</span>
                                                        {activeS.executionInstruction}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })()}
                                </div>

                                {/* ── STEP 9: RISK ARCHITECTURE ── */}
                                <div style={card()}>
                                    <SectionHead icon="🛡" title="Step 9 — Risk Architecture" />
                                    {/* TP allocation bar */}
                                    <div style={{ marginBottom: 14 }}>
                                        <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 6 }}>Position Allocation</div>
                                        <div style={{ display: 'flex', height: 24, borderRadius: 8, overflow: 'hidden', gap: 2 }}>
                                            <div style={{ width: `${risk.tp1Allocation || 60}%`, background: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#000' }}>TP1 {risk.tp1Allocation || 60}%</div>
                                            <div style={{ width: `${risk.tp2Allocation || 30}%`, background: '#34d39960', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#fff' }}>TP2 {risk.tp2Allocation || 30}%</div>
                                            <div style={{ width: `${risk.tp3RunnerAllocation || 10}%`, background: '#34d39930', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#34d399' }}>Run {risk.tp3RunnerAllocation || 10}%</div>
                                        </div>
                                    </div>
                                    {/* Hard stop */}
                                    {risk.hardStop && (
                                        <div style={{ padding: '10px 12px', background: '#f8717112', border: '1px solid #f8717130', borderRadius: 8, marginBottom: 10 }}>
                                            <div style={{ fontSize: 9, fontWeight: 700, color: '#f87171', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Hard Stop</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-sec)', lineHeight: 1.4 }}>{risk.hardStop}</div>
                                        </div>
                                    )}
                                    {/* Invalidation conditions */}
                                    {risk.invalidationConditions?.length > 0 && (
                                        <div style={{ marginBottom: 10 }}>
                                            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>3-Condition Invalidation</div>
                                            {risk.invalidationConditions.map((c, i) => (
                                                <div key={i} style={{ display: 'flex', gap: 8, padding: '5px 0', fontSize: 11, color: 'var(--text-sec)', borderBottom: '1px solid var(--border)' }}>
                                                    <span style={{ color: '#f87171', fontWeight: 800, flexShrink: 0 }}>✕</span>{c}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {/* Reassessment trigger */}
                                    {risk.reassessmentTrigger && (
                                        <div style={{ padding: '8px 12px', background: '#fbbf2410', border: '1px solid #fbbf2430', borderRadius: 8, fontSize: 11, color: '#fbbf24', lineHeight: 1.5, marginBottom: 10 }}>
                                            🔄 Reassess when: {risk.reassessmentTrigger}
                                        </div>
                                    )}
                                    {/* R:R summary */}
                                    {risk.rrSummary && (
                                        <div style={{ padding: '10px 12px', background: 'var(--bg-hover)', borderRadius: 8, fontSize: 11, color: 'var(--text-sec)', lineHeight: 1.5 }}>
                                            <span style={{ fontWeight: 700, color: 'var(--text-pri)' }}>R:R Summary: </span>{risk.rrSummary}
                                        </div>
                                    )}
                                </div>

                                {/* ── TRADE OUTCOME ── */}
                                <div style={{ ...card(), borderTop: '2px solid var(--border)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                                        <div>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-pri)' }}>Trade Outcome</div>
                                            <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>How did this analysis perform?</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            {[['Won', '#34d399'], ['Lost', '#f87171'], ['Not Taken', 'var(--text-dim)']].map(([label, color]) => (
                                                <button key={label} style={{ padding: '6px 14px', borderRadius: 8, border: `1.5px solid ${color}50`, background: `${color}15`, color, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-ui)', transition: 'all 0.15s' }}
                                                    onMouseEnter={e => { e.currentTarget.style.background = `${color}30` }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = `${color}15` }}>
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )
                    })()}

                    {/* ── HISTORY ── */}
                    {history.length > 0 && (
                        <div style={card()}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-sec)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Recent Analyses</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                                {history.slice(0, 5).map(h => (
                                    <div key={h.id} onClick={() => { setResult(h.analysis); setImageDataUrl(h.thumb); setMarket(h.market); setActiveSetup(0) }}
                                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 10, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', transition: 'border-color 0.15s' }}
                                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
                                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                                        <img src={h.thumb} alt="" style={{ width: 48, height: 34, borderRadius: 5, objectFit: 'cover', background: 'var(--bg-hover)', flexShrink: 0 }} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 10, color: 'var(--text-dim)', ...mono }}>{h.market} · {h.pattern}</div>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: h.signal === 'BUY' ? '#34d399' : h.signal === 'SELL' ? '#f87171' : '#fbbf24' }}>{h.signal}</div>
                                        </div>
                                        <div style={{ textAlign: 'right', fontSize: 10, color: 'var(--text-dim)', ...mono, flexShrink: 0 }}>{h.time}<br />{h.date}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── PAYWALL MODAL (unchanged) ── */}
            <AIModal show={showPaywall} onClose={() => setShowPaywall(false)}>
                <div style={{ padding: '32px 28px', textAlign: 'center' }}>
                    <div style={{ fontSize: 44, marginBottom: 14 }}>🔒</div>
                    <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-pri)', marginBottom: 8, letterSpacing: '-0.02em' }}>Unlock Deep AI Analysis</h2>
                    <p style={{ fontSize: 13, color: 'var(--text-sec)', lineHeight: 1.7, marginBottom: 22 }}>Powered by <strong style={{ color: 'var(--acc-main)' }}>Falcon 🦅</strong> — all 9 analysis steps, unlimited charts, full TP levels, iceberg detection & risk architecture.</p>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 22 }}>
                        {[['✓', '9-Step Deep Analysis'], ['✓', 'Bookmap Wall Detection'], ['✓', 'CHoCH / BOS Structure'], ['✓', 'Iceberg Volume Alerts'], ['✓', '3 Trade Setups + Risk Plan']].map(([icon, txt]) => (
                            <span key={txt} style={{ fontSize: 11, color: 'var(--text-sec)', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: '4px 11px', display: 'flex', gap: 5, alignItems: 'center' }}>
                                <span style={{ color: '#34d399' }}>{icon}</span>{txt}
                            </span>
                        ))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                        {[
                            { id: 'free', label: 'Free Trial', price: '$0', sub: '5 analyses · forever', highlight: false },
                            { id: 'monthly', label: 'Monthly', price: '$25', sub: 'per month · cancel anytime', highlight: true },
                            { id: 'yearly', label: 'Yearly', price: '$12.50', sub: '/mo · $150/yr · save 50%', highlight: false, badge: '💰 SAVE 50%' },
                        ].map(p => (
                            <div key={p.id} onClick={() => {
                                if (p.id === 'free') { setShowPaywall(false) } else {
                                    setSelectedPlan(p.id); setShowPaywall(false); setShowCheckout(true)
                                    window.open(p.id === 'yearly' ? 'https://link.payway.com.kh/ABAPAYnS442225A' : 'https://link.payway.com.kh/ABAPAYck442224o', '_blank', 'noopener,noreferrer')
                                }
                            }} style={{ background: p.highlight ? 'var(--acc-subtle)' : 'var(--bg-card)', border: `1.5px solid ${p.highlight ? 'var(--acc-main)' : 'var(--border)'}`, borderRadius: 12, padding: '16px 12px', textAlign: 'center', cursor: 'pointer', position: 'relative', transition: 'all 0.15s' }}>
                                {p.badge && <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: '#34d399', color: '#000', fontSize: 8, fontWeight: 800, padding: '2px 8px', borderRadius: 10, whiteSpace: 'nowrap' }}>{p.badge}</div>}
                                <div style={{ fontSize: 10, fontWeight: 800, color: p.highlight ? 'var(--acc-main)' : 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>{p.label}</div>
                                <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-pri)', lineHeight: 1, marginBottom: 4 }}>{p.price}</div>
                                <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 12 }}>{p.sub}</div>
                                <div style={{ padding: '7px', borderRadius: 7, background: p.highlight ? 'var(--grad-accent)' : 'var(--bg-hover)', color: p.highlight ? '#fff' : 'var(--text-sec)', fontSize: 11, fontWeight: 700 }}>{p.id === 'free' ? 'Stay Free' : 'Subscribe'}</div>
                            </div>
                        ))}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', ...mono }}>🔒 Secure checkout via ABA · Cancel anytime</div>
                </div>
            </AIModal>

            {/* ── CHECKOUT MODAL (unchanged from original) ── */}
            <AIModal show={showCheckout} onClose={() => { setShowCheckout(false); setCheckoutStep('qr'); setPaymentScreenshot(null); setNotifySent(false) }} maxWidth={460}>
                <div style={{ padding: '28px 26px' }}>
                    <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-pri)' }}>Subscribe — {selectedPlan === 'yearly' ? 'Yearly Pro' : 'Monthly Pro'}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-dim)', ...mono }}>AI Chart Analyzer · Pay via ABA</div>
                    </div>
                    {checkoutStep === 'done' ? (
                        <div style={{ textAlign: 'center', padding: '8px 0' }}>
                            <div style={{ fontSize: 52, marginBottom: 14 }}>📨</div>
                            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-pri)', margin: '0 0 10px' }}>Request Sent!</h3>
                            <p style={{ fontSize: 13, color: 'var(--text-sec)', lineHeight: 1.7, marginBottom: 20 }}>Admin notified on Telegram.<br />Activation code within <strong style={{ color: 'var(--acc-main)' }}>5–30 min</strong>.</p>
                            <button onClick={() => { setShowCheckout(false); setCheckoutStep('qr'); setPaymentScreenshot(null); setNotifySent(false) }} style={{ width: '100%', padding: '13px', borderRadius: 9, border: 'none', background: 'var(--grad-accent)', color: '#fff', cursor: 'pointer', fontWeight: 800, fontSize: 13, fontFamily: 'var(--font-ui)' }}>Got it — Close</button>
                        </div>
                    ) : checkoutStep === 'confirm' ? (
                        <div>
                            <button onClick={async () => { await sendTelegramAlert(); setCheckoutStep('done') }} style={{ width: '100%', padding: '13px', borderRadius: 9, border: 'none', background: 'var(--grad-accent)', color: '#fff', cursor: 'pointer', fontWeight: 800, fontSize: 13, fontFamily: 'var(--font-ui)', marginBottom: 10 }}>✅ Confirm & Notify Admin</button>
                            <button onClick={() => setCheckoutStep('qr')} style={{ width: '100%', padding: '10px', borderRadius: 9, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-ui)' }}>← Back</button>
                        </div>
                    ) : (
                        <div>
                            <label style={{ display: 'block', border: `2px dashed ${paymentScreenshot ? 'var(--acc-main)' : 'var(--border)'}`, borderRadius: 12, padding: paymentScreenshot ? '10px' : '36px 20px', textAlign: 'center', cursor: 'pointer', background: paymentScreenshot ? 'var(--acc-subtle)' : 'var(--bg-card)', marginBottom: 16 }}>
                                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = ev => setPaymentScreenshot(ev.target.result); r.readAsDataURL(f) }} />
                                {paymentScreenshot ? <img src={paymentScreenshot} alt="" style={{ width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 8 }} /> : <><div style={{ fontSize: 36, marginBottom: 10 }}>📷</div><div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-pri)' }}>Upload your ABA receipt</div></>}
                            </label>
                            <button onClick={() => { if (paymentScreenshot) setCheckoutStep('confirm') }} disabled={!paymentScreenshot} style={{ width: '100%', padding: '13px', borderRadius: 9, border: 'none', background: paymentScreenshot ? 'var(--grad-accent)' : 'var(--bg-card)', color: paymentScreenshot ? '#fff' : 'var(--text-dim)', cursor: paymentScreenshot ? 'pointer' : 'not-allowed', fontWeight: 800, fontSize: 13, fontFamily: 'var(--font-ui)' }}>
                                {paymentScreenshot ? 'Next — Confirm →' : '⬆ Upload screenshot to continue'}
                            </button>
                        </div>
                    )}
                </div>
            </AIModal>

            <style>{`
        @keyframes aiSpin { to { transform: rotate(360deg) } }
        @keyframes aiModalIn { from{opacity:0;transform:translateY(14px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
      `}</style>
        </div>
    )
}


// ═══════════════════════════════════════════════════════════════════════════════
// ICT LESSONS
// ═══════════════════════════════════════════════════════════════════════════════
const LESSON_LIBRARY = [
    {
        id: 'ict-daily-bias',
        title: 'ICT Daily Bias',
        titleKh: 'ការយល់ដឹងអំពី Daily Bias',
        tag: 'ICT CONCEPT • XAUUSD',
        tagColor: '#fbbf24',
        icon: '📊',
        level: 'Intermediate',
        duration: '8 slides',
        description: 'Learn how to determine the Daily Bias using OHLC candle structure, PD Arrays, and CISD to trade AM Session effectively.',
        slides: [
            {
                step: '01 / 08',
                badge: 'ICT CONCEPT • XAUUSD',
                badgeColor: '#fbbf24',
                title: 'ICT Daily Bias',
                titleHighlight: null,
                subtitle: 'គឺជាអ្វី?',
                body: 'Daily Bias គឺជាការស្វែងរកទិសដៅ Market នឹងដើរ — ទៅឡើងបុះ — សម្រាប់ថ្ងៃនោះ។',
                bodyEn: 'Daily Bias is identifying which direction the market is likely to move for the day — up or down — used to guide trade direction.',
                tags: ['Liquidity Grabs', 'Bias Shifts', 'PD Arrays', 'Kill Zones'],
                chart: null,
                tip: 'Use OHLC / OLHC candle pattern to determine Bias each day.',
                keyPoints: [
                    { icon: '↑', color: '#34d399', label: 'Bullish Bias', desc: 'Market targeting Buy-Side Liquidity above' },
                    { icon: '↓', color: '#f87171', label: 'Bearish Bias', desc: 'Market targeting Sell-Side Liquidity below' },
                ],
            },
            {
                step: '02 / 08',
                badge: 'ជំហានទី 1',
                badgeColor: '#fbbf24',
                title: 'វាស់តំ',
                titleHighlight: 'Previous Day Range',
                subtitle: null,
                body: 'មុន Candle ថ្ងៃបើក — វាស់តំ Price ទៅដល់ Level សំខាន់គំរ Range ថ្ងៃមុន។',
                bodyEn: 'Before the daily candle opens — identify where Price is relative to the Previous Day\'s Range levels.',
                tags: [],
                chart: {
                    type: 'range',
                    description: 'H4 candles with BISI and +OB marked between Prev High and Prev Low dashed lines',
                },
                tip: 'Mark Imbalances, OB, FVG inside the Range of the previous day for reference.',
                keyPoints: [
                    { icon: '📍', color: '#fbbf24', label: 'High & Low', desc: 'Mark the High & Low of the previous day' },
                    { icon: '📐', color: '#60a5fa', label: 'PD Arrays', desc: 'Identify PD Arrays across 1D, 4H, 1H timeframes' },
                ],
            },
            {
                step: '03 / 08',
                badge: 'ជំហានទី 2',
                badgeColor: '#fbbf24',
                title: 'រង់ចាំ',
                titleHighlight: 'Price បះ PD Array',
                subtitle: null,
                body: 'មុន Candle ថ្ងៃបើក — រង់ចាំ Price ទៅដល់ Level សំខាន់គំរ Range ថ្ងៃមុន។',
                bodyEn: 'Wait for Price to reach a key PD Array level within the previous day\'s range before acting.',
                tags: [],
                chart: {
                    type: 'pd-array',
                    description: 'Price reaching BISI level with reaction near Prev Low',
                },
                tip: 'ត្រូវអត់ធ្មត់ — Price នឹងមកប្រទះ Level ។ Trade តែពេល Price ទៅរាំង។',
                keyPoints: [
                    { icon: '⏳', color: '#a78bfa', label: 'Wait for reaction', desc: 'Price must react at the PD Array — do not trade until it does' },
                ],
            },
            {
                step: '04 / 08',
                badge: 'ជំហានទី 3 · BULLISH',
                badgeColor: '#34d399',
                title: 'កំណត់',
                titleHighlight: 'Bullish Bias',
                subtitle: null,
                body: 'ក្រោយ Candle ថ្ងៃបើក — Price ចុះជាមុន ហើយបះ Previous Day Low / Bullish PD Array។ Candle ថ្ងៃនោះ បង្ហាញ Close ខ្ពស់ (OLHC) — Bullish Bias!',
                bodyEn: 'After the daily candle opens — Price dips to Previous Day Low / Bullish PD Array, then closes HIGH (OLHC pattern) — confirming Bullish Bias.',
                tags: [],
                chart: {
                    type: 'bullish-ohlc',
                    description: 'Large green candle with OLHC label, SIBI visible, between Prev High and Prev Low',
                },
                tip: 'Bullish Bias — Market is likely to go UP. Look for Buy setups during AM Session.',
                keyPoints: [
                    { icon: '↑', color: '#34d399', label: 'OLHC Pattern', desc: 'Open → Low → High → Close (price dips then rallies)' },
                    { icon: '🛒', color: '#34d399', label: 'Buy AM Session', desc: 'Bias confirmed — prepare to Buy during New York AM' },
                ],
            },
            {
                step: '05 / 08',
                badge: 'ជំហានទី 3 · BEARISH',
                badgeColor: '#f87171',
                title: 'កំណត់',
                titleHighlight: 'Bearish Bias',
                subtitle: null,
                body: 'ក្រោយ Candle ថ្ងៃបើក — Price ឡើងជាមុន ហើយបះ Previous Day High / Bearish PD Array។ Candle ថ្ងៃនោះ Close តាប (OHLC) — Bearish Bias!',
                bodyEn: 'After the daily candle opens — Price rallies to Previous Day High / Bearish PD Array, then closes LOW (OHLC pattern) — confirming Bearish Bias.',
                tags: [],
                chart: {
                    type: 'bearish-ohlc',
                    description: 'Large red candle with OHLC label, between Prev High and Prev Low',
                },
                tip: 'Bearish Bias — Market is likely to go DOWN. Look for Sell setups during AM Session.',
                keyPoints: [
                    { icon: '↓', color: '#f87171', label: 'OHLC Pattern', desc: 'Open → High → Low → Close (price rallies then dumps)' },
                    { icon: '📉', color: '#f87171', label: 'Sell AM Session', desc: 'Bias confirmed — prepare to Sell during New York AM' },
                ],
            },
            {
                step: '06 / 08',
                badge: 'ជំហានទី 4',
                badgeColor: '#60a5fa',
                title: 'បញ្ជាក់ High/Low',
                titleHighlight: 'លាម 1H CISD',
                subtitle: null,
                body: 'ពេល Price ទៅដល់ Level ថ្ងៃមុន — រង់ចាំ 1H CISD ដើម្បីបញ្ជាក់ Low ឬ High របស់ Candle ថ្ងៃ។ ក្រោយ CISD ត្រូវបានបញ្ជាក់ — Entry ទៅ M15/M5។',
                bodyEn: 'When Price reaches the previous day\'s level — wait for 1H CISD to confirm the Low or High of the daily candle. After CISD confirmation — enter on M15/M5.',
                tags: [],
                chart: {
                    type: 'cisd',
                    description: 'H1 chart showing CISD level with M15/M5 entry arrow',
                },
                tip: 'CISD = Change In State of Delivery — market structure shift confirming the bias.',
                keyPoints: [
                    { icon: '🔵', color: '#60a5fa', label: '1H CISD', desc: 'Wait for 1H Change In State of Delivery at the PD level' },
                    { icon: '🎯', color: '#a78bfa', label: 'M15/M5 Entry', desc: 'After CISD confirmed, drill down to M15 or M5 for entry' },
                ],
            },
            {
                step: '07 / 08',
                badge: '⏰ TIMING',
                badgeColor: '#fbbf24',
                title: 'Trade ពេល',
                titleHighlight: 'AM Session',
                subtitle: 'តែប៉ុណ្ណោះ:',
                body: 'Candle ថ្ងៃភាគច្រើន Expand គំរ AM Session។ ផ្សារភ្ជាប់ Asian & London Session ដើម្បីរំពឹង Bias គ្រឹកច្រោស។',
                bodyEn: 'Most daily candles expand during the AM Session. Use Asian & London sessions to anticipate bias before the AM Kill Zone opens.',
                tags: [],
                chart: null,
                tip: 'Rules: ផ្សារភ្ជាប់ Asian & London ។ រង់ចាំ Price ប្រតិកម្ម ទៅ Range ថ្ងៃមុន។',
                keyPoints: [
                    { icon: '🚫', color: '#f87171', label: 'No Trade before 9:30', desc: 'New York Time — wait for AM Kill Zone' },
                    { icon: '✅', color: '#34d399', label: '9:30 – 11:30 NY', desc: 'Primary trading window (GMT+7: 20:30 – 22:30)' },
                    { icon: '🇰🇭', color: '#fbbf24', label: 'GMT+7 Kill Zones', desc: 'AM = 20:30–22:30 | London = 14:30–16:30' },
                ],
            },
            {
                step: '08 / 08',
                badge: 'ឧទាហរណ៍ BEARISH',
                badgeColor: '#f87171',
                title: 'Chart Example',
                titleHighlight: 'Bearish Setup',
                subtitle: null,
                body: 'ថ្ងៃមុន បាន Leave 4H SIBI គំរ Range ។ ពេល Candle ថ្ងៃបើក — Price ឡើង SIBI ជាយន្ត → High ត្រូវបានបង្ហើរ → Market Expand ចុះ → Bearish OHLC',
                bodyEn: 'Previous day left a 4H SIBI inside the range. When the daily candle opened — Price pushed to SIBI delivery → High was swept → Market expanded down → Bearish OHLC confirmed.',
                tags: [],
                chart: {
                    type: 'bearish-full',
                    description: 'H4 chart showing SIBI in range, price sweeping Prev High, then expanding down to Prev Low',
                },
                tip: '📌 សង្ខេប: Price ឡើង SIBI → High ត្រូវបង្ហើរ → Market ចុះទៅ → Close ជា Bearish OHLC → Bearish Bias បញ្ជាក់!',
                keyPoints: [
                    { icon: '1️⃣', color: '#fbbf24', label: 'Price sweeps SIBI', desc: 'Opens, pushes up to deliver into the 4H SIBI level' },
                    { icon: '2️⃣', color: '#f87171', label: 'Prev High swept', desc: 'Liquidity above Prev High is grabbed' },
                    { icon: '3️⃣', color: '#f87171', label: 'Market expands down', desc: 'Price reverses and expands bearish — OHLC confirmed' },
                ],
            },
        ],
    },

    // ── LESSON 2: LIQUIDITY GRABS ──────────────────────────────────────────────
    {
        id: 'liquidity-grabs',
        title: 'Liquidity Grabs',
        titleKh: 'ការចាប់យក Liquidity',
        tag: 'ICT CONCEPT • SMART MONEY',
        tagColor: '#60a5fa',
        icon: '🎣',
        level: 'Intermediate',
        duration: '6 slides',
        description: 'Understand how institutions engineer stop hunts to grab liquidity before reversing — and how to trade with them instead of against them.',
        slides: [
            {
                step: '01 / 06',
                badge: 'WHAT IS IT?',
                badgeColor: '#60a5fa',
                title: 'Liquidity Grabs',
                titleHighlight: 'គឺជាអ្វី?',
                subtitle: null,
                body: 'Liquidity Grab គឺជាព្រឹត្តិការណ៍ Market ដែល Price ឆ្លងកាត់ Level (High/Low) ដើម្បី Trigger Stop Loss របស់ Retail Traders — បន្ទាប់មក Reverse វិញ។',
                bodyEn: 'A Liquidity Grab is when price spikes beyond a key level (swing high or low) to trigger clustered stop-loss orders, then sharply reverses. Institutions engineer this to fill their large orders at favorable prices.',
                chart: null,
                tip: 'Every sweep is NOT a grab. A grab = sweep + sharp reversal. A sweep that continues is a breakout.',
                keyPoints: [
                    { icon: '🏦', color: '#60a5fa', label: 'Why Institutions Do This', desc: 'Large orders need volume to fill. Stop-loss clusters = cheap liquidity for smart money to enter big positions.' },
                    { icon: '🪤', color: '#f87171', label: 'Retail Trap', desc: 'Retail traders place stops at obvious levels (prev high/low). Institutions know exactly where they are.' },
                    { icon: '↩️', color: '#34d399', label: 'The Reversal Signal', desc: 'After the grab, price snaps back — this is your signal that smart money has entered the opposite direction.' },
                ],
                tags: ['BSL', 'SSL', 'Stop Hunt', 'Sweep'],
            },
            {
                step: '02 / 06',
                badge: 'TWO TYPES',
                badgeColor: '#60a5fa',
                title: 'Bullish vs Bearish',
                titleHighlight: 'Liquidity Grabs',
                subtitle: null,
                body: 'មាន ២ប្រភេទ: Bullish Grab (ចាប់ SSL ខាងក្រោម) និង Bearish Grab (ចាប់ BSL ខាងលើ)។',
                bodyEn: 'Bullish Grab: Price dips below a Sell-Side Liquidity (SSL) level with a long lower wick, then closes back above — signals buyers stepped in. Bearish Grab: Price spikes above Buy-Side Liquidity (BSL) with a long upper wick, then closes back below — signals sellers entered.',
                chart: { type: 'liquidity-grab', description: 'Bullish grab: long lower wick sweeping SSL. Bearish grab: long upper wick sweeping BSL.' },
                tip: 'Look for a candle with a LONG wick and SMALL body at a key level. The wick is the grab, the body is the rejection.',
                keyPoints: [
                    { icon: '📗', color: '#34d399', label: 'Bullish Grab (SSL Sweep)', desc: 'Price sweeps below prev low → long lower wick → closes back up → look for LONGS' },
                    { icon: '📕', color: '#f87171', label: 'Bearish Grab (BSL Sweep)', desc: 'Price spikes above prev high → long upper wick → closes back down → look for SHORTS' },
                ],
                tags: ['BSL', 'SSL'],
            },
            {
                step: '03 / 06',
                badge: 'IDENTIFICATION',
                badgeColor: '#60a5fa',
                title: 'How to Identify',
                titleHighlight: 'a Grab',
                subtitle: null,
                body: 'ដើម្បីកំណត់ Liquidity Grab ត្រឹមត្រូវ ត្រូវមាន ៣ Evidence: Long Wick, Sharp Reversal, Key Level។',
                bodyEn: 'Three things must align: (1) Price exceeds a known liquidity level (prev high/low, equal highs/lows, session extremes), (2) A long wick forms — indicating stop hunts triggered, (3) Price snaps back with a sharp close in the opposite direction.',
                chart: null,
                tip: 'Grab vs Sweep: A GRAB happens in ONE candle (one wick). A SWEEP can take multiple candles. Both can signal reversals but grabs are more immediate.',
                keyPoints: [
                    { icon: '📍', color: '#fbbf24', label: 'Where to Look', desc: 'Equal Highs/Lows, Prev Day High/Low, Session Highs/Lows, Swing Points on HTF' },
                    { icon: '🕯️', color: '#60a5fa', label: 'Candle Pattern', desc: 'Long wick (2× body minimum) at the key level with a close back inside the range' },
                    { icon: '⚡', color: '#a78bfa', label: 'Speed of Reversal', desc: 'The faster price snaps back after the wick, the more valid the grab' },
                ],
                tags: ['Equal Highs', 'Equal Lows', 'Wicks'],
            },
            {
                step: '04 / 06',
                badge: 'TRADING STRATEGY',
                badgeColor: '#60a5fa',
                title: 'How to Trade',
                titleHighlight: 'Liquidity Grabs',
                subtitle: null,
                body: 'Strategy ស្ទើរតែ Simple: Wait for Grab → Confirm Reversal → Find FVG/OB → Entry ។',
                bodyEn: 'Step 1: Map key liquidity levels (prev high/low, equal highs/lows). Step 2: Wait for a grab (long wick sweep of the level). Step 3: Confirm reversal with a BOS or CISD on lower timeframe. Step 4: Enter at the first FVG or Order Block formed after the grab.',
                chart: null,
                tip: 'Combine Liquidity Grabs with FVGs for highest-probability entries. After a bullish grab, wait for price to form a Bullish FVG, then enter when price retests it.',
                keyPoints: [
                    { icon: '1️⃣', color: '#fbbf24', label: 'Map Liquidity Levels', desc: 'Mark prev day H/L, session extremes, equal highs/lows before the session' },
                    { icon: '2️⃣', color: '#60a5fa', label: 'Wait for the Grab', desc: 'Watch for price to spike past the level and reverse — patience is key' },
                    { icon: '3️⃣', color: '#34d399', label: 'Confirm + Enter', desc: 'LTF BOS/CISD confirms direction. Enter at FVG or OB. SL beyond the grab wick.' },
                    { icon: '4️⃣', color: '#a78bfa', label: 'Target Next Liquidity', desc: 'TP at the opposing liquidity pool — the next HTF high or low' },
                ],
                tags: [],
            },
            {
                step: '05 / 06',
                badge: 'COMMON MISTAKES',
                badgeColor: '#f87171',
                title: 'What to Avoid',
                titleHighlight: null,
                subtitle: null,
                body: 'Traders ច្រើនខ្វះ Patience ហើយ Enter ភ្លាមៗ — ឬ Confuse ការ Sweep ជា Breakout ។',
                bodyEn: 'Most mistakes happen from impatience or misreading. Not every wick is a grab — you need confirmation. And not every grab leads to a big reversal — always check the higher timeframe bias first.',
                chart: null,
                tip: 'RULE: Never trade a liquidity grab counter to your higher timeframe bias. A bearish grab on 5M means nothing if the Daily is bullish.',
                keyPoints: [
                    { icon: '❌', color: '#f87171', label: 'Entering Too Early', desc: 'Don\'t enter during the wick — wait for candle close confirmation back inside range' },
                    { icon: '❌', color: '#f87171', label: 'No HTF Context', desc: 'Grabs on low timeframes against a strong HTF trend are low-probability' },
                    { icon: '❌', color: '#f87171', label: 'Misidentifying Breakouts', desc: 'If price sweeps a level AND closes beyond it with body → it\'s a breakout, not a grab' },
                    { icon: '✅', color: '#34d399', label: 'Correct Process', desc: 'HTF bias first → identify level → wait for grab with confirmation → enter with SL beyond wick' },
                ],
                tags: [],
            },
            {
                step: '06 / 06',
                badge: 'KEY TAKEAWAY',
                badgeColor: '#60a5fa',
                title: 'Summary:',
                titleHighlight: 'Liquidity Grabs',
                subtitle: null,
                body: 'Liquidity ជា Destination — មិនមែន Entry Signal ដោយខ្លួនឯងទេ។ Sweep ជា Event, Trade ជា Confirmation ។',
                bodyEn: 'Liquidity is where price goes, not where you trade. The sweep is the event. Your trade is confirmed when price shows rejection (wick), displacement (fast move back), and structure shift on a lower timeframe. Master this and you stop getting stopped out at "obvious" levels.',
                chart: null,
                tip: '💡 Mindset shift: Stop treating highs/lows as support/resistance. Treat them as LIQUIDITY TARGETS that institutions will raid before reversing.',
                keyPoints: [
                    { icon: '🎯', color: '#60a5fa', label: 'Liquidity = Destination', desc: 'Price moves TO liquidity, not FROM it. Map it and wait.' },
                    { icon: '🔁', color: '#34d399', label: 'Grab = Entry Signal', desc: 'After the grab with confirmation, institutions are positioned. Follow them.' },
                    { icon: '📐', color: '#a78bfa', label: 'SL Placement', desc: 'Always place SL beyond the grab wick — that level is now likely protected by institutions.' },
                ],
                tags: ['Liquidity Grabs', 'SSL', 'BSL', 'Stop Hunt'],
            },
        ],
    },

    // ── LESSON 3: BIAS SHIFTS ──────────────────────────────────────────────────
    {
        id: 'bias-shifts',
        title: 'Bias Shifts',
        titleKh: 'ការផ្លាស់ប្តូរ Bias',
        tag: 'ICT CONCEPT • OHLC / PO3',
        tagColor: '#a78bfa',
        icon: '🔄',
        level: 'Intermediate',
        duration: '5 slides',
        description: 'Master how to read OHLC/OLHC candle structure and Power of Three (AMD) to identify when the daily bias shifts — and align your trades with institutional intent.',
        slides: [
            {
                step: '01 / 05',
                badge: 'FOUNDATION',
                badgeColor: '#a78bfa',
                title: 'What Is a',
                titleHighlight: 'Bias Shift?',
                subtitle: null,
                body: 'Bias Shift គឺជាការផ្លាស់ប្តូរ Market Direction — ពី Bullish ទៅ Bearish ឬ Bearish ទៅ Bullish ។ មើល OHLC/OLHC Pattern ដើម្បីកំណត់ Bias ។',
                bodyEn: 'A Bias Shift is when the market\'s intended daily direction changes. ICT identifies this through the OHLC/OLHC candle structure — how the daily candle sequences its Open, High, Low, and Close tells you whether institutions are bullish or bearish for the day.',
                chart: null,
                tip: 'Daily Bias = The directional "North Star" for your entire trading day. Get this wrong and every trade is fighting the tide.',
                keyPoints: [
                    { icon: '📈', color: '#34d399', label: 'OLHC = Bullish Bias', desc: 'Open → Low (manipulation down) → High (expansion up) → Close high. Market intended up.' },
                    { icon: '📉', color: '#f87171', label: 'OHLC = Bearish Bias', desc: 'Open → High (manipulation up) → Low (expansion down) → Close low. Market intended down.' },
                    { icon: '😐', color: '#6b7280', label: 'Consolidation', desc: 'Price stays within prev range without sweeping either side = Neutral / No Trade.' },
                ],
                tags: ['OHLC', 'OLHC', 'PO3', 'AMD'],
            },
            {
                step: '02 / 05',
                badge: 'POWER OF THREE',
                badgeColor: '#a78bfa',
                title: 'AMD:',
                titleHighlight: 'The Daily Script',
                subtitle: null,
                body: 'ICT Power of Three (PO3) ពណ៌នា Script ប្រចាំថ្ងៃ: Accumulation (Asian) → Manipulation (London False Move) → Distribution (NY True Move) ។',
                bodyEn: 'Every trading day follows 3 phases: Accumulation (Asian session — range builds, liquidity pools on both sides), Manipulation (London open — fake move against the true bias to trigger stops), Distribution (NY AM session — the real move in the true direction).',
                chart: null,
                tip: 'The Manipulation phase is a TRAP. It moves against the true daily bias to hunt stops and induce retail entries in the wrong direction before the real move.',
                keyPoints: [
                    { icon: '🌙', color: '#6b7280', label: 'Accumulation (Asian)', desc: 'Price consolidates. Both sides build liquidity. Smart money is accumulating positions quietly.' },
                    { icon: '🎭', color: '#fbbf24', label: 'Manipulation (London)', desc: 'Fake move opposite to true bias. Retail enters wrong direction. Stops are hunted.' },
                    { icon: '🚀', color: '#a78bfa', label: 'Distribution (NY AM)', desc: 'True directional move begins. Smart money profits from the accumulated position.' },
                ],
                tags: ['PO3', 'AMD', 'Accumulation', 'Manipulation', 'Distribution'],
            },
            {
                step: '03 / 05',
                badge: 'OHLC DEEP DIVE',
                badgeColor: '#a78bfa',
                title: '5 Candle',
                titleHighlight: 'Formation Types',
                subtitle: null,
                body: 'ICT ចែក Candle ជា ៥ប្រភេទ: Bullish Directional, Bullish Reversal, Bearish Directional, Bearish Reversal, និង Consolidation ។',
                bodyEn: 'Directional candles confirm strong trend continuation. Reversal candles (OLHC Reversal / OHLC Reversal) signal a shift in market sentiment — price ran one way then strongly reversed. Indecision/Consolidation candles mean no clear bias — stay out.',
                chart: null,
                tip: 'The 5 formations appear on ALL timeframes. On the Daily, they define your day. On H4, they define your session. On H1, they define your entry window.',
                keyPoints: [
                    { icon: '↑↑', color: '#34d399', label: 'Bullish Directional', desc: 'OLHC — strong trend up. Open low, close near high. Multiple in a row = strong uptrend.' },
                    { icon: '↓↓', color: '#f87171', label: 'Bearish Directional', desc: 'OHLC — strong trend down. Open high, close near low. Series = strong downtrend.' },
                    { icon: '↓↑', color: '#34d399', label: 'Bullish Reversal', desc: 'Price dips then reverses to close higher than open. Potential bottom signal.' },
                    { icon: '↑↓', color: '#f87171', label: 'Bearish Reversal', desc: 'Price rallies then reverses to close lower than open. Potential top signal.' },
                    { icon: '↔️', color: '#6b7280', label: 'Consolidation', desc: 'Neither buyers nor sellers dominate. No bias — skip this day.' },
                ],
                tags: [],
            },
            {
                step: '04 / 05',
                badge: 'HOW TO READ',
                badgeColor: '#a78bfa',
                title: 'Reading Bias',
                titleHighlight: 'in Real Time',
                subtitle: null,
                body: 'Step-by-step Process: ១) ចាប់ពី Daily Chart → ២) រង់ចាំ Candle Close → ៣) Identify Pattern → ៤) Confirm ជាមួយ HTF Order Flow ។',
                bodyEn: 'Before any trading day: Check the PREVIOUS daily candle\'s close. Did it close above Prev High (Bullish continuation)? Below Prev Low (Bearish continuation)? Swept PDH but failed to close above (Bearish reversal)? Swept PDL but failed to close below (Bullish reversal)? Then align your intraday bias accordingly.',
                chart: null,
                tip: '4 Bias Scenarios: (1) Close above PDH = Bullish continuation. (2) Close below PDL = Bearish continuation. (3) Sweep PDH + close inside = Bearish reversal bias. (4) Sweep PDL + close inside = Bullish reversal bias.',
                keyPoints: [
                    { icon: '⬆️', color: '#34d399', label: 'Close > PDH', desc: 'Strong bullish continuation. Next day bias = Bullish. Target: next HTF high.' },
                    { icon: '⬇️', color: '#f87171', label: 'Close < PDL', desc: 'Strong bearish continuation. Next day bias = Bearish. Target: next HTF low.' },
                    { icon: '🔄', color: '#fbbf24', label: 'Sweep PDH + close inside', desc: 'Bearish reversal — price grabbed BSL but failed to hold. Next bias = Bearish.' },
                    { icon: '🔄', color: '#34d399', label: 'Sweep PDL + close inside', desc: 'Bullish reversal — price grabbed SSL but failed to hold. Next bias = Bullish.' },
                ],
                tags: ['PDH', 'PDL', 'Continuation', 'Reversal'],
            },
            {
                step: '05 / 05',
                badge: 'KEY TAKEAWAY',
                badgeColor: '#a78bfa',
                title: 'Summary:',
                titleHighlight: 'Bias Shifts',
                subtitle: null,
                body: 'Bias ដែលត្រឹមត្រូវ = ១ Half ប្រយ័ត្ន ។ Bias ខុស = ១ ថ្ងៃ បាត់ ។ Learn ​ Power of Three ។',
                bodyEn: 'The Daily Bias is the single most important decision of your trading day. The wrong bias means every setup works against you. Combine: Previous Day close position + OHLC formation + HTF order flow + PO3 script = High-probability daily bias. Then only trade in that direction during the AM Kill Zone.',
                chart: null,
                tip: '💡 Top-down approach: Monthly → Weekly → Daily bias. Only trade on LTF when ALL align in the same direction.',
                keyPoints: [
                    { icon: '🔭', color: '#a78bfa', label: 'Top-Down Analysis', desc: 'Monthly → Weekly → Daily → H4 → H1 → Entry TF. Each level must confirm bias.' },
                    { icon: '⏰', color: '#fbbf24', label: 'Trade Only AM Kill Zone', desc: 'Bias is confirmed by the NY AM open. Distribution (true move) happens 9:30–11:30 NY time.' },
                    { icon: '🚫', color: '#f87171', label: 'No Bias = No Trade', desc: 'If OHLC pattern is indecisive, or HTF context is unclear — sit on hands. Patience is an edge.' },
                ],
                tags: ['Bias', 'OHLC', 'PO3', 'Top-Down'],
            },
        ],
    },

    // ── LESSON 4: PD ARRAYS ────────────────────────────────────────────────────
    {
        id: 'pd-arrays',
        title: 'PD Arrays',
        titleKh: 'Premium & Discount Arrays',
        tag: 'ICT CONCEPT • STRUCTURE',
        tagColor: '#fbbf24',
        icon: '🗺️',
        level: 'Advanced',
        duration: '6 slides',
        description: 'Deep dive into the Premium/Discount Array matrix — Order Blocks, FVGs, Breaker Blocks and how to rank and use them for precise entries.',
        slides: [
            {
                step: '01 / 06',
                badge: 'FOUNDATION',
                badgeColor: '#fbbf24',
                title: 'What Are',
                titleHighlight: 'PD Arrays?',
                subtitle: null,
                body: 'PD Array = Premium & Discount Array ។ ជា Framework ដែល ICT ប្រើ ដើម្បី Map ដែន Price likely ​ to React — ជា Level មួយៗ ក្នុង Dealing Range ។',
                bodyEn: 'PD Arrays are a collection of price zones ranked by importance that ICT traders use to identify where institutions have left footprints — where price is likely to pause, react, or reverse. Think of them as a ranked shopping list of where to buy or sell.',
                chart: null,
                tip: 'PD Array is NOT one tool — it\'s a FRAMEWORK containing Order Blocks, FVGs, Liquidity Voids, Breaker Blocks and more, all organized by their strength.',
                keyPoints: [
                    { icon: '💰', color: '#fbbf24', label: 'Premium Zone (> 50%)', desc: 'Above the 50% Fibonacci of a dealing range. Institutional sellers prefer to sell here.' },
                    { icon: '💸', color: '#34d399', label: 'Discount Zone (< 50%)', desc: 'Below the 50% Fibonacci. Institutional buyers prefer to accumulate here.' },
                    { icon: '⚖️', color: '#6b7280', label: 'Equilibrium (50%)', desc: 'The midpoint. Price at equilibrium has no directional edge — avoid entries here.' },
                ],
                tags: ['Premium', 'Discount', 'Equilibrium', 'Fibonacci'],
            },
            {
                step: '02 / 06',
                badge: 'THE MATRIX',
                badgeColor: '#fbbf24',
                title: 'PD Array',
                titleHighlight: 'Ranking (Matrix)',
                subtitle: null,
                body: 'Arrays ត្រូវ Rank តាម Priority ។ Array ខ្ពស់ជាង → Price ស្ដាប់ More ។ ចេះ Rank = ចេះ Trade ។',
                bodyEn: 'The PD Array Matrix ranks zones by reliability. From strongest to weakest: Old High/Low → Rejection Block → Order Block → Fair Value Gap → Liquidity Void → Breaker Block → Mitigation Block. Higher-ranked arrays are more likely to cause strong reactions.',
                chart: null,
                tip: 'When multiple arrays stack at the same price level (e.g., OB + FVG + PDH), that\'s called CONFLUENCE — the highest probability entry zones.',
                keyPoints: [
                    { icon: '🥇', color: '#fbbf24', label: '1st — Old High / Old Low', desc: 'Previous swing high/low = strongest liquidity pools. Price gravitates to these first.' },
                    { icon: '🥈', color: '#fbbf24', label: '2nd — Rejection Block', desc: 'Long wicks at extremes showing institutional rejection. Strong reaction zones.' },
                    { icon: '🥉', color: '#fbbf24', label: '3rd — Order Block (OB)', desc: 'Last candle before a sharp move. Institutions entered here. High revisit probability.' },
                    { icon: '4️⃣', color: '#fbbf24', label: '4th — Fair Value Gap (FVG)', desc: '3-candle imbalance. Price often returns to "fill" these gaps.' },
                    { icon: '5️⃣', color: '#6b7280', label: '5-7 — Void, Breaker, Mitigation', desc: 'Supporting zones. Use for confluence, not primary entries.' },
                ],
                tags: ['Matrix', 'Ranking', 'Confluence'],
            },
            {
                step: '03 / 06',
                badge: 'ORDER BLOCKS',
                badgeColor: '#fbbf24',
                title: 'Order Blocks',
                titleHighlight: '(OB)',
                subtitle: null,
                body: 'Order Block = Candle ចុងក្រោយ Before ការ Move យ៉ាង Force ។ ជា Zone ដែល Institutions ចូល Market ។ Price ច្រើន Return Back មក OB ។',
                bodyEn: 'A Bullish OB is the last down-close candle before a sharp expansion up — institutions bought there. A Bearish OB is the last up-close candle before a sharp move down. When price returns to an OB, there\'s high probability of a reaction because smart money defends their entry level.',
                chart: null,
                tip: 'Best OBs are: (1) In a discount zone for bullish, premium for bearish, (2) Have a strong displacement candle after them, (3) Leave a FVG between the OB and the move.',
                keyPoints: [
                    { icon: '📗', color: '#34d399', label: 'Bullish OB', desc: 'Last bearish (red) candle before a sharp rally. When price returns = high-prob buy zone.' },
                    { icon: '📕', color: '#f87171', label: 'Bearish OB', desc: 'Last bullish (green) candle before a sharp drop. When price returns = high-prob sell zone.' },
                    { icon: '🎯', color: '#fbbf24', label: 'Mitigation', desc: 'When price returns to the OB level and reacts — this is "mitigating" the OB.' },
                ],
                tags: ['Order Block', 'OB', 'Mitigation'],
            },
            {
                step: '04 / 06',
                badge: 'FAIR VALUE GAPS',
                badgeColor: '#fbbf24',
                title: 'Fair Value Gaps',
                titleHighlight: '(FVG)',
                subtitle: null,
                body: 'FVG = ១ Gap ក្នុង Price ដែល Market Move លឿនណាស់ Block Orders មិន Fill ។ Price ច្រើន Return Back មក Fill FVG ។',
                bodyEn: 'A Fair Value Gap (or Imbalance) is a 3-candle pattern where candle 1\'s wick doesn\'t overlap with candle 3\'s wick, leaving an unfilled gap. BISI (Bullish FVG) = Buy-Side Imbalance Sell-Side Inefficiency, found in discount zones. SIBI (Bearish FVG) = Sell-Side Imbalance Buy-Side Inefficiency, found in premium zones.',
                chart: null,
                tip: 'FVGs act as price magnets. If the daily bias is bullish and price is near a discount BISI (FVG), that\'s a high-probability entry setup — wait for price to enter the gap and reject.',
                keyPoints: [
                    { icon: '🟢', color: '#34d399', label: 'BISI (Bullish FVG)', desc: 'Gap in discount zone. Price returns to fill it → likely reacts up. Entry: bottom of gap, SL below gap.' },
                    { icon: '🔴', color: '#f87171', label: 'SIBI (Bearish FVG)', desc: 'Gap in premium zone. Price returns to fill it → likely reacts down. Entry: top of gap, SL above gap.' },
                    { icon: '🔁', color: '#a78bfa', label: 'Inversion FVG', desc: 'When price blows through the FVG, it often inverts — the support becomes resistance and vice versa.' },
                ],
                tags: ['FVG', 'BISI', 'SIBI', 'Imbalance'],
            },
            {
                step: '05 / 06',
                badge: 'BREAKER BLOCKS',
                badgeColor: '#fbbf24',
                title: 'Breaker Blocks',
                titleHighlight: '& Mitigation',
                subtitle: null,
                body: 'Breaker Block = OB ដែល Failed ។ ពេល Price Breaks through OB → OB ក្លាយជា Breaker (Flip) ។ ជា Zone Strong ណាស់ ។',
                bodyEn: 'A Breaker Block forms when an OB is violated — price breaks through it and returns to it, but now it acts in the OPPOSITE direction (support becomes resistance). This flip is significant because it signals a confirmed structure change. Mitigation Blocks are similar but form from failed swings, not failed OBs.',
                chart: null,
                tip: 'Breaker Blocks are often stronger than regular OBs because they represent a CONFIRMED structural failure — not just an entry point, but a regime change.',
                keyPoints: [
                    { icon: '🔓', color: '#f87171', label: 'Bearish Breaker', desc: 'Bullish OB was violated → becomes resistance. Price sweeps a high, drops through the OB, then returns to it from below.' },
                    { icon: '🔓', color: '#34d399', label: 'Bullish Breaker', desc: 'Bearish OB was violated → becomes support. Price sweeps a low, bounces through the OB, then returns from above.' },
                    { icon: '🔧', color: '#a78bfa', label: 'Mitigation Block', desc: 'Failed swing (no new high/low) forms a zone. Institutions return to "mitigate" their losing positions here.' },
                ],
                tags: ['Breaker Block', 'Mitigation', 'Flip'],
            },
            {
                step: '06 / 06',
                badge: 'KEY TAKEAWAY',
                badgeColor: '#fbbf24',
                title: 'Using PD Arrays',
                titleHighlight: 'in Practice',
                subtitle: null,
                body: 'Don\'t trade every array ។ Use Top-Down Analysis, Select Highest-Ranked Array ដែល align ជាមួយ Bias ។',
                bodyEn: 'Process: (1) Define the Dealing Range (swing high to low), (2) Mark the 50% Fibonacci, (3) With bullish bias, only look for entries in DISCOUNT zones at high-ranked arrays (OB, FVG, Old Low), (4) With bearish bias, only look for entries in PREMIUM zones at high-ranked arrays (OB, FVG, Old High), (5) Enter when price reaches the array + confirmation on LTF.',
                chart: null,
                tip: '💡 The SEQUENCE matters: Bias → Direction → Zone (Premium/Discount) → Array Type → LTF Confirmation → Entry. Don\'t skip steps.',
                keyPoints: [
                    { icon: '📊', color: '#fbbf24', label: 'Define Range First', desc: 'Use a significant swing high and low to define your dealing range. Draw Fibonacci 0–100.' },
                    { icon: '🎯', color: '#34d399', label: 'Buy in Discount at Arrays', desc: 'Bullish bias + discount zone + OB or FVG = highest probability long setup.' },
                    { icon: '🎯', color: '#f87171', label: 'Sell in Premium at Arrays', desc: 'Bearish bias + premium zone + OB or FVG = highest probability short setup.' },
                    { icon: '🔗', color: '#a78bfa', label: 'Confluence = Best Entries', desc: 'When PDH + OB + FVG stack at same level = maximum confluence = tightest SL, best RR.' },
                ],
                tags: ['PD Arrays', 'Top-Down', 'Entry', 'Confluence'],
            },
        ],
    },

    // ── LESSON 5: KILL ZONES ──────────────────────────────────────────────────
    {
        id: 'kill-zones',
        title: 'Kill Zones',
        titleKh: 'ពេលវេលា Trade ល្អបំផុត',
        tag: 'ICT CONCEPT • TIMING',
        tagColor: '#34d399',
        icon: '⏱️',
        level: 'Beginner',
        duration: '5 slides',
        description: 'Master the 4 ICT Kill Zones — the specific time windows when institutions are most active and high-probability setups form. Timing is everything.',
        slides: [
            {
                step: '01 / 05',
                badge: 'WHY TIMING MATTERS',
                badgeColor: '#34d399',
                title: 'Kill Zones:',
                titleHighlight: 'Timing is Everything',
                subtitle: null,
                body: 'ទីផ្សារ Forex ដំណើរការ ២៤ ម៉ោង — ប៉ុន្តែ NOT all hours ស្មើគ្នា ។ Kill Zones = Time Windows ដែល Smart Money Active ជាងគេ ។',
                bodyEn: 'The forex market runs 24 hours, but most significant moves happen in concentrated windows tied to when major institutional desks (London banks, NY funds) begin executing orders. Trading outside these windows means fighting low liquidity, wide spreads, and choppy price action.',
                chart: null,
                tip: 'Trading during Kill Zones dramatically reduces noise. Most ICT setups (OB entries, FVG fills, liquidity grabs) work best during these windows because that\'s when algorithms are running.',
                keyPoints: [
                    { icon: '🌙', color: '#a78bfa', label: 'Asian Kill Zone', desc: '8:00–10:00 PM New York (01:00–03:00 GMT) | GMT+7: 08:00–10:00 AM' },
                    { icon: '🇬🇧', color: '#60a5fa', label: 'London Kill Zone', desc: '2:00–5:00 AM New York (07:00–10:00 GMT) | GMT+7: 14:00–17:00' },
                    { icon: '🇺🇸', color: '#34d399', label: 'New York AM Kill Zone', desc: '7:00–10:00 AM New York (12:00–15:00 GMT) | GMT+7: 19:00–22:00' },
                    { icon: '🔔', color: '#fbbf24', label: 'London Close Kill Zone', desc: '10:00 AM–12:00 PM New York (15:00–17:00 GMT) | GMT+7: 22:00–00:00' },
                ],
                tags: ['Kill Zones', 'Sessions', 'Timing'],
            },
            {
                step: '02 / 05',
                badge: '🌙 ASIAN KILL ZONE',
                badgeColor: '#a78bfa',
                title: 'Asian Kill Zone',
                titleHighlight: '(Accumulation)',
                subtitle: null,
                body: '8:00–10:00 PM NY Time ។ ជា Phase Accumulation របស់ Power of Three ។ Market រង់ចាំ — Range តូច — Liquidity Build up ។',
                bodyEn: 'The Asian Kill Zone (8–10 PM NY) is the Accumulation phase of the daily PO3 script. Price consolidates into a tight range, building liquidity on both sides. This is NOT the time to trade aggressively — it\'s the time to OBSERVE and mark the Asian high and low for later liquidity grabs.',
                chart: null,
                tip: 'Mark the Asian Range High and Low. These become the key liquidity targets for London session. When London opens, one of these levels will likely be swept first.',
                keyPoints: [
                    { icon: '📏', color: '#a78bfa', label: 'Mark Asian Range', desc: 'Draw horizontal lines at Asian session High and Low. These = SSL and BSL for London.' },
                    { icon: '😴', color: '#6b7280', label: 'Low Volatility', desc: 'AUD, NZD, JPY pairs are most active. USD pairs are quiet. Avoid overtrading.' },
                    { icon: '🧠', color: '#a78bfa', label: 'Prep for London', desc: 'Use this time to plan: identify HTF bias, mark key PD arrays, set alerts.' },
                ],
                tags: ['Asian Session', 'Range', 'Accumulation'],
            },
            {
                step: '03 / 05',
                badge: '🇬🇧 LONDON KILL ZONE',
                badgeColor: '#60a5fa',
                title: 'London Kill Zone',
                titleHighlight: '(Manipulation)',
                subtitle: null,
                body: '2:00–5:00 AM NY Time (GMT+7: 14:00–17:00) ។ ជា Phase Manipulation ។ Price ច្រើន Sweep Asian Range ជាមុន — បន្ទាប់មក Move ។',
                bodyEn: 'The London Kill Zone (2–5 AM NY) is the Manipulation phase. Price typically sweeps the Asian range (either high or low) to trigger stops and induce retail entries in the wrong direction. This is the phase that sets the daily High or Low — on bullish days, London sets the Low; on bearish days, London sets the High.',
                chart: null,
                tip: 'On bullish days, London sweeps below Asian low (takes SSL) and reverses up. On bearish days, London sweeps above Asian high (takes BSL) and reverses down. Wait for the sweep + reversal before considering an entry.',
                keyPoints: [
                    { icon: '🎭', color: '#fbbf24', label: 'London = Manipulation', desc: 'The false move happens here. Don\'t be the retail trader buying the breakout — wait for the reversal.' },
                    { icon: '📉', color: '#34d399', label: 'Bullish Days', desc: 'London sweeps Asian Low (SSL grab) → reverses up → London sets the LOW of the day.' },
                    { icon: '📈', color: '#f87171', label: 'Bearish Days', desc: 'London sweeps Asian High (BSL grab) → reverses down → London sets the HIGH of the day.' },
                    { icon: '💱', color: '#60a5fa', label: 'Best Pairs', desc: 'EUR/USD, GBP/USD, XAU/USD — highest volume, tightest spreads during London open.' },
                ],
                tags: ['London', 'Manipulation', 'Judas Swing'],
            },
            {
                step: '04 / 05',
                badge: '🇺🇸 NEW YORK AM',
                badgeColor: '#34d399',
                title: 'New York AM Kill Zone',
                titleHighlight: '(Distribution)',
                subtitle: null,
                body: '7:00–10:00 AM NY Time (GMT+7: 19:00–22:00) ។ ជា Phase Distribution — True Move ។ AM Session 9:30–11:30 = PRIMARY Trading Window ។',
                bodyEn: 'The New York AM Kill Zone (7–10 AM NY) is the Distribution phase — the TRUE directional move of the day. This is when the largest moves happen and when most ICT setups complete. The overlap with London (7–9 AM NY) creates peak liquidity. For XAU/USD specifically, 9:30–11:30 AM NY is the primary execution window.',
                chart: null,
                tip: 'The 10 AM reversal is a common phenomenon — after the initial NY move, price often temporarily reverses around 10 AM NY before continuing. Plan your TP targets accordingly.',
                keyPoints: [
                    { icon: '🚀', color: '#34d399', label: 'True Move Begins', desc: 'Distribution = the real institutional direction. Continuation of the bias established by London reversal.' },
                    { icon: '⭐', color: '#fbbf24', label: 'Primary Window (XAU)', desc: '9:30–11:30 AM NY (20:30–22:30 GMT+7) — highest-probability window for Gold/XAU/USD.' },
                    { icon: '🔄', color: '#a78bfa', label: '10 AM Reversal', desc: 'Around 10:00 AM NY, expect a temporary pullback before continuation. Don\'t panic close.' },
                    { icon: '💵', color: '#34d399', label: 'Best Pairs', desc: 'USD-major pairs, Gold (XAU/USD), NAS100, US30 — all highly active during NY AM.' },
                ],
                tags: ['New York', 'Distribution', 'AM Session', '9:30'],
            },
            {
                step: '05 / 05',
                badge: 'KEY TAKEAWAY',
                badgeColor: '#34d399',
                title: 'Kill Zone',
                titleHighlight: 'Summary',
                subtitle: null,
                body: 'Rule: Trade ONLY during Kill Zones ។ Outside Kill Zones = Low Probability, Choppy, Wide Spread ។ ជ្រើស Kill Zone ១-២ ដែលសាកសម ។',
                bodyEn: 'You don\'t need to trade all 4 kill zones. Pick 1–2 that fit your timezone and schedule, then master them. For traders in GMT+7 (Cambodia), the most practical are: London Kill Zone (14:00–17:00 local) and New York AM Kill Zone (19:00–22:00 local). Focus on these, nothing else.',
                chart: null,
                tip: '💡 Cambodia (GMT+7) Summary: London Kill Zone = 14:00–17:00 | NY AM Kill Zone = 19:00–22:00 | Primary XAU/USD Window = 20:30–22:30',
                keyPoints: [
                    { icon: '🇰🇭', color: '#fbbf24', label: 'GMT+7 Schedule', desc: 'London: 14:00–17:00 | NY AM: 19:00–22:00 | XAU Primary: 20:30–22:30' },
                    { icon: '⚠️', color: '#f87171', label: 'No Trade Zones', desc: 'Before 9:30 AM NY (before 20:30 GMT+7) and after 11:30 AM NY — low prob, skip.' },
                    { icon: '📵', color: '#6b7280', label: 'Outside Kill Zones', desc: 'Close charts. Analyze. Prepare. Rest. The market will always be there tomorrow.' },
                    { icon: '🏆', color: '#34d399', label: 'The Edge', desc: 'Kill Zone trading = fewer trades, higher probability, better risk-reward. Quality over quantity.' },
                ],
                tags: ['Kill Zones', 'GMT+7', 'Cambodia', 'Schedule'],
            },
        ],
    },
]

// ── Candle SVG helpers ────────────────────────────────────────────────────────
function MiniCandle({ x, high, open, close, low, color, w = 14 }) {
    const bullish = close >= open
    const bodyTop = Math.min(open, close)
    const bodyH = Math.max(Math.abs(close - open), 2)
    return (
        <g>
            <line x1={x + w / 2} y1={high} x2={x + w / 2} y2={low} stroke={color} strokeWidth={1.5} />
            <rect x={x} y={bodyTop} width={w} height={bodyH} rx={1.5} fill={color} opacity={bullish ? 1 : 0.85} />
        </g>
    )
}

function ChartIllustration({ type }) {
    const H = 140, W = 300
    const prevHigh = 28, prevLow = 118
    const mid = (prevHigh + prevLow) / 2

    if (type === 'bullish-ohlc') {
        return (
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H }}>
                <line x1={0} y1={prevHigh} x2={W} y2={prevHigh} stroke="#fbbf2450" strokeWidth={1} strokeDasharray="4,3" />
                <line x1={0} y1={prevLow} x2={W} y2={prevLow} stroke="#fbbf2450" strokeWidth={1} strokeDasharray="4,3" />
                <text x={W - 4} y={prevHigh - 4} fontSize={9} fill="#fbbf24" textAnchor="end">Prev High</text>
                <text x={W - 4} y={prevLow + 11} fontSize={9} fill="#fbbf24" textAnchor="end">Prev Low</text>
                {/* Small candles */}
                <MiniCandle x={10} high={65} open={75} close={60} low={80} color="#6b7280" w={12} />
                <MiniCandle x={28} high={60} open={68} close={55} low={72} color="#f87171" w={12} />
                <MiniCandle x={46} high={62} open={70} close={78} low={80} color="#34d399" w={12} />
                <MiniCandle x={64} high={68} open={78} close={72} low={84} color="#f87171" w={12} />
                <MiniCandle x={82} high={72} open={80} close={75} low={86} color="#f87171" w={12} />
                <MiniCandle x={100} high={70} open={78} close={85} low={90} color="#6b7280" w={12} />
                {/* SIBI box */}
                <rect x={96} y={72} width={22} height={16} rx={2} fill="#34d39918" stroke="#34d39940" strokeWidth={1} />
                <text x={107} y={83} fontSize={7} fill="#34d399" textAnchor="middle">SIBI</text>
                {/* Big bullish candle */}
                <MiniCandle x={210} high={prevHigh + 2} open={prevLow - 2} close={prevHigh - 8} low={prevLow + 4} color="#34d399" w={18} />
                <text x={232} y={prevHigh + 4} fontSize={8} fill="#34d399">H</text>
                <text x={232} y={mid} fontSize={8} fill="#34d399">C</text>
                <text x={232} y={prevLow - 2} fontSize={8} fill="#34d399">O</text>
                <text x={232} y={prevLow + 12} fontSize={8} fill="#6b7280">L</text>
                <rect x={203} y={prevHigh - 8} width={36} height={13} rx={3} fill="#34d39920" stroke="#34d39950" />
                <text x={221} y={prevHigh - 1} fontSize={8} fill="#34d399" textAnchor="middle">OLHC</text>
            </svg>
        )
    }
    if (type === 'bearish-ohlc' || type === 'bearish-full') {
        return (
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H }}>
                <line x1={0} y1={prevHigh} x2={W} y2={prevHigh} stroke="#fbbf2450" strokeWidth={1} strokeDasharray="4,3" />
                <line x1={0} y1={prevLow} x2={W} y2={prevLow} stroke="#fbbf2450" strokeWidth={1} strokeDasharray="4,3" />
                <text x={W - 4} y={prevHigh - 4} fontSize={9} fill="#fbbf24" textAnchor="end">Prev High</text>
                <text x={W - 4} y={prevLow + 11} fontSize={9} fill="#fbbf24" textAnchor="end">Prev Low</text>
                {/* Range candles */}
                <MiniCandle x={10} high={65} open={72} close={68} low={78} color="#6b7280" w={12} />
                <MiniCandle x={28} high={55} open={62} close={70} low={72} color="#34d399" w={12} />
                <MiniCandle x={46} high={50} open={56} close={64} low={68} color="#34d399" w={12} />
                <MiniCandle x={64} high={54} open={62} close={56} low={70} color="#f87171" w={12} />
                <MiniCandle x={82} high={58} open={65} close={60} low={74} color="#f87171" w={12} />
                {type === 'bearish-full' && <>
                    <rect x={110} y={62} width={28} height={18} rx={2} fill="#60a5fa18" stroke="#60a5fa40" strokeWidth={1} />
                    <text x={124} y={74} fontSize={7} fill="#60a5fa" textAnchor="middle">SIBI</text>
                </>}
                {/* Big bearish candle */}
                <MiniCandle x={210} high={prevHigh - 4} open={prevHigh - 10} close={prevLow + 6} low={prevLow + 2} color="#f87171" w={18} />
                <text x={232} y={prevHigh} fontSize={8} fill="#f87171">H</text>
                <text x={232} y={prevHigh + 10} fontSize={8} fill="#f87171">O</text>
                <text x={232} y={prevLow + 4} fontSize={8} fill="#f87171">L</text>
                <rect x={203} y={prevHigh - 16} width={36} height={13} rx={3} fill="#f8717120" stroke="#f8717150" />
                <text x={221} y={prevHigh - 8} fontSize={8} fill="#f87171" textAnchor="middle">OHLC</text>
            </svg>
        )
    }
    if (type === 'cisd') {
        return (
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H }}>
                <line x1={0} y1={80} x2={W} y2={80} stroke="#60a5fa40" strokeWidth={1} strokeDasharray="4,3" />
                <text x={W - 4} y={76} fontSize={9} fill="#60a5fa" textAnchor="end">CISD</text>
                <line x1={0} y1={105} x2={W} y2={105} stroke="#fbbf2440" strokeWidth={1} strokeDasharray="4,3" />
                <text x={W - 4} y={118} fontSize={9} fill="#fbbf24" textAnchor="end">Level ថ្ងៃមុន</text>
                {/* Bearish candles */}
                <MiniCandle x={10} high={50} open={60} close={55} low={68} color="#6b7280" w={12} />
                <MiniCandle x={28} high={60} open={70} close={65} low={78} color="#f87171" w={12} />
                <MiniCandle x={46} high={68} open={78} close={73} low={85} color="#f87171" w={12} />
                <MiniCandle x={64} high={72} open={82} close={76} low={90} color="#6b7280" w={12} />
                <MiniCandle x={82} high={80} open={90} close={84} low={98} color="#f87171" w={12} />
                {/* CISD dot */}
                <circle cx={100} cy={100} r={5} fill="#60a5fa" />
                {/* Recovery candles */}
                <MiniCandle x={110} high={88} open={98} close={90} low={102} color="#34d399" w={12} />
                <MiniCandle x={128} high={78} open={88} close={78} low={92} color="#34d399" w={12} />
                <MiniCandle x={146} high={68} open={80} close={68} low={84} color="#34d399" w={12} />
                <MiniCandle x={164} high={58} open={70} close={55} low={74} color="#34d399" w={12} />
                <MiniCandle x={182} high={48} open={60} close={44} low={64} color="#34d399" w={12} />
                {/* Entry arrow */}
                <text x={108} y={44} fontSize={9} fill="#a78bfa" textAnchor="middle">→ Entry M15/M5</text>
            </svg>
        )
    }
    if (type === 'liquidity-grab') {
        return (
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H }}>
                {/* Bullish grab - left side */}
                <text x={5} y={14} fontSize={9} fill="#34d399">Bullish Grab (SSL Sweep)</text>
                <line x1={5} y1={90} x2={140} y2={90} stroke="#f8717150" strokeWidth={1} strokeDasharray="4,3" />
                <text x={138} y={86} fontSize={8} fill="#f87171" textAnchor="end">SSL</text>
                <MiniCandle x={10} high={40} open={50} close={45} low={55} color="#6b7280" w={12} />
                <MiniCandle x={28} high={50} open={58} close={52} low={62} color="#f87171" w={12} />
                <MiniCandle x={46} high={55} open={62} close={60} low={65} color="#6b7280" w={12} />
                {/* Wick sweep candle */}
                <line x1={70} y1={30} x2={70} y2={105} stroke="#34d399" strokeWidth={1.5} />
                <rect x={64} y={50} width={12} height={12} rx={2} fill="#34d399" />
                <circle cx={70} cy={105} r={3} fill="#34d399" opacity={0.6} />
                <text x={70} y={120} fontSize={8} fill="#34d399" textAnchor="middle">Long lower wick</text>
                <MiniCandle x={86} high={32} open={58} close={42} low={60} color="#34d399" w={12} />
                <MiniCandle x={104} high={24} open={44} close={32} low={50} color="#34d399" w={12} />
                {/* Bearish grab - right side */}
                <text x={155} y={14} fontSize={9} fill="#f87171">Bearish Grab (BSL Sweep)</text>
                <line x1={155} y1={55} x2={W} y2={55} stroke="#34d39950" strokeWidth={1} strokeDasharray="4,3" />
                <text x={W - 2} y={51} fontSize={8} fill="#34d399" textAnchor="end">BSL</text>
                <MiniCandle x={158} high={65} open={75} close={70} low={80} color="#6b7280" w={12} />
                <MiniCandle x={176} high={58} open={68} close={72} low={74} color="#34d399" w={12} />
                <MiniCandle x={194} high={52} open={62} close={66} low={68} color="#34d399" w={12} />
                {/* Wick sweep candle */}
                <line x1={218} y1={28} x2={218} y2={85} stroke="#f87171" strokeWidth={1.5} />
                <rect x={212} y={60} width={12} height={12} rx={2} fill="#f87171" />
                <circle cx={218} cy={28} r={3} fill="#f87171" opacity={0.6} />
                <text x={218} y={22} fontSize={8} fill="#f87171" textAnchor="middle">Long upper wick</text>
                <MiniCandle x={232} high={70} open={80} close={90} low={94} color="#f87171" w={12} />
                <MiniCandle x={250} high={78} open={90} close={100} low={102} color="#f87171" w={12} />
            </svg>
        )
    }
    return null
}

function ICTLessons() {
    const [selected, setSelected] = useState(null)
    const [slide, setSlide] = useState(0)

    const lesson = selected !== null ? LESSON_LIBRARY[selected] : null
    const currentSlide = lesson ? lesson.slides[slide] : null

    const goBack = () => { setSelected(null); setSlide(0) }
    const nextSlide = () => { if (slide < lesson.slides.length - 1) setSlide(s => s + 1) }
    const prevSlide = () => { if (slide > 0) setSlide(s => s - 1) }

    // ── Lesson Library ────────────────────────────────────────────────────────
    if (selected === null) {
        return (
            <div>
                <div style={{ marginBottom: 24 }}>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-pri)', margin: 0, letterSpacing: '-0.02em' }}>Trading Lessons</h2>
                    <p style={{ fontSize: 12, color: 'var(--text-mut)', margin: '4px 0 0' }}>ICT concepts · step-by-step guides · in Khmer & English</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                    {LESSON_LIBRARY.map((les, i) => (
                        <div key={les.id} onClick={() => { setSelected(i); setSlide(0) }}
                            style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, cursor: 'pointer', transition: 'all 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = les.tagColor; e.currentTarget.style.background = `${les.tagColor}08` }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-panel)' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                                <div style={{ fontSize: 32 }}>{les.icon}</div>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                    <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: `${les.tagColor}18`, color: les.tagColor, border: `1px solid ${les.tagColor}40`, letterSpacing: '0.06em' }}>{les.level}</span>
                                    <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: 'var(--bg-card)', color: 'var(--text-dim)', letterSpacing: '0.06em' }}>{les.duration}</span>
                                </div>
                            </div>
                            <div style={{ fontSize: 9, fontWeight: 700, color: les.tagColor, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>{les.tag}</div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-pri)', marginBottom: 4 }}>{les.title}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 12, lineHeight: 1.5 }}>{les.titleKh}</div>
                            <p style={{ fontSize: 12, color: 'var(--text-sec)', lineHeight: 1.6, margin: '0 0 14px' }}>{les.description}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: les.tagColor }}>
                                <span>Start Lesson</span>
                                <span>→</span>
                            </div>
                        </div>
                    ))}
                    {/* Coming soon placeholder */}
                    <div style={{ background: 'var(--bg-panel)', border: '1px dashed var(--border)', borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200, opacity: 0.5 }}>
                        <div style={{ fontSize: 32, marginBottom: 10 }}>🔒</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-sec)', marginBottom: 4 }}>More Lessons Coming Soon</div>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'center' }}>SMC, Liquidity, Order Blocks & more</div>
                    </div>
                </div>
            </div>
        )
    }

    // ── Slide Viewer ──────────────────────────────────────────────────────────
    return (
        <div>
            {/* Back + progress header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <button onClick={goBack} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12, color: 'var(--text-sec)', fontFamily: 'var(--font-ui)', fontWeight: 700 }}>← Back</button>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-pri)' }}>{lesson.title}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{currentSlide.step}</div>
                </div>
                {/* Progress dots */}
                <div style={{ display: 'flex', gap: 5 }}>
                    {lesson.slides.map((_, i) => (
                        <div key={i} onClick={() => setSlide(i)} style={{ width: i === slide ? 20 : 6, height: 6, borderRadius: 3, background: i === slide ? lesson.tagColor : i < slide ? `${lesson.tagColor}60` : 'var(--border)', cursor: 'pointer', transition: 'all 0.2s' }} />
                    ))}
                </div>
            </div>

            {/* Slide card */}
            <div style={{ background: 'var(--bg-panel)', border: `1px solid ${currentSlide.badgeColor}30`, borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
                {/* Slide header */}
                <div style={{ padding: '20px 22px 0' }}>
                    <span style={{ display: 'inline-block', fontSize: 9, fontWeight: 800, padding: '4px 10px', borderRadius: 20, background: `${currentSlide.badgeColor}18`, color: currentSlide.badgeColor, border: `1px solid ${currentSlide.badgeColor}40`, letterSpacing: '0.08em', marginBottom: 14 }}>{currentSlide.badge}</span>
                    <h2 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-pri)', margin: 0, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
                        {currentSlide.title}
                        {currentSlide.titleHighlight && <> <span style={{ color: currentSlide.badgeColor }}>{currentSlide.titleHighlight}</span></>}
                    </h2>
                    {currentSlide.subtitle && <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-sec)', marginTop: 4 }}>{currentSlide.subtitle}</div>}
                </div>

                {/* Body text */}
                <div style={{ padding: '14px 22px 0' }}>
                    <p style={{ fontSize: 13, color: 'var(--text-sec)', lineHeight: 1.7, margin: 0 }}>{currentSlide.body}</p>
                    {currentSlide.bodyEn && <p style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.6, margin: '8px 0 0', borderLeft: `2px solid ${currentSlide.badgeColor}40`, paddingLeft: 10 }}>{currentSlide.bodyEn}</p>}
                </div>

                {/* Chart illustration */}
                {currentSlide.chart && (
                    <div style={{ margin: '16px 22px 0', background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', padding: '12px 16px' }}>
                        <ChartIllustration type={currentSlide.chart.type} />
                        <div style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 6, textAlign: 'center', letterSpacing: '0.04em' }}>{currentSlide.chart.description}</div>
                    </div>
                )}

                {/* Key points */}
                {currentSlide.keyPoints && currentSlide.keyPoints.length > 0 && (
                    <div style={{ margin: '16px 22px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {currentSlide.keyPoints.map((pt, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: `${pt.color}0c`, border: `1px solid ${pt.color}25`, borderRadius: 10, padding: '10px 14px' }}>
                                <div style={{ width: 28, height: 28, borderRadius: 8, background: `${pt.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{pt.icon}</div>
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 800, color: pt.color, marginBottom: 2 }}>{pt.label}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.4 }}>{pt.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Tags */}
                {currentSlide.tags && currentSlide.tags.length > 0 && (
                    <div style={{ margin: '14px 22px 0', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {currentSlide.tags.map(t => (
                            <span key={t} style={{ fontSize: 10, padding: '4px 10px', borderRadius: 20, background: 'var(--bg-card)', color: 'var(--text-dim)', border: '1px solid var(--border)' }}>{t}</span>
                        ))}
                    </div>
                )}

                {/* Tip box */}
                {currentSlide.tip && (
                    <div style={{ margin: '14px 22px 20px', background: `${currentSlide.badgeColor}0e`, border: `1px solid ${currentSlide.badgeColor}30`, borderRadius: 10, padding: '10px 14px', borderLeft: `3px solid ${currentSlide.badgeColor}` }}>
                        <div style={{ fontSize: 11, color: currentSlide.badgeColor, lineHeight: 1.6 }}>💡 {currentSlide.tip}</div>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={prevSlide} disabled={slide === 0}
                    style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: slide === 0 ? 'var(--text-dim)' : 'var(--text-sec)', cursor: slide === 0 ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 13, opacity: slide === 0 ? 0.4 : 1 }}>
                    ← Previous
                </button>
                {slide < lesson.slides.length - 1 ? (
                    <button onClick={nextSlide}
                        style={{ flex: 2, padding: '12px', borderRadius: 10, border: 'none', background: lesson.tagColor, color: '#000', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: 13 }}>
                        Next Slide →
                    </button>
                ) : (
                    <button onClick={goBack}
                        style={{ flex: 2, padding: '12px', borderRadius: 10, border: 'none', background: '#34d399', color: '#000', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: 13 }}>
                        ✅ Lesson Complete — Back to Library
                    </button>
                )}
            </div>
        </div>
    )
}


// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
const TABS = [
    { key: 'sessions', label: 'Sessions', icon: '🕐', desc: 'Live market hours' },
    { key: 'risk', label: 'Risk Calc', icon: '⚖️', desc: 'Lot size & R:R' },
    { key: 'prop', label: 'Prop Firm', icon: '🏦', desc: 'Challenge tracker' },
    { key: 'checklist', label: 'Checklist', icon: '✅', desc: 'Pre-trade rules' },
    { key: 'emotion', label: 'Emotion', icon: '🧠', desc: 'Mindset tracker' },
    { key: 'journal', label: 'Journal', icon: '📓', desc: 'Daily reflection' },
    { key: 'heatmap', label: 'Heatmap', icon: '🔥', desc: 'Best times to trade' },
    { key: 'analyzer', label: 'AI Analyzer', icon: '✨', desc: 'Claude Chart Analysis' },
    { key: 'lessons', label: 'Lessons', icon: '🎓', desc: 'ICT trading lessons' },
]

export default function ToolsPage() {
    const [tab, setTab] = useState('sessions')
    const active = TABS.find(t => t.key === tab)
    const { isPro, isAdmin, user } = useAuth()
    const hasAccess = isPro || isAdmin

    // AI Usage — lives here so it persists across tab switches
    const [aiPlan, setAiPlan] = useState('free')
    const [aiFreeCount, setAiFreeCount] = useState(0)
    const [aiUsageLoaded, setAiUsageLoaded] = useState(false)
    const [aiHistory, setAiHistory] = useState([])

    useEffect(() => {
        if (!user?.uid) { setAiUsageLoaded(true); return }
        async function loadUsage() {
            try {
                const { getFirestore, doc, getDoc } = await import('firebase/firestore')
                const db = getFirestore()
                const snap = await getDoc(doc(db, 'users', user.uid, 'aiUsage', 'data'))
                if (snap.exists()) {
                    const d = snap.data()
                    setAiPlan(d.plan || 'free')
                    setAiFreeCount(d.freeCount || 0)
                    setAiHistory(d.history || [])
                }
            } catch (e) {
                console.error('Load AI usage failed:', e)
            } finally {
                setAiUsageLoaded(true)
            }
        }
        loadUsage()
    }, [user?.uid])

    return (
        <Layout openCount={0}>
            {/* Tab bar */}
            <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 14, padding: 6, marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {TABS.map(t => (
                        <button key={t.key} onClick={() => setTab(t.key)} style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9,
                            border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)', transition: 'all 0.15s', whiteSpace: 'nowrap',
                            background: tab === t.key ? 'var(--grad-accent)' : 'transparent',
                            color: tab === t.key ? '#fff' : 'var(--text-sec)',
                            boxShadow: tab === t.key ? 'var(--shadow-btn)' : 'none',
                        }}>
                            <span style={{ fontSize: 15 }}>{t.icon}</span>
                            <span style={{ fontSize: 12, fontWeight: 700 }}>{t.label}</span>
                            {tab !== t.key && <span style={{ fontSize: 10, color: 'var(--text-dim)', display: 'none' }}>{t.desc}</span>}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                {tab === 'sessions' && <SessionClock />}
                {tab === 'risk' && <RiskCalculator />}
                {tab === 'prop' && <PropFirmTracker />}
                {tab === 'checklist' && <PreTradeChecklist />}
                {tab === 'emotion' && <EmotionTag />}
                {tab === 'journal' && <DailyJournal />}
                {tab === 'heatmap' && <Heatmap />}
                {tab === 'analyzer' && (
                    <AIChartAnalyzer
                        aiPlan={aiPlan} setAiPlan={setAiPlan}
                        aiFreeCount={aiFreeCount} setAiFreeCount={setAiFreeCount}
                        aiUsageLoaded={aiUsageLoaded}
                        aiHistory={aiHistory} setAiHistory={setAiHistory}
                    />
                )}
                {tab === 'lessons' && (
                    hasAccess ? <ICTLessons /> : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center' }}>
                            <div style={{ fontSize: 52, marginBottom: 16 }}>🔒</div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-pri)', marginBottom: 8 }}>Pro Feature</div>
                            <div style={{ fontSize: 13, color: 'var(--text-sec)', lineHeight: 1.7, marginBottom: 24, maxWidth: 360 }}>
                                ICT Lessons are available on the Pro plan. Upgrade to unlock all lessons, AI Analyzer unlimited access, and more.
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, maxWidth: 340, width: '100%', marginBottom: 20 }}>
                                {[
                                    { label: '🎓', text: 'ICT Lessons Library' },
                                    { label: '🤖', text: 'Unlimited AI Analysis' },
                                    { label: '📊', text: 'Full Analytics Access' },
                                    { label: '♾️', text: 'Unlimited Trades' },
                                ].map(({ label, text }) => (
                                    <div key={text} style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px', fontSize: 12, color: 'var(--text-sec)' }}>
                                        {label} {text}
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <div style={{ padding: '10px 24px', borderRadius: 10, background: 'var(--bg-panel)', border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-sec)' }}>
                                    Monthly — $25/mo
                                </div>
                                <div style={{ padding: '10px 24px', borderRadius: 10, background: 'var(--grad-accent)', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
                                    Yearly — $12.50/mo 💰
                                </div>
                            </div>
                        </div>
                    )
                )}
            </div>
        </Layout>
    )
}