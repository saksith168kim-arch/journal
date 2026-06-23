// src/pages/JournalPage.jsx
import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTrades } from '../hooks/useTrades'
import { calcTrade, fmt$, pnlColor, calcPortfolioStats } from '../lib/calc'
import { exportTradesToCSV, importTradesFromCSV } from '../lib/csv'
import { Tag, StatCard, Button, Spinner, EmptyState, ConfirmModal } from '../components/ui'
import TradeDetail from '../components/trades/TradeDetail'
import Layout from '../components/layout/Layout'
import { useLang } from '../context/LanguageContext'

const STRATEGIES = ['Breakout', 'Trend Following', 'Mean Reversion', 'Scalping', 'Swing Trade', 'Momentum', 'News Play', 'Options Strategy', 'Custom']
const PAGE_SIZE = 50
// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtUSD = (n) => (n == null ? '—' : (n < 0 ? '-' : '') + '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' USD')
const fmtPnl = (n) => {
  if (n == null) return '—'
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : '+'
  return sign + '$' + (abs >= 1000 ? (abs / 1000).toFixed(1) + 'K' : abs.toFixed(2))
}

const CHART_COLORS = ['#6b7ff7', '#f59e0b', '#ec4899', '#34d399', '#f87171', '#60a5fa']

// ─── Donut chart ──────────────────────────────────────────────────────────────
function DonutChart({ slices, mode, centerLabel }) {
  // For winrate mode, each slice should be proportional to its own winrate
  // We normalize by showing each symbol's winrate as a fraction of the total
  const values = slices.map(s => s.value)
  const total = values.reduce((s, x) => s + x, 0)

  let cumul = 0
  const R = 70, CX = 90, SW = 22
  const paths = slices.map((sl, i) => {
    const pct = total > 0 ? sl.value / total : 0
    if (pct <= 0) return null
    if (pct >= 1) return (
      <circle key={i} cx={CX} cy={CX} r={R} fill="none"
        stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={SW} />
    )
    const startAngle = cumul * 2 * Math.PI - Math.PI / 2
    cumul += pct
    const endAngle = cumul * 2 * Math.PI - Math.PI / 2
    const x1 = CX + R * Math.cos(startAngle), y1 = CX + R * Math.sin(startAngle)
    const x2 = CX + R * Math.cos(endAngle), y2 = CX + R * Math.sin(endAngle)
    return (
      <path key={i}
        d={`M ${x1} ${y1} A ${R} ${R} 0 ${pct > 0.5 ? 1 : 0} 1 ${x2} ${y2}`}
        fill="none" stroke={CHART_COLORS[i % CHART_COLORS.length]}
        strokeWidth={SW} strokeLinecap="butt" />
    )
  })

  return (
    <svg viewBox={`0 0 ${CX * 2} ${CX * 2}`} style={{ width: 140, height: 140 }}>
      <circle cx={CX} cy={CX} r={R} fill="none" stroke="var(--border)" strokeWidth={SW} />
      {paths}
      {centerLabel && (
        <>
          <text x={CX} y={CX - 4} textAnchor="middle" fontSize="18" fontWeight="800"
            fill="var(--text-pri)" fontFamily="var(--font-mono)">{centerLabel.main}</text>
          <text x={CX} y={CX + 14} textAnchor="middle" fontSize="9"
            fill="var(--text-dim)" fontFamily="var(--font-ui)">{centerLabel.sub}</text>
        </>
      )}
    </svg>
  )
}

