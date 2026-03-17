// src/pages/DisciplinePage.jsx
import { useState, useEffect, useMemo } from 'react'
import { useTrades } from '../hooks/useTrades'
import { calcTrade, calcPortfolioStats, fmt$ } from '../lib/calc'
import Layout from '../components/layout/Layout'
import { Spinner } from '../components/ui'
import { useLang } from '../context/LanguageContext'

const mono = { fontFamily: 'var(--font-mono)' }
const card = (extra = {}) => ({ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, ...extra })

// ─── Daily Target ─────────────────────────────────────────────────────────────
function DailyTarget({ trades }) {
  const [target, setTarget] = useState(() => parseFloat(localStorage.getItem('daily_target') || '0'))
  const [editing, setEditing] = useState(false)
  const [input, setInput] = useState('')

  const today = new Date().toISOString().split('T')[0]
  const todayTrades = trades.filter(t => t.date?.startsWith(today))
  const todayPnl = todayTrades.reduce((s, t) => { try { return s + (calcTrade(t).netPnl || 0) } catch { return s } }, 0)
  const pct = target > 0 ? Math.min(100, Math.max(0, (todayPnl / target) * 100)) : 0
  const overTarget = target > 0 && todayPnl >= target

  const save = () => {
    const v = parseFloat(input) || 0
    setTarget(v)
    localStorage.setItem('daily_target', String(v))
    setEditing(false)
  }

  const barColor = overTarget ? '#34d399' : pct > 60 ? '#fbbf24' : todayPnl < 0 ? '#f87171' : '#60a5fa'

  return (
    <div style={card()}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-pri)' }}>🎯 Daily Profit Target</div>
          <div style={{ fontSize: 11, color: 'var(--text-mut)', marginTop: 2 }}>{today}</div>
        </div>
        <button onClick={() => { setInput(String(target)); setEditing(true) }} style={{ fontSize: 11, padding: '5px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-sec)', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>
          {target > 0 ? 'Edit' : 'Set Target'}
        </button>
      </div>

      {editing && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input autoFocus value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && save()}
            placeholder="e.g. 200" type="number"
            style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--acc-main)', borderRadius: 8, padding: '8px 12px', color: 'var(--text-pri)', fontSize: 13, outline: 'none', fontFamily: mono.fontFamily }} />
          <button onClick={save} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--grad-accent)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontFamily: 'var(--font-ui)' }}>Save</button>
        </div>
      )}

      {target > 0 ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 32, fontWeight: 900, color: todayPnl >= 0 ? '#34d399' : '#f87171', ...mono }}>{todayPnl >= 0 ? '+' : ''}${Math.abs(todayPnl).toFixed(2)}</div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>today's P&L · {todayTrades.length} trades</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: barColor, ...mono }}>{pct.toFixed(0)}%</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>of ${target}</div>
            </div>
          </div>

          <div style={{ height: 12, background: 'var(--bg-card)', borderRadius: 6, overflow: 'hidden', marginBottom: 10 }}>
            <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 6, transition: 'width 0.5s ease', boxShadow: overTarget ? `0 0 12px ${barColor}` : 'none' }} />
          </div>

          <div style={{ fontSize: 13, fontWeight: 700, color: barColor }}>
            {overTarget ? '🏆 Target reached! Great discipline.' :
              todayPnl < 0 ? `⚠️ Down $${Math.abs(todayPnl).toFixed(2)} today — stay focused` :
                pct > 0 ? `${fmt$((target - todayPnl))} remaining to target` :
                  'No trades yet today'}
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-dim)', fontSize: 13 }}>
          Set a daily profit target to track your progress
        </div>
      )}
    </div>
  )
}

