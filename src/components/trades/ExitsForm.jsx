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
          <div className="w-7 h-7 bg-accent-red rounded-md flex items-center justify-center text-white font-bold text-sm">↓</div>
          <h3 className="text-[15px] font-extrabold text-text-primary">Exits / Partial Closes</h3>
        </div>
        {entryQty > 0 && (
          <span className={`font-mono text-[11px] ${remaining > 0 ? 'text-accent-lime' : 'text-text-dim'}`}>
            {remaining > 0 ? `${fmtN(remaining)} remaining` : 'Fully exited'}
          </span>
        )}
      </div>

      {/* Progress bar */}
      {entryQty > 0 && (
        <div className="h-1 bg-border rounded-full mb-4 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #ff4d6d, #ff8c6d)' }}
          />
        </div>
      )}

      {/* Exit list */}
      {(form.exits || []).length === 0 && !adding && (
        <p className="text-text-dark font-mono text-[12px] mb-3">No exits recorded yet.</p>
      )}

      {(form.exits || []).map((e, i) => (
        <div key={e.id} className="flex flex-wrap items-center gap-2.5 bg-bg-panel border border-border rounded-lg px-3.5 py-2.5 mb-2 text-[12px] font-mono">
          <span className="text-text-dark min-w-[22px]">E{i + 1}</span>
          <span className="text-text-muted">{e.date}</span>
          <span className="text-text-primary">@ {e.price}</span>
          <span className="text-accent-blue">×{fmtN(e.quantity)}</span>
          {e.fees > 0 && <span className="text-[#4a3a2a]">fee ${e.fees}</span>}
          {e.note && <span className="text-text-dim flex-1">{e.note}</span>}
          <button onClick={() => removeExit(e.id)} className="ml-auto text-[#3a2a3a] hover:text-accent-red transition-colors bg-transparent border-none cursor-pointer text-[12px]">✕</button>
        </div>
      ))}

      {/* Add exit form */}
      {adding && (
        <div className="bg-bg-panel border border-[#1a3a5a] rounded-xl p-4 mb-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <Input label="Exit Date" type="date" value={ex.date} onChange={(v) => setEx((e) => ({ ...e, date: v }))} />
            <Input label="Exit Price *" type="number" placeholder="0.00" value={ex.price} onChange={(v) => setEx((e) => ({ ...e, price: v }))} />
            <Input label="Quantity *" type="number" placeholder={remaining > 0 ? `max ${fmtN(remaining)}` : 'qty'} value={ex.quantity} onChange={(v) => setEx((e) => ({ ...e, quantity: v }))} />
            <Input label="Exit Fees" type="number" placeholder="0.00" value={ex.fees} onChange={(v) => setEx((e) => ({ ...e, fees: v }))} />
          </div>
          <Input label="Note" placeholder="TP hit, stop out, manual close…" value={ex.note} onChange={(v) => setEx((e) => ({ ...e, note: v }))} className="mb-3" />
          <div className="flex gap-2">
            <button onClick={addExit} className="bg-accent-red text-white font-mono font-bold text-[12px] px-5 py-2 rounded-lg hover:brightness-110 transition-all cursor-pointer border-none">
              Add Exit
            </button>
            <button onClick={() => setAdding(false)} className="bg-transparent border border-border text-text-muted font-mono text-[12px] px-4 py-2 rounded-lg hover:text-text-primary transition-colors cursor-pointer">
              Cancel
            </button>
          </div>
        </div>
      )}

      {!adding && (
        <button
          onClick={() => setAdding(true)}
          className="w-full bg-transparent border border-dashed border-[#1a3a4a] text-accent-orange font-mono text-[11px] tracking-wide py-2.5 rounded-lg hover:border-accent-orange transition-colors cursor-pointer mt-1"
        >
          + Record Exit / Partial Close
        </button>
      )}
    </div>
  )
}
