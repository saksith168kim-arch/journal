// src/components/trades/ExitsForm.jsx
import { useState } from 'react'
import { Input } from '../ui'

const mkId = () => Math.random().toString(36).slice(2)
const fmtN = (v) => v == null ? '—' : parseFloat(v).toLocaleString(undefined, { maximumFractionDigits: 6 })

export default function ExitsForm({ form, setForm }) {
  const [adding, setAdding] = useState(false)
  const [ex, setEx] = useState({ date: new Date().toISOString().slice(0, 10), price: '', quantity: '', fees: '', note: '' })

  const totalExited = (form.exits || []).reduce((s, e) => s + Number(e.quantity), 0)
  const entryQty = parseFloat(form.entry?.quantity) || 0
  const remaining = entryQty - totalExited
  const pct = entryQty > 0 ? Math.min(100, (totalExited / entryQty) * 100) : 0

  function addExit() {
    if (!ex.price || !ex.quantity) return
    setForm((f) => ({
      ...f,
      exits: [...(f.exits || []), { ...ex, id: mkId(), price: +ex.price, quantity: +ex.quantity, fees: +ex.fees || 0 }],
    }))
    setEx({ date: new Date().toISOString().slice(0, 10), price: '', quantity: '', fees: '', note: '' })
    setAdding(false)
  }

  function removeExit(id) {
    setForm((f) => ({ ...f, exits: (f.exits || []).filter((x) => x.id !== id) }))
  }

  return (
    <div className="bg-bg-card border border-border rounded-xl p-5 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div style={{ width: 28, height: 28, background: 'var(--col-loss)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14 }}>↓</div>
          <h3 className="text-[15px] font-extrabold text-text-primary">Exits / Partial Closes</h3>
        </div>
        {entryQty > 0 && (
          <span className="font-mono text-[11px]" style={{ color: remaining > 0 ? 'var(--col-win)' : 'var(--text-dim)' }}>
            {remaining > 0 ? `${fmtN(remaining)} remaining` : 'Fully exited'}
          </span>
        )}
      </div>

      {/* Progress bar */}
      {entryQty > 0 && (
        <div className="h-1 bg-border rounded-full mb-4 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--col-loss), var(--col-warn))' }} />
        </div>
      )}

      {/* Exit list */}
      {(form.exits || []).length === 0 && !adding && (
        <p className="font-mono text-[12px] mb-3" style={{ color: 'var(--text-dim)' }}>No exits recorded yet.</p>
      )}

      {(form.exits || []).map((e, i) => (
        <div key={e.id} className="flex flex-wrap items-center gap-2.5 bg-bg-panel border border-border rounded-lg px-3.5 py-2.5 mb-2 text-[12px] font-mono">
          <span style={{ color: 'var(--text-dim)', minWidth: 22 }}>E{i + 1}</span>
          <span className="text-text-muted">{e.date}</span>
          <span className="text-text-primary">@ {e.price}</span>
          <span style={{ color: 'var(--acc-main)' }}>×{fmtN(e.quantity)}</span>
          {e.fees > 0 && <span style={{ color: 'var(--col-warn)' }}>fee ${e.fees}</span>}
          {e.note && <span style={{ color: 'var(--text-dim)', flex: 1 }}>{e.note}</span>}
          <button onClick={() => removeExit(e.id)}
            style={{ marginLeft: 'auto', color: 'var(--text-dim)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, transition: 'color 0.15s' }}
            onMouseOver={e => e.currentTarget.style.color = 'var(--col-loss)'}
            onMouseOut={e => e.currentTarget.style.color = 'var(--text-dim)'}
          >✕</button>
        </div>
      ))}

      {/* Add exit form */}
      {adding && (
        <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-l)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <Input label="Exit Date" type="date" value={ex.date} onChange={(v) => setEx((e) => ({ ...e, date: v }))} />
            <Input label="Exit Price *" type="number" placeholder="0.00" value={ex.price} onChange={(v) => setEx((e) => ({ ...e, price: v }))} />
            <Input label="Quantity *" type="number" placeholder={remaining > 0 ? `max ${fmtN(remaining)}` : 'qty'} value={ex.quantity} onChange={(v) => setEx((e) => ({ ...e, quantity: v }))} />
            <Input label="Exit Fees" type="number" placeholder="0.00" value={ex.fees} onChange={(v) => setEx((e) => ({ ...e, fees: v }))} />
          </div>
          <Input label="Note" placeholder="TP hit, stop out, manual close…" value={ex.note} onChange={(v) => setEx((e) => ({ ...e, note: v }))} className="mb-3" />
          <div className="flex gap-2">
            <button onClick={addExit} style={{
              background: 'var(--col-loss)', color: '#fff', fontFamily: 'var(--font-mono)', fontWeight: 700,
              fontSize: 12, padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
              transition: 'filter 0.15s',
            }}
              onMouseOver={e => e.currentTarget.style.filter = 'brightness(1.1)'}
              onMouseOut={e => e.currentTarget.style.filter = 'brightness(1)'}
            >Add Exit</button>
            <button onClick={() => setAdding(false)} style={{
              background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-mut)',
              fontFamily: 'var(--font-mono)', fontSize: 12, padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
              transition: 'color 0.15s',
            }}
              onMouseOver={e => e.currentTarget.style.color = 'var(--text-pri)'}
              onMouseOut={e => e.currentTarget.style.color = 'var(--text-mut)'}
            >Cancel</button>
          </div>
        </div>
      )}

      {!adding && (
        <button onClick={() => setAdding(true)} style={{
          width: '100%', background: 'transparent',
          border: '1px dashed var(--border-l)',
          color: 'var(--col-warn)', fontFamily: 'var(--font-mono)', fontSize: 11,
          letterSpacing: '0.05em', padding: '10px 0', borderRadius: 8, cursor: 'pointer',
          marginTop: 4, transition: 'border-color 0.15s',
        }}
          onMouseOver={e => e.currentTarget.style.borderColor = 'var(--col-warn)'}
          onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-l)'}
        >+ Record Exit / Partial Close</button>
      )}
    </div>
  )
}