// ─── Weekly Report Card ───────────────────────────────────────────────────────
function WeeklyReport({ trades }) {
  const [weekOffset, setWeekOffset] = useState(0)

  const { weekTrades, weekStart, weekEnd, weekStats, grade, gradeColor, dayBreakdown } = useMemo(() => {
    const now = new Date()
    const day = now.getDay()
    const monday = new Date(now)
    monday.setDate(now.getDate() - ((day + 6) % 7) + weekOffset * 7)
    monday.setHours(0, 0, 0, 0)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    sunday.setHours(23, 59, 59, 999)

    const wStart = monday.toISOString().split('T')[0]
    const wEnd = sunday.toISOString().split('T')[0]

    const wTrades = trades.filter(t => t.date >= wStart && t.date <= wEnd)
    const wCalcs = wTrades.map(t => { try { return { t, pnl: calcTrade(t).netPnl || 0 } } catch { return { t, pnl: 0 } } })

    const totalPnl = wCalcs.reduce((s, c) => s + c.pnl, 0)
    const wins = wCalcs.filter(c => c.t.status === 'WIN').length
    const losses = wCalcs.filter(c => c.t.status === 'LOSS').length
    const total = wTrades.filter(t => t.status).length
    const wr = total > 0 ? (wins / total) * 100 : 0

    // Grade logic
    let g = 'C'
    if (totalPnl > 0 && wr >= 70) g = 'A'
    else if (totalPnl > 0 && wr >= 55) g = 'B'
    else if (totalPnl >= 0 && wr >= 40) g = 'C'
    else if (totalPnl < 0 && wr >= 40) g = 'D'
    else g = 'F'
    if (wTrades.length === 0) g = '—'

    const gColor = { A: '#34d399', B: '#60a5fa', C: '#fbbf24', D: '#fb923c', F: '#f87171', '—': 'var(--text-dim)' }[g]

    // Day breakdown Mon-Fri
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const dayData = days.map((day, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      const dateStr = d.toISOString().split('T')[0]
      const dayCalcs = wCalcs.filter(c => c.t.date?.startsWith(dateStr))
      const pnl = dayCalcs.reduce((s, c) => s + c.pnl, 0)
      return { day, date: dateStr, pnl, count: dayCalcs.length }
    })

    return { weekTrades: wTrades, weekStart: wStart, weekEnd: wEnd, weekStats: { totalPnl, wins, losses, total, wr }, grade: g, gradeColor: gColor, dayBreakdown: dayData }
  }, [trades, weekOffset])

  const maxAbsPnl = Math.max(...dayBreakdown.map(d => Math.abs(d.pnl)), 1)

  return (
    <div style={card()}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-pri)' }}>📋 Weekly Report Card</div>
          <div style={{ fontSize: 11, color: 'var(--text-mut)', marginTop: 2 }}>{weekStart} → {weekEnd}</div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => setWeekOffset(o => o - 1)} style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-sec)', cursor: 'pointer', fontSize: 14 }}>‹</button>
          <button onClick={() => setWeekOffset(0)} disabled={weekOffset === 0} style={{ padding: '0 10px', height: 30, borderRadius: 7, border: '1px solid var(--border)', background: weekOffset === 0 ? 'var(--acc-subtle)' : 'transparent', color: weekOffset === 0 ? 'var(--acc-main)' : 'var(--text-sec)', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-ui)', fontWeight: 600 }}>This week</button>
          <button onClick={() => setWeekOffset(o => Math.min(0, o + 1))} disabled={weekOffset === 0} style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: weekOffset === 0 ? 'var(--text-dim)' : 'var(--text-sec)', cursor: weekOffset === 0 ? 'default' : 'pointer', fontSize: 14, opacity: weekOffset === 0 ? 0.4 : 1 }}>›</button>
        </div>
      </div>

      {weekTrades.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-dim)', fontSize: 13 }}>No trades this week</div>
      ) : (
        <>
          {/* Grade + summary row */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'stretch' }}>
            <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: '16px 20px', textAlign: 'center', minWidth: 70 }}>
              <div style={{ fontSize: 42, fontWeight: 900, color: gradeColor, ...mono, lineHeight: 1 }}>{grade}</div>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Grade</div>
            </div>
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { lbl: 'Net P&L', val: `${weekStats.totalPnl >= 0 ? '+' : ''}$${Math.abs(weekStats.totalPnl).toFixed(2)}`, color: weekStats.totalPnl >= 0 ? '#34d399' : '#f87171' },
                { lbl: 'Win Rate', val: `${weekStats.wr.toFixed(0)}%`, color: weekStats.wr >= 60 ? '#34d399' : weekStats.wr >= 40 ? '#fbbf24' : '#f87171' },
                { lbl: 'Trades', val: weekStats.total, color: 'var(--text-pri)' },
                { lbl: 'W / L', val: `${weekStats.wins}W · ${weekStats.losses}L`, color: 'var(--text-sec)' },
              ].map(({ lbl, val, color }) => (
                <div key={lbl} style={{ background: 'var(--bg-card)', borderRadius: 9, padding: '10px 12px' }}>
                  <div style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>{lbl}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color, ...mono }}>{val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Day-by-day bars */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 80, marginBottom: 8 }}>
            {dayBreakdown.map(({ day, pnl, count }) => {
              const h = count > 0 ? Math.max(8, (Math.abs(pnl) / maxAbsPnl) * 64) : 4
              const col = pnl > 0 ? '#34d399' : pnl < 0 ? '#f87171' : 'var(--border)'
              return (
                <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ fontSize: 9, color: pnl !== 0 ? col : 'var(--text-dim)', fontWeight: 700, ...mono, whiteSpace: 'nowrap' }}>
                    {count > 0 ? `${pnl >= 0 ? '+' : ''}$${Math.abs(pnl).toFixed(0)}` : ''}
                  </div>
                  <div style={{ width: '100%', height: h, background: col, borderRadius: 4, opacity: count === 0 ? 0.2 : 1, transition: 'height 0.3s' }} />
                  <div style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 600 }}>{day}</div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Discipline Score ─────────────────────────────────────────────────────────
