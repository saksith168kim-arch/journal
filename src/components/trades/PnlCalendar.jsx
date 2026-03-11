// src/components/trades/PnlCalendar.jsx
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
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

function cellStyle(pnl, selected) {
  if (selected) return { background: 'var(--acc-main)', border: '1px solid var(--acc-main)' }
  if (pnl == null) return {}
  if (pnl > 0) return { background: 'rgba(0,229,160,0.12)', border: '1px solid rgba(0,229,160,0.25)' }
  if (pnl < 0) return { background: 'rgba(255,77,109,0.12)', border: '1px solid rgba(255,77,109,0.25)' }
  return {}
}

export default function PnlCalendar({ trades }) {
  const now = new Date()
  const navigate = useNavigate()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selectedKey, setSelectedKey] = useState(null) // 'YYYY-MM-DD'

  // Build daily map
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

  // Calendar grid
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  const weekTotals = weeks.map((week) => {
    let pnl = 0; let days = 0
    week.forEach((d) => {
      if (!d) return
      const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      if (dailyMap[key]) { pnl += dailyMap[key].pnl; days++ }
    })
    return { pnl, days }
  })

  const monthTotal = weekTotals.reduce((s, w) => s + w.pnl, 0)

  const yearOptions = []
  for (let y = now.getFullYear() - 5; y <= now.getFullYear() + 1; y++) yearOptions.push(y)

  function prev() { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  function next() { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }

  const today = new Date()
  const selectedData = selectedKey ? dailyMap[selectedKey] : null

  function handleDayClick(key, data) {
    setSelectedKey(prev => prev === key ? null : key) // toggle
  }

  return (
    <div className="flex gap-4 items-start">
      {/* ── Calendar Panel ── */}
      <div className="flex-1 bg-bg-panel border border-border rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <div className="flex items-center gap-4">
            {/* Month */}
            <div className="flex items-center gap-1.5">
              <span className="font-display font-extrabold text-[15px] w-28 text-text-primary">{MONTH_NAMES[month]}</span>
              <div className="flex flex-col">
                <button onClick={prev} className="flex items-center justify-center w-5 h-4 text-text-muted hover:text-accent-green cursor-pointer bg-transparent border-none transition-colors leading-none" title="Previous month">
                  <svg width="9" height="6" viewBox="0 0 9 6" fill="none"><path d="M1 5l3.5-4L8 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
                <button onClick={next} className="flex items-center justify-center w-5 h-4 text-text-muted hover:text-accent-green cursor-pointer bg-transparent border-none transition-colors leading-none" title="Next month">
                  <svg width="9" height="6" viewBox="0 0 9 6" fill="none"><path d="M1 1l3.5 4L8 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </div>
            </div>
            {/* Year */}
            <div className="flex items-center gap-1.5">
              <span className="font-display font-extrabold text-[15px] w-14 text-text-primary">{year}</span>
              <div className="flex flex-col">
                <button onClick={() => setYear(y => y - 1)} className="flex items-center justify-center w-5 h-4 text-text-muted hover:text-accent-green cursor-pointer bg-transparent border-none transition-colors leading-none">
                  <svg width="9" height="6" viewBox="0 0 9 6" fill="none"><path d="M1 5l3.5-4L8 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
                <button onClick={() => setYear(y => y + 1)} className="flex items-center justify-center w-5 h-4 text-text-muted hover:text-accent-green cursor-pointer bg-transparent border-none transition-colors leading-none">
                  <svg width="9" height="6" viewBox="0 0 9 6" fill="none"><path d="M1 1l3.5 4L8 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[12px]">
            <span className="text-text-dim">Monthly:</span>
            <span className="font-bold" style={{ color: monthTotal > 0 ? '#00e5a0' : monthTotal < 0 ? '#ff4d6d' : '#4a6a8a' }}>
              {monthTotal === 0 ? '$0' : (monthTotal > 0 ? '+' : '') + monthTotal.toLocaleString(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        <div className="flex">
          {/* Grid */}
          <div className="flex-1 p-3">
            <div className="grid grid-cols-7 mb-1">
              {DAYS.map(d => (
                <div key={d} className="text-center text-[10px] font-semibold text-text-dim uppercase py-1.5">{d}</div>
              ))}
            </div>
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-1 mb-1">
                {week.map((d, di) => {
                  if (!d) return <div key={di} />
                  const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                  const data = dailyMap[key]
                  const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d
                  const isSelected = selectedKey === key
                  const pnl = data?.pnl ?? null
                  const wr = data && data.count > 0 ? Math.round((data.wins / data.count) * 100) : null

                  return (
                    <div
                      key={di}
                      onClick={() => data && handleDayClick(key, data)}
                      className={`rounded-lg p-1 sm:p-1.5 min-h-[60px] sm:min-h-[64px] flex flex-col justify-between transition-all overflow-hidden ${data ? 'cursor-pointer hover:scale-[1.03]' : ''}`}
                      style={data ? cellStyle(pnl, isSelected) : { border: '1px solid transparent' }}
                    >
                      <div className={`text-[10px] font-semibold self-start w-5 h-5 flex items-center justify-center rounded-full ${isSelected ? 'bg-bg-base text-text-primary' :
                          isToday ? 'bg-accent-green text-bg-base' : 'text-text-dim'
                        }`}>
                        {d}
                      </div>
                      {data && (
                        <div className="flex flex-col gap-0.5">
                          <div className="text-[10px] sm:text-[11px] font-bold leading-none truncate"
                            style={{ color: isSelected ? 'var(--bg-base)' : pnl > 0 ? '#00e5a0' : pnl < 0 ? '#ff4d6d' : '#ffd166' }}
                            title={fmt(pnl)}>
                            {fmt(pnl)}
                          </div>
                          <div className="text-[8px] sm:text-[9px] truncate" style={{ color: isSelected ? 'rgba(0,0,0,0.55)' : 'var(--text-dim)' }}>
                            <span className="hidden sm:inline">{data.count} trade{data.count !== 1 ? 's' : ''}{wr != null ? ` · ${wr}%` : ''}</span>
                            <span className="sm:hidden">{data.count}T{wr != null ? ` ${wr}%` : ''}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Weekly sidebar */}
          <div className="w-24 border-l border-border flex flex-col">
            <div className="h-[32px] border-b border-border flex items-center justify-center">
              <span className="text-[9px] text-text-dark uppercase tracking-wide">Week</span>
            </div>
            {weekTotals.map((w, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-center border-b border-border px-2 py-2 min-h-[65px]">
                <span className="text-[9px] text-text-dim mb-1">Week {i + 1}</span>
                <span className="text-[12px] font-bold leading-tight text-center"
                  style={{ color: w.pnl > 0 ? '#00e5a0' : w.pnl < 0 ? '#ff4d6d' : '#3a5a7a' }}>
                  {w.pnl === 0 ? '$0' : fmt(w.pnl)}
                </span>
                {w.days > 0 && <span className="text-[9px] text-text-dark mt-0.5">{w.days}d</span>}
              </div>
            ))}
            <div className="px-2 py-3 flex flex-col items-center justify-center border-t border-border bg-bg-card">
              <span className="text-[9px] text-text-dim mb-1">Total</span>
              <span className="text-[13px] font-bold"
                style={{ color: monthTotal > 0 ? '#00e5a0' : monthTotal < 0 ? '#ff4d6d' : '#3a5a7a' }}>
                {monthTotal === 0 ? '$0' : fmt(monthTotal)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Day Detail Panel ── */}
      {selectedData && (
        <div className="w-80 bg-bg-panel border border-border rounded-xl overflow-hidden flex-shrink-0">
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div>
              <div className="text-[13px] font-bold text-text-primary">{selectedKey}</div>
              <div className="text-[11px] text-text-dim mt-0.5">
                {selectedData.count} trade{selectedData.count !== 1 ? 's' : ''}
                &nbsp;·&nbsp;
                <span style={{ color: selectedData.pnl > 0 ? '#00e5a0' : selectedData.pnl < 0 ? '#ff4d6d' : '#ffd166' }}>
                  {fmt$(selectedData.pnl)}
                </span>
              </div>
            </div>
            <button onClick={() => setSelectedKey(null)}
              className="w-6 h-6 flex items-center justify-center rounded-full text-text-dim hover:text-text-primary bg-transparent border-none cursor-pointer transition-colors text-[14px]">
              ✕
            </button>
          </div>

          {/* Trade rows */}
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {selectedData.trades.map((tr) => {
              const c = calcTrade(tr)
              return (
                <div key={tr.id} className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-bold text-text-primary">{tr.symbol}</span>
                      <Tag
                        bg={tr.direction === 'LONG' ? 'rgba(0,180,120,0.15)' : 'rgba(255,77,109,0.12)'}
                        color={tr.direction === 'LONG' ? '#00b878' : '#ff4d6d'}
                      >{tr.direction}</Tag>
                    </div>
                    <span className="text-[13px] font-bold" style={{ color: pnlColor(c.netPnl) }}>
                      {fmt$(c.netPnl)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-text-dim">
                    <span>Entry: {tr.entry?.price ?? '—'} × {tr.entry?.lotSize ?? '—'}L</span>
                    <span>Close: {tr.entry?.closePrice ?? '—'}</span>
                  </div>
                  {tr.strategy && (
                    <div className="mt-1.5">
                      <Tag bg="var(--bg-hover)" color="var(--text-mut)">{tr.strategy}</Tag>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
