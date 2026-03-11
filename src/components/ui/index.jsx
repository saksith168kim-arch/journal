// src/components/ui/index.jsx
import { useState, useRef, useEffect } from 'react'
export function Tag({ children, bg = '#1a2540', color = '#4a6a8a', className = '' }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${className}`}
      style={{ background: bg, color }}
    >
      {children}
    </span>
  )
}

export function StatCard({ label, value, sub, color = '#00e5a0' }) {
  return (
    <div className="bg-bg-panel border border-border rounded-xl px-5 py-4 flex-1 min-w-[130px]">
      <div className="text-text-dim text-[10px] uppercase mb-1.5">{label}</div>
      <div className="text-[22px] font-bold" style={{ color }}>{value}</div>
      {sub && <div className="text-text-dark text-[10px] mt-1">{sub}</div>}
    </div>
  )
}

export function Button({ children, onClick, variant = 'primary', size = 'md', className = '', type = 'button', disabled = false }) {
  const base = 'font-bold rounded-lg transition-all cursor-pointer border-none outline-none'
  const sizes = { sm: 'text-[11px] px-3 py-1.5', md: 'text-[12px] px-5 py-2.5', lg: 'text-[13px] px-7 py-3' }
  const variants = {
    primary: 'bg-accent-green text-bg-base hover:brightness-110',
    danger: 'bg-accent-red text-white hover:brightness-110',
    ghost: 'bg-transparent text-text-muted border border-border hover:border-accent-green hover:text-accent-green',
    outline: 'bg-transparent text-text-muted border border-border hover:text-text-primary',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${disabled ? 'opacity-40 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  )
}

export function Input({ label, hint, hintColor, value, onChange, type = 'text', placeholder, className = '' }) {
  return (
    <div className={className}>
      {label && (
        <label className="flex justify-between text-[10px] text-text-dim uppercase mb-1.5">
          <span>{label}</span>
          {hint && <span style={{ color: hintColor || '#4a6a8a' }} className="normal-case tracking-normal">{hint}</span>}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-bg-panel border border-border rounded-lg text-text-primary text-[12px] px-3 py-2.5 outline-none focus:border-accent-green transition-colors"
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
    <div className={`relative ${className}`} ref={ref}>
      {label && (
        <label className="block text-[11px] text-text-dim uppercase mb-1.5">{label}</label>
      )}
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between bg-bg-panel border rounded-lg text-text-muted text-[12px] px-3 py-2.5 outline-none transition-colors cursor-pointer text-left ${open ? 'border-accent-green text-text-primary' : 'border-border hover:border-border-light'
          }`}
      >
        <span>{displayLabel}</span>
        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="none"
          className={`flex-shrink-0 ml-2 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <path d="M1 3l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-bg-panel border border-border rounded-xl shadow-2xl overflow-hidden"
          style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
          <div className="max-h-52 overflow-y-auto py-1">
            {options.map((o) => {
              const v = getValue(o)
              const l = getLabel(o)
              const isActive = v === value
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => { onChange(v); setOpen(false) }}
                  className={`w-full text-left px-3.5 py-2 text-[12px] transition-colors cursor-pointer border-none flex items-center justify-between gap-2 ${isActive
                    ? 'bg-accent-green/10 text-accent-green'
                    : 'bg-transparent text-text-muted hover:bg-bg-hover hover:text-text-primary'
                    }`}
                >
                  {l}
                  {isActive && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="flex-shrink-0">
                      <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="#00e5a0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
      <div className="w-8 h-8 border-2 border-border border-t-accent-green rounded-full animate-spin" />
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
  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
      <div className="bg-bg-panel border border-border rounded-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${variant === 'danger' ? 'bg-accent-red/10 text-accent-red' : 'bg-accent-green/10 text-accent-green'}`}>
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
              className="flex-1 py-2.5 rounded-lg font-bold text-text-primary bg-bg-hover hover:bg-border transition-colors border-none cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm()
                onClose()
              }}
              className={`flex-1 py-2.5 rounded-lg font-bold text-white transition-colors border-none cursor-pointer ${variant === 'danger' ? 'bg-accent-red hover:bg-[#ff6b87]' : 'bg-accent-green hover:bg-[#33ffbb]'}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
