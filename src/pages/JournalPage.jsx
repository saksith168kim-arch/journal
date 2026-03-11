// src/pages/JournalPage.jsx
import { useState, useMemo } from 'react'
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

export default function JournalPage() {
  const { trades, loading, deleteTrade, importTrades } = useTrades()
  const navigate = useNavigate()
  const { t } = useLang()
  const [detail, setDetail] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState({ status: 'ALL', direction: 'ALL', strategy: 'ALL' })
  const [importing, setImporting] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [view, setView] = useState('list') // 'list' | 'calendar'

  const stats = useMemo(() => calcPortfolioStats(trades), [trades])

  const filtered = useMemo(() =>
    trades.filter((tr) => {
      if (filter.status !== 'ALL' && tr.status !== filter.status) return false
      if (filter.direction !== 'ALL' && tr.direction !== filter.direction) return false
      if (filter.strategy !== 'ALL' && tr.strategy !== filter.strategy) return false
      if (search && !tr.symbol?.toLowerCase().includes(search.toLowerCase())) return false
      return true
    }).sort((a, b) => new Date(b.date) - new Date(a.date)),
    [trades, filter, search]
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
      {/* Stats row */}
      <div className="flex gap-2.5 mb-4 flex-wrap">
        <StatCard label={t('stat_net_pnl')} value={fmt$(stats.totalNet)} sub={`${stats.total} closed`} color={stats.totalNet >= 0 ? '#00e5a0' : '#ff4d6d'} />
        <StatCard label={t('stat_win_rate')} value={`${stats.winRate.toFixed(1)}%`} sub={`${stats.wins}W · ${stats.losses}L`} color="#7dd8ff" />
        <StatCard label={t('stat_rr')} value={stats.rr ? stats.rr.toFixed(2) : '—'} color="#ffd166" />
        <StatCard label={t('stat_fees')} value={`$${stats.totalFees.toFixed(2)}`} color="#ff8c6d" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2.5 mb-4 items-center">
        {/* View toggle */}
        <div className="flex items-center rounded-lg overflow-hidden border border-border text-[12px] font-semibold mr-1">
          <button
            onClick={() => setView('list')}
            className="flex items-center gap-1.5 px-3 py-2 transition-colors cursor-pointer border-none"
            style={{ background: view === 'list' ? 'var(--acc-main)' : 'transparent', color: view === 'list' ? '#060c16' : 'var(--text-mut)' }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 2h10M1 6h10M1 10h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            List
          </button>
          <button
            onClick={() => setView('calendar')}
            className="flex items-center gap-1.5 px-3 py-2 transition-colors cursor-pointer border-none"
            style={{ background: view === 'calendar' ? 'var(--acc-main)' : 'transparent', color: view === 'calendar' ? '#060c16' : 'var(--text-mut)' }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1" y="2" width="10" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" /><path d="M4 1v2M8 1v2M1 5h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            Calendar
          </button>
        </div>

        {view === 'list' && <>
          <input
            placeholder={t('search_placeholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-bg-panel border border-border rounded-lg text-text-primary text-[12px] px-3 py-2 outline-none focus:border-accent-green transition-colors w-40"
          />
          <Select value={filter.status} onChange={(v) => setFilter((f) => ({ ...f, status: v }))}
            options={['ALL', 'WIN', 'LOSS']} />
          <Select value={filter.direction} onChange={(v) => setFilter((f) => ({ ...f, direction: v }))}
            options={['ALL', 'LONG', 'SHORT']} />
          <Select value={filter.strategy} onChange={(v) => setFilter((f) => ({ ...f, strategy: v }))}
            options={['ALL', ...STRATEGIES]} />
          <span className="text-[12px] text-text-dim ml-auto">{t('trades_count', filtered.length)}</span>
        </>}

        {/* Import / Export always visible */}
        <label className={`text-[12px] border border-border rounded-lg px-3 py-2 cursor-pointer hover:border-accent-green hover:text-accent-green transition-colors text-text-muted ${importing ? 'opacity-50' : ''} ${view === 'list' ? '' : 'ml-auto'}`}>
          {importing ? t('importing') : t('import_csv')}
          <input type="file" accept=".csv" className="hidden" onChange={handleImport} disabled={importing} />
        </label>
        <Button size="sm" onClick={() => exportTradesToCSV(trades)} variant="ghost">{t('export_csv')}</Button>
        <Button size="sm" onClick={() => navigate('/new')}>{t('new_trade')}</Button>
      </div>

      {/* ── Views ── */}
      {view === 'calendar' ? (
        <PnlCalendar trades={trades} />
      ) : (
        <>
          {filtered.length === 0
            ? <EmptyState message={t('no_trades')} action={<Button onClick={() => navigate('/new')}>{t('log_first_trade')}</Button>} />
            : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block bg-bg-panel border border-border rounded-xl overflow-hidden">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-bg-card border-b border-border">
                        {[t('th_date'), t('th_symbol'), t('th_dir'), t('th_entry'), t('th_close'), t('th_net_pnl'), t('th_strategy'), t('th_status'), ''].map((h) => (
                          <th key={h} className="px-3.5 py-3 text-left text-[10px] text-text-dark font-semibold uppercase whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((tr, i) => {
                        const c = calcTrade(tr)
                        return (
                          <tr key={tr.id}
                            className="border-b border-[#111d30] cursor-pointer hover:bg-bg-hover transition-colors"
                            style={{ background: i % 2 === 0 ? 'var(--bg-panel)' : 'var(--bg-card)' }}
                            onClick={() => setDetail(tr)}
                          >
                            <td className="px-3.5 py-3 text-[12px] text-text-dim whitespace-nowrap">{tr.date}</td>
                            <td className="px-3.5 py-3 text-[13px] font-bold text-text-primary">{tr.symbol}</td>
                            <td className="px-3.5 py-3"><Tag
                              bg={tr.direction === 'LONG' ? 'rgba(0,180,120,0.15)' : 'rgba(255,77,109,0.12)'}
                              color={tr.direction === 'LONG' ? '#00b878' : '#ff4d6d'}>{tr.direction}</Tag></td>
                            <td className="px-3.5 py-3 text-[12px] text-text-primary whitespace-nowrap">
                              {tr.entry?.price}
                              {tr.entry?.lotSize && <span className="text-text-dark text-[11px]"> ×{tr.entry.lotSize}L</span>}
                            </td>
                            <td className="px-3.5 py-3 text-[12px] text-text-muted whitespace-nowrap">
                              {c.avgExitPrice ? parseFloat(c.avgExitPrice.toFixed(4)) : '—'}
                            </td>
                            <td className="px-3.5 py-3 text-[13px] font-bold whitespace-nowrap" style={{ color: pnlColor(c.netPnl) }}>
                              {fmt$(c.netPnl)}
                            </td>
                            <td className="px-3.5 py-3">
                              <Tag bg="var(--bg-hover)" color="var(--text-mut)">{tr.strategy}</Tag>
                            </td>
                            <td className="px-3.5 py-3">
                              {tr.status === 'WIN' && <Tag bg="rgba(0,180,120,0.15)" color="#00a575">▲ Win</Tag>}
                              {tr.status === 'LOSS' && <Tag bg="rgba(255,77,109,0.12)" color="#ff4d6d">▼ Loss</Tag>}
                              {!tr.status && <span className="text-text-dim text-[11px]">—</span>}
                            </td>
                            <td className="px-3.5 py-3" onClick={(e) => e.stopPropagation()}>
                              <div className="flex gap-1.5">
                                <button className="text-[11px] text-text-muted border border-border rounded px-2 py-1 hover:border-accent-green hover:text-accent-green transition-colors cursor-pointer bg-transparent"
                                  onClick={() => navigate(`/edit/${tr.id}`)}>{t('edit')}</button>
                                <button className="text-[11px] text-text-muted border border-border rounded px-2 py-1 hover:border-accent-red hover:text-accent-red transition-colors cursor-pointer bg-transparent"
                                  onClick={() => setDeleteId(tr.id)}>✕</button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden space-y-3">
                  {filtered.map((tr) => {
                    const c = calcTrade(tr)
                    return (
                      <div key={tr.id} className="bg-bg-panel border border-border rounded-xl p-4 cursor-pointer active:bg-bg-hover transition-colors"
                        onClick={() => setDetail(tr)}>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-text-primary text-[15px]">{tr.symbol}</span>
                            <Tag bg={tr.direction === 'LONG' ? '#0d2e1f' : '#2e0d1a'} color={tr.direction === 'LONG' ? '#00e5a0' : '#ff4d6d'}>{tr.direction}</Tag>
                            <Tag bg={tr.status === 'OPEN' ? '#1a1f0d' : '#141b2d'} color={tr.status === 'OPEN' ? '#c8f060' : '#3a5a7a'}>{tr.status}</Tag>
                          </div>
                          <span className="font-bold text-[14px]" style={{ color: pnlColor(c.netPnl) }}>
                            {fmt$(c.netPnl)}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-text-muted">
                          <span>{tr.date}</span>
                          <span>{t('th_entry')}: {tr.entry?.price}{tr.entry?.lotSize ? ` ×${tr.entry.lotSize}L` : ''}</span>
                          <span>{t('th_close')}: {c.avgExitPrice ? parseFloat(c.avgExitPrice.toFixed(4)) : '—'}</span>
                          <span className="text-accent-blue">{tr.strategy}</span>
                        </div>
                      </div>
                    )
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
        onConfirm={() => {
          deleteTrade(deleteId)
          setDeleteId(null)
        }}
        title={t('delete_confirm')}
        message="Are you sure you want to delete this trade? This action cannot be undone."
        confirmText="Delete Trade"
      />
    </Layout>
  )
}
