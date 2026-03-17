// src/pages/AnalyticsPage.jsx
import { useMemo, useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid, Cell
} from 'recharts'
import { useTrades } from '../hooks/useTrades'
import { calcPortfolioStats, calcTrade, fmt$, pnlColor } from '../lib/calc'
import { StatCard, Spinner } from '../components/ui'
import Layout from '../components/layout/Layout'
import { useLang } from '../context/LanguageContext'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: 12, boxShadow: 'var(--shadow-panel)' }}>
      <p style={{ color: 'var(--text-mut)', marginBottom: 4 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.value >= 0 ? 'var(--col-win)' : 'var(--col-loss)' }}>{fmt$(p.value)}</p>
      ))}
    </div>
  )
}

function WinGauge({ wins, losses, be, winRate }) {
  const total = wins + losses + be
  const lossPct = total > 0 ? losses / total : 0
  const bePct = total > 0 ? be / total : 0
  const winPct = total > 0 ? wins / total : 0
  const CX = 60, CY = 58, R = 44, SW = 10
  const pt = (angleDeg) => {
    const rad = (angleDeg * Math.PI) / 180
    return { x: CX + R * Math.cos(rad), y: CY - R * Math.sin(rad) }
  }
  const arc = (startDeg, endDeg, color) => {
    if (Math.abs(endDeg - startDeg) < 0.1) return null
    const s = pt(startDeg), e = pt(endDeg)
    return <path d={`M ${s.x} ${s.y} A ${R} ${R} 0 ${(endDeg - startDeg) > 180 ? 1 : 0} 0 ${e.x} ${e.y}`} fill="none" stroke={color} strokeWidth={SW} strokeLinecap="butt" />
  }
  const lossEnd = 180 - lossPct * 180
  const beEnd = lossEnd - bePct * 180
  return (
    <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px' }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 2 }}>Trade Win %</div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <svg viewBox="0 4 120 62" style={{ width: '100%', maxWidth: 170 }}>
          <path d={`M ${pt(0).x} ${pt(0).y} A ${R} ${R} 0 0 0 ${pt(180).x} ${pt(180).y}`} fill="none" stroke="var(--bg-card)" strokeWidth={SW} strokeLinecap="butt" />
          {arc(0, lossEnd, '#f87171')}
          {arc(lossEnd, beEnd, '#60a5fa')}
          {arc(beEnd, 180, '#34d399')}
          <line x1={CX} y1={CY} x2={CX + R * 0.6 * Math.cos((winPct * Math.PI))} y2={CY - R * 0.6 * Math.sin((winPct * Math.PI))} stroke="var(--text-pri)" strokeWidth={2} strokeLinecap="round" />
          <circle cx={CX} cy={CY} r={3.5} fill="var(--text-pri)" />
        </svg>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--acc-main)', fontFamily: 'var(--font-mono)', textAlign: 'center', marginTop: -10, marginBottom: 8 }}>{winRate.toFixed(2)}%</div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
        {[{ color: '#34d399', count: wins, label: 'W' }, { color: '#60a5fa', count: be, label: 'BE' }, { color: '#f87171', count: losses, label: 'L' }].map(({ color, count, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
            <span style={{ fontSize: 12, fontWeight: 800, color, fontFamily: 'var(--font-mono)' }}>{count}</span>
            <span style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 600 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── AI Trade Review ──────────────────────────────────────────────────────────
function AIReview({ trades, stats }) {
  const [review, setReview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function generate() {
    setLoading(true)
    setError(null)
    try {
      const summary = {
        totalTrades: stats.total,
        winRate: stats.winRate.toFixed(1),
        wins: stats.wins, losses: stats.losses, be: stats.be || 0,
        totalPnl: stats.totalNet.toFixed(2),
        avgWin: stats.avgWin.toFixed(2),
        avgLoss: stats.avgLoss.toFixed(2),
        rr: stats.rr?.toFixed(2) || 'N/A',
        profitFactor: stats.profitFactor?.toFixed(2) || 'N/A',
        strategies: stats.stratBreakdown.map(([s, d]) => ({
          name: s, trades: d.count, wins: d.wins,
          pnl: d.pnl.toFixed(2),
          wr: ((d.wins / d.count) * 100).toFixed(0)
        })),
        recentTrades: trades.slice(0, 10).map(tr => {
          let c = {}; try { c = calcTrade(tr) } catch { }
          return { symbol: tr.symbol, direction: tr.direction, status: tr.status, pnl: c.netPnl?.toFixed(2), strategy: tr.strategy, date: tr.date }
        })
      }
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `You are an expert trading coach. Analyze this trader's performance data and give a concise, actionable review.

Trading Stats:
${JSON.stringify(summary, null, 2)}

Give your response in this exact JSON format (no markdown, no backticks):
{
  "grade": "A/B/C/D/F",
  "headline": "One punchy sentence summary of their trading",
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "topTip": "The single most important thing they should focus on",
  "bestStrategy": "strategy name or null",
  "worstStrategy": "strategy name or null"
}`
          }]
        })
      })
      const data = await res.json()
      const text = data.content?.[0]?.text || ''
      const parsed = JSON.parse(text)
      setReview(parsed)
    } catch (e) {
      setError('Could not generate review. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const gradeColor = review ? { A: '#34d399', B: '#60a5fa', C: '#fbbf24', D: '#fb923c', F: '#f87171' }[review.grade] || '#94a3b8' : null

  return (
    <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-pri)', margin: 0 }}>🤖 AI Trade Review</h2>
          <p style={{ fontSize: 11, color: 'var(--text-mut)', margin: '3px 0 0' }}>Powered by Claude · Personalized coaching based on your data</p>
        </div>
        <button onClick={generate} disabled={loading} style={{
          padding: '8px 18px', borderRadius: 9, border: 'none',
          background: loading ? 'var(--bg-card)' : 'var(--grad-accent)',
          color: loading ? 'var(--text-dim)' : '#fff',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontWeight: 700, fontSize: 12, fontFamily: 'var(--font-ui)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          {loading ? (
            <><span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid var(--text-dim)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Analyzing...</>
          ) : (
            <>{review ? '↺ Re-analyze' : '✨ Analyze My Trading'}</>
          )}
        </button>
      </div>

      {error && <div style={{ background: 'var(--col-loss-bg)', border: '1px solid var(--col-loss)', borderRadius: 8, padding: '10px 14px', color: 'var(--col-loss)', fontSize: 12 }}>{error}</div>}

      {!review && !loading && !error && (
        <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-dim)', fontSize: 13 }}>
          Click "Analyze My Trading" to get personalized AI feedback on your performance
        </div>
      )}

      {review && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Grade + headline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'var(--bg-card)', borderRadius: 12, padding: '14px 18px' }}>
            <div style={{ fontSize: 48, fontWeight: 900, color: gradeColor, fontFamily: 'var(--font-mono)', lineHeight: 1, minWidth: 52, textAlign: 'center' }}>{review.grade}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-pri)', lineHeight: 1.4 }}>{review.headline}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                {review.bestStrategy && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 5, background: '#34d39918', color: '#34d399', fontWeight: 700 }}>✓ Best: {review.bestStrategy}</span>}
                {review.worstStrategy && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 5, background: '#f8717118', color: '#f87171', fontWeight: 700 }}>✗ Worst: {review.worstStrategy}</span>}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {/* Strengths */}
            <div style={{ background: '#34d39910', border: '1px solid #34d39930', borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#34d399', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>💪 Strengths</div>
              {review.strengths?.map((s, i) => (
                <div key={i} style={{ fontSize: 12, color: 'var(--text-sec)', marginBottom: 5, display: 'flex', gap: 6 }}>
                  <span style={{ color: '#34d399', flexShrink: 0 }}>→</span>{s}
                </div>
              ))}
            </div>
            {/* Weaknesses */}
            <div style={{ background: '#f8717110', border: '1px solid #f8717130', borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#f87171', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>⚠️ Areas to Fix</div>
              {review.weaknesses?.map((w, i) => (
                <div key={i} style={{ fontSize: 12, color: 'var(--text-sec)', marginBottom: 5, display: 'flex', gap: 6 }}>
                  <span style={{ color: '#f87171', flexShrink: 0 }}>→</span>{w}
                </div>
              ))}
            </div>
          </div>

          {/* Top tip */}
          <div style={{ background: 'var(--acc-subtle)', border: '1px solid var(--acc-main)', borderRadius: 12, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>🎯</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--acc-main)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Top Priority</div>
              <div style={{ fontSize: 13, color: 'var(--text-pri)', fontWeight: 600 }}>{review.topTip}</div>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

// ─── Streak & Best/Worst ──────────────────────────────────────────────────────
function StreakPanel({ trades, stats }) {
  const sorted = useMemo(() =>
    [...trades].filter(t => t.status === 'WIN' || t.status === 'LOSS' || t.status === 'BE')
      .sort((a, b) => new Date(a.date) - new Date(b.date)),
    [trades]
  )

  const { currentStreak, currentType, longestWin, longestLoss } = useMemo(() => {
    if (!sorted.length) return { currentStreak: 0, currentType: null, longestWin: 0, longestLoss: 0 }
    let cur = 1, curType = sorted[sorted.length - 1].status
    let lw = 0, ll = 0, streak = 1
    for (let i = sorted.length - 2; i >= 0; i--) {
      if (sorted[i].status === curType) cur++
      else break
    }
    let tmp = 1
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].status === 'WIN' && sorted[i - 1].status === 'WIN') { tmp++; lw = Math.max(lw, tmp) }
      else if (sorted[i].status === 'WIN') { tmp = 1; lw = Math.max(lw, 1) }
    }
    tmp = 1
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].status === 'LOSS' && sorted[i - 1].status === 'LOSS') { tmp++; ll = Math.max(ll, tmp) }
      else if (sorted[i].status === 'LOSS') { tmp = 1; ll = Math.max(ll, 1) }
    }
    return { currentStreak: cur, currentType: curType, longestWin: lw, longestLoss: ll }
  }, [sorted])

  const { bestTrade, worstTrade } = useMemo(() => {
    const calcs = trades.map(tr => { try { return { tr, pnl: calcTrade(tr).netPnl || 0 } } catch { return { tr, pnl: 0 } } })
    const best = calcs.reduce((a, b) => b.pnl > a.pnl ? b : a, calcs[0])
    const worst = calcs.reduce((a, b) => b.pnl < a.pnl ? b : a, calcs[0])
    return { bestTrade: best, worstTrade: worst }
  }, [trades])

  const streakColor = currentType === 'WIN' ? '#34d399' : currentType === 'LOSS' ? '#f87171' : '#60a5fa'
  const streakEmoji = currentType === 'WIN' ? '🔥' : currentType === 'LOSS' ? '❄️' : '➖'

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
      {/* Current streak */}
      <div style={{ background: 'var(--bg-panel)', border: `1px solid ${streakColor}40`, borderRadius: 14, padding: '16px 18px', textAlign: 'center' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Current Streak</div>
        <div style={{ fontSize: 42, fontWeight: 900, color: streakColor, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{currentStreak}</div>
        <div style={{ fontSize: 13, color: streakColor, fontWeight: 700, marginTop: 4 }}>{streakEmoji} {currentType || '—'}</div>
      </div>

      {/* Longest streaks */}
      <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Best Streaks</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--text-sec)' }}>🔥 Win streak</span>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-mono)' }}>{longestWin}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: 'var(--text-sec)' }}>❄️ Loss streak</span>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#f87171', fontFamily: 'var(--font-mono)' }}>{longestLoss}</span>
        </div>
      </div>

      {/* Best trade */}
      {bestTrade && (
        <div style={{ background: '#34d39910', border: '1px solid #34d39930', borderRadius: 14, padding: '16px 18px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>🏆 Best Trade</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#34d399', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>+${Math.abs(bestTrade.pnl).toFixed(2)}</div>
          <div style={{ fontSize: 11, color: 'var(--text-sec)' }}>{bestTrade.tr.symbol} · {bestTrade.tr.date}</div>
          <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>{bestTrade.tr.strategy}</div>
        </div>
      )}

      {/* Worst trade */}
      {worstTrade && (
        <div style={{ background: '#f8717110', border: '1px solid #f8717130', borderRadius: 14, padding: '16px 18px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>💀 Worst Trade</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#f87171', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>-${Math.abs(worstTrade.pnl).toFixed(2)}</div>
          <div style={{ fontSize: 11, color: 'var(--text-sec)' }}>{worstTrade.tr.symbol} · {worstTrade.tr.date}</div>
          <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>{worstTrade.tr.strategy}</div>
        </div>
      )}
    </div>
  )
}

// ─── Achievement Badges ───────────────────────────────────────────────────────
function Achievements({ trades, stats }) {
  const badges = useMemo(() => {
    const sorted = [...trades].filter(t => t.status).sort((a, b) => new Date(a.date) - new Date(b.date))
    let maxWinStreak = 0, cur = 0
    sorted.forEach((t, i) => {
      if (t.status === 'WIN') { cur++; maxWinStreak = Math.max(maxWinStreak, cur) }
      else cur = 0
    })

    const symbols = new Set(trades.map(t => t.symbol).filter(Boolean))
    const strategies = new Set(trades.map(t => t.strategy).filter(Boolean))
    const profitableDays = new Set(
      trades.filter(t => { try { return calcTrade(t).netPnl > 0 } catch { return false } }).map(t => t.date?.slice(0, 10))
    )

    return [
      { id: 'first', emoji: '🎯', name: 'First Blood', desc: 'Logged your first trade', earned: trades.length >= 1 },
      { id: 'ten', emoji: '📈', name: 'Getting Started', desc: '10 trades logged', earned: trades.length >= 10 },
      { id: 'fifty', emoji: '🚀', name: 'Committed', desc: '50 trades logged', earned: trades.length >= 50 },
      { id: 'hundred', emoji: '💯', name: 'Centurion', desc: '100 trades logged', earned: trades.length >= 100 },
      { id: 'streak3', emoji: '🔥', name: 'On Fire', desc: '3 win streak', earned: maxWinStreak >= 3 },
      { id: 'streak5', emoji: '⚡', name: 'Unstoppable', desc: '5 win streak', earned: maxWinStreak >= 5 },
      { id: 'winrate60', emoji: '🎪', name: 'Sharp Shooter', desc: '60%+ win rate', earned: stats.winRate >= 60 },
      { id: 'winrate75', emoji: '🏹', name: 'Sniper', desc: '75%+ win rate', earned: stats.winRate >= 75 },
      { id: 'profit', emoji: '💰', name: 'In The Green', desc: 'Net positive P&L', earned: stats.totalNet > 0 },
      { id: 'pf2', emoji: '📊', name: 'Profit Machine', desc: 'Profit factor above 2.0', earned: (stats.profitFactor || 0) >= 2 },
      { id: 'multisym', emoji: '🌍', name: 'Diversified', desc: 'Traded 3+ different symbols', earned: symbols.size >= 3 },
      { id: 'multistrat', emoji: '🧠', name: 'Strategist', desc: 'Used 3+ different strategies', earned: strategies.size >= 3 },
      { id: 'days10', emoji: '📅', name: 'Consistent', desc: '10+ profitable trading days', earned: profitableDays.size >= 10 },
      { id: 'rr2', emoji: '⚖️', name: 'Risk Manager', desc: 'Average R:R above 2.0', earned: (stats.rr || 0) >= 2 },
    ]
  }, [trades, stats])

  const earned = badges.filter(b => b.earned)
  const locked = badges.filter(b => !b.earned)

  return (
    <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-pri)', margin: 0 }}>🏆 Achievements</h2>
          <p style={{ fontSize: 11, color: 'var(--text-mut)', margin: '3px 0 0' }}>{earned.length} of {badges.length} unlocked</p>
        </div>
        <div style={{ height: 6, width: 120, background: 'var(--bg-card)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(earned.length / badges.length) * 100}%`, background: 'var(--grad-accent)', borderRadius: 3, transition: 'width 0.5s' }} />
        </div>
      </div>

      {/* Earned */}
      {earned.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {earned.map(b => (
            <div key={b.id} title={b.desc} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--acc-subtle)', border: '1px solid var(--acc-main)', borderRadius: 10, padding: '7px 12px' }}>
              <span style={{ fontSize: 18 }}>{b.emoji}</span>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--acc-main)' }}>{b.name}</div>
                <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>{b.desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Locked */}
      {locked.length > 0 && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Locked</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {locked.map(b => (
              <div key={b.id} title={b.desc} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '6px 10px', opacity: 0.5, filter: 'grayscale(1)' }}>
                <span style={{ fontSize: 16 }}>{b.emoji}</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-dim)' }}>{b.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
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
      <h1 className="text-[20px] font-extrabold text-text-primary mb-6 flex items-center gap-2">
        <img src="/Analyz.png" alt="" className="w-10 h-10 object-contain" />
        {t('analytics_title')}
      </h1>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-8">
        <StatCard label={t('stat_net_pnl')} value={fmt$(stats.totalNet)} color={stats.totalNet >= 0 ? 'var(--col-win)' : 'var(--col-loss)'} />
        <WinGauge wins={stats.wins} losses={stats.losses} be={stats.be || 0} winRate={stats.winRate} />
        <StatCard label={t('stat_rr')} value={stats.rr ? stats.rr.toFixed(2) : '—'} color="var(--col-warn)" />
        <StatCard label={t('stat_avg_win')} value={`+$${stats.avgWin.toFixed(0)}`} color="var(--col-win)" />
        <StatCard label={t('stat_avg_loss')} value={`-$${stats.avgLoss.toFixed(0)}`} color="var(--col-loss)" />
        <StatCard label={t('stat_total_fees')} value={`$${stats.totalFees.toFixed(2)}`} color="var(--text-sec)" />
      </div>

      {/* Streak + Best/Worst */}
      {hasClosed && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-pri)', marginBottom: 12 }}>⚡ Streaks & Highlights</h2>
          <StreakPanel trades={trades} stats={stats} />
        </div>
      )}

      {/* AI Review */}
      {hasClosed && (
        <div style={{ marginBottom: 24 }}>
          <AIReview trades={trades} stats={stats} />
        </div>
      )}

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
                  <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={stats.totalNet >= 0 ? 'var(--col-win)' : 'var(--col-loss)'} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={stats.totalNet >= 0 ? 'var(--col-win)' : 'var(--col-loss)'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--text-mut)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-mut)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} width={60} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="pnl" stroke={stats.totalNet >= 0 ? 'var(--col-win)' : 'var(--col-loss)'}
                  strokeWidth={2} fill="url(#pnlGrad)"
                  dot={{ fill: stats.totalNet >= 0 ? 'var(--col-win)' : 'var(--col-loss)', r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Monthly P&L */}
            {stats.monthlyPnl.length > 0 && (
              <div className="bg-bg-panel border border-border rounded-xl p-5">
                <h2 className="font-extrabold text-text-primary text-[15px] mb-4">{t('monthly_pnl')}</h2>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={stats.monthlyPnl} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" tick={{ fill: 'var(--text-mut)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--text-mut)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} width={60} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                      {stats.monthlyPnl.map((entry, i) => (
                        <Cell key={i} fill={entry.pnl >= 0 ? 'var(--col-win)' : 'var(--col-loss)'} />
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
                  <div className="h-full rounded-full transition-all" style={{ width: `${stats.total ? (stats.wins / stats.total) * 100 : 0}%`, background: 'var(--col-win)' }} />
                </div>
                <span className="text-[12px]" style={{ color: 'var(--col-win)' }}>{stats.winRate.toFixed(1)}%</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[12px] text-text-muted w-10">{stats.losses}L</span>
                <div className="flex-1 h-3 bg-border rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${stats.total ? (stats.losses / stats.total) * 100 : 0}%`, background: 'var(--col-loss)' }} />
                </div>
                <span className="text-[12px]" style={{ color: 'var(--col-loss)' }}>{(100 - parseFloat(stats.winRate)).toFixed(1)}%</span>
              </div>
              {stats.profitFactor && (
                <div className="mt-5 pt-4 border-t border-border">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-text-muted">{t('profit_factor')}</span>
                    <span style={{ color: stats.profitFactor >= 1.5 ? 'var(--col-win)' : stats.profitFactor >= 1 ? 'var(--col-warn)' : 'var(--col-loss)' }}>{stats.profitFactor.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[13px] mt-2">
                    <span className="text-text-muted">{t('stat_rr')}</span>
                    <span style={{ color: 'var(--col-warn)' }}>{stats.rr ? stats.rr.toFixed(2) : '—'}</span>
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
                    <div className="h-full rounded-full transition-all" style={{ width: `${(Math.abs(data.pnl) / max) * 100}%`, background: data.pnl >= 0 ? 'var(--col-win)' : 'var(--col-loss)' }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Achievements */}
          <Achievements trades={trades} stats={stats} />
        </div>
      )}
    </Layout>
  )
}