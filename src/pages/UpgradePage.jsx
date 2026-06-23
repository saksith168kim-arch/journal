// src/pages/UpgradePage.jsx
// Upgrade / pricing page with ABA PayWay KHQR checkout modal.
// Real ABA PayWay generate-qr API integration with polling for payment status.

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '../components/layout/Layout'

/* ─────────────────────────────────────────────
   Design tokens — mirrors HomePage (C object)
───────────────────────────────────────────── */
const C = {
  bg: '#050B14',
  bgSoft: '#0A1422',
  primary: '#32E6D5',
  secondary: '#0EA5E9',
  text: '#FFFFFF',
  muted: '#94A3B8',
  pos: '#34D399',
  neg: '#F87171',
  glow: 'rgba(50,230,213,0.25)',
  border: 'rgba(255,255,255,0.08)',
  card: 'rgba(255,255,255,0.03)',
  aba: '#005E7B',
  abaRed: '#E1232E',
}

/* ─────────────────────────────────────────────
   ABA PayWay config — replace with your values
───────────────────────────────────────────── */
const ABA_CONFIG = {
  merchantId: import.meta.env.VITE_ABA_MERCHANT_ID || 'YOUR_MERCHANT_ID',
  apiKey: import.meta.env.VITE_ABA_API_KEY || 'YOUR_API_KEY',
  baseUrl: import.meta.env.VITE_ABA_BASE_URL || 'https://checkout.payway.com.kh',
  // QR lifetime in minutes (min 3, max 172800)
  lifetime: 15,
  qrImageTemplate: 'template3_color',
}

/* ─────────────────────────────────────────────
   Utilities
───────────────────────────────────────────── */

/** Format date as YYYYMMDDHHmmss in UTC */
function getReqTime() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return (
    now.getUTCFullYear() +
    pad(now.getUTCMonth() + 1) +
    pad(now.getUTCDate()) +
    pad(now.getUTCHours()) +
    pad(now.getUTCMinutes()) +
    pad(now.getUTCSeconds())
  )
}

/** Generate a unique transaction ID (max 20 chars) */
function genTranId() {
  return Date.now().toString().slice(-16) + Math.floor(Math.random() * 1000).toString().padStart(3, '0')
}

/**
 * Compute HMAC-SHA512 → Base64 using Web Crypto API.
 * NOTE: In production, move hash generation to your backend to protect the API key.
 */
async function computeHash(data, apiKey) {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(apiKey),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data))
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
}

/** Base64 encode a UTF-8 string */
function b64(str) {
  return btoa(unescape(encodeURIComponent(str)))
}

/**
 * Call ABA PayWay generate-qr API.
 * Returns { qrImage, tranId } on success or throws on error.
 *
 * ⚠️  SECURITY: The API key is used here on the client for demo purposes.
 *     In production, proxy this call through your own backend endpoint so
 *     the key is never exposed in the browser.
 */
