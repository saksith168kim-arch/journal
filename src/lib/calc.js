// src/lib/calc.js — all trade math in one place

// Quick P&L using the lot-size formula (same as PositionEntryForm)
//   LONG:  (closePrice - entryPrice) × lotSize × 100
//   SHORT: (entryPrice - closePrice) × lotSize × 100
function quickPnl(trade) {
  const { entry, direction } = trade
  const e = Number(entry?.price)
  const c = Number(entry?.closePrice)
  const l = Number(entry?.lotSize)
  if (!e || !c || !l || isNaN(e) || isNaN(c) || isNaN(l)) return null
  return direction === 'SHORT' ? (e - c) * l * 100 : (c - e) * l * 100
}

export function calcTrade(trade) {
  const { entry = {} } = trade

  // Primary P&L: from the lotSize formula
  const pnl = quickPnl(trade)
  const fees = Number(entry.fees || 0)
  const grossPnl = pnl ?? 0
  const netPnl = grossPnl - fees

  return {
    grossPnl,
    netPnl,
    totalFees: fees,
    avgExitPrice: entry.closePrice ? Number(entry.closePrice) : null,
    exitedQty: null,
    remainingQty: null,
    riskAmount: null,
    rMultiple: null,
    totalQty: entry.lotSize ? Number(entry.lotSize) : null,
    hasData: pnl !== null,
  }
}

export function calcPortfolioStats(trades) {
  // Count trades that have a result (WIN or LOSS)
  const closed = trades.filter((t) => t.status === 'WIN' || t.status === 'LOSS')
  const calcs = closed.map((t) => ({ trade: t, ...calcTrade(t) }))

  const totalNet = calcs.reduce((s, c) => s + c.netPnl, 0)
  const wins = calcs.filter((c) => c.netPnl > 0)
  const losses = calcs.filter((c) => c.netPnl < 0)
  const winRate = closed.length ? (wins.length / closed.length) * 100 : 0
  const avgWin = wins.length ? wins.reduce((s, c) => s + c.netPnl, 0) / wins.length : 0
  const avgLoss = losses.length ? losses.reduce((s, c) => s + c.netPnl, 0) / losses.length : 0
  const rr = avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : null
  const totalFees = calcs.reduce((s, c) => s + c.totalFees, 0)
  const profitFactor =
    losses.length && Math.abs(avgLoss * losses.length) > 0
      ? (avgWin * wins.length) / Math.abs(avgLoss * losses.length)
      : null

  // Equity curve sorted by date
  const sortedClosed = [...closed].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  )
  let cum = 0
  const equityCurve = sortedClosed.map((t, i) => {
    cum += calcTrade(t).netPnl
    return { index: i + 1, date: t.date, symbol: t.symbol, pnl: cum }
  })

  // Per-strategy breakdown
  const stratMap = {}
  closed.forEach((t) => {
    const c = calcTrade(t)
    if (!stratMap[t.strategy]) stratMap[t.strategy] = { pnl: 0, count: 0, wins: 0 }
    stratMap[t.strategy].pnl += c.netPnl
    stratMap[t.strategy].count++
    if (c.netPnl > 0) stratMap[t.strategy].wins++
  })
  const stratBreakdown = Object.entries(stratMap).sort((a, b) => b[1].pnl - a[1].pnl)

  // Monthly P&L
  const monthMap = {}
  closed.forEach((t) => {
    const key = t.date?.slice(0, 7)
    if (!key) return
    if (!monthMap[key]) monthMap[key] = 0
    monthMap[key] += calcTrade(t).netPnl
  })
  const monthlyPnl = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, pnl]) => ({ month, pnl }))

  return {
    totalNet,
    winRate,
    wins: wins.length,
    losses: losses.length,
    total: closed.length,
    rr,
    avgWin,
    avgLoss: Math.abs(avgLoss),
    totalFees,
    profitFactor,
    equityCurve,
    stratBreakdown,
    monthlyPnl,
    openCount: trades.filter((t) => !t.status).length,
  }
}

export const fmt$ = (v, decimals = 2) => {
  if (v == null) return '—'
  const abs = Math.abs(v).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  return `${v >= 0 ? '+' : '-'}$${abs}`
}

export const fmtN = (v) =>
  v == null ? '—' : parseFloat(v).toLocaleString(undefined, { maximumFractionDigits: 6 })

export const pnlColor = (v) => (v == null ? '#4a6a8a' : v >= 0 ? '#00e5a0' : '#ff4d6d')
