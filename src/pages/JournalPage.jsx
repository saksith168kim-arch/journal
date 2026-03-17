// src/pages/JournalPage.jsx
import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTrades } from '../hooks/useTrades'
import { calcTrade, fmt$, fmtN, pnlColor, calcPortfolioStats } from '../lib/calc'
import { exportTradesToCSV, importTradesFromCSV } from '../lib/csv'
import { Tag, StatCard, Button, Select, Spinner, EmptyState, ConfirmModal } from '../components/ui'
import TradeDetail from '../components/trades/TradeDetail'
import PnlCalendar from '../components/trades/PnlCalendar'
import Layout from '../components/layout/Layout'
import { useLang } from '../context/LanguageContext'

const STRATEGIES = ['Breakout', 'Trend Following', 'Mean Reversion', 'Scalping', 'Swing Trade', 'Momentum', 'News Play', 'Options Strategy', 'Custom']

function WinGauge({ wins, losses, be, winRate }) {
  const total = wins + losses + be
  const lossPct = total > 0 ? losses / total : 0
  const bePct = total > 0 ? be / total : 0
  const winPct = total > 0 ? wins / total : 0
  const CX = 60, CY = 58, R = 44, SW = 10
  const pt = (deg) => ({ x: CX + R * Math.cos((deg * Math.PI) / 180), y: CY - R * Math.sin((deg * Math.PI) / 180) })
  const arc = (s, e, color) => {
    if (Math.abs(e - s) < 0.1) return null
    const sp = pt(s), ep = pt(e)
    return <path d={`M ${sp.x} ${sp.y} A ${R} ${R} 0 ${(e - s) > 180 ? 1 : 0} 0 ${ep.x} ${ep.y}`} fill="none" stroke={color} strokeWidth={SW} strokeLinecap="butt" />
  }
  const lossEnd = 180 - lossPct * 180
  const beEnd = lossEnd - bePct * 180
  return (
    <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 14, padding: '12px 16px', minWidth: 0, overflow: 'hidden' }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 0 }}>Win Rate</div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <svg viewBox="0 4 120 62" style={{ width: '100%', maxWidth: 150 }}>
          <path d={`M ${pt(0).x} ${pt(0).y} A ${R} ${R} 0 0 0 ${pt(180).x} ${pt(180).y}`} fill="none" stroke="var(--bg-card)" strokeWidth={SW} strokeLinecap="butt" />
          {arc(0, lossEnd, '#f87171')}
          {arc(lossEnd, beEnd, '#60a5fa')}
          {arc(beEnd, 180, '#34d399')}
          <line x1={CX} y1={CY} x2={CX + R * 0.6 * Math.cos((winPct * Math.PI))} y2={CY - R * 0.6 * Math.sin((winPct * Math.PI))} stroke="var(--text-pri)" strokeWidth={2} strokeLinecap="round" />
          <circle cx={CX} cy={CY} r={3.5} fill="var(--text-pri)" />
        </svg>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--acc-main)', fontFamily: 'var(--font-mono)', textAlign: 'center', marginTop: -10, marginBottom: 8 }}>{winRate.toFixed(1)}%</div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
        {[{ color: '#34d399', count: wins, label: 'W' }, { color: '#60a5fa', count: be, label: 'BE' }, { color: '#f87171', count: losses, label: 'L' }].map(({ color, count, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 800, color, fontFamily: 'var(--font-mono)' }}>{count}</span>
            <span style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 600 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── MobileCard with tap-action menu ─────────────────────────────────────────
function MobileCard({ tr, c, onOpen, onEdit, onDelete, t }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const statusColor = tr.status === 'WIN' ? '#22c55e' : tr.status === 'LOSS' ? '#ef4444' : '#3b82f6'
  const statusBg = tr.status === 'WIN' ? '#22c55e18' : tr.status === 'LOSS' ? '#ef444418' : '#3b82f618'
  const statusLabel = tr.status === 'WIN' ? '▲ Win' : tr.status === 'LOSS' ? '▼ Loss' : tr.status || '—'
  const pnlCol = (c.netPnl ?? 0) >= 0 ? '#22c55e' : '#ef4444'
  const leftAccent = tr.status === 'WIN' ? '#22c55e' : tr.status === 'LOSS' ? '#ef4444' : '#3b82f6'

  return (
    <div style={{ position: 'relative', background: 'var(--bg-panel)', border: '1px solid var(--border)', borderLeft: `3px solid ${leftAccent}`, borderRadius: 14 }}>
      <div style={{ padding: '14px 14px 12px' }} onClick={onOpen}>
        {/* Row 1: symbol + tags | P&L + menu */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
            <span style={{ fontWeight: 800, color: 'var(--text-pri)', fontSize: 15, fontFamily: 'var(--font-mono)' }}>{tr.symbol}</span>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5, background: tr.direction === 'LONG' ? '#22c55e18' : '#ef444418', color: tr.direction === 'LONG' ? '#22c55e' : '#ef4444' }}>{tr.direction}</span>
            {tr.status && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5, background: statusBg, color: statusColor }}>{statusLabel}</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{ fontWeight: 800, fontSize: 15, color: pnlCol, fontFamily: 'var(--font-mono)' }}>
              {(c.netPnl ?? 0) >= 0 ? '+' : ''}{typeof c.netPnl === 'number' ? `$${Math.abs(c.netPnl).toFixed(2)}` : '—'}
            </span>
            {/* Three-dot menu button */}
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(o => !o) }}
              style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: menuOpen ? 'var(--bg-hover)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="3" r="1.5" fill="var(--text-sec)" />
                <circle cx="8" cy="8" r="1.5" fill="var(--text-sec)" />
                <circle cx="8" cy="13" r="1.5" fill="var(--text-sec)" />
              </svg>
            </button>
          </div>
        </div>

        {/* Row 2: date · entry → close */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 12, color: 'var(--text-sec)', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-mut)' }}>{tr.date}</span>
          <span style={{ color: 'var(--border)' }}>·</span>
          <span style={{ fontFamily: 'var(--font-mono)' }}>{tr.entry?.price}{tr.entry?.lotSize && <span style={{ color: 'var(--text-dim)' }}> ×{tr.entry.lotSize}L</span>}</span>
          <span style={{ color: 'var(--text-dim)' }}>→</span>
          <span style={{ fontFamily: 'var(--font-mono)' }}>{c.avgExitPrice ? parseFloat(c.avgExitPrice.toFixed(2)) : '—'}</span>
        </div>

        {/* Row 3: strategy */}
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--acc-main)', background: 'var(--acc-subtle)', padding: '2px 8px', borderRadius: 5 }}>{tr.strategy || '—'}</span>
      </div>

      {/* Inline action menu */}
      {menuOpen && (
        <div style={{ borderTop: '1px solid var(--border)', display: 'flex' }} onClick={e => e.stopPropagation()}>
          <button
            onClick={() => { setMenuOpen(false); onEdit() }}
            style={{ flex: 1, padding: '12px', border: 'none', background: 'transparent', color: '#3b82f6', cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-ui)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><path d="M14.5 2.5a2.121 2.121 0 0 1 3 3L6 17l-4 1 1-4L14.5 2.5z" stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            {t('edit')}
          </button>
          <div style={{ width: 1, background: 'var(--border)' }} />
          <button
            onClick={() => { setMenuOpen(false); onDelete() }}
            style={{ flex: 1, padding: '12px', border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-ui)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><path d="M3 6h14M8 6V4h4v2M5 6l1 11h8l1-11" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

export default function JournalPage() {
  const { trades, loading, deleteTrade, importTrades } = useTrades()
  const navigate = useNavigate()
  const { t } = useLang()
  const [detail, setDetail] = useState(null)
  const [search, setSearch] = useState('')
  const [importing, setImporting] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [view, setView] = useState('list')
  const [filter, setFilter] = useState({ status: 'ALL', direction: 'ALL', strategy: 'ALL' })
  const [filterOpen, setFilterOpen] = useState(false)
  const filterRef = useRef(null)

  useEffect(() => {
    function onDown(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const stats = useMemo(() => calcPortfolioStats(trades), [trades])
  const activeFilters = Object.values(filter).filter(v => v !== 'ALL').length

  const filtered = useMemo(() =>
    trades.filter((tr) => {
      if (search && !tr.symbol?.toLowerCase().includes(search.toLowerCase())) return false
      if (filter.status !== 'ALL' && tr.status !== filter.status) return false
      if (filter.direction !== 'ALL' && tr.direction !== filter.direction) return false
      if (filter.strategy !== 'ALL' && tr.strategy !== filter.strategy) return false
      return true
    }).sort((a, b) => new Date(b.date) - new Date(a.date)),
    [trades, search, filter]
  )

  async function handleImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    try {
      const imported = await importTradesFromCSV(file)
      await importTrades(imported)
    } catch (err) {
      alert('Import failed: ' + err.message)
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  if (loading) return <Layout openCount={0}><Spinner /></Layout>

  return (
    <Layout openCount={stats.openCount}>

      {/* ── Stats row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 16 }}>
        <StatCard label={t('stat_net_pnl')} value={fmt$(stats.totalNet)} sub={`${stats.total} closed`} color={stats.totalNet >= 0 ? 'var(--col-win)' : 'var(--col-loss)'} />
        <WinGauge wins={stats.wins} losses={stats.losses} be={stats.be || 0} winRate={stats.winRate} />
        <StatCard label={t('stat_rr')} value={stats.rr ? stats.rr.toFixed(2) : '—'} color="var(--col-warn)" />
        <StatCard label={t('stat_fees')} value={`$${stats.totalFees.toFixed(2)}`} color="var(--text-sec)" />
      </div>

      {/* ── Toolbar Row 1: View toggle + Import / Export ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
        {/* View toggle */}
        <div style={{ display: 'flex', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 3, gap: 2 }}>
          {[
            { key: 'list', label: 'List', icon: <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 2h10M1 6h10M1 10h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg> },
            { key: 'grid', label: 'Grid', icon: <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1" y="1" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" /><rect x="7" y="1" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" /><rect x="1" y="7" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" /><rect x="7" y="7" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" /></svg> },
            { key: 'calendar', label: 'Calendar', icon: <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1" y="2" width="10" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" /><path d="M4 1v2M8 1v2M1 5h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg> },
          ].map(({ key, label, icon }) => (
            <button key={key} onClick={() => setView(key)} style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
              borderRadius: 6, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-ui)',
              background: view === key ? 'var(--grad-accent)' : 'transparent',
              color: view === key ? '#fff' : 'var(--text-mut)',
            }}>{icon}{label}</button>
          ))}
        </div>

        {/* Import / Export — fills the empty right space */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 11, border: '1px solid var(--border)', borderRadius: 7, padding: '6px 11px',
            cursor: importing ? 'not-allowed' : 'pointer', color: 'var(--text-sec)', transition: 'all 0.15s',
            opacity: importing ? 0.5 : 1, fontFamily: 'var(--font-ui)', whiteSpace: 'nowrap', background: 'transparent',
          }}
            onMouseOver={e => { if (!importing) { e.currentTarget.style.borderColor = 'var(--acc-main)'; e.currentTarget.style.color = 'var(--acc-main)' } }}
            onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-sec)' }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v7M3 5l3 3 3-3M1 9v1a1 1 0 001 1h8a1 1 0 001-1V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            {importing ? t('importing') : t('import_csv')}
            <input type="file" accept=".csv" style={{ display: 'none' }} onChange={handleImport} disabled={importing} />
          </label>
          <button onClick={() => exportTradesToCSV(trades)} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 11, border: '1px solid var(--border)', borderRadius: 7, padding: '6px 11px',
            cursor: 'pointer', color: 'var(--text-sec)', background: 'transparent',
            transition: 'all 0.15s', fontFamily: 'var(--font-ui)', whiteSpace: 'nowrap',
          }}
            onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--acc-main)'; e.currentTarget.style.color = 'var(--acc-main)' }}
            onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-sec)' }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 8V1M3 4l3-3 3 3M1 9v1a1 1 0 001 1h8a1 1 0 001-1V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            {t('export_csv')}
          </button>
        </div>
      </div>

      {/* ── Toolbar Row 2: Search + Filter + count + New Trade ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', flex: 1 }}>
          {/* Search */}
          {view !== 'calendar' && (
            <input
              placeholder={t('search_placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 8,
                color: 'var(--text-pri)', fontSize: 12, padding: '7px 12px', outline: 'none',
                width: 150, boxSizing: 'border-box', transition: 'border-color 0.2s', fontFamily: 'var(--font-ui)',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--acc-main)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          )}

          {/* Filter button + popover */}
          {view !== 'calendar' && (
            <div style={{ position: 'relative' }} ref={filterRef}>
              <button onClick={() => setFilterOpen(o => !o)} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, cursor: 'pointer',
                fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
                background: filterOpen || activeFilters > 0 ? 'var(--acc-subtle)' : 'var(--bg-panel)',
                border: `1px solid ${filterOpen || activeFilters > 0 ? 'var(--acc-main)' : 'var(--border)'}`,
                color: filterOpen || activeFilters > 0 ? 'var(--acc-main)' : 'var(--text-sec)',
              }}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M1 3h11M3 6.5h7M5 10h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Filter
                {activeFilters > 0 && (
                  <span style={{ background: 'var(--acc-main)', color: '#fff', borderRadius: '50%', width: 16, height: 16, fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{activeFilters}</span>
                )}
              </button>

              {filterOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 300, background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, width: 240, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-pri)' }}>Filters</span>
                    {activeFilters > 0 && (
                      <button onClick={() => setFilter({ status: 'ALL', direction: 'ALL', strategy: 'ALL' })} style={{ fontSize: 10, color: 'var(--col-loss)', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 600 }}>Clear all</button>
                    )}
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-mut)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Status</div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {['ALL', 'WIN', 'LOSS'].map(v => (
                        <button key={v} onClick={() => setFilter(f => ({ ...f, status: v }))} style={{ flex: 1, padding: '5px 0', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-ui)', transition: 'all 0.15s', background: filter.status === v ? (v === 'WIN' ? 'var(--col-win-bg)' : v === 'LOSS' ? 'var(--col-loss-bg)' : 'var(--acc-subtle)') : 'var(--bg-hover)', color: filter.status === v ? (v === 'WIN' ? 'var(--col-win)' : v === 'LOSS' ? 'var(--col-loss)' : 'var(--acc-main)') : 'var(--text-mut)', border: filter.status === v ? `1px solid ${v === 'WIN' ? 'var(--col-win)' : v === 'LOSS' ? 'var(--col-loss)' : 'var(--acc-main)'}` : '1px solid transparent' }}>{v}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-mut)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Direction</div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {['ALL', 'LONG', 'SHORT'].map(v => (
                        <button key={v} onClick={() => setFilter(f => ({ ...f, direction: v }))} style={{ flex: 1, padding: '5px 0', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-ui)', transition: 'all 0.15s', background: filter.direction === v ? (v === 'LONG' ? 'var(--col-win-bg)' : v === 'SHORT' ? 'var(--col-loss-bg)' : 'var(--acc-subtle)') : 'var(--bg-hover)', color: filter.direction === v ? (v === 'LONG' ? 'var(--col-win)' : v === 'SHORT' ? 'var(--col-loss)' : 'var(--acc-main)') : 'var(--text-mut)', border: filter.direction === v ? `1px solid ${v === 'LONG' ? 'var(--col-win)' : v === 'SHORT' ? 'var(--col-loss)' : 'var(--acc-main)'}` : '1px solid transparent' }}>{v}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-mut)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Strategy</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {['ALL', ...STRATEGIES].map(v => (
                        <button key={v} onClick={() => setFilter(f => ({ ...f, strategy: v }))} style={{ textAlign: 'left', padding: '6px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-ui)', transition: 'all 0.15s', background: filter.strategy === v ? 'var(--acc-subtle)' : 'transparent', color: filter.strategy === v ? 'var(--acc-main)' : 'var(--text-sec)', fontWeight: filter.strategy === v ? 700 : 400 }}>{v === 'ALL' ? 'All Strategies' : v}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <span style={{ fontSize: 11, color: 'var(--text-mut)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{t('trades_count', filtered.length)}</span>
        </div>

        {/* New Trade */}
        <button onClick={() => navigate('/new')} style={{
          display: 'flex', alignItems: 'center', gap: 5,
          fontSize: 12, fontWeight: 700, borderRadius: 8, padding: '7px 16px',
          cursor: 'pointer', border: 'none', background: 'var(--grad-accent)',
          color: '#fff', fontFamily: 'var(--font-ui)', whiteSpace: 'nowrap',
          boxShadow: 'var(--shadow-btn)',
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="#fff" strokeWidth="2" strokeLinecap="round" /></svg>
          {t('new_trade')}
        </button>
      </div>

      {/* ── Views ── */}
      {view === 'calendar' ? (
        <PnlCalendar trades={trades} />
      ) : view === 'grid' ? (
        <>
          {filtered.length === 0
            ? <EmptyState message={t('no_trades')} action={<Button onClick={() => navigate('/new')}>{t('log_first_trade')}</Button>} />
            : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                {filtered.map((tr) => {
                  const c = calcTrade(tr)
                  const pnl = c.netPnl
                  return (
                    <div key={tr.id}
                      onClick={() => setDetail(tr)}
                      style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s', boxShadow: 'var(--shadow-card)' }}
                      onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--acc-main)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                      onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}
                    >
                      {tr.entry?.imageUrl && (
                        <div style={{ height: 130, overflow: 'hidden', background: 'var(--bg-card)' }}>
                          <img src={tr.entry.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}
                      <div style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, color: 'var(--text-pri)' }}>{tr.symbol}</span>
                            <Tag bg={tr.direction === 'LONG' ? 'var(--col-win-bg)' : 'var(--col-loss-bg)'} color={tr.direction === 'LONG' ? 'var(--col-win)' : 'var(--col-loss)'}>{tr.direction}</Tag>
                          </div>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 800, color: pnlColor(pnl) }}>{fmt$(pnl)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            <Tag bg="var(--bg-hover)" color="var(--text-sec)">{tr.strategy}</Tag>
                            {tr.status === 'WIN' && <Tag bg="var(--col-win-bg)" color="var(--col-win)">▲ Win</Tag>}
                            {tr.status === 'LOSS' && <Tag bg="var(--col-loss-bg)" color="var(--col-loss)">▼ Loss</Tag>}
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{tr.date}</span>
                        </div>
                        {tr.notes && (
                          <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 8, lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {tr.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
        </>
      ) : (
        <>
          {filtered.length === 0
            ? <EmptyState message={t('no_trades')} action={<Button onClick={() => navigate('/new')}>{t('log_first_trade')}</Button>} />
            : (
              <>
                {/* Desktop table */}
                <div className="desktop-table" style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
                        {[t('th_date'), t('th_symbol'), t('th_dir'), t('th_entry'), t('th_close'), t('th_net_pnl'), t('th_strategy'), t('th_status'), ''].map((h) => (
                          <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, color: 'var(--text-mut)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((tr, i) => {
                        const c = calcTrade(tr)
                        return (
                          <tr key={tr.id}
                            style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.15s', background: i % 2 === 0 ? 'var(--bg-panel)' : 'var(--bg-row-alt)' }}
                            onMouseOver={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                            onMouseOut={e => e.currentTarget.style.background = i % 2 === 0 ? 'var(--bg-panel)' : 'var(--bg-row-alt)'}
                            onClick={() => setDetail(tr)}
                          >
                            <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--text-mut)', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>{tr.date}</td>
                            <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 500, color: 'var(--text-pri)', fontFamily: 'var(--font-mono)', letterSpacing: '0.02em' }}>{tr.symbol}</td>
                            <td style={{ padding: '11px 14px' }}>
                              <Tag bg={tr.direction === 'LONG' ? 'var(--col-win-bg)' : 'var(--col-loss-bg)'} color={tr.direction === 'LONG' ? 'var(--col-win)' : 'var(--col-loss)'}>{tr.direction}</Tag>
                            </td>
                            <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--text-pri)', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>
                              {tr.entry?.price}
                              {tr.entry?.lotSize && <span style={{ color: 'var(--text-dim)', fontSize: 11 }}> ×{tr.entry.lotSize}L</span>}
                            </td>
                            <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--text-sec)', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>
                              {c.avgExitPrice ? parseFloat(c.avgExitPrice.toFixed(4)) : '—'}
                            </td>
                            <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', color: pnlColor(c.netPnl), fontFamily: 'var(--font-mono)' }}>
                              {fmt$(c.netPnl)}
                            </td>
                            <td style={{ padding: '11px 14px' }}>
                              <Tag bg="var(--bg-hover)" color="var(--text-sec)">{tr.strategy}</Tag>
                            </td>
                            <td style={{ padding: '11px 14px' }}>
                              {tr.status === 'WIN' && <Tag bg="var(--col-win-bg)" color="var(--col-win)">▲ Win</Tag>}
                              {tr.status === 'LOSS' && <Tag bg="var(--col-loss-bg)" color="var(--col-loss)">▼ Loss</Tag>}
                              {tr.status === 'BE' && <Tag bg="var(--acc-subtle)" color="var(--acc-main)">BE</Tag>}
                              {!tr.status && <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>—</span>}
                            </td>
                            <td style={{ padding: '11px 14px' }} onClick={(e) => e.stopPropagation()}>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button
                                  style={{ fontSize: 11, color: 'var(--text-sec)', border: '1px solid var(--border)', borderRadius: 5, padding: '4px 10px', cursor: 'pointer', background: 'transparent', transition: 'all 0.15s', fontFamily: 'var(--font-ui)' }}
                                  onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--acc-main)'; e.currentTarget.style.color = 'var(--acc-main)' }}
                                  onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-sec)' }}
                                  onClick={() => navigate(`/edit/${tr.id}`)}>{t('edit')}</button>
                                <button
                                  style={{ fontSize: 11, color: 'var(--text-mut)', border: '1px solid var(--border)', borderRadius: 5, padding: '4px 8px', cursor: 'pointer', background: 'transparent', transition: 'all 0.15s', fontFamily: 'var(--font-ui)' }}
                                  onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--col-loss)'; e.currentTarget.style.color = 'var(--col-loss)' }}
                                  onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-mut)' }}
                                  onClick={() => setDeleteId(tr.id)}>✕</button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards — swipe left to reveal Edit / Delete */}
                <div className="mobile-cards" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {filtered.map((tr) => {
                    const c = calcTrade(tr)
                    return <MobileCard key={tr.id} tr={tr} c={c} onOpen={() => setDetail(tr)} onEdit={() => navigate(`/edit/${tr.id}`)} onDelete={() => setDeleteId(tr.id)} t={t} />
                  })}
                </div>
              </>
            )}
        </>
      )}

      {detail && (
        <TradeDetail
          trade={detail}
          onClose={() => setDetail(null)}
          onEdit={() => { navigate(`/edit/${detail.id}`); setDetail(null) }}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { deleteTrade(deleteId); setDeleteId(null) }}
        title={t('delete_confirm')}
        message="Are you sure you want to delete this trade? This action cannot be undone."
        confirmText="Delete Trade"
      />

      <style>{`
        @media (min-width: 768px) {
          .desktop-table { display: block !important; }
          .mobile-cards  { display: none !important; }
        }
        @media (max-width: 767px) {
          .desktop-table { display: none !important; }
          .mobile-cards  { display: flex !important; }
        }
      `}</style>
    </Layout>
  )
}