async function generateQR({ amount, currency = 'USD', firstName = '', lastName = '', email = '', phone = '' }) {
  const reqTime = getReqTime()
  const tranId = genTranId()
  const callbackUrl = b64(import.meta.env.VITE_PAYMENT_CALLBACK_URL || 'https://yourdomain.com/api/payment/callback')

  // Build the hash pre-image exactly as documented:
  // req_time + merchant_id + tran_id + amount + items + first_name + last_name +
  // email + phone + purchase_type + payment_option + callback_url + return_deeplink +
  // currency + custom_fields + return_params + payout + lifetime + qr_image_template
  const items = ''           // optional — omit for subscription
  const purchaseType = 'purchase'
  const paymentOption = 'abapay_khqr'
  const returnDeeplink = ''
  const customFields = ''
  const returnParams = ''
  const payout = ''

  const preimage =
    reqTime +
    ABA_CONFIG.merchantId +
    tranId +
    amount +
    items +
    firstName +
    lastName +
    email +
    phone +
    purchaseType +
    paymentOption +
    callbackUrl +
    returnDeeplink +
    currency +
    customFields +
    returnParams +
    payout +
    ABA_CONFIG.lifetime +
    ABA_CONFIG.qrImageTemplate

  const hash = await computeHash(preimage, ABA_CONFIG.apiKey)

  const body = {
    req_time: reqTime,
    merchant_id: ABA_CONFIG.merchantId,
    tran_id: tranId,
    amount,
    currency,
    purchase_type: purchaseType,
    payment_option: paymentOption,
    callback_url: callbackUrl,
    lifetime: ABA_CONFIG.lifetime,
    qr_image_template: ABA_CONFIG.qrImageTemplate,
    hash,
    ...(firstName && { first_name: firstName }),
    ...(lastName && { last_name: lastName }),
    ...(email && { email }),
    ...(phone && { phone }),
  }

  const res = await fetch(`${ABA_CONFIG.baseUrl}/api/payment-gateway/v1/payments/generate-qr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`PayWay error ${res.status}: ${text}`)
  }

  const data = await res.json()

  // ABA PayWay returns status 0 for success
  if (data.status?.code !== '00') {
    throw new Error(data.status?.message || 'QR generation failed')
  }

  return {
    tranId,
    qrImage: data.qr,          // base64 PNG or URL depending on template
    qrString: data.md5_hash,   // raw KHQR string (for deep-link / app2app)
  }
}

/**
 * Poll ABA PayWay for payment status.
 * Returns 'pending' | 'paid' | 'expired' | 'error'
 *
 * ⚠️  Same note: proxy through backend in production.
 */
async function checkPaymentStatus(tranId) {
  const reqTime = getReqTime()
  const preimage = reqTime + ABA_CONFIG.merchantId + tranId
  const hash = await computeHash(preimage, ABA_CONFIG.apiKey)

  const res = await fetch(`${ABA_CONFIG.baseUrl}/api/payment-gateway/v1/payments/check-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      req_time: reqTime,
      merchant_id: ABA_CONFIG.merchantId,
      tran_id: tranId,
      hash,
    }),
  })

  if (!res.ok) return 'error'

  const data = await res.json()
  const code = data.status?.code

  if (code === '00') return 'paid'
  if (code === '06') return 'expired'
  if (code === '01' || code === '68') return 'pending'
  return 'error'
}

/* ─────────────────────────────────────────────
   Pricing data
───────────────────────────────────────────── */
const PLANS = [
  {
    id: 'free',
    name: 'Free',
    monthly: 0,
    yearly: 0,
    period: 'forever',
    desc: 'Get started with core journaling features at no cost.',
    cta: 'Get started',
    ghost: true,
    features: [
      'Up to 10 trades / month',
      'Basic trade journal',
      'Performance overview',
      'Screenshot storage',
      '3 AI analyses / day',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    monthly: 9.99,
    yearly: 95.90,
    period: 'per month',
    desc: 'Everything you need to trade with data, not emotion.',
    cta: 'Upgrade to Pro',
    ghost: false,
    popular: true,
    features: [
      'Unlimited trades',
      'Full trade journal',
      'Advanced analytics',
      'Unlimited AI analysis',
      'Risk calculator',
      'Telegram alerts',
      'Priority support',
    ],
  },
]

/* ─────────────────────────────────────────────
   Tiny shared components
───────────────────────────────────────────── */
const Arrow = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
)

const Check = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <polyline points="2,7 5.5,10.5 12,3.5" stroke={C.primary}
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const Spinner = ({ size = 24, color = C.primary }) => (
  <motion.svg
    width={size} height={size} viewBox="0 0 24 24" fill="none"
    animate={{ rotate: 360 }}
    transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
  >
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2.5" strokeOpacity="0.2" />
    <path d="M12 2 a10 10 0 0 1 10 10" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
  </motion.svg>
)

