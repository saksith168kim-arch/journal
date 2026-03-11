// src/pages/AnalyticsPage.jsx
import { useMemo } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid, Cell
} from 'recharts'
import { useTrades } from '../hooks/useTrades'
import { calcPortfolioStats, fmt$, pnlColor } from '../lib/calc'
import { StatCard, Spinner } from '../components/ui'
import Layout from '../components/layout/Layout'
import { useLang } from '../context/LanguageContext'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-bg-card border border-border rounded-xl px-3.5 py-2.5 text-[12px]">
      <p className="text-text-muted mb-0.5">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.value >= 0 ? '#00e5a0' : '#ff4d6d' }}>
          {fmt$(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const { trades, loading } = useTrades()
  const { t } = useLang()
  const stats = useMemo(() => calcPortfolioStats(trades), [trades])

  if (loading) return <Layout><Spinner /></Layout>

  const hasClosed = stats.total > 0

  return (
    <Layout openCount={stats.openCount}>
      <h1 className="text-[20px] font-extrabold text-text-primary mb-6">{t('analytics_title')}</h1>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-8">
        <StatCard label={t('stat_net_pnl')} value={fmt$(stats.totalNet)} color={stats.totalNet >= 0 ? '#00e5a0' : '#ff4d6d'} />
        <StatCard label={t('stat_win_rate')} value={`${stats.winRate.toFixed(1)}%`} sub={`${stats.wins}W / ${stats.losses}L`} color="#7dd8ff" />
        <StatCard label={t('stat_rr')} value={stats.rr ? stats.rr.toFixed(2) : '—'} color="#ffd166" />
        <StatCard label={t('stat_avg_win')} value={`+$${stats.avgWin.toFixed(0)}`} color="#00e5a0" />
        <StatCard label={t('stat_avg_loss')} value={`-$${stats.avgLoss.toFixed(0)}`} color="#ff4d6d" />
        <StatCard label={t('stat_total_fees')} value={`$${stats.totalFees.toFixed(2)}`} color="#ff8c6d" />
      </div>

      {!hasClosed ? (
        <div className="bg-bg-panel border border-border rounded-xl p-12 text-center">
          <p className="text-text-muted text-sm">{t('no_closed_trades')}</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Equity Curve */}
          <div className="bg-bg-panel border border-border rounded-xl p-5">
            <h2 className="font-extrabold text-text-primary text-[15px] mb-4">{t('equity_curve')}</h2>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={stats.equityCurve} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={stats.totalNet >= 0 ? '#00e5a0' : '#ff4d6d'} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={stats.totalNet >= 0 ? '#00e5a0' : '#ff4d6d'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a2a40" />
                <XAxis dataKey="symbol" tick={{ fill: '#3a5a7a', fontSize: 11, fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#3a5a7a', fontSize: 11, fontFamily: 'Inter' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} width={60} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="pnl" stroke={stats.totalNet >= 0 ? '#00e5a0' : '#ff4d6d'} strokeWidth={2} fill="url(#eq)" dot={{ fill: stats.totalNet >= 0 ? '#00e5a0' : '#ff4d6d', r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Monthly P&L */}
            {stats.monthlyPnl.length > 0 && (
              <div className="bg-bg-panel border border-border rounded-xl p-5">
                <h2 className="font-extrabold text-text-primary text-[15px] mb-4">{t('monthly_pnl')}</h2>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={stats.monthlyPnl} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a2a40" />
                    <XAxis dataKey="month" tick={{ fill: '#3a5a7a', fontSize: 11, fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#3a5a7a', fontSize: 11, fontFamily: 'Inter' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} width={60} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                      {stats.monthlyPnl.map((entry, i) => (
                        <Cell key={i} fill={entry.pnl >= 0 ? '#00e5a0' : '#ff4d6d'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Win/Loss bars */}
            <div className="bg-bg-panel border border-border rounded-xl p-5">
              <h2 className="font-extrabold text-text-primary text-[15px] mb-4">{t('win_loss_ratio')}</h2>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[12px] text-text-muted w-10">{stats.wins}W</span>
                <div className="flex-1 h-3 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-accent-green rounded-full" style={{ width: `${stats.total ? (stats.wins / stats.total) * 100 : 0}%` }} />
                </div>
                <span className="text-[12px] text-accent-green">{stats.winRate.toFixed(1)}%</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[12px] text-text-muted w-10">{stats.losses}L</span>
                <div className="flex-1 h-3 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-accent-red rounded-full" style={{ width: `${stats.total ? (stats.losses / stats.total) * 100 : 0}%` }} />
                </div>
                <span className="text-[12px] text-accent-red">{(100 - parseFloat(stats.winRate)).toFixed(1)}%</span>
              </div>

              {stats.profitFactor && (
                <div className="mt-5 pt-4 border-t border-border">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-text-muted">{t('profit_factor')}</span>
                    <span style={{ color: stats.profitFactor >= 1.5 ? '#00e5a0' : stats.profitFactor >= 1 ? '#ffd166' : '#ff4d6d' }}>
                      {stats.profitFactor.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[13px] mt-2">
                    <span className="text-text-muted">{t('stat_rr')}</span>
                    <span className="text-accent-yellow">{stats.rr ? stats.rr.toFixed(2) : '—'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Strategy Breakdown */}
          <div className="bg-bg-panel border border-border rounded-xl p-5">
            <h2 className="font-extrabold text-text-primary text-[15px] mb-5">{t('strategy_breakdown')}</h2>
            {stats.stratBreakdown.map(([strat, data]) => {
              const max = Math.max(...stats.stratBreakdown.map(([, d]) => Math.abs(d.pnl)), 1)
              const wr = ((data.wins / data.count) * 100).toFixed(0)
              return (
                <div key={strat} className="mb-4">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[13px] text-text-primary">{strat}</span>
                    <div className="flex gap-4 items-center">
                      <span className="text-[11px] text-text-dim">{data.count} trades · {wr}% WR</span>
                      <span className="text-[13px] font-bold" style={{ color: pnlColor(data.pnl) }}>{fmt$(data.pnl)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-border rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(Math.abs(data.pnl) / max) * 100}%`, background: data.pnl >= 0 ? '#00e5a0' : '#ff4d6d' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </Layout>
  )
}
