// src/components/trades/TradeDetail.jsx
import { calcTrade, fmt$, fmtN, pnlColor } from '../../lib/calc'
import { Modal, Tag } from '../ui'

function Sec({ title, color, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em',
        paddingBottom: 8, marginBottom: 12,
        borderBottom: '1px solid var(--border)', color,
        fontFamily: 'var(--font-mono)',
      }}>{title}</div>
      {children}
    </div>
  )
}

function Row({ label, value, vc }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-mut)' }}>
      <span>{label}</span>
      <span style={{ color: vc || 'var(--text-pri)' }}>{value}</span>
    </div>
  )
}

export default function TradeDetail({ trade, onClose, onEdit }) {
  const c = calcTrade(trade)
  const side = trade.direction === 'SHORT' ? -1 : 1

  return (
    <Modal onClose={onClose}>
      <div style={{ padding: '16px' }} className="sm:p-6 md:p-8">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: 'var(--text-pri)' }}>{trade.symbol}</span>
              <Tag bg={trade.direction === 'LONG' ? 'var(--col-win-bg)' : 'var(--col-loss-bg)'} color={trade.direction === 'LONG' ? 'var(--col-win)' : 'var(--col-loss)'}>{trade.direction}</Tag>
              <Tag bg="var(--acc-subtle)" color={trade.status === 'OPEN' ? 'var(--col-win)' : 'var(--text-sec)'}>{trade.status}</Tag>
              <Tag>{trade.asset}</Tag>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{trade.date} · {trade.strategy}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onEdit} style={{
              fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-sec)',
              border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px',
              cursor: 'pointer', background: 'transparent', transition: 'all 0.15s',
            }}
              onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--acc-main)'; e.currentTarget.style.color = 'var(--acc-main)' }}
              onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-sec)' }}
            >Edit</button>
            <button onClick={onClose} style={{ color: 'var(--text-mut)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 20, lineHeight: 1, transition: 'color 0.15s' }}
              onMouseOver={e => e.currentTarget.style.color = 'var(--text-pri)'}
              onMouseOut={e => e.currentTarget.style.color = 'var(--text-mut)'}
            >✕</button>
          </div>
        </div>

        {/* P&L grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4 mb-6">
          {[
            ['Net P&L', fmt$(c.netPnl), pnlColor(c.netPnl)],
            ['Gross P&L', fmt$(c.grossPnl), pnlColor(c.grossPnl)],
            ['Total Fees', `$${c.totalFees.toFixed(2)}`, 'var(--col-warn)'],
            ['R-Multiple', c.rMultiple ? `${c.rMultiple}R` : '—', c.rMultiple >= 0 ? 'var(--col-win)' : 'var(--col-loss)'],
            ['Risk Amount', c.riskAmount ? `$${c.riskAmount.toFixed(2)}` : '—', 'var(--col-loss)'],
            ['Exited', `${fmtN(c.exitedQty)} / ${fmtN(c.totalQty)}`, 'var(--acc-main)'],
          ].map(([l, v, col]) => (
            <div key={l} style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 12px' }} className="sm:p-3">
              <div style={{ fontSize: 9, letterSpacing: '0.15em', color: 'var(--text-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>{l}</div>
              <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-mono)', color: col }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Entry */}
        <Sec title="↑ Entry" color="var(--col-win)">
          <Row label="Price" value={trade.entry.price} />
          <Row label="Quantity" value={fmtN(trade.entry.quantity)} />
          <Row label="Position Value" value={`$${(trade.entry.price * trade.entry.quantity).toLocaleString()}`} />
          {trade.entry.stopLoss && <Row label="Stop Loss" value={trade.entry.stopLoss} vc="var(--col-loss)" />}
          {trade.entry.fees > 0 && <Row label="Entry Fees" value={`$${trade.entry.fees}`} />}
        </Sec>

        {/* Take profits */}
        {trade.entry.takeProfits?.length > 0 && (
          <Sec title="🎯 Take Profit Targets" color="var(--col-warn)">
            {trade.entry.takeProfits.map((tp, i) => {
              const reward = (tp.price - trade.entry.price) * side
              const risk = trade.entry.stopLoss ? Math.abs(trade.entry.price - trade.entry.stopLoss) : null
              const rr = risk ? (reward / risk).toFixed(2) : null
              return (
                <div key={tp.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                  <span style={{ color: 'var(--text-dim)', width: 28 }}>TP{i + 1}</span>
                  <span style={{ color: 'var(--text-pri)' }}>@ {tp.price}</span>
                  <span style={{ color: 'var(--acc-main)' }}>×{fmtN(tp.quantity)}</span>
                  {rr && <span style={{ color: 'var(--col-warn)' }}>{rr}R</span>}
                  <span style={{ color: 'var(--col-win)', marginLeft: 'auto' }}>{fmt$((tp.price - trade.entry.price) * (tp.quantity || 0) * side)}</span>
                </div>
              )
            })}
          </Sec>
        )}

        {/* Exits */}
        {trade.exits?.length > 0 && (
          <Sec title="↓ Exits" color="var(--col-loss)">
            {trade.exits.map((e, i) => {
              const exitPnl = (e.price - trade.entry.price) * e.quantity * side - (e.fees || 0)
              return (
                <div key={e.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                    <span style={{ color: 'var(--text-dim)', width: 24 }}>E{i + 1}</span>
                    <span style={{ color: 'var(--text-sec)' }}>{e.date}</span>
                    <span style={{ color: 'var(--text-pri)' }}>@ {e.price}</span>
                    <span style={{ color: 'var(--acc-main)' }}>×{fmtN(e.quantity)}</span>
                    {e.fees > 0 && <span style={{ color: 'var(--col-warn)' }}>fee ${e.fees}</span>}
                    <span style={{ marginLeft: 'auto', fontWeight: 700, color: pnlColor(exitPnl) }}>{fmt$(exitPnl)}</span>
                  </div>
                  {e.note && <p style={{ color: 'var(--text-dim)', fontSize: 11, fontFamily: 'var(--font-mono)', marginTop: 4, paddingLeft: 32 }}>↳ {e.note}</p>}
                </div>
              )
            })}
            {c.avgExitPrice && <Row label="Avg Exit Price" value={parseFloat(c.avgExitPrice.toFixed(4))} />}
          </Sec>
        )}

        {/* Notes */}
        {trade.notes && (
          <Sec title="📝 Notes" color="var(--acc-main)">
            <p style={{ color: 'var(--text-sec-fixed)', fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 1.7 }}>{trade.notes}</p>
          </Sec>
        )}

        {/* Position Screenshot */}
        {trade.entry?.imageUrl && (
          <Sec title="📸 Position Screenshot" color="var(--acc-main)">
            <a href={trade.entry.imageUrl} target="_blank" rel="noopener noreferrer">
              <img
                src={trade.entry.imageUrl}
                alt="Position screenshot"
                style={{
                  width: '100%',
                  maxHeight: 400,
                  objectFit: 'contain',
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-base)',
                  cursor: 'zoom-in',
                  transition: 'opacity 0.2s',
                }}
                onMouseOver={e => e.currentTarget.style.opacity = '0.85'}
                onMouseOut={e => e.currentTarget.style.opacity = '1'}
              />
            </a>
            <p style={{ fontSize: 10, color: 'var(--text-dim-fixed)', marginTop: 6, textAlign: 'center' }}>
              Click image to open full size
            </p>
          </Sec>
        )}
      </div>
    </Modal>
  )
}