/* ─────────────────────────────────────────────
   Checkout modal — real ABA PayWay flow
   Steps: idle → loading → qr → success | error | expired
───────────────────────────────────────────── */
function CheckoutModal({ plan, isYearly, onClose, onSuccess }) {
  const price = isYearly ? plan.yearly : plan.monthly
  const billing = isYearly ? 'Yearly' : 'Monthly'

  // step: 'loading' | 'qr' | 'success' | 'error' | 'expired'
  const [step, setStep] = useState('loading')
  const [qrImage, setQrImage] = useState(null)  // base64 or URL
  const [tranId, setTranId] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [countdown, setCountdown] = useState(ABA_CONFIG.lifetime * 60) // seconds

  const pollRef = useRef(null)
  const countdownRef = useRef(null)

  // ── Generate QR on mount ──────────────────
  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        const result = await generateQR({ amount: price, currency: 'USD' })
        if (cancelled) return
        setTranId(result.tranId)
        setQrImage(result.qrImage)
        setStep('qr')
      } catch (err) {
        if (cancelled) return
        setErrorMsg(err.message || 'Could not generate QR code.')
        setStep('error')
      }
    }

    init()
    return () => { cancelled = true }
  }, [price])

  // ── Poll for payment status ───────────────
  useEffect(() => {
    if (step !== 'qr' || !tranId) return

    pollRef.current = setInterval(async () => {
      const status = await checkPaymentStatus(tranId)
      if (status === 'paid') {
        clearInterval(pollRef.current)
        clearInterval(countdownRef.current)
        setStep('success')
        onSuccess?.()
      } else if (status === 'expired') {
        clearInterval(pollRef.current)
        clearInterval(countdownRef.current)
        setStep('expired')
      }
      // 'pending' and 'error' → keep polling
    }, 3000)  // poll every 3 seconds

    return () => clearInterval(pollRef.current)
  }, [step, tranId, onSuccess])

  // ── Countdown timer ───────────────────────
  useEffect(() => {
    if (step !== 'qr') return

    countdownRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(countdownRef.current)
          clearInterval(pollRef.current)
          setStep('expired')
          return 0
        }
        return c - 1
      })
    }, 1000)

    return () => clearInterval(countdownRef.current)
  }, [step])

  // ── Escape key ────────────────────────────
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const handleRetry = () => {
    clearInterval(pollRef.current)
    clearInterval(countdownRef.current)
    setStep('loading')
    setQrImage(null)
    setTranId(null)
    setErrorMsg('')
    setCountdown(ABA_CONFIG.lifetime * 60)
  }

  const formatCountdown = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  // Urgency colour for countdown
  const countdownColor = countdown < 60 ? C.neg : countdown < 180 ? '#FBBF24' : C.muted

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.72)',
          backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
        }}
      >
        {/* Modal */}
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 400,
            background: '#08111C',
            border: `1px solid ${C.border}`,
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: '0 40px 100px -30px rgba(0,0,0,0.9)',
          }}
        >
          {/* ── Header ── */}
          <div style={{
            background: C.aba,
            padding: '16px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 2, letterSpacing: '0.06em' }}>
                ABA PAYWAY · SECURE CHECKOUT
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>
                {plan.name} Plan — ${price.toFixed(2)}{isYearly ? '/yr' : '/mo'}
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                background: 'rgba(255,255,255,0.15)', border: 'none',
                borderRadius: 8, width: 32, height: 32, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 18, lineHeight: 1,
              }}
            >×</button>
          </div>

          {/* ── Body ── */}
          <div style={{ padding: '20px' }}>

            {/* Loading */}
            {step === 'loading' && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Spinner size={40} />
                <p style={{ marginTop: 16, fontSize: 14, color: C.muted }}>
                  Generating your QR code…
                </p>
              </div>
            )}

            {/* QR ready */}
            {step === 'qr' && (
              <>
                {/* Order summary */}
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${C.border}`,
                  borderRadius: 12, padding: '12px 16px',
                  marginBottom: 16,
                }}>
                  {[
                    ['Plan', plan.name],
                    ['Billing', billing],
                    ['Currency', 'USD'],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                      <span style={{ color: C.muted }}>{k}</span>
                      <span style={{ color: C.text }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: `1px solid ${C.border}`, margin: '8px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Total</span>
                    <span style={{ fontSize: 18, fontWeight: 700, color: C.primary }}>
                      ${price.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* KHQR label + countdown */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: C.aba }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.aba }}>ABA KHQR</span>
                    <span style={{ fontSize: 12, color: C.muted }}>/ Scan to pay</span>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: countdownColor, fontVariantNumeric: 'tabular-nums' }}>
                    Expires {formatCountdown(countdown)}
                  </div>
                </div>

                {/* QR image */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 180, height: 180,
                    border: `2px solid ${C.aba}`,
                    borderRadius: 12,
                    background: '#fff',
                    overflow: 'hidden',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative',
                  }}>
                    {qrImage && (
                      <img
                        src={qrImage.startsWith('data:') ? qrImage : `data:image/png;base64,${qrImage}`}
                        alt="ABA PayWay KHQR"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    )}
                    {/* Scan-line animation */}
                    <motion.div
                      animate={{ top: ['6%', '90%', '6%'] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                      style={{
                        position: 'absolute', left: 8, right: 8, height: 2,
                        background: `linear-gradient(90deg, transparent, ${C.abaRed}, transparent)`,
                        borderRadius: 2, pointerEvents: 'none',
                      }}
                    />
                  </div>

                  {/* ABA badge */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: 'rgba(0,94,123,0.15)',
                    border: `1px solid rgba(0,94,123,0.35)`,
                    borderRadius: 20, padding: '6px 14px',
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.aba }} />
                    <span style={{ fontSize: 12, color: C.aba, fontWeight: 500 }}>
                      Scan with ABA Mobile or any Bakong app
                    </span>
                  </div>

                  {/* Polling indicator */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <motion.div
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.4, repeat: Infinity }}
                      style={{ width: 6, height: 6, borderRadius: '50%', background: C.pos }}
                    />
                    <span style={{ fontSize: 12, color: C.muted }}>Waiting for payment…</span>
                  </div>

                  <p style={{ fontSize: 12, color: C.muted, textAlign: 'center', lineHeight: 1.6, margin: 0 }}>
                    Open your banking app → Scan QR → Confirm
                  </p>
                </div>
              </>
            )}

            {/* Success */}
            {step === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                style={{ textAlign: 'center', padding: '20px 0' }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.1 }}
                  style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: 'rgba(52,211,153,0.12)',
                    border: `2px solid ${C.pos}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 20px', fontSize: 32,
                  }}
                >✓</motion.div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 8 }}>
                  Payment successful!
                </h3>
                <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, marginBottom: 24 }}>
                  Your Pro plan is now active.<br />Welcome to the next level of trading.
                </p>
                <button
                  onClick={onClose}
                  style={{
                    width: '100%', padding: '12px',
                    background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`,
                    border: 'none', borderRadius: 12,
                    color: '#03121A', fontWeight: 700, fontSize: 14,
                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: 8, fontFamily: 'inherit',
                  }}
                >
                  Go to Dashboard <Arrow size={14} />
                </button>
              </motion.div>
            )}

            {/* Expired */}
            {step === 'expired' && (
              <div style={{ textAlign: 'center', padding: '28px 0' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'rgba(248,113,113,0.1)',
                  border: `2px solid ${C.neg}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px', fontSize: 28,
                }}>⏱</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 8 }}>
                  QR code expired
                </h3>
                <p style={{ fontSize: 14, color: C.muted, marginBottom: 24, lineHeight: 1.6 }}>
                  The QR code has expired. Generate a new one to continue.
                </p>
                <button
                  onClick={handleRetry}
                  style={{
                    width: '100%', padding: '12px',
                    background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`,
                    border: 'none', borderRadius: 12,
                    color: '#03121A', fontWeight: 700, fontSize: 14,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  Generate new QR
                </button>
              </div>
            )}

            {/* Error */}
            {step === 'error' && (
              <div style={{ textAlign: 'center', padding: '28px 0' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'rgba(248,113,113,0.1)',
                  border: `2px solid ${C.neg}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px', fontSize: 28,
                }}>✕</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 8 }}>
                  Something went wrong
                </h3>
                <p style={{ fontSize: 13, color: C.muted, marginBottom: 24, lineHeight: 1.6, wordBreak: 'break-word' }}>
                  {errorMsg || 'Could not connect to ABA PayWay. Please try again.'}
                </p>
                <button
                  onClick={handleRetry}
                  style={{
                    width: '100%', padding: '12px',
                    background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`,
                    border: 'none', borderRadius: 12,
                    color: '#03121A', fontWeight: 700, fontSize: 14,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  Try again
                </button>
              </div>
            )}

            {/* Security footer */}
            {(step === 'loading' || step === 'qr') && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span style={{ fontSize: 11, color: C.muted }}>
                  Secured by ABA PayWay · PCI DSS Level 1
                </span>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

/* ─────────────────────────────────────────────
   Plan card
───────────────────────────────────────────── */
function PlanCard({ plan, isYearly, onUpgrade }) {
  const price = isYearly ? plan.yearly : plan.monthly
  const saving = plan.monthly > 0
    ? `Save $${((plan.monthly * 12) - plan.yearly).toFixed(2)}/yr`
    : null

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      style={{
        position: 'relative',
        background: plan.popular ? 'rgba(50,230,213,0.04)' : C.card,
        border: plan.popular ? `1px solid rgba(50,230,213,0.38)` : `1px solid ${C.border}`,
        borderRadius: 22,
        padding: '36px 32px',
        backdropFilter: 'blur(16px)',
        boxShadow: plan.popular
          ? `0 24px 60px -24px ${C.glow}, inset 0 0 0 1px rgba(50,230,213,0.08)`
          : 'none',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {plan.popular && (
        <div style={{
          position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
          background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`,
          color: '#03121A', fontSize: 11, fontWeight: 700,
          padding: '4px 16px', borderRadius: 20, whiteSpace: 'nowrap',
          letterSpacing: '0.04em',
        }}>Most Popular</div>
      )}

      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.muted, marginBottom: 12 }}>
        {plan.name}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, marginBottom: 6, lineHeight: 1 }}>
        <span style={{ fontSize: 52, fontWeight: 800, letterSpacing: '-2px', color: C.text }}>
          {price === 0 ? '$0' : `$${price.toFixed(2)}`}
        </span>
        {price > 0 && (
          <span style={{ fontSize: 14, color: C.muted, paddingBottom: 10 }}>
            {isYearly ? '/yr' : '/mo'}
          </span>
        )}
        {price === 0 && (
          <span style={{ fontSize: 14, color: C.muted, paddingBottom: 10 }}>/ forever</span>
        )}
      </div>

      {isYearly && saving && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          background: 'rgba(52,211,153,0.1)', color: C.pos,
          fontSize: 12, fontWeight: 600,
          padding: '3px 10px', borderRadius: 20, marginBottom: 10, alignSelf: 'flex-start',
        }}>↓ {saving}</div>
      )}

      <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, marginBottom: 24 }}>
        {plan.desc}
      </p>

      <button
        onClick={() => onUpgrade(plan)}
        disabled={plan.ghost}
        style={{
          width: '100%', padding: '13px 20px',
          background: plan.ghost
            ? 'rgba(255,255,255,0.04)'
            : `linear-gradient(135deg, ${C.primary}, ${C.secondary})`,
          border: plan.ghost ? `1px solid ${C.border}` : 'none',
          borderRadius: 12,
          color: plan.ghost ? C.text : '#03121A',
          fontWeight: 700, fontSize: 14,
          cursor: plan.ghost ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          fontFamily: 'inherit',
          boxShadow: plan.ghost ? 'none' : `0 10px 30px -10px ${C.glow}`,
          transition: 'opacity 0.2s',
        }}
      >
        {plan.cta}
        {!plan.ghost && <Arrow size={14} />}
      </button>

      <div style={{ height: 1, background: C.border, margin: '24px 0' }} />

      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
        {plan.features.map((f) => (
          <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: C.muted }}>
            <Check /> {f}
          </li>
        ))}
      </ul>
    </motion.div>
  )
}

