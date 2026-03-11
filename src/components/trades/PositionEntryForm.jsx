// src/components/trades/PositionEntryForm.jsx
import { useRef, useState } from 'react'
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '../../lib/firebase'
import { useAuth } from '../../context/AuthContext'
import { Input } from '../ui'

// P&L formula matching Excel:
//   LONG:  profit = (closePrice - entryPrice) × lotSize × 100
//   SHORT: profit = (entryPrice - closePrice) × lotSize × 100
export function calcQuickPnl({ direction, entryPrice, closePrice, lotSize }) {
  const e = parseFloat(entryPrice)
  const c = parseFloat(closePrice)
  const l = parseFloat(lotSize)
  if (!e || !c || !l || isNaN(e) || isNaN(c) || isNaN(l)) return null
  return direction === 'SHORT' ? (e - c) * l * 100 : (c - e) * l * 100
}

export default function PositionEntryForm({ form, setForm }) {
  const { user } = useAuth()
  const entry = form.entry
  const set = (k, v) => setForm((f) => ({ ...f, entry: { ...f.entry, [k]: v } }))

  // Live P&L
  const quickPnl = calcQuickPnl({
    direction: form.direction,
    entryPrice: entry.price,
    closePrice: entry.closePrice,
    lotSize: entry.lotSize,
  })
  const tradeStatus =
    quickPnl == null ? null : quickPnl > 0 ? 'Win' : quickPnl < 0 ? 'Loss' : 'Break Even'

  // Image upload
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState('')

  async function handleImageChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image must be under 10 MB')
      return
    }
    setUploadError('')
    setUploading(true)
    setUploadProgress(0)
    try {
      const path = `users/${user.uid}/trades/${Date.now()}_${file.name}`
      const storageRef = ref(storage, path)
      const task = uploadBytesResumable(storageRef, file)
      await new Promise((resolve, reject) => {
        task.on(
          'state_changed',
          (snap) => setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
          reject,
          async () => {
            const url = await getDownloadURL(task.snapshot.ref)
            setForm((f) => ({ ...f, entry: { ...f.entry, imageUrl: url, imagePath: path } }))
            resolve()
          }
        )
      })
    } catch (err) {
      setUploadError('Upload failed: ' + err.message)
    } finally {
      setUploading(false)
      setUploadProgress(0)
      e.target.value = ''
    }
  }

  async function handleRemoveImage() {
    if (entry.imagePath) {
      try { await deleteObject(ref(storage, entry.imagePath)) } catch (_) { }
    }
    setForm((f) => ({ ...f, entry: { ...f.entry, imageUrl: null, imagePath: null } }))
  }

  return (
    <div className="bg-bg-card border border-border rounded-xl p-5 mb-4">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-7 h-7 bg-accent-green rounded-md flex items-center justify-center text-bg-base font-bold text-sm">↑</div>
        <h3 className="text-[15px] font-extrabold text-text-primary">Position Entry</h3>
      </div>

      {/* Core fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <Input label="Entry Price *" type="number" placeholder="0.00" value={entry.price} onChange={(v) => set('price', v)} />
        <Input label="Lot Size *" type="number" placeholder="e.g. 1.0" value={entry.lotSize ?? ''} onChange={(v) => set('lotSize', v)} />
        <Input label="Entry Fees / Commission" type="number" placeholder="0.00" value={entry.fees} onChange={(v) => set('fees', v)} />
      </div>

      {/* ── Quick P&L Calculator ── */}
      <div className="border-t border-border pt-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] tracking-wide text-text-dim uppercase">Quick P&amp;L Calculator</span>
          <span className="text-[10px] text-text-dark">(lotSize × Δprice × 100)</span>
        </div>
        <div className="mb-3">
          <Input
            label="Close / Exit Price"
            type="number"
            placeholder="0.00"
            value={entry.closePrice ?? ''}
            onChange={(v) => set('closePrice', v)}
          />
        </div>

        {quickPnl !== null && (
          <div className="flex flex-wrap items-center gap-4 bg-[#0d1a2e] border border-border rounded-lg px-4 py-3">
            <div className="flex flex-col">
              <span className="text-[10px] text-text-dim uppercase tracking-wide mb-0.5">Profit / Loss</span>
              <span
                className="text-[24px] font-bold"
                style={{ color: quickPnl > 0 ? '#00e5a0' : quickPnl < 0 ? '#ff4d6d' : '#ffd166' }}
              >
                {quickPnl >= 0 ? '+' : ''}
                {quickPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-bold"
              style={{
                background: tradeStatus === 'Win' ? '#0d2e1f' : tradeStatus === 'Loss' ? '#2e0d1a' : '#1a1a0d',
                color: tradeStatus === 'Win' ? '#00e5a0' : tradeStatus === 'Loss' ? '#ff4d6d' : '#ffd166',
                border: `1px solid ${tradeStatus === 'Win' ? '#00e5a040' : tradeStatus === 'Loss' ? '#ff4d6d40' : '#ffd16640'}`,
              }}
            >
              {tradeStatus === 'Win' ? '▲' : tradeStatus === 'Loss' ? '▼' : '='} {tradeStatus}
            </div>

            {entry.lotSize && entry.closePrice && entry.price && (
              <span className="text-[10px] text-text-dark ml-auto">
                {form.direction === 'SHORT'
                  ? `(${entry.price} − ${entry.closePrice})`
                  : `(${entry.closePrice} − ${entry.price})`}
                {` × ${entry.lotSize} × 100`}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Position Screenshot (optional) ── */}
      <div className="border-t border-border pt-4">
        <span className="text-[11px] tracking-wide text-text-dim uppercase block mb-3">
          Position Screenshot <span className="text-text-dark normal-case tracking-normal">(optional)</span>
        </span>

        {entry.imageUrl ? (
          /* Preview */
          <div className="relative group">
            <img
              src={entry.imageUrl}
              alt="Position screenshot"
              className="w-full max-h-72 object-contain rounded-xl border border-border bg-bg-panel"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 bg-[#2e0d1a] border border-accent-red/40 text-accent-red rounded-lg px-2.5 py-1 text-[11px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              ✕ Remove
            </button>
          </div>
        ) : (
          /* Drop zone */
          <label
            className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl h-36 cursor-pointer transition-colors ${uploading
                ? 'border-accent-green/40 bg-accent-green/5'
                : 'border-border hover:border-accent-green/50 hover:bg-bg-panel'
              }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
              disabled={uploading}
            />
            {uploading ? (
              <>
                <div className="w-32 h-1.5 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent-green rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <span className="text-[11px] text-accent-green">Uploading… {uploadProgress}%</span>
              </>
            ) : (
              <>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-text-dim">
                  <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M12 4v12M8 8l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-[12px] text-text-muted">Click to upload image</span>
                <span className="text-[10px] text-text-dark">PNG, JPG, WebP — max 10 MB</span>
              </>
            )}
          </label>
        )}

        {uploadError && (
          <p className="text-accent-red text-[11px] mt-2">{uploadError}</p>
        )}
      </div>
    </div>
  )
}
