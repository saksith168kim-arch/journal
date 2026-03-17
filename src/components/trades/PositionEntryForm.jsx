// src/components/trades/PositionEntryForm.jsx
import { useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Input } from '../ui'

const CLOUDINARY_CLOUD = 'dcp7a0xhk'
const CLOUDINARY_PRESET = 'journal'

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

  const quickPnl = calcQuickPnl({
    direction: form.direction,
    entryPrice: entry.price,
    closePrice: entry.closePrice,
    lotSize: entry.lotSize,
  })
  const tradeStatus = quickPnl == null ? null : quickPnl > 0 ? 'Win' : quickPnl < 0 ? 'Loss' : 'Break Even'

  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState('')

  async function handleImageChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { setUploadError('Image must be under 10 MB'); return }
    setUploadError('')
    setUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', CLOUDINARY_PRESET)
      formData.append('folder', `trades/${user.uid}`)

      // Use XMLHttpRequest so we can track upload progress
      const url = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`)

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setUploadProgress(Math.round((event.loaded / event.total) * 100))
          }
        }

        xhr.onload = () => {
          if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText)
            resolve(data.secure_url)
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`))
          }
        }

        xhr.onerror = () => reject(new Error('Network error during upload'))
        xhr.send(formData)
      })

      setForm((f) => ({ ...f, entry: { ...f.entry, imageUrl: url, imagePath: url } }))
    } catch (err) {
      setUploadError('Upload failed: ' + err.message)
    } finally {
      setUploading(false)
      setUploadProgress(0)
      e.target.value = ''
    }
  }

  async function handleRemoveImage() {
    // Just clear the URL — Cloudinary deletion requires server-side API key
    setForm((f) => ({ ...f, entry: { ...f.entry, imageUrl: null, imagePath: null } }))
  }

  const statusColor = tradeStatus === 'Win' ? 'var(--col-win-fixed)' : tradeStatus === 'Loss' ? 'var(--col-loss-fixed)' : 'var(--col-warn-fixed)'
  const statusBg = tradeStatus === 'Win' ? 'var(--col-win-bg-fixed)' : tradeStatus === 'Loss' ? 'var(--col-loss-bg-fixed)' : 'var(--col-warn-bg-fixed)'

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 20, marginBottom: 16, width: "100%", boxSizing: "border-box" }}>
      <div className="flex items-center gap-2.5 mb-5">
        <div style={{ width: 28, height: 28, background: 'var(--col-win-fixed)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14 }}>↑</div>
        <h3 className="text-[15px] font-extrabold text-text-primary">Position Entry</h3>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 16, width: "100%", boxSizing: "border-box" }}>
        <Input label="Entry Price *" type="number" placeholder="0.00" value={entry.price} onChange={(v) => set('price', v)} />
        <Input label="Lot Size *" type="number" placeholder="e.g. 1.0" value={entry.lotSize ?? ''} onChange={(v) => set('lotSize', v)} />
        <Input label="Entry Fees / Commission" type="number" placeholder="0.00" value={entry.fees} onChange={(v) => set('fees', v)} />
      </div>

      {/* Quick P&L Calculator */}
      <div className="border-t border-border pt-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span style={{ fontSize: 11, letterSpacing: '0.1em', color: 'var(--text-dim-fixed)', textTransform: 'uppercase' }}>Quick P&L Calculator</span>
          <span style={{ fontSize: 10, color: 'var(--text-dim-fixed)' }}>(lotSize × Δprice × 100)</span>
        </div>
        <div className="mb-3">
          <Input label="Close / Exit Price" type="number" placeholder="0.00" value={entry.closePrice ?? ''} onChange={(v) => set('closePrice', v)} />
        </div>
        {quickPnl !== null && (
          <div className="flex flex-wrap items-center gap-4 border border-border rounded-lg px-4 py-3" style={{ background: 'var(--bg-panel)' }}>
            <div className="flex flex-col">
              <span style={{ fontSize: 10, color: 'var(--text-dim-fixed)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Profit / Loss</span>
              <span style={{ fontSize: 24, fontWeight: 700, color: statusColor, fontFamily: 'var(--font-mono)' }}>
                {quickPnl >= 0 ? '+' : ''}{quickPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
              borderRadius: 8, fontSize: 13, fontWeight: 700,
              background: statusBg, color: statusColor,
              border: `1px solid ${statusColor}40`,
              fontFamily: 'var(--font-ui)',
            }}>
              {tradeStatus === 'Win' ? '▲' : tradeStatus === 'Loss' ? '▼' : '='} {tradeStatus}
            </div>
            {entry.lotSize && entry.closePrice && entry.price && (
              <span style={{ fontSize: 10, color: 'var(--text-dim-fixed)', marginLeft: 'auto', fontFamily: 'var(--font-mono)' }}>
                {form.direction === 'SHORT' ? `(${entry.price} − ${entry.closePrice})` : `(${entry.closePrice} − ${entry.price})`}
                {` × ${entry.lotSize} × 100`}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Position Screenshot */}
      <div className="border-t border-border pt-4">
        <span style={{ fontSize: 11, letterSpacing: '0.1em', color: 'var(--text-dim-fixed)', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>
          Position Screenshot <span style={{ textTransform: 'none', letterSpacing: 'normal', color: 'var(--text-dim-fixed)' }}>(optional)</span>
        </span>
        {entry.imageUrl ? (
          <div style={{ position: 'relative' }}>
            <img src={entry.imageUrl} alt="Position screenshot" style={{ width: '100%', maxHeight: 288, objectFit: 'contain', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-panel)', display: 'block' }} />
            {/* Always-visible action bar below image */}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <label style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '8px', borderRadius: 8, border: '1px solid var(--border)',
                background: 'transparent', color: 'var(--text-sec)', cursor: 'pointer',
                fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-ui)', transition: 'all 0.15s',
              }}
                onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--acc-main)'; e.currentTarget.style.color = 'var(--acc-main)' }}
                onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-sec)' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><path d="M12 4v12M8 8l4-4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Replace Photo
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} disabled={uploading} />
              </label>
              <button type="button" onClick={handleRemoveImage} style={{
                flex: 1, padding: '8px', borderRadius: 8,
                border: '1px solid var(--col-loss-bg-fixed)',
                background: 'var(--col-loss-bg-fixed)', color: 'var(--col-loss-fixed)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-ui)',
              }}>✕ Remove</button>
            </div>
            {uploading && (
              <div style={{ marginTop: 8 }}>
                <div style={{ height: 6, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'var(--acc-main)', borderRadius: 999, width: `${uploadProgress}%`, transition: 'width 0.3s' }} />
                </div>
                <span style={{ fontSize: 11, color: 'var(--acc-main)', fontFamily: 'var(--font-mono)', marginTop: 4, display: 'block' }}>Uploading… {uploadProgress}%</span>
              </div>
            )}
          </div>
        ) : (
          <label style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 8, borderWidth: 2, borderStyle: 'dashed',
            borderColor: uploading ? 'var(--acc-main)' : 'var(--border)',
            borderRadius: 12, height: 144, cursor: 'pointer', transition: 'border-color 0.2s',
            background: uploading ? 'var(--acc-subtle)' : 'transparent',
          }}
            onMouseOver={e => !uploading && (e.currentTarget.style.borderColor = 'var(--acc-main)')}
            onMouseOut={e => !uploading && (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} disabled={uploading} />
            {uploading ? (
              <>
                <div style={{ width: 160, height: 6, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'var(--acc-main)', borderRadius: 999, width: `${uploadProgress}%`, transition: 'width 0.3s' }} />
                </div>
                <span style={{ fontSize: 12, color: 'var(--acc-main)', fontFamily: 'var(--font-mono)' }}>Uploading… {uploadProgress}%</span>
              </>
            ) : (
              <>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--text-dim-fixed)' }}>
                  <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M12 4v12M8 8l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span style={{ fontSize: 12, color: 'var(--text-sec-fixed)' }}>Click to upload image</span>
                <span style={{ fontSize: 10, color: 'var(--text-dim-fixed)' }}>PNG, JPG, WebP — max 10 MB</span>
              </>
            )}
          </label>
        )}
        {uploadError && <p style={{ color: 'var(--col-loss-fixed)', fontSize: 11, marginTop: 8 }}>{uploadError}</p>}
      </div>
    </div>
  )
}