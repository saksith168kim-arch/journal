// src/components/trades/PnlCalendar.jsx
import { useState, useMemo } from 'react'
import { calcTrade, fmt$, pnlColor } from '../../lib/calc'
import { Tag } from '../ui'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function fmt(v) {
  if (v == null || v === 0) return null
  const abs = Math.abs(v)
  const s = abs >= 1000 ? `$${(abs / 1000).toFixed(1)}K` : `$${abs.toFixed(0)}`
  return v > 0 ? `+${s}` : `-${s}`
}

export default function PnlCalendar({ trades }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selectedKey, setSelectedKey] = useState(null)

  const dailyMap = useMemo(() => {
    const map = {}
    trades.forEach((tr) => {
      if (!tr.date) return
      const c = calcTrade(tr)
      const pnl = c.netPnl ?? 0
      const key = tr.date.slice(0, 10)
      if (!map[key]) map[key] = { pnl: 0, count: 0, wins: 0, trades: [] }
      map[key].pnl += pnl
      map[key].count++
      if (pnl > 0) map[key].wins++
      map[key].trades.push(tr)
    })
    return map
  }, [trades])

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  const weeklyTotals = weeks.map((week) =>
    week.reduce((sum, d) => {
      if (!d) return sum
      const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      return sum + (dailyMap[key]?.pnl ?? 0)
    }, 0)
  )
  const monthTotal = weeklyTotals.reduce((a, b) => a + b, 0)

  function prev() { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  function next() { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }

  const today = new Date()
  const selectedData = selectedKey ? dailyMap[selectedKey] : null

  return (
    <div>
      {/* Calendar Panel */}
      <div className="w-full bg-bg-panel border border-border rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <button onClick={prev} className="w-8 h-8 flex items-center justify-center rounded-md text-text-muted hover:bg-bg-hover hover:text-text-primary cursor-pointer bg-transparent border-none transition-colors">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <button onClick={next} className="w-8 h-8 flex items-center justify-center rounded-md text-text-muted hover:bg-bg-hover hover:text-text-primary cursor-pointer bg-transparent border-none transition-colors">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>
            <h2 className="text-[16px] sm:text-[18px] font-bold text-text-primary m-0">{MONTH_NAMES[month]} {year}</h2>
          </div>
          <span className="text-[13px] sm:text-[14px] font-bold px-3 py-1 rounded-md font-mono" style={{
            color: monthTotal > 0 ? 'var(--col-win-fixed)' : monthTotal < 0 ? 'var(--col-loss-fixed)' : 'var(--text-mut-fixed)',
            background: monthTotal > 0 ? 'var(--col-win-bg-fixed)' : monthTotal < 0 ? 'var(--col-loss-bg-fixed)' : 'transparent',
          }}>
            {monthTotal === 0 ? '$0.00' : (monthTotal > 0 ? '+' : '') + monthTotal.toLocaleString(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {DAYS.map(d => (
            <div key={d} className="text-center text-[11px] font-semibold text-text-dim py-2.5 border-r border-border last:border-r-0">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div>
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 border-b border-border last:border-b-0">
              {week.map((d, di) => {
                if (!d) return <div key={di} className="border-r border-border last:border-r-0 min-h-[70px] sm:min-h-[85px]" style={{ background: 'color-mix(in srgb, var(--bg-base) 60%, transparent)' }} />
                const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                const data = dailyMap[key]
                const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d
                const isSelected = selectedKey === key
                const pnl = data?.pnl ?? null
                const wr = data && data.count > 0 ? Math.round((data.wins / data.count) * 100) : null

                return (
                  <div key={di}
                    onClick={() => data && setSelectedKey(prev => prev === key ? null : key)}
                    className="border-r border-border last:border-r-0 min-h-[70px] sm:min-h-[85px] p-1.5 sm:p-2 flex flex-col transition-colors"
                    style={{
                      cursor: data ? 'pointer' : 'default',
                      background: isSelected ? 'var(--acc-subtle-fixed)' : undefined,
                      boxShadow: isSelected ? 'inset 3px 0 0 var(--acc-main)' : undefined,
                    }}
                    onMouseOver={e => { if (data && !isSelected) e.currentTarget.style.background = 'var(--bg-hover)' }}
                    onMouseOut={e => { if (!isSelected) e.currentTarget.style.background = '' }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] sm:text-[12px] font-medium w-6 h-6 flex items-center justify-center rounded-full" style={{
                        background: isToday ? 'var(--acc-main-fixed)' : 'transparent',
                        color: isToday ? '#fff' : isSelected ? 'var(--acc-main-fixed)' : 'var(--text-mut-fixed)',
                        fontWeight: isToday || isSelected ? 700 : 400,
                      }}>{d}</span>
                      {data && data.count > 0 && (
                        <span className="text-[9px] text-text-dim hidden sm:inline">{data.count} trade{data.count !== 1 ? 's' : ''}</span>
                      )}
                    </div>
                    {data && (
                      <div className="mt-auto flex flex-col gap-0.5">
                        <div className="rounded-[3px] px-1.5 py-[2px] text-[10px] sm:text-[11px] font-bold leading-tight truncate" style={{
                          background: pnl > 0 ? 'var(--col-win-bg-fixed)' : pnl < 0 ? 'var(--col-loss-bg-fixed)' : 'var(--col-warn-bg)',
                          color: pnl > 0 ? 'var(--col-win-fixed)' : pnl < 0 ? 'var(--col-loss-fixed)' : 'var(--col-warn-fixed)',
                          borderLeft: `3px solid ${pnl > 0 ? 'var(--col-win-fixed)' : pnl < 0 ? 'var(--col-loss-fixed)' : 'var(--col-warn-fixed)'}`,
                        }}>
                          {fmt(pnl) || '$0'}
                        </div>
                        {wr != null && (
                          <span className="text-[8px] sm:text-[9px] text-text-dim pl-1 truncate hidden sm:block">{wr}% win rate</span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Weekly summary row — horizontal boxes below calendar */}
      <div className="mt-2 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${weeklyTotals.length + 1}, 1fr)` }}>
        {weeklyTotals.map((wPnl, wi) => (
          <div key={wi} className="bg-bg-panel border border-border rounded-lg px-2 py-2 flex flex-col gap-0.5">
            <span className="text-[9px] text-text-dim uppercase tracking-wider">Week {wi + 1}</span>
            <span className="text-[12px] font-bold font-mono" style={{
              color: wPnl > 0 ? 'var(--col-win-fixed)' : wPnl < 0 ? 'var(--col-loss-fixed)' : 'var(--text-mut-fixed)',
            }}>
              {fmt(wPnl) || '$0'}
            </span>
          </div>
        ))}
        {/* Total box */}
        <div className="bg-bg-card border border-border rounded-lg px-2 py-2 flex flex-col gap-0.5">
          <span className="text-[9px] text-text-dim uppercase tracking-wider">Total</span>
          <span className="text-[12px] font-bold font-mono" style={{
            color: monthTotal > 0 ? 'var(--col-win-fixed)' : monthTotal < 0 ? 'var(--col-loss-fixed)' : 'var(--text-mut-fixed)',
          }}>
            {fmt(monthTotal) || '$0'}
          </span>
        </div>
      </div>

      {/* Day detail panel */}
      {selectedData && (
        <div className="mt-3 bg-bg-panel border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div>
              <div className="text-[13px] font-bold text-text-primary font-mono">{selectedKey}</div>
              <div className="text-[11px] text-text-dim mt-0.5">
                {selectedData.count} trade{selectedData.count !== 1 ? 's' : ''}
                &nbsp;·&nbsp;
                <span style={{ color: selectedData.pnl > 0 ? 'var(--col-win-fixed)' : selectedData.pnl < 0 ? 'var(--col-loss-fixed)' : 'var(--col-warn-fixed)' }}>
                  {fmt$(selectedData.pnl)}
                </span>
              </div>
            </div>
            <button onClick={() => setSelectedKey(null)} className="w-7 h-7 flex items-center justify-center rounded-md text-text-dim hover:text-text-primary hover:bg-bg-hover bg-transparent border-none cursor-pointer transition-colors text-[14px]">✕</button>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {selectedData.trades.map((tr) => {
              const c = calcTrade(tr)
              return (
                <div key={tr.id} className="px-4 py-3 hover:bg-bg-hover transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-bold text-text-primary">{tr.symbol}</span>
                      <Tag bg={tr.direction === 'LONG' ? 'var(--col-win-bg-fixed)' : 'var(--col-loss-bg-fixed)'} color={tr.direction === 'LONG' ? 'var(--col-win-fixed)' : 'var(--col-loss-fixed)'}>{tr.direction}</Tag>
                    </div>
                    <span className="text-[13px] font-bold" style={{ color: pnlColor(c.netPnl) }}>{fmt$(c.netPnl)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-text-dim">
                    <span>Entry: {tr.entry?.price ?? '—'} × {tr.entry?.lotSize ?? '—'}L</span>
                    <span>Close: {tr.entry?.closePrice ?? '—'}</span>
                  </div>
                  {tr.strategy && <div className="mt-1.5"><Tag bg="var(--bg-hover)" color="var(--text-sec)">{tr.strategy}</Tag></div>}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}