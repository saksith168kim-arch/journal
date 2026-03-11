// src/components/trades/TradeDetail.jsx
import { calcTrade, fmt$, fmtN, pnlColor } from '../../lib/calc'
import { Modal, Tag } from '../ui'

function Sec({ title, color, children }) {
  return (
    <div className="mb-5">
      <div className="text-[10px] uppercase pb-2 mb-3 border-b border-border" style={{ color }}>{title}</div>
      {children}
    </div>
  )
}
function Row({ label, value, vc = '#c8d8e8' }) {
  return (
    <div className="flex justify-between py-1.5 text-[12px] font-mono text-text-muted">
      <span>{label}</span><span style={{ color: vc }}>{value}</span>
    </div>
  )
}

export default function TradeDetail({ trade, onClose, onEdit }) {
  const c = calcTrade(trade)
  const side = trade.direction === 'SHORT' ? -1 : 1

  return (
    <Modal onClose={onClose}>
      <div className="p-6 sm:p-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
              <span className="font-display text-2xl font-extrabold text-text-primary">{trade.symbol}</span>
              <Tag bg={trade.direction === 'LONG' ? '#0d2e1f' : '#2e0d1a'} color={trade.direction === 'LONG' ? '#00e5a0' : '#ff4d6d'}>{trade.direction}</Tag>
              <Tag bg={trade.status === 'OPEN' ? '#1a1f0d' : '#141b2d'} color={trade.status === 'OPEN' ? '#c8f060' : '#4a6a8a'}>{trade.status}</Tag>
              <Tag>{trade.asset}</Tag>
            </div>
            <p className="text-[11px] text-text-dim font-mono">{trade.date} · {trade.strategy}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={onEdit} className="font-mono text-[11px] text-text-muted border border-border rounded-lg px-3 py-1.5 hover:border-accent-green hover:text-accent-green transition-colors cursor-pointer bg-transparent">Edit</button>
            <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors bg-transparent border-none cursor-pointer text-xl leading-none">✕</button>
          </div>
        </div>

        {/* P&L grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-6">
          {[
            ['Net P&L', fmt$(c.netPnl), pnlColor(c.netPnl)],
            ['Gross P&L', fmt$(c.grossPnl), pnlColor(c.grossPnl)],
            ['Total Fees', `$${c.totalFees.toFixed(2)}`, '#ffd166'],
            ['R-Multiple', c.rMultiple ? `${c.rMultiple}R` : '—', c.rMultiple >= 0 ? '#00e5a0' : '#ff4d6d'],
            ['Risk Amount', c.riskAmount ? `$${c.riskAmount.toFixed(2)}` : '—', '#ff4d6d'],
            ['Exited', `${fmtN(c.exitedQty)} / ${fmtN(c.totalQty)}`, '#7dd8ff'],
          ].map(([l, v, col]) => (
            <div key={l} className="bg-bg-base border border-border rounded-xl px-3.5 py-3">
              <div className="text-[9px] tracking-[2px] text-text-dark uppercase font-mono mb-1">{l}</div>
              <div className="text-[16px] font-bold font-mono" style={{ color: col }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Entry */}
        <Sec title="↑ Entry" color="#00e5a0">
          <Row label="Price" value={trade.entry.price} />
          <Row label="Quantity" value={fmtN(trade.entry.quantity)} />
          <Row label="Position Value" value={`$${(trade.entry.price * trade.entry.quantity).toLocaleString()}`} />
          {trade.entry.stopLoss && <Row label="Stop Loss" value={trade.entry.stopLoss} vc="#ff4d6d" />}
          {trade.entry.fees > 0 && <Row label="Entry Fees" value={`$${trade.entry.fees}`} />}
        </Sec>

        {/* Take profits */}
        {trade.entry.takeProfits?.length > 0 && (
          <Sec title="🎯 Take Profit Targets" color="#ffd166">
            {trade.entry.takeProfits.map((tp, i) => {
              const reward = (tp.price - trade.entry.price) * side
              const risk = trade.entry.stopLoss ? Math.abs(trade.entry.price - trade.entry.stopLoss) : null
              const rr = risk ? (reward / risk).toFixed(2) : null
              return (
                <div key={tp.id} className="flex flex-wrap items-center gap-3 py-2 border-b border-border text-[12px] font-mono">
                  <span className="text-text-dim w-7">TP{i + 1}</span>
                  <span className="text-text-primary">@ {tp.price}</span>
                  <span className="text-accent-blue">×{fmtN(tp.quantity)}</span>
                  {rr && <span className="text-accent-yellow">{rr}R</span>}
                  <span className="text-accent-green ml-auto">{fmt$((tp.price - trade.entry.price) * (tp.quantity || 0) * side)}</span>
                </div>
              )
            })}
          </Sec>
        )}

        {/* Exits */}
        {trade.exits?.length > 0 && (
          <Sec title="↓ Exits" color="#ff4d6d">
            {trade.exits.map((e, i) => {
              const exitPnl = (e.price - trade.entry.price) * e.quantity * side - (e.fees || 0)
              return (
                <div key={e.id} className="py-2 border-b border-border">
                  <div className="flex flex-wrap items-center gap-2.5 text-[12px] font-mono">
                    <span className="text-text-dim w-6">E{i + 1}</span>
                    <span className="text-text-muted">{e.date}</span>
                    <span className="text-text-primary">@ {e.price}</span>
                    <span className="text-accent-blue">×{fmtN(e.quantity)}</span>
                    {e.fees > 0 && <span style={{ color: '#4a3a2a' }}>fee ${e.fees}</span>}
                    <span className="ml-auto font-bold" style={{ color: pnlColor(exitPnl) }}>{fmt$(exitPnl)}</span>
                  </div>
                  {e.note && <p className="text-text-dark text-[11px] font-mono mt-1 pl-8">↳ {e.note}</p>}
                </div>
              )
            })}
            {c.avgExitPrice && <Row label="Avg Exit Price" value={parseFloat(c.avgExitPrice.toFixed(4))} />}
          </Sec>
        )}

        {/* Notes */}
        {trade.notes && (
          <Sec title="📝 Notes" color="#7dd8ff">
            <p className="text-[#6a8aaa] font-mono text-[13px] leading-relaxed">{trade.notes}</p>
          </Sec>
        )}
      </div>
    </Modal>
  )
}