// ─── Equity curve ─────────────────────────────────────────────────────────────
function EquityLine({ trades, range }) {
  const points = useMemo(() => {
    const now = new Date()
    const cutoff = range === '1W' ? new Date(now - 7 * 864e5)
      : range === '1M' ? new Date(now - 30 * 864e5)
      : range === '3M' ? new Date(now - 90 * 864e5)
      : null

    let cum = 0
    return [...trades]
      .filter(t => t.date && t.status !== 'OPEN')
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .filter(t => !cutoff || new Date(t.date) >= cutoff)
      .map(t => { cum += calcTrade(t).netPnl ?? 0; return cum })
  }, [trades, range])

  if (points.length < 2) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-dim)', fontSize: 13 }}>
      Not enough data
    </div>
  )

  const W = 860, H = 220, min = Math.min(...points), max = Math.max(...points), range2 = max - min || 1
  const xs = points.map((_, i) => (i / (points.length - 1)) * W)
  const ys = points.map(p => H - ((p - min) / range2) * (H - 20) - 10)
  const area = `M ${xs[0]},${H} ` + xs.map((x, i) => `L ${x},${ys[i]}`).join(' ') + ` L ${xs[xs.length - 1]},${H} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%' }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="eq-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--acc-main)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--acc-main)" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#eq-grad)" />
      <polyline points={xs.map((x, i) => `${x},${ys[i]}`).join(' ')} fill="none" stroke="var(--acc-main)" strokeWidth="2" strokeLinejoin="round" />
      <rect x={W - 68} y={ys[ys.length - 1] - 11} width={66} height={22} rx={4} fill="var(--acc-main)" />
      <text x={W - 35} y={ys[ys.length - 1] + 5} fill="var(--text-inv)" fontSize="11" textAnchor="middle" fontFamily="var(--font-mono)">
        {fmtPnl(points[points.length - 1])}
      </text>
    </svg>
  )
}

// ─── Risk/Reward chart ────────────────────────────────────────────────────────
function RRChart({ trades }) {
  const { winPts, lossPts, total } = useMemo(() => {
    const sorted = [...trades].filter(t => t.date).sort((a, b) => new Date(a.date) - new Date(b.date))
    const winPts = [], lossPts = []
    sorted.forEach((t, i) => {
      const pnl = calcTrade(t).netPnl ?? 0
      if (pnl >= 0) winPts.push({ i, v: pnl }); else lossPts.push({ i, v: Math.abs(pnl) })
    })
    return { winPts, lossPts, total: sorted.length }
  }, [trades])
  if (total < 2) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-dim)', fontSize: 13 }}>Not enough data</div>
  const W = 560, H = 220, maxV = Math.max(...[...winPts, ...lossPts].map(p => p.v), 1)
  const toX = (i) => (i / (total - 1)) * W
  const toY = (v) => H - (v / maxV) * (H - 20) - 10
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%' }} preserveAspectRatio="none">
      {[0.25, 0.5, 0.75].map(r => <line key={r} x1={0} y1={toY(maxV * r)} x2={W} y2={toY(maxV * r)} stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4" />)}
      {winPts.length > 1 && <polyline points={winPts.map(p => `${toX(p.i)},${toY(p.v)}`).join(' ')} fill="none" stroke="var(--col-win)" strokeWidth="1.5" strokeLinejoin="round" />}
      {lossPts.length > 1 && <polyline points={lossPts.map(p => `${toX(p.i)},${toY(p.v)}`).join(' ')} fill="none" stroke="var(--col-loss)" strokeWidth="1.5" strokeLinejoin="round" />}
    </svg>
  )
}

// ─── PnL Calendar ────────────────────────────────────────────────────────────
function PnlCalendar({ trades }) {
  const [cursor, setCursor] = useState(() => { const n = new Date(); return { year: n.getFullYear(), month: n.getMonth() } })
  const { year, month } = cursor
  const todayStr = (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}` })()

  const dayMap = useMemo(() => {
    const map = {}
    trades.forEach(tr => {
      if (!tr.date) return
      const key = tr.date.slice(0, 10)
      const d = new Date(key)
      if (d.getFullYear() !== year || d.getMonth() !== month) return
      if (!map[key]) map[key] = { pnl: 0, count: 0 }
      map[key].pnl += calcTrade(tr).netPnl ?? 0
      map[key].count += 1
    })
    return map
  }, [trades, year, month])

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startOffset = firstDay.getDay()
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const mkKey = (d) => d ? `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}` : null
  const cells = []
  for (let i = 0; i < 42; i++) { const dn = i - startOffset + 1; cells.push(dn >= 1 && dn <= lastDay.getDate() ? dn : null) }
  const weeks = []
  for (let w = 0; w < 6; w++) { const s = cells.slice(w*7, w*7+7); if (s.some(d => d !== null)) weeks.push(s) }
  const monthPnl = Object.values(dayMap).reduce((s, v) => s + v.pnl, 0)
  const monthTrades = Object.values(dayMap).reduce((s, v) => s + v.count, 0)
  const border = '1px solid var(--border)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderBottom: border }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button onClick={() => setCursor(c => { const d = new Date(c.year, c.month-1); return { year: d.getFullYear(), month: d.getMonth() } })}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-mut)', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}>‹</button>
          <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-pri)', minWidth: 130 }}>{new Date(year, month, 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
          <button onClick={() => setCursor(c => { const d = new Date(c.year, c.month+1); return { year: d.getFullYear(), month: d.getMonth() } })}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-mut)', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}>›</button>
          <button onClick={() => { const n = new Date(); setCursor({ year: n.getFullYear(), month: n.getMonth() }) }}
            style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-mut)', cursor: 'pointer', fontSize: 10, padding: '2px 6px', borderRadius: 4 }}>Today</button>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ textAlign: 'right' }}><div style={{ fontSize: 10, color: 'var(--text-dim)' }}>Month P&L</div><div style={{ fontSize: 12, fontWeight: 700, color: monthPnl >= 0 ? 'var(--col-win)' : 'var(--col-loss)', fontFamily: 'var(--font-mono)' }}>{fmtPnl(monthPnl)}</div></div>
          <div style={{ textAlign: 'right' }}><div style={{ fontSize: 10, color: 'var(--text-dim)' }}>Trades</div><div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-pri)', fontFamily: 'var(--font-mono)' }}>{monthTrades}</div></div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: border }}>
        {DAYS.map(d => <div key={d} style={{ padding: '6px 4px', fontSize: 9, color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center', borderRight: border }}>{d}</div>)}
      </div>
      {weeks.map((days, wi) => (
        <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: wi < weeks.length - 1 ? border : 'none' }}>
          {days.map((d, di) => {
            const key = mkKey(d)
            const data = key ? dayMap[key] : null
            const pnl = data?.pnl ?? 0, count = data?.count ?? 0
            const hasTrades = count > 0, isWin = pnl >= 0, isToday = key === todayStr
            return (
              <div key={di} style={{ minHeight: 60, padding: '5px 5px', borderRight: border, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: isToday ? 'var(--acc-glow)' : hasTrades ? (isWin ? 'var(--col-win-bg)' : 'var(--col-loss-bg)') : 'transparent', position: 'relative' }}>
                {d && <>
                  {isToday && <span style={{ position: 'absolute', top: 4, right: 4, width: 5, height: 5, borderRadius: '50%', background: 'var(--acc-main)' }} />}
                  <span style={{ fontSize: 10, color: isToday ? 'var(--acc-main)' : hasTrades ? 'var(--text-pri)' : 'var(--text-dim)', fontWeight: isToday ? 700 : 400 }}>{String(d).padStart(2, '0')}</span>
                  {hasTrades && <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: isWin ? 'var(--col-win)' : 'var(--col-loss)', fontFamily: 'var(--font-mono)', lineHeight: 1.2 }}>{fmtPnl(pnl)}</div>
                    <div style={{ fontSize: 9, color: 'var(--text-mut)' }}>{count}t</div>
                  </div>}
                </>}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// ─── Mobile card ──────────────────────────────────────────────────────────────
function MobileCard({ tr, c, onOpen, onEdit, onDelete, t }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const pnl = c.netPnl ?? 0
  const isWin = pnl >= 0
  const statusColor = tr.status === 'WIN' ? 'var(--col-win)' : tr.status === 'LOSS' ? 'var(--col-loss)' : 'var(--acc-main)'
  const statusBg = tr.status === 'WIN' ? 'var(--col-win-bg)' : tr.status === 'LOSS' ? 'var(--col-loss-bg)' : 'var(--acc-subtle)'
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: `3px solid ${statusColor}`, borderRadius: 10 }}>
      <div style={{ padding: '12px 14px' }} onClick={onOpen}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontWeight: 800, color: 'var(--text-pri)', fontSize: 14, fontFamily: 'var(--font-mono)' }}>{tr.symbol}</span>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: tr.direction === 'LONG' ? 'var(--col-win-bg)' : 'var(--col-loss-bg)', color: tr.direction === 'LONG' ? 'var(--col-win)' : 'var(--col-loss)' }}>{tr.direction}</span>
            {tr.status && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: statusBg, color: statusColor }}>{tr.status === 'WIN' ? '▲ Win' : tr.status === 'LOSS' ? '▼ Loss' : tr.status}</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* ── Fixed: single sign only ── */}
            <span style={{ fontWeight: 800, fontSize: 14, color: isWin ? 'var(--col-win)' : 'var(--col-loss)', fontFamily: 'var(--font-mono)' }}>{fmtPnl(pnl)}</span>
            <button onClick={e => { e.stopPropagation(); setMenuOpen(o => !o) }} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border)', background: menuOpen ? 'var(--bg-hover)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="3" r="1.5" fill="var(--text-mut)" /><circle cx="8" cy="8" r="1.5" fill="var(--text-mut)" /><circle cx="8" cy="13" r="1.5" fill="var(--text-mut)" /></svg>
            </button>
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-mut)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>
          {tr.date} · {tr.entry?.price}{tr.entry?.lotSize && ` ×${tr.entry.lotSize}L`} → {c.avgExitPrice ? parseFloat(c.avgExitPrice.toFixed(2)) : '—'}
        </div>
        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--acc-main)', background: 'var(--acc-subtle)', padding: '2px 8px', borderRadius: 4 }}>{tr.strategy || '—'}</span>
      </div>
      {menuOpen && (
        <div style={{ borderTop: '1px solid var(--border)', display: 'flex' }} onClick={e => e.stopPropagation()}>
          <button onClick={() => { setMenuOpen(false); onEdit() }} style={{ flex: 1, padding: '10px', border: 'none', background: 'transparent', color: 'var(--acc-main)', cursor: 'pointer', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            <svg width="13" height="13" viewBox="0 0 20 20" fill="none"><path d="M14.5 2.5a2.121 2.121 0 0 1 3 3L6 17l-4 1 1-4L14.5 2.5z" stroke="var(--acc-main)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            {t('edit')}
          </button>
          <div style={{ width: 1, background: 'var(--border)' }} />
          <button onClick={() => { setMenuOpen(false); onDelete() }} style={{ flex: 1, padding: '10px', border: 'none', background: 'transparent', color: 'var(--col-loss)', cursor: 'pointer', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            <svg width="13" height="13" viewBox="0 0 20 20" fill="none"><path d="M3 6h14M8 6V4h4v2M5 6l1 11h8l1-11" stroke="var(--col-loss)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function JournalPage() {
  const { trades, loading, deleteTrade, importTrades } = useTrades()
  const navigate = useNavigate()
  const { t } = useLang()
  const [detail, setDetail] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [importing, setImporting] = useState(false)
  const [view, setView] = useState('list')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState({ status: 'ALL', direction: 'ALL', strategy: 'ALL' })
  const [filterOpen, setFilterOpen] = useState(false)
  const filterRef = useRef(null)
const [startingBalance, setStartingBalance] = useState(() => {
  const saved = localStorage.getItem('tradeStartingBalance')
  return saved ? parseFloat(saved) : 10000
})
const [editingBalance, setEditingBalance] = useState(false)
const [balanceInput, setBalanceInput] = useState('')

function handleBalanceSave() {
  const val = parseFloat(balanceInput)
  if (!isNaN(val) && val > 0) {
    setStartingBalance(val)
    localStorage.setItem('tradeStartingBalance', val)
  }
  setEditingBalance(false)
}
  useEffect(() => {
    function onDown(e) { if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const stats = useMemo(() => calcPortfolioStats(trades), [trades])
  const activeFilters = Object.values(filter).filter(v => v !== 'ALL').length

  const calStats = useMemo(() => {
    const closed = trades.filter(t => t.status && t.status !== 'OPEN')
    const wins = closed.filter(t => t.status === 'WIN')
    const losses = closed.filter(t => t.status === 'LOSS')
    const totalNet = closed.reduce((s, t) => s + (calcTrade(t).netPnl ?? 0), 0)
    const winRate = closed.length ? (wins.length / closed.length) * 100 : 0
    const grossWin = wins.reduce((s, t) => s + Math.abs(calcTrade(t).netPnl ?? 0), 0)
    const grossLoss = losses.reduce((s, t) => s + Math.abs(calcTrade(t).netPnl ?? 0), 0)
    const pf = grossLoss > 0 ? grossWin / grossLoss : 0
    const avgWin = wins.length ? grossWin / wins.length : 0
    const avgLoss = losses.length ? grossLoss / losses.length : 0
    const unrealized = trades.filter(t => t.status === 'OPEN').reduce((s, t) => s + (calcTrade(t).netPnl ?? 0), 0)
    return { totalNet, winRate, pf, avgWin, avgLoss, wins: wins.length, losses: losses.length, unrealized }
  }, [trades])

const [assetMode, setAssetMode] = useState('volume')
const [equityRange, setEquityRange] = useState('All')  // ← add this
const [page, setPage] = useState(1)
const [calendarDateFilter, setCalendarDateFilter] = useState(null)
const assetMap = useMemo(() => {
  const map = {}
  trades.forEach(tr => {
    if (!tr.symbol) return
    if (!map[tr.symbol]) map[tr.symbol] = { volume: 0, trades: 0, wins: 0 }
    map[tr.symbol].volume += Math.abs(calcTrade(tr).netPnl ?? 0)
    map[tr.symbol].trades += 1
    if (tr.status === 'WIN') map[tr.symbol].wins += 1
  })
  return Object.entries(map).map(([sym, d]) => ([
    sym,
    {
      volume: d.volume,
      trades: d.trades,
      winrate: d.trades > 0 ? (d.wins / d.trades) * 100 : 0,
    }
  ])).sort((a, b) => b[1][assetMode] - a[1][assetMode]).slice(0, 6)
}, [trades, assetMode])
const totalAsset = assetMap.reduce((s, [, v]) => s + v[assetMode], 0)

  const filtered = useMemo(() =>
    trades.filter(tr => {
      if (search && !tr.symbol?.toLowerCase().includes(search.toLowerCase())) return false
      if (filter.status !== 'ALL' && tr.status !== filter.status) return false
      if (filter.direction !== 'ALL' && tr.direction !== filter.direction) return false
      if (filter.strategy !== 'ALL' && tr.strategy !== filter.strategy) return false
      return true
    }).sort((a, b) => new Date(b.date) - new Date(a.date)),
    [trades, search, filter]
  )

  async function handleImport(e) {
    const file = e.target.files?.[0]; if (!file) return
    setImporting(true)
    try { await importTrades(await importTradesFromCSV(file)) }
    catch (err) { alert('Import failed: ' + err.message) }
    finally { setImporting(false); e.target.value = '' }
  }

  if (loading) return <Layout openCount={0}><Spinner /></Layout>

  const P = { background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }
  const PH = { padding: '10px 16px', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 600, color: 'var(--text-mut)', textTransform: 'uppercase', letterSpacing: '0.07em' }

  return (
    <Layout openCount={stats.openCount}>

      {/* ── Top metric strip — scrollable on mobile ── */}
      <div style={{ overflowX: 'auto', marginBottom: 10, WebkitOverflowScrolling: 'touch' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(130px,1fr))', gap: 1, background: 'var(--border)', borderRadius: 8, overflow: 'hidden', minWidth: 320 }}>
          {(() => {
  const balance = startingBalance + calStats.totalNet
  const equity = startingBalance + calStats.totalNet + calStats.unrealized
  return [
    { label: 'Starting Deposit', value: fmtUSD(startingBalance), color: 'var(--text-pri)', isBalance: true },
{ label: 'Balance', value: fmtUSD(balance), color: 'var(--text-pri)' },
    { label: 'Equity', value: fmtUSD(equity), color: 'var(--text-pri)' },
    { label: 'PnL', value: fmtUSD(calStats.totalNet), color: calStats.totalNet >= 0 ? 'var(--col-win)' : 'var(--col-loss)' },
    
  ].map(({ label, value, color, isBalance }) => (
    <div key={label} style={{ background: 'var(--bg-panel)', padding: '10px 14px' }}>
      <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
        {label}{isBalance && <span style={{ marginLeft: 5, fontSize: 9, color: 'var(--acc-main)', cursor: 'pointer', fontWeight: 600 }} onClick={() => { setBalanceInput(startingBalance.toString()); setEditingBalance(true) }}>✎ edit</span>}
      </div>
      {isBalance && editingBalance ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input
            autoFocus
            type="number"
            value={balanceInput}
            onChange={e => setBalanceInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleBalanceSave(); if (e.key === 'Escape') setEditingBalance(false) }}
            onBlur={handleBalanceSave}
            style={{ width: 100, fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', background: 'var(--bg-input)', border: '1px solid var(--acc-main)', borderRadius: 4, color: 'var(--text-pri)', padding: '2px 6px', outline: 'none' }}
          />
        </div>
      ) : (
        <div style={{ fontSize: 12, fontWeight: 700, color, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{value}</div>
      )}
    </div>
  ))
})()}
        </div>
      </div>

      {/* ── 4 stat cards — 2×2 on mobile, 4×1 on desktop ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginBottom: 10 }} className="stat-cards-grid">
        <div style={P}>
          <div style={PH}>PnL</div>
          <div style={{ padding: '12px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { label: 'Unrealized', value: fmtUSD(calStats.unrealized), color: calStats.unrealized >= 0 ? 'var(--col-win)' : 'var(--col-loss)' },
              { label: 'Realized', value: fmtUSD(calStats.totalNet), color: calStats.totalNet >= 0 ? 'var(--col-win)' : 'var(--col-loss)' },
            ].map(({ label, value, color }) => (
              <div key={label}><div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 3 }}>{label}</div><div style={{ fontSize: 11, fontWeight: 700, color, fontFamily: 'var(--font-mono)' }}>{value}</div></div>
            ))}
          </div>
        </div>
        <div style={P}>
          <div style={PH}>Win / Risk</div>
          <div style={{ padding: '12px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { label: 'Win Rate', value: calStats.winRate.toFixed(1) + '%', color: 'var(--col-win)' },
              { label: 'Risk Rate', value: (100 - calStats.winRate).toFixed(1) + '%', color: 'var(--col-loss)' },
            ].map(({ label, value, color }) => (
              <div key={label}><div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 3 }}>{label}</div><div style={{ fontSize: 18, fontWeight: 800, color, fontFamily: 'var(--font-mono)' }}>{value}</div></div>
            ))}
          </div>
        </div>
        <div style={P}>
          <div style={PH}>Avg Win / Loss</div>
          <div style={{ padding: '12px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[
              { label: 'Avg Win', value: fmtUSD(calStats.avgWin), color: 'var(--col-win)' },
              { label: 'Avg Loss', value: fmtUSD(calStats.avgLoss), color: 'var(--col-loss)' },
              { label: 'W / L', value: `${calStats.wins} / ${calStats.losses}`, color: 'var(--text-pri)' },
            ].map(({ label, value, color }) => (
              <div key={label}><div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 3 }}>{label}</div><div style={{ fontSize: 11, fontWeight: 700, color, fontFamily: 'var(--font-mono)' }}>{value}</div></div>
            ))}
          </div>
        </div>
        <div style={P}>
          <div style={PH}>Profitability</div>
          <div style={{ padding: '12px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { label: 'Net Profit', value: fmtUSD(calStats.totalNet), color: calStats.totalNet >= 0 ? 'var(--col-win)' : 'var(--col-loss)' },
              { label: 'Profit Factor', value: calStats.pf.toFixed(2), color: 'var(--text-pri)' },
            ].map(({ label, value, color }) => (
              <div key={label}><div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 3 }}>{label}</div><div style={{ fontSize: 11, fontWeight: 700, color, fontFamily: 'var(--font-mono)' }}>{value}</div></div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Assets + Equity chart — stack on mobile ── */}
      <div className="assets-equity-grid" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 8, marginBottom: 10 }}>
       <div style={P}>
  <div style={{ ...PH, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <span>Assets</span>
    <div style={{ display: 'flex', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 5, padding: 2, gap: 2 }}>
      {[['volume', 'Volume'], ['trades', 'Trades'], ['winrate', 'Win %']].map(([key, label]) => (
        <button key={key} onClick={() => setAssetMode(key)} style={{
          fontSize: 10, fontWeight: 600, padding: '3px 7px', borderRadius: 3, border: 'none', cursor: 'pointer',
          background: assetMode === key ? 'var(--acc-main)' : 'transparent',
          color: assetMode === key ? 'var(--text-inv)' : 'var(--text-mut)',
        }}>{label}</button>
      ))}
    </div>
  </div>
  <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
    {assetMap.length > 0 ? <>
      <DonutChart
  slices={assetMap.map(([, v]) => ({
    // For winrate: use raw winrate values (they already sum meaningfully per symbol)
    // We normalize across symbols so total = 100% visually
    value: assetMode === 'winrate' ? v.winrate : v[assetMode]
  }))}
  centerLabel={
    assetMode === 'winrate'
      ? { main: (assetMap.reduce((s,[,v]) => s + v.winrate, 0) / (assetMap.length || 1)).toFixed(0) + '%', sub: 'avg win rate' }
      : assetMode === 'trades'
      ? { main: totalAsset, sub: 'total trades' }
      : { main: '$' + (totalAsset >= 1000 ? (totalAsset/1000).toFixed(1)+'K' : totalAsset.toFixed(0)), sub: 'total volume' }
  }
/>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 5 }}>
        {assetMap.map(([sym, val], i) => (
          <div key={sym} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: CHART_COLORS[i % CHART_COLORS.length] }} />
              <span style={{ fontSize: 12, color: 'var(--text-sec)' }}>{sym}</span>
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-pri)', fontFamily: 'var(--font-mono)' }}>
              {assetMode === 'volume' && ('$' + val.volume.toFixed(0))}
              {assetMode === 'trades' && (val.trades + ' trades')}
              {assetMode === 'winrate' && (val.winrate.toFixed(1) + '%')}
            </span>
          </div>
        ))}
      </div>
    </> : <div style={{ color: 'var(--text-dim)', fontSize: 12, padding: '32px 0' }}>No trade data yet</div>}
  </div>
</div>
        <div style={P}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-mut)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Balance / Equity</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {['1W', '1M', '3M', 'All'].map(l => (
  <button key={l}
    onClick={() => setEquityRange(l)}
    style={{
      background: equityRange === l ? 'var(--acc-subtle)' : 'transparent',
      border: 'none',
      color: equityRange === l ? 'var(--acc-main)' : 'var(--text-mut)',
      fontSize: 10, padding: '3px 6px', borderRadius: 4, cursor: 'pointer', fontWeight: 600
    }}>{l}</button>
))}
            </div>
          </div>
          <div style={{ padding: '8px 16px 16px', height: 200, boxSizing: 'border-box' }}><EquityLine trades={trades} range={equityRange} /></div>
        </div>
      </div>

      {/* ── Calendar + Risk/Reward — stack on mobile ── */}
      <div className="calendar-rr-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
        <div style={P}><PnlCalendar trades={trades} /></div>
        <div style={P}>
          <div style={PH}>Risk / Reward</div>
          <div style={{ padding: '8px 16px', height: 240, boxSizing: 'border-box' }}><RRChart trades={trades} /></div>
          <div style={{ display: 'flex', gap: 14, padding: '0 16px 12px' }}>
            {[{ color: 'var(--col-win)', label: 'Reward' }, { color: 'var(--col-loss)', label: 'Risk' }].map(({ color, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 20, height: 2, background: color }} />
                <span style={{ fontSize: 11, color: 'var(--text-mut)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Toolbar Row 1: View toggle + Import/Export + New Trade ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        {/* View toggle */}
        <div style={{ display: 'flex', background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 7, padding: 3, gap: 2 }}>
          {[
            { key: 'list', label: 'List', icon: <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 2h10M1 6h10M1 10h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg> },
            { key: 'grid', label: 'Grid', icon: <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1" y="1" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" /><rect x="7" y="1" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" /><rect x="1" y="7" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" /><rect x="7" y="7" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" /></svg> },
          ].map(({ key, label, icon }) => (
            <button key={key} onClick={() => setView(key)} style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 5, border: 'none', cursor: 'pointer', transition: 'all 0.15s', fontSize: 12, fontWeight: 600,
              background: view === key ? 'var(--grad-accent)' : 'transparent',
              color: view === key ? 'var(--text-inv)' : 'var(--text-mut)',
            }}>{icon}{label}</button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Import */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px', cursor: importing ? 'not-allowed' : 'pointer', color: 'var(--text-mut)', background: 'var(--bg-panel)', opacity: importing ? 0.5 : 1, whiteSpace: 'nowrap' }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v7M3 5l3 3 3-3M1 9v1a1 1 0 001 1h8a1 1 0 001-1V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span className="btn-label-full">{importing ? 'Importing…' : t('import_csv')}</span>
            <span className="btn-label-short" style={{ display: 'none' }}>Import</span>
            <input type="file" accept=".csv" style={{ display: 'none' }} onChange={handleImport} disabled={importing} />
          </label>
          {/* Export */}
          <button onClick={() => exportTradesToCSV(trades)} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', color: 'var(--text-mut)', background: 'var(--bg-panel)', whiteSpace: 'nowrap' }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 8V1M3 4l3-3 3 3M1 9v1a1 1 0 001 1h8a1 1 0 001-1V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span className="btn-label-full">{t('export_csv')}</span>
            <span className="btn-label-short" style={{ display: 'none' }}>Export</span>
          </button>
          {/* New Trade */}
          <button onClick={() => navigate('/new')} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, borderRadius: 6, padding: '7px 14px', cursor: 'pointer', border: 'none', background: 'var(--grad-accent)', color: 'var(--text-inv)', whiteSpace: 'nowrap' }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="var(--text-inv)" strokeWidth="2" strokeLinecap="round" /></svg>
            <span className="btn-label-full">{t('new_trade')}</span>
            <span className="btn-label-short" style={{ display: 'none' }}>New</span>
          </button>
        </div>
      </div>

      {/* ── Toolbar Row 2: Search + Filter + count ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <input
          placeholder={t('search_placeholder') || 'Search symbol…'}
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text-pri)', fontSize: 12, padding: '7px 12px', outline: 'none', flex: 1, minWidth: 120, maxWidth: 200 }}
          onFocus={e => e.target.style.borderColor = 'var(--acc-main)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />

        <div style={{ position: 'relative' }} ref={filterRef}>
          <button onClick={() => setFilterOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600, border: `1px solid ${filterOpen || activeFilters > 0 ? 'var(--acc-main)' : 'var(--border)'}`, background: filterOpen || activeFilters > 0 ? 'var(--acc-subtle)' : 'var(--bg-panel)', color: filterOpen || activeFilters > 0 ? 'var(--acc-main)' : 'var(--text-mut)', whiteSpace: 'nowrap' }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1 3h11M3 6.5h7M5 10h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            Filter
            {activeFilters > 0 && <span style={{ background: 'var(--acc-main)', color: 'var(--text-inv)', borderRadius: '50%', width: 16, height: 16, fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{activeFilters}</span>}
          </button>
          {filterOpen && (
            <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 300, background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 12, padding: 14, width: 230, boxShadow: 'var(--shadow-panel)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-pri)' }}>Filters</span>
                {activeFilters > 0 && <button onClick={() => setFilter({ status: 'ALL', direction: 'ALL', strategy: 'ALL' })} style={{ fontSize: 10, color: 'var(--col-loss)', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Clear all</button>}
              </div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>Status</div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {['ALL', 'WIN', 'LOSS'].map(v => (
                    <button key={v} onClick={() => setFilter(f => ({ ...f, status: v }))} style={{ flex: 1, padding: '5px 0', borderRadius: 5, cursor: 'pointer', fontSize: 11, fontWeight: 700, border: filter.status === v ? `1px solid ${v === 'WIN' ? 'var(--col-win)' : v === 'LOSS' ? 'var(--col-loss)' : 'var(--acc-main)'}` : '1px solid transparent', background: filter.status === v ? (v === 'WIN' ? 'var(--col-win-bg)' : v === 'LOSS' ? 'var(--col-loss-bg)' : 'var(--acc-subtle)') : 'var(--bg-hover)', color: filter.status === v ? (v === 'WIN' ? 'var(--col-win)' : v === 'LOSS' ? 'var(--col-loss)' : 'var(--acc-main)') : 'var(--text-mut)' }}>{v}</button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>Direction</div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {['ALL', 'LONG', 'SHORT'].map(v => (
                    <button key={v} onClick={() => setFilter(f => ({ ...f, direction: v }))} style={{ flex: 1, padding: '5px 0', borderRadius: 5, cursor: 'pointer', fontSize: 11, fontWeight: 700, border: filter.direction === v ? `1px solid ${v === 'LONG' ? 'var(--col-win)' : v === 'SHORT' ? 'var(--col-loss)' : 'var(--acc-main)'}` : '1px solid transparent', background: filter.direction === v ? (v === 'LONG' ? 'var(--col-win-bg)' : v === 'SHORT' ? 'var(--col-loss-bg)' : 'var(--acc-subtle)') : 'var(--bg-hover)', color: filter.direction === v ? (v === 'LONG' ? 'var(--col-win)' : v === 'SHORT' ? 'var(--col-loss)' : 'var(--acc-main)') : 'var(--text-mut)' }}>{v}</button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>Strategy</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 180, overflowY: 'auto' }}>
                  {['ALL', ...STRATEGIES].map(v => (
                    <button key={v} onClick={() => setFilter(f => ({ ...f, strategy: v }))} style={{ textAlign: 'left', padding: '5px 8px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 11, background: filter.strategy === v ? 'var(--acc-subtle)' : 'transparent', color: filter.strategy === v ? 'var(--acc-main)' : 'var(--text-sec)', fontWeight: filter.strategy === v ? 700 : 400 }}>{v === 'ALL' ? 'All Strategies' : v}</button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{filtered.length} trade{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* ── Views ── */}
      {view === 'grid' ? (
        filtered.length === 0
          ? <div style={{ ...P, padding: 32, textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>No trades found — <button onClick={() => navigate('/new')} style={{ background: 'none', border: 'none', color: 'var(--acc-main)', cursor: 'pointer', fontWeight: 600 }}>log your first trade</button></div>
          : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 10 }}>
              {filtered.map(tr => {
                const c = calcTrade(tr), pnl = c.netPnl ?? 0
                return (
                  <div key={tr.id} onClick={() => setDetail(tr)}
                    style={{ ...P, cursor: 'pointer', transition: 'border-color .15s' }}
                    onMouseOver={e => e.currentTarget.style.borderColor = 'var(--acc-main)'}
                    onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                    {tr.entry?.imageUrl && <div style={{ height: 120, overflow: 'hidden' }}><img src={tr.entry.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>}
                    <div style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, color: 'var(--text-pri)' }}>{tr.symbol}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: tr.direction === 'LONG' ? 'var(--col-win-bg)' : 'var(--col-loss-bg)', color: tr.direction === 'LONG' ? 'var(--col-win)' : 'var(--col-loss)' }}>{tr.direction}</span>
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 800, color: pnl >= 0 ? 'var(--col-win)' : 'var(--col-loss)' }}>{fmtPnl(pnl)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: 'var(--bg-hover)', color: 'var(--text-mut)' }}>{tr.strategy || '—'}</span>
                          {tr.status === 'WIN' && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: 'var(--col-win-bg)', color: 'var(--col-win)' }}>▲ Win</span>}
                          {tr.status === 'LOSS' && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: 'var(--col-loss-bg)', color: 'var(--col-loss)' }}>▼ Loss</span>}
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{tr.date}</span>
                      </div>
                      {tr.notes && <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 8, lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{tr.notes}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          )
      ) : (
        filtered.length === 0
          ? <div style={{ ...P, padding: 32, textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>No trades found — <button onClick={() => navigate('/new')} style={{ background: 'none', border: 'none', color: 'var(--acc-main)', cursor: 'pointer', fontWeight: 600 }}>log your first trade</button></div>
          : <>
            {/* Desktop table */}
            <div className="desktop-table" style={P}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-ui)' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--border)' }}>
                    {[t('th_date')||'Date', t('th_symbol')||'Symbol', t('th_dir')||'Dir', t('th_entry')||'Entry', t('th_close')||'Close', t('th_net_pnl')||'Net P&L', t('th_strategy')||'Strategy', t('th_status')||'Status', ''].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((tr, i) => {
                    const c = calcTrade(tr), pnl = c.netPnl ?? 0
                    const rowBg = i % 2 === 0 ? 'var(--bg-panel)' : 'var(--bg-row-alt)'
                    return (
                      <tr key={tr.id}
                        style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', background: rowBg, transition: 'background .12s' }}
                        onMouseOver={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                        onMouseOut={e => e.currentTarget.style.background = rowBg}
                        onClick={() => setDetail(tr)}
                      >
                        <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--text-mut)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{tr.date}</td>
                        <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 700, color: 'var(--text-pri)', fontFamily: 'var(--font-mono)' }}>{tr.symbol}</td>
                        <td style={{ padding: '11px 14px' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: tr.direction === 'LONG' ? 'var(--col-win-bg)' : 'var(--col-loss-bg)', color: tr.direction === 'LONG' ? 'var(--col-win)' : 'var(--col-loss)' }}>{tr.direction}</span>
                        </td>
                        <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--text-sec)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                          {tr.entry?.price}{tr.entry?.lotSize && <span style={{ color: 'var(--text-dim)', fontSize: 11 }}> ×{tr.entry.lotSize}L</span>}
                        </td>
                        <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--text-sec)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{c.avgExitPrice ? parseFloat(c.avgExitPrice.toFixed(4)) : '—'}</td>
                        <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: pnl >= 0 ? 'var(--col-win)' : 'var(--col-loss)', fontFamily: 'var(--font-mono)' }}>{fmtPnl(pnl)}</span>
                        </td>
                        <td style={{ padding: '11px 14px' }}>
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: 'var(--bg-hover)', color: 'var(--text-mut)' }}>{tr.strategy || '—'}</span>
                        </td>
                        <td style={{ padding: '11px 14px' }}>
                          {tr.status === 'WIN' && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: 'var(--col-win-bg)', color: 'var(--col-win)' }}>▲ Win</span>}
                          {tr.status === 'LOSS' && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: 'var(--col-loss-bg)', color: 'var(--col-loss)' }}>▼ Loss</span>}
                          {tr.status === 'BE' && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: 'var(--acc-subtle)', color: 'var(--acc-main)' }}>BE</span>}
                          {!tr.status && <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>—</span>}
                        </td>
                        <td style={{ padding: '11px 14px' }} onClick={e => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: 5 }}>
                            <button
                              onClick={() => navigate(`/edit/${tr.id}`)}
                              style={{ fontSize: 11, color: 'var(--text-mut)', border: '1px solid var(--border)', borderRadius: 5, padding: '4px 10px', cursor: 'pointer', background: 'transparent', transition: 'all .15s' }}
                              onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--acc-main)'; e.currentTarget.style.color = 'var(--acc-main)' }}
                              onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-mut)' }}
                            >{t('edit') || 'Edit'}</button>
                            <button
                              onClick={() => setDeleteId(tr.id)}
                              style={{ fontSize: 11, color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: 5, padding: '4px 8px', cursor: 'pointer', background: 'transparent', transition: 'all .15s' }}
                              onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--col-loss)'; e.currentTarget.style.color = 'var(--col-loss)' }}
                              onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-dim)' }}
                            >✕</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="mobile-cards" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map(tr => {
                const c = calcTrade(tr)
                return <MobileCard key={tr.id} tr={tr} c={c} onOpen={() => setDetail(tr)} onEdit={() => navigate(`/edit/${tr.id}`)} onDelete={() => setDeleteId(tr.id)} t={t} />
              })}
            </div>
          </>
      )}

      {detail && <TradeDetail trade={detail} onClose={() => setDetail(null)} onEdit={() => { navigate(`/edit/${detail.id}`); setDetail(null) }} />}
      <ConfirmModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { deleteTrade(deleteId); setDeleteId(null) }} title={t('delete_confirm') || 'Delete trade?'} message="This action cannot be undone." confirmText="Delete Trade" />

      <style>{`
        /* ── Desktop ── */
        @media (min-width: 768px) {
          .desktop-table  { display: block !important; }
          .mobile-cards   { display: none !important; }
          .stat-cards-grid { grid-template-columns: repeat(4,1fr) !important; }
          .assets-equity-grid { grid-template-columns: 280px 1fr !important; }
          .calendar-rr-grid { grid-template-columns: 1fr 1fr !important; }
          .btn-label-short { display: none !important; }
          .btn-label-full  { display: inline !important; }
        }

        /* ── Mobile ── */
        @media (max-width: 767px) {
          .desktop-table  { display: none !important; }
          .mobile-cards   { display: flex !important; }

          /* Stat cards: 2 columns */
          .stat-cards-grid { grid-template-columns: repeat(2,1fr) !important; }

          /* Assets + Equity: stack vertically */
          .assets-equity-grid { grid-template-columns: 1fr !important; }

          /* Calendar + RR: stack vertically */
          .calendar-rr-grid { grid-template-columns: 1fr !important; }

          /* Toolbar buttons: shorten labels */
          .btn-label-full  { display: none !important; }
          .btn-label-short { display: inline !important; }
        }
      `}</style>
    </Layout>
  )
}