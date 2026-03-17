// src/components/ui/index.jsx
import { useState, useRef, useEffect } from 'react'

export function Tag({ children, bg = 'var(--bg-hover)', color = 'var(--text-sec)', className = '' }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${className}`}
      style={{ background: bg, color }}
    >
      {children}
    </span>
  )
}

export function StatCard({ label, value, sub, color = 'var(--acc-main)' }) {
  return (
    <div className="bg-bg-panel border border-border rounded-xl px-4 py-4 flex-1" style={{ minWidth: 0, overflow: 'hidden' }}>
      <div className="text-text-dim text-[10px] uppercase mb-1.5" style={{ whiteSpace: 'nowrap' }}>{label}</div>
      <div className="font-bold" style={{ color, fontSize: 'clamp(13px, 3.5vw, 22px)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
      {sub && <div className="text-text-sec text-[10px] mt-1" style={{ whiteSpace: 'nowrap' }}>{sub}</div>}
    </div>
  )
}

export function Button({ children, onClick, variant = 'primary', size = 'md', className = '', type = 'button', disabled = false }) {
  const base = 'font-bold rounded-lg transition-all cursor-pointer border-none outline-none'
  const sizes = { sm: 'text-[11px] px-3 py-1.5', md: 'text-[12px] px-5 py-2.5', lg: 'text-[13px] px-7 py-3' }

  const variantStyles = {
    primary: { background: 'var(--grad-accent)', color: 'var(--text-inv)', border: 'none' },
    danger: { background: 'var(--col-loss)', color: '#fff', border: 'none' },
    ghost: { background: 'transparent', color: 'var(--text-mut)', border: '1px solid var(--border)' },
    outline: { background: 'transparent', color: 'var(--text-mut)', border: '1px solid var(--border)' },
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${disabled ? 'opacity-40 cursor-not-allowed' : ''} ${className}`}
      style={variantStyles[variant]}
      onMouseOver={e => {
        if (disabled) return
        if (variant === 'ghost' || variant === 'outline') {
          e.currentTarget.style.borderColor = 'var(--acc-main)'
          e.currentTarget.style.color = 'var(--acc-main)'
        } else {
          e.currentTarget.style.filter = 'brightness(1.1)'
        }
      }}
      onMouseOut={e => {
        if (disabled) return
        if (variant === 'ghost' || variant === 'outline') {
          e.currentTarget.style.borderColor = 'var(--border)'
          e.currentTarget.style.color = 'var(--text-mut)'
        } else {
          e.currentTarget.style.filter = 'brightness(1)'
        }
      }}
    >
      {children}
    </button>
  )
}

export function Input({ label, hint, hintColor, value, onChange, type = 'text', placeholder, className = '' }) {
  return (
    <div style={{ width: '100%', boxSizing: 'border-box', minWidth: 0 }}>
      {label && (
        <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-dim-fixed)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
          <span>{label}</span>
          {hint && <span style={{ color: hintColor || 'var(--text-sec-fixed)', textTransform: 'none', letterSpacing: 'normal' }}>{hint}</span>}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          display: 'block', width: '100%', boxSizing: 'border-box',
          background: 'var(--bg-panel)', border: '1px solid var(--border)',
          borderRadius: 8, color: 'var(--text-pri-fixed)', fontSize: 13,
          padding: '10px 12px', outline: 'none', transition: 'border-color 0.2s',
          fontFamily: 'var(--font-ui)',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--acc-main)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      />
    </div>
  )
}

export function Select({ label, value, onChange, options, className = '' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const getLabel = (o) => typeof o === 'string' ? o : o.label
  const getValue = (o) => typeof o === 'string' ? o : o.value
  const selected = options.find((o) => getValue(o) === value)
  const displayLabel = selected ? getLabel(selected) : value

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className={`relative ${className}`} ref={ref} style={{ width: "100%", boxSizing: "border-box", minWidth: 0 }}>
      {label && (
        <label style={{ display: "block", fontSize: 10, color: "var(--text-dim-fixed)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{label}</label>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', boxSizing: 'border-box',
          background: 'var(--bg-panel)',
          border: `1px solid ${open ? 'var(--acc-main)' : 'var(--border)'}`,
          borderRadius: 8,
          color: open ? 'var(--text-pri-fixed)' : 'var(--text-sec-fixed)',
          fontSize: 13, padding: '10px 12px', outline: 'none',
          cursor: 'pointer', textAlign: 'left',
          fontFamily: 'var(--font-ui)', transition: 'all 0.2s',
        }}
      >
        <span>{displayLabel}</span>
        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="none"
          className={`flex-shrink-0 ml-2 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <path d="M1 3l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div style={{ position: "absolute", zIndex: 50, left: 0, right: 0, marginTop: 4, background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
          <div style={{ maxHeight: 208, overflowY: "auto", padding: "4px 0" }}>
            {options.map((o) => {
              const v = getValue(o)
              const l = getLabel(o)
              const isActive = v === value
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => { onChange(v); setOpen(false) }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: 8, width: '100%', boxSizing: 'border-box',
                    textAlign: 'left', padding: '8px 14px', fontSize: 13,
                    cursor: 'pointer', border: 'none',
                    background: isActive ? 'var(--acc-subtle)' : 'transparent',
                    color: isActive ? 'var(--acc-main-fixed)' : 'var(--text-pri-fixed)',
                    fontFamily: 'var(--font-ui)', transition: 'background 0.15s',
                  }}
                >
                  {l}
                  {isActive && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="flex-shrink-0">
                      <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export function Modal({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-bg-panel border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '2px solid var(--border)', borderTopColor: 'var(--acc-main)' }} />
    </div>
  )
}

export function EmptyState({ message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-4xl mb-4">📋</div>
      <p className="text-text-muted text-sm mb-4">{message}</p>
      {action}
    </div>
  )
}

export function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', variant = 'danger' }) {
  if (!isOpen) return null
  const iconColor = variant === 'danger' ? 'var(--col-loss)' : 'var(--col-win)'
  const iconBg = variant === 'danger' ? 'var(--col-loss-bg)' : 'var(--col-win-bg)'
  const btnBg = variant === 'danger' ? 'var(--col-loss)' : 'var(--col-win)'

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
      <div className="bg-bg-panel border border-border rounded-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: iconBg, color: iconColor }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-text-primary font-bold text-lg">{title}</h3>
          </div>
          <p className="text-text-muted text-sm mb-6 leading-relaxed">{message}</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg font-bold transition-colors border-none cursor-pointer"
              style={{ background: 'var(--bg-hover)', color: 'var(--text-pri)' }}
              onMouseOver={e => e.currentTarget.style.background = 'var(--border)'}
              onMouseOut={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => { onConfirm(); onClose() }}
              className="flex-1 py-2.5 rounded-lg font-bold text-white transition-colors border-none cursor-pointer"
              style={{ background: btnBg }}
              onMouseOver={e => e.currentTarget.style.filter = 'brightness(1.1)'}
              onMouseOut={e => e.currentTarget.style.filter = 'brightness(1)'}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}