/* ─────────────────────────────────────────────
   FAQ
───────────────────────────────────────────── */
const FAQS = [
  { q: 'Can I cancel anytime?', a: 'Yes. Cancel from your account settings — no questions asked. Your Pro access continues until the end of the billing period.' },
  { q: 'How does the ABA KHQR payment work?', a: 'Scan the QR code with ABA Mobile or any Bakong-supported banking app. Payment confirms in seconds and your plan activates immediately.' },
  { q: 'Is my payment data secure?', a: 'All payments are processed by ABA PayWay, a PCI DSS Level 1 certified gateway. We never store your card or banking details.' },
  { q: 'Can I switch plans later?', a: 'Yes. Upgrade or downgrade any time. Upgrades take effect immediately; downgrades apply at the next billing cycle.' },
]

function FAQ() {
  const [open, setOpen] = useState(null)
  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      {FAQS.map((item, i) => (
        <div key={i} style={{ borderBottom: `1px solid ${C.border}`, padding: '18px 0' }}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            style={{
              width: '100%', background: 'none', border: 'none',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              cursor: 'pointer', gap: 16,
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 600, color: C.text, textAlign: 'left' }}>{item.q}</span>
            <motion.span
              animate={{ rotate: open === i ? 45 : 0 }}
              transition={{ duration: 0.2 }}
              style={{ color: C.primary, fontSize: 22, lineHeight: 1, flexShrink: 0 }}
            >+</motion.span>
          </button>
          <AnimatePresence>
            {open === i && (
              <motion.p
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22 }}
                style={{ fontSize: 14, color: C.muted, lineHeight: 1.7, margin: '10px 0 0', overflow: 'hidden' }}
              >{item.a}</motion.p>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────────
   Main page
───────────────────────────────────────────── */
export default function UpgradePage() {
  const [isYearly, setIsYearly] = useState(false)
  const [checkout, setCheckout] = useState(null)

  const handleUpgrade = (plan) => {
    if (plan.ghost || plan.monthly === 0) return
    setCheckout(plan)
  }

  const handleSuccess = useCallback(() => {
    // TODO: update user subscription state in your auth/store layer
    console.log('Payment confirmed — activate Pro plan for user')
  }, [])

  return (
    <Layout openCount={0}>
      <div style={{
        minHeight: '100vh',
        background: C.bg,
        color: C.text,
        fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
        WebkitFontSmoothing: 'antialiased',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Ambient glow */}
        <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
          <div style={{ position: 'absolute', top: '-10%', right: '-8%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(50,230,213,0.13), transparent 70%)', filter: 'blur(80px)' }} />
          <div style={{ position: 'absolute', bottom: '-15%', left: '-6%', width: '45vw', height: '45vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,233,0.11), transparent 70%)', filter: 'blur(80px)' }} />
        </div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', padding: '80px 28px 120px' }}>

          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            style={{ textAlign: 'center', marginBottom: 56 }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.primary, marginBottom: 14 }}>
              Pricing
            </div>
            <h1 style={{ fontSize: 'clamp(34px,5vw,58px)', fontWeight: 800, lineHeight: 1.07, letterSpacing: '-1.5px', margin: '0 0 18px' }}>
              Simple, transparent{' '}
              <span style={{
                background: `linear-gradient(90deg, ${C.primary}, ${C.secondary})`,
                WebkitBackgroundClip: 'text', backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>pricing</span>
            </h1>
            <p style={{ fontSize: 17, color: C.muted, lineHeight: 1.7, maxWidth: 480, margin: '0 auto 32px' }}>
              Start free, upgrade when you're ready. No hidden fees — cancel anytime.
            </p>

            {/* Billing toggle */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 30, padding: '6px 20px' }}>
              <span style={{ fontSize: 14, fontWeight: isYearly ? 400 : 600, color: isYearly ? C.muted : C.text, transition: 'color 0.2s' }}>Monthly</span>
              <button
                role="switch"
                aria-checked={isYearly}
                onClick={() => setIsYearly(y => !y)}
                style={{
                  position: 'relative', width: 46, height: 26,
                  background: isYearly ? C.aba : 'rgba(255,255,255,0.12)',
                  border: 'none', borderRadius: 26,
                  cursor: 'pointer', transition: 'background 0.25s',
                }}
              >
                <motion.span
                  animate={{ x: isYearly ? 22 : 2 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  style={{ position: 'absolute', top: 3, width: 20, height: 20, background: '#fff', borderRadius: '50%', display: 'block' }}
                />
              </button>
              <span style={{ fontSize: 14, fontWeight: isYearly ? 600 : 400, color: isYearly ? C.text : C.muted, transition: 'color 0.2s' }}>
                Yearly
                {isYearly && (
                  <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, background: 'rgba(52,211,153,0.15)', color: C.pos, padding: '2px 8px', borderRadius: 20 }}>
                    Save 20%
                  </span>
                )}
              </span>
            </div>
          </motion.div>

          {/* Plan cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, maxWidth: 780, margin: '0 auto 100px' }}>
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              >
                <PlanCard plan={plan} isYearly={isYearly} onUpgrade={handleUpgrade} />
              </motion.div>
            ))}
          </div>

          {/* Trust strip */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.3 }}
            style={{
              display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center',
              gap: 28, marginBottom: 100, padding: '22px 28px',
              background: 'rgba(255,255,255,0.02)',
              border: `1px solid ${C.border}`,
              borderRadius: 16, maxWidth: 780, margin: '0 auto 100px',
            }}
          >
            {[['🔒', 'PCI DSS Level 1'], ['⚡', 'Instant activation'], ['↩', 'Cancel anytime'], ['🇰🇭', 'ABA PayWay secured']].map(([icon, label]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.muted }}>
                <span>{icon}</span> {label}
              </div>
            ))}
          </motion.div>

          {/* FAQ */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.4 }}
          >
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.primary, marginBottom: 12 }}>FAQ</div>
              <h2 style={{ fontSize: 'clamp(26px,3.5vw,38px)', fontWeight: 800, letterSpacing: '-1px', margin: 0 }}>Common questions</h2>
            </div>
            <FAQ />
          </motion.div>
        </div>

        {/* Checkout modal */}
        {checkout && (
          <CheckoutModal
            plan={checkout}
            isYearly={isYearly}
            onClose={() => setCheckout(null)}
            onSuccess={handleSuccess}
          />
        )}
      </div>
    </Layout>
  )
}