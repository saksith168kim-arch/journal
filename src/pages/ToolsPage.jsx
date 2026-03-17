// src/pages/ToolsPage.jsx
import { useState, useEffect, useRef, useMemo } from 'react'
import Layout from '../components/layout/Layout'
import { useTrades } from '../hooks/useTrades'
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

            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
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
]

export default function ToolsPage() {
    const [tab, setTab] = useState('sessions')
    const active = TABS.find(t => t.key === tab)

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
            </div>
        </Layout>
    )
}