function DisciplineScore({ trades }) {
  const DEFAULT_RULES = [
    { id: 1, text: 'Only trade during planned sessions', checked: false },
    { id: 2, text: 'No trades after 2 consecutive losses', checked: false },
    { id: 3, text: 'Risk max 1% per trade', checked: false },
    { id: 4, text: 'No revenge trading', checked: false },
    { id: 5, text: 'Wait for confirmation before entry', checked: false },
  ]
  const [rules, setRules] = useState(() => {
    try { return JSON.parse(localStorage.getItem('discipline_rules') || 'null') || DEFAULT_RULES }
    catch { return DEFAULT_RULES }
  })
  const [violations, setViolations] = useState(() => {
    try { return JSON.parse(localStorage.getItem('rule_violations') || '[]') } catch { return [] }
  })
  const [newRule, setNewRule] = useState('')
  const [showViolation, setShowViolation] = useState(false)
  const [violationNote, setViolationNote] = useState('')

  useEffect(() => { localStorage.setItem('discipline_rules', JSON.stringify(rules)) }, [rules])
  useEffect(() => { localStorage.setItem('rule_violations', JSON.stringify(violations)) }, [violations])

  const toggle = id => setRules(r => r.map(x => x.id === id ? { ...x, checked: !x.checked } : x))
  const addRule = () => { if (!newRule.trim()) return; setRules(r => [...r, { id: Date.now(), text: newRule.trim(), checked: false }]); setNewRule('') }
  const removeRule = id => setRules(r => r.filter(x => x.id !== id))
  const logViolation = () => {
    if (!violationNote.trim()) return
    setViolations(v => [{ id: Date.now(), note: violationNote, date: new Date().toISOString().split('T')[0], cost: '' }, ...v])
    setViolationNote('')
    setShowViolation(false)
  }

  const checked = rules.filter(r => r.checked).length
  const pct = rules.length > 0 ? Math.round(checked / rules.length * 100) : 0
  const scoreColor = pct === 100 ? '#34d399' : pct >= 60 ? '#fbbf24' : '#f87171'

  const totalViolationCost = violations.reduce((s, v) => s + (parseFloat(v.cost) || 0), 0)

  return (
    <div style={card()}>
      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-pri)', marginBottom: 4 }}>🧠 Discipline Tracker</div>
      <div style={{ fontSize: 11, color: 'var(--text-mut)', marginBottom: 16 }}>Check your rules before each trade session</div>

      {/* Score ring */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20, background: 'var(--bg-card)', borderRadius: 12, padding: '14px 18px' }}>
        <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
          <svg width="72" height="72" viewBox="0 0 72 72">
            <circle cx="36" cy="36" r="28" fill="none" stroke="var(--bg-hover)" strokeWidth="8" />
            <circle cx="36" cy="36" r="28" fill="none" stroke={scoreColor} strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 28}`}
              strokeDashoffset={`${2 * Math.PI * 28 * (1 - pct / 100)}`}
              strokeLinecap="round"
              transform="rotate(-90 36 36)"
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: scoreColor, ...mono }}>{pct}%</div>
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-pri)' }}>
            {pct === 100 ? '✅ Ready to Trade' : pct >= 60 ? '⚠️ Almost Ready' : '❌ Not Ready'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-sec)', marginTop: 4 }}>{checked} of {rules.length} rules confirmed</div>
          {violations.length > 0 && <div style={{ fontSize: 11, color: '#f87171', marginTop: 4 }}>⚠ {violations.length} violations logged {totalViolationCost > 0 ? `· $${totalViolationCost.toFixed(2)} lost` : ''}</div>}
        </div>
      </div>

      {/* Rules list */}
      <div style={{ marginBottom: 14 }}>
        {rules.map(rule => (
          <div key={rule.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
            <button onClick={() => toggle(rule.id)} style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, cursor: 'pointer', border: `2px solid ${rule.checked ? '#34d399' : 'var(--border)'}`, background: rule.checked ? '#34d399' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
              {rule.checked && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            </button>
            <span style={{ flex: 1, fontSize: 13, color: rule.checked ? 'var(--text-dim)' : 'var(--text-pri)', textDecoration: rule.checked ? 'line-through' : 'none' }}>{rule.text}</span>
            <button onClick={() => removeRule(rule.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 16, padding: '0 4px', opacity: 0.4, flexShrink: 0 }} onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => e.currentTarget.style.opacity = '0.4'}>×</button>
          </div>
        ))}
      </div>

      {/* Add rule */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input value={newRule} onChange={e => setNewRule(e.target.value)} onKeyDown={e => e.key === 'Enter' && addRule()} placeholder="Add a trading rule..." style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text-pri)', fontSize: 12, outline: 'none', fontFamily: 'var(--font-ui)' }} />
        <button onClick={addRule} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: 'var(--grad-accent)', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-ui)' }}>Add</button>
      </div>

      {/* Reset + log violation */}
      <div style={{ display: 'flex', gap: 8, marginBottom: showViolation ? 12 : 0 }}>
        <button onClick={() => setRules(r => r.map(x => ({ ...x, checked: false })))} style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-sec)', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-ui)' }}>↺ Reset for new session</button>
        <button onClick={() => setShowViolation(v => !v)} style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1px solid #f8717140', background: '#f8717110', color: '#f87171', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-ui)', fontWeight: 600 }}>⚠ Log Violation</button>
      </div>

      {showViolation && (
        <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
          <input autoFocus value={violationNote} onChange={e => setViolationNote(e.target.value)} onKeyDown={e => e.key === 'Enter' && logViolation()} placeholder="What rule did you break?" style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid #f8717160', borderRadius: 8, padding: '8px 12px', color: 'var(--text-pri)', fontSize: 12, outline: 'none', fontFamily: 'var(--font-ui)' }} />
          <button onClick={logViolation} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#f87171', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-ui)' }}>Log</button>
        </div>
      )}

      {/* Violations log */}
      {violations.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>⚠ Violations Log ({violations.length})</div>
          <div style={{ maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {violations.map(v => (
              <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8717108', border: '1px solid #f8717125', borderRadius: 8, padding: '8px 12px' }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-pri)' }}>{v.note}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>{v.date}</div>
                </div>
                <button onClick={() => setViolations(vs => vs.filter(x => x.id !== v.id))} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 14, opacity: 0.5 }}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Cooldown Lock ────────────────────────────────────────────────────────────
function CooldownLock({ trades }) {
  const [cooldownMins, setCooldownMins] = useState(() => parseInt(localStorage.getItem('cooldown_mins') || '30'))
  const [locked, setLocked] = useState(false)
  const [lockEnd, setLockEnd] = useState(() => {
    const v = localStorage.getItem('lock_end')
    return v ? new Date(v) : null
  })
  const [consecutiveLosses, setConsecutiveLosses] = useState(0)
  const [now, setNow] = useState(new Date())

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t) }, [])

  // Detect consecutive losses from recent trades
  useEffect(() => {
    const sorted = [...trades].filter(t => t.status === 'WIN' || t.status === 'LOSS').sort((a, b) => new Date(b.date) - new Date(a.date))
    let count = 0
    for (const t of sorted) { if (t.status === 'LOSS') count++; else break }
    setConsecutiveLosses(count)
  }, [trades])

  const isLocked = lockEnd && new Date(lockEnd) > now
  const remaining = isLocked ? Math.max(0, Math.ceil((new Date(lockEnd) - now) / 1000)) : 0
  const remainingMins = Math.floor(remaining / 60)
  const remainingSecs = remaining % 60

  const triggerLock = () => {
    const end = new Date(Date.now() + cooldownMins * 60 * 1000)
    setLockEnd(end)
    localStorage.setItem('lock_end', end.toISOString())
  }
  const unlock = () => {
    setLockEnd(null)
    localStorage.removeItem('lock_end')
  }

  return (
    <div style={{ ...card(), border: isLocked ? '1px solid #f8717150' : consecutiveLosses >= 2 ? '1px solid #fbbf2450' : '1px solid var(--border)', background: isLocked ? '#f8717108' : 'var(--bg-panel)' }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-pri)', marginBottom: 4 }}>🔒 Cooldown Lock</div>
      <div style={{ fontSize: 11, color: 'var(--text-mut)', marginBottom: 16 }}>Auto-detects consecutive losses and helps you step away</div>

      {consecutiveLosses >= 2 && !isLocked && (
        <div style={{ background: '#fbbf2415', border: '1px solid #fbbf2450', borderRadius: 10, padding: '12px 14px', marginBottom: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 22 }}>⚠️</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24' }}>{consecutiveLosses} consecutive losses detected</div>
            <div style={{ fontSize: 11, color: 'var(--text-sec)', marginTop: 2 }}>Consider taking a break to reset mentally</div>
          </div>
        </div>
      )}

      {isLocked ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: 48, ...mono, fontWeight: 900, color: '#f87171', lineHeight: 1 }}>{String(remainingMins).padStart(2, '0')}:{String(remainingSecs).padStart(2, '0')}</div>
          <div style={{ fontSize: 13, color: 'var(--text-sec)', marginTop: 8, marginBottom: 16 }}>Step away, breathe, review your trades</div>
          <button onClick={unlock} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-sec)', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-ui)' }}>Override (not recommended)</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Cooldown Duration</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[15, 30, 60, 120].map(m => (
                <button key={m} onClick={() => { setCooldownMins(m); localStorage.setItem('cooldown_mins', String(m)) }} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: `1.5px solid ${cooldownMins === m ? 'var(--acc-main)' : 'var(--border)'}`, background: cooldownMins === m ? 'var(--acc-subtle)' : 'transparent', color: cooldownMins === m ? 'var(--acc-main)' : 'var(--text-sec)', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-ui)' }}>{m < 60 ? `${m}m` : `${m / 60}h`}</button>
              ))}
            </div>
          </div>
          <button onClick={triggerLock} style={{ width: '100%', padding: '11px', borderRadius: 10, border: 'none', background: consecutiveLosses >= 2 ? '#f87171' : 'var(--grad-accent)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-ui)' }}>
            🔒 Start {cooldownMins < 60 ? `${cooldownMins}min` : `${cooldownMins / 60}hr`} Cooldown
          </button>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'center' }}>Current losing streak: <span style={{ color: consecutiveLosses >= 2 ? '#f87171' : consecutiveLosses >= 1 ? '#fbbf24' : '#34d399', fontWeight: 700 }}>{consecutiveLosses}</span></div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DisciplinePage() {
  const { trades, loading } = useTrades()
  const { t } = useLang()
  const stats = useMemo(() => calcPortfolioStats(trades), [trades])

  if (loading) return <Layout openCount={0}><Spinner /></Layout>

  return (
    <Layout openCount={stats.openCount}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-pri)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          🧠 Discipline Hub
        </h1>
        <p style={{ fontSize: 12, color: 'var(--text-mut)', margin: '4px 0 0' }}>Your edge lives in your discipline — track it daily</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        <DailyTarget trades={trades} />
        <WeeklyReport trades={trades} />
        <DisciplineScore trades={trades} />
        <CooldownLock trades={trades} />
      </div>
    </Layout>
  )
}