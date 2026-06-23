// src/pages/HomePage.jsx
// Public marketing homepage — premium fintech SaaS redesign.
// Visual language inspired by Linear / Stripe / MemoTrade: dark futuristic
// canvas, cyan glassmorphism, generous whitespace, floating dashboard.
//
// Branding, routes, auth behaviour and business logic are preserved:
//  - logged-in users see a "Dashboard" entry point
//  - all CTAs route to the same paths as before (/register, /login, ...)
//
// Requires: framer-motion (already used by the previous homepage).

import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, useMotionValue, useSpring, useScroll, useTransform } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

/* ──────────────────────────────────────────────────────────────────────────
   Design tokens
   ────────────────────────────────────────────────────────────────────────── */
const C = {
  bg: '#050B14',
  bgSoft: '#0A1422',
  primary: '#32E6D5',
  secondary: '#0EA5E9',
  text: '#FFFFFF',
  muted: '#94A3B8',
  pos: '#34D399',
  glow: 'rgba(50,230,213,0.25)',
  border: 'rgba(255,255,255,0.08)',
  card: 'rgba(255,255,255,0.03)',
}

/* ──────────────────────────────────────────────────────────────────────────
   Static content
   ────────────────────────────────────────────────────────────────────────── */
const NAV = [
  { label: 'Features', path: '/signals' },
  { label: 'Markets', path: '/market-analysis' },
  { label: 'Track Record', path: '/track-record' },
  { label: 'Pricing', path: '#pricing' },
  { label: 'Contact', path: '/contact' },
]

const TRUSTED = ['coinbase', 'ripple', 'stitch', 'sling', 'CarTrawler', 'SafetyWing']

const CRYPTO = [
  { sym: '₿', from: '#F7931A', to: '#FFB347' },
  { sym: 'Ξ', from: '#627EEA', to: '#8EA2FF' },
  { sym: '◎', from: '#14F195', to: '#9945FF' },
  { sym: '✕', from: '#23292F', to: '#4A5568' },
  { sym: '⬡', from: '#2775CA', to: '#56CCF2' },
]

const DASH_STATS = [
  { label: 'Win Rate', value: '68.26%' },
  { label: 'Profit Factor', value: '2.45' },
  { label: 'Total Trades', value: '312' },
  { label: 'Total Profit', value: '$14,832.01', accent: true },
  { label: 'Best Trade', value: '$2,392.21', accent: true },
]

const BENEFITS = [
  { label: 'Total Trades', value: '1,248', delta: '+18.6% vs last month', up: true, big: true },
  { label: 'Win Rate', value: '68.26%', delta: '+8.2% vs last month', up: true, chart: true },
  { label: 'Profit Factor', value: '2.45', delta: '+0.42 vs last month', up: true },
  { label: 'Total Profit', value: '$14,832.01', delta: '+19.44% vs last month', up: true, chart: true },
]

const FEATURES = [
  { title: 'AI Trade Analysis', desc: 'Upload your chart to get the signal, SL, TP and explanation of the position.' },
  { title: 'Trade Journal', desc: 'Log entries, exits, P&L and screenshots to compound your edge.' },

  { title: 'Risk Calculator', desc: 'Automatic SL/TP placement with transparent reward-to-risk profiling.' },
  { title: 'Performance Reports', desc: 'Equity curve, monthly P&L and strategy breakdowns on demand.' },
  { title: 'Screenshot Storage', desc: 'Attach chart context to every trade and review it later.' },
  { title: 'Lessons', desc: 'Trade what you see, not what you think.' },
  { title: 'Market Analytics', desc: 'Live multi-asset analytics across FX, crypto, indices and metals.' },
]
const PLANS = [
  {
    name: 'Free', price: '$0', period: 'forever',
    desc: 'Perfect to get started with your trading journal.',
    cta: 'Get Started', ctaPath: '/register', ghost: true,
    features: ['Up to 10 trades/month', 'Basic trade journal', 'Performance overview', 'Screenshot storage', '3 AI analyses/day'],
  },
  {
    name: 'Pro', price: '$9', period: 'per month',
    desc: 'Everything you need to trade with data, not emotion.',
    cta: 'Start Free Trial', ctaPath: '/register', ghost: false, popular: true,
    features: ['Unlimited trades', 'Full trade journal', 'Advanced analytics', 'Unlimited AI analysis', 'Risk calculator', 'Telegram alerts', 'Priority support'],
  },
]

const BROKERS = [
  { 
    name: 'Exness', 
    short: 'EX', 
    logo: 'https://i.postimg.cc/4xSQvJZt/Exness-Logo-d79e0e0521.jpg',
    link: 'https://one.exnessonelink.com/a/ylobd35p1f'
  },
]
/* ──────────────────────────────────────────────────────────────────────────
   Tiny icons
   ────────────────────────────────────────────────────────────────────────── */
const Arrow = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
)
const Spark = ({ stroke = C.primary }) => (
  <svg width="100%" height="34" viewBox="0 0 120 34" preserveAspectRatio="none">
    <polyline points="0,28 16,22 30,25 46,12 62,17 80,8 100,11 120,4" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

/* ──────────────────────────────────────────────────────────────────────────
   Brand mark
   ────────────────────────────────────────────────────────────────────────── */
function Logo({ size = 34 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.28,
      background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, boxShadow: `0 6px 20px -6px ${C.glow}`,
    }}>
      <svg width={size * 0.54} height={size * 0.54} viewBox="0 0 14 14" fill="none">
        <polyline points="0,11 4,6 8,9 14,2" stroke="#05070A" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   Reusable primitives
   ────────────────────────────────────────────────────────────────────────── */
function FadeUp({ children, delay = 0, y = 28, className, style }) {
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

function GlassCard({ children, className = '', style, glow = true, lift = true, ...rest }) {
  return (
    <motion.div
      className={`atj-glass ${glow ? 'atj-glass--glow' : ''} ${className}`}
      whileHover={lift ? { y: -6 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      style={style}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

function SectionHead({ label, title, sub, light = false, center = true }) {
  return (
    <FadeUp style={{ textAlign: center ? 'center' : 'left', maxWidth: center ? 680 : undefined, margin: center ? '0 auto' : undefined }}>
      <div className="atj-eyebrow">{label}</div>
      <h2 className={`atj-h2 ${light ? 'atj-h2--dark' : ''}`}>{title}</h2>
      {sub && <p className={`atj-lead ${light ? 'atj-lead--dark' : ''}`}>{sub}</p>}
    </FadeUp>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   Hero — floating glass trading dashboard with 3D tilt
   ────────────────────────────────────────────────────────────────────────── */
function EquityChart() {
  const pts = [22, 38, 30, 52, 44, 64, 58, 78, 70, 92, 86, 108]
  const max = 120, w = 460, h = 150, step = w / (pts.length - 1)
  const line = pts.map((p, i) => `${i * step},${h - (p / max) * h}`).join(' ')
  const area = `0,${h} ${line} ${w},${h}`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: 150, display: 'block' }}>
      <defs>
        <linearGradient id="atj-eq" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.primary} stopOpacity="0.35" />
          <stop offset="100%" stopColor={C.primary} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#atj-eq)" />
      <motion.polyline
        points={line} fill="none" stroke={C.primary} strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }}
        viewport={{ once: true }} transition={{ duration: 1.6, ease: 'easeInOut' }}
      />
    </svg>
  )
}

function TradingDashboard() {
  const rx = useSpring(useMotionValue(0), { stiffness: 150, damping: 18 })
  const ry = useSpring(useMotionValue(0), { stiffness: 150, damping: 18 })

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    ry.set(px * 10)
    rx.set(-py * 10)
  }
  const onLeave = () => { rx.set(0); ry.set(0) }

  return (
    <div style={{ perspective: 1200, width: '100%' }}>
      <motion.div
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d', position: 'relative' }}
      >
        <div className="atj-glass atj-dash">
          <div className="atj-dash__top">
            <div>
              <div className="atj-dash__cap">Portfolio Value</div>
              <div className="atj-dash__value">
                $91,134,765<span style={{ color: C.muted, fontSize: '0.55em' }}>.99</span>
              </div>
              <div className="atj-dash__pnl">▲ +$14,832.01 (+19.44%)</div>
            </div>
            <div className="atj-dash__period">This Month ▾</div>
          </div>

          <div className="atj-dash__body">
            <div className="atj-dash__chart">
              <EquityChart />
              <div className="atj-dash__axis">
                <span>05</span><span>06</span><span>07</span><span>08</span><span>09</span><span>10</span><span>11</span>
              </div>
            </div>
            <div className="atj-dash__stats">
              {DASH_STATS.map((s) => (
                <div key={s.label} className="atj-dash__stat">
                  <span className="atj-dash__stat-l">{s.label}</span>
                  <span className="atj-dash__stat-v" style={s.accent ? { color: C.primary } : undefined}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="atj-dash__crypto">
            {CRYPTO.map((c, i) => (
              <motion.span
                key={i}
                className="atj-coin"
                style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }}
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: 'easeInOut' }}
              >
                {c.sym}
              </motion.span>
            ))}
          </div>
        </div>

        {/* floating mini widgets */}
        <motion.div
          className="atj-glass atj-float atj-float--tr"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
        >
          <div className="atj-float__l">Monthly Return</div>
          <div className="atj-float__v" style={{ color: C.pos }}>+19.44%</div>
        </motion.div>

        <motion.div
          className="atj-glass atj-float atj-float--bl"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        >
          <div className="atj-float__l">Win Rate</div>
          <div className="atj-float__v">68.26%</div>
          <Spark />
        </motion.div>
      </motion.div>
    </div>
  )
}

function Hero() {
  const { scrollY } = useScroll()
  const glowY = useTransform(scrollY, [0, 600], [0, 120])
  return (
    <section className="atj-hero">
      <motion.div className="atj-hero__glow" style={{ y: glowY }} />
      <div className="atj-hero__grid">
        <FadeUp>
          <div className="atj-eyebrow atj-eyebrow--solo">AI Trading Journal</div>
          <h1 className="atj-h1">
            Explore the world of<br />trading with{' '}
            <span className="atj-grad">AI Trading Journal</span>
          </h1>
          <p className="atj-lead" style={{ maxWidth: 460 }}>
            Track your trades, analyze performance, and build better trading habits — all in one powerful digital journal.
          </p>
          <div className="atj-hero__cta">
            <Link to="/register" className="atj-btn atj-btn--primary">
              Get Started <Arrow />
            </Link>
            <Link to="/signals" className="atj-btn atj-btn--ghost">View Dashboard</Link>
          </div>
          <div className="atj-trustrow">
            <div className="atj-avatars">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className="atj-avatar" style={{ background: `linear-gradient(135deg, hsl(${190 + i * 18} 80% 55%), hsl(${210 + i * 18} 80% 45%))` }} />
              ))}
            </div>
            <span className="atj-trustrow__txt">Trusted by <strong>12,000+</strong> traders worldwide</span>
          </div>
        </FadeUp>

        <FadeUp delay={0.15} y={36}>
          <TradingDashboard />
        </FadeUp>
      </div>
    </section>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   Trusted companies strip
   ────────────────────────────────────────────────────────────────────────── */
function Trusted() {
  return (
    <section className="atj-section atj-section--tight">
      <FadeUp>
        {/* <div className="atj-glass atj-trusted">
          <div className="atj-trusted__logos">
            {TRUSTED.map((t) => <span key={t} className="atj-trusted__logo">{t}</span>)}
          </div>
          <div className="atj-trusted__cap">Trusted by global leaders to secure their most sensitive data</div>
        </div> */}
      </FadeUp>
    </section>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   Benefits (light section)
   ────────────────────────────────────────────────────────────────────────── */
function BenefitWidget({ b, delay }) {
  return (
    <FadeUp delay={delay} className={b.big ? 'atj-bw atj-bw--feature' : 'atj-bw'}>
      <div className="atj-bw__l">{b.label}</div>
      <div className="atj-bw__v" style={b.big ? { color: '#fff' } : undefined}>{b.value}</div>
      {b.chart && <Spark stroke={b.big ? '#fff' : C.secondary} />}
      <div className={`atj-bw__delta ${b.up ? 'up' : 'down'}`}>{b.delta}</div>
    </FadeUp>
  )
}

function Benefits() {
  return (
    <section className="atj-light">
      <div className="atj-section">
        <div className="atj-benefits">
          <div>
            <SectionHead label="Benefits" title="We trade with AI Analysis" light center={false}
              sub="Clean analytics widgets and an always-on AI assistant keep you focused on what actually moves your P&L." />
            <div className="atj-benefits__grid">
              {BENEFITS.map((b, i) => <BenefitWidget key={b.label} b={b} delay={(i % 4) * 0.06} />)}
            </div>
          </div>

          <FadeUp delay={0.1} className="atj-assistant">
            <div className="atj-bubble">What are the top movers today?</div>
            <div className="atj-bubble">Show me a detailed analysis of XAUUSD</div>
            <div className="atj-glass atj-ai">
              <div className="atj-ai__top">
                <span className="atj-ai__title">AI Analysis · XAUUSD</span>
                <span className="atj-ai__tag">BUY</span>
              </div>
              <p className="atj-ai__txt">
                Strong bullish momentum with key support holding. Structure confirmed across H1/H4.
              </p>
              <div className="atj-ai__target">Target: <strong>$2,450.00</strong></div>
              <Spark />
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   Features
   ────────────────────────────────────────────────────────────────────────── */
function Features() {
  return (
    <section className="atj-section">
      <SectionHead
        label="Features"
        title="Tools & Features Designed for Your Profit Growth"
        sub="Everything you need to journal, analyze and improve — wrapped in a fast, modern interface."
      />
      <div className="atj-features">
        <FadeUp className="atj-iso">
          <motion.div className="atj-glass atj-iso__a" animate={{ y: [0, -10, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}>
            <div className="atj-iso__cap">Net P&amp;L</div>
            <div className="atj-iso__big" style={{ color: C.pos }}>$8,320.00</div>
            <Spark />
          </motion.div>
          <motion.div className="atj-glass atj-iso__b" animate={{ y: [0, 12, 0] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}>
            <div className="atj-iso__cap">Profit Factor</div>
            <div className="atj-iso__big">2.45</div>
          </motion.div>
        </FadeUp>

        <div className="atj-features__grid">
          {FEATURES.map((f, i) => (
            <FadeUp key={f.title} delay={(i % 4) * 0.05}>
              <GlassCard className="atj-feature">
                <div className="atj-feature__ico">
                  <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                    <polyline points="0,11 4,6 8,9 14,2" stroke={C.primary} strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="atj-feature__t">{f.title}</div>
                <div className="atj-feature__d">{f.desc}</div>
              </GlassCard>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   Broker integrations
   ────────────────────────────────────────────────────────────────────────── */
// Replace the Integrations function with this:
function Integrations() {
  return (
    <section className="atj-section">
      <SectionHead 
        label="Integrations" 
        title="Brokers & Integrations"
        sub="Connect the platforms you already trade on. Sync fills, prices and analytics in seconds." 
      />
      <div className="atj-brokers">
        {BROKERS.map((b, i) => (
          <FadeUp key={b.name} delay={(i % 6) * 0.05}>
            <GlassCard className="atj-broker overflow-hidden p-0"> 
              
              {/* Clickable wrapper link covering the entire card area */}
              <a 
                href={b.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 w-full h-full transition-all duration-200 hover:bg-white/[0.05]"
              >
                {/* Logo Container */}
                <div className="flex h-12 w-20 shrink-0 items-center justify-center overflow-hidden rounded bg-white/10">
                  <img 
                    src={b.logo} 
                    alt={`${b.name} logo`} 
                    className="h-full w-full object-cover" 
                  />
                </div>

                {/* Broker Name */}
                <span className="atj-broker__name text-sm font-medium text-white">{b.name}</span>
              </a>

            </GlassCard>
          </FadeUp>
        ))}
      </div>
    </section>
  )
}
/* ──────────────────────────────────────────────────────────────────────────
   Light & Dark mode showcase
   ────────────────────────────────────────────────────────────────────────── */
function ThemeSection() {
  const [dark, setDark] = useState(true)
  return (
    <section className="atj-section">
      <SectionHead label="Customization" title="Light & Dark Mode"
        sub="Make it yours. Switch themes instantly — your charts and journal follow along." />
      <FadeUp className="atj-theme">
        <button className={`atj-toggle ${dark ? 'on' : ''}`} onClick={() => setDark((d) => !d)} aria-label="Toggle theme">
          <span className="atj-toggle__dot" />
          <span className="atj-toggle__t atj-toggle__t--l">Dark</span>
          <span className="atj-toggle__t atj-toggle__t--r">Light</span>
        </button>
        <div className="atj-theme__previews">
          <motion.div className={`atj-preview atj-preview--dark ${dark ? 'active' : ''}`} whileHover={{ y: -6 }}>
            <div className="atj-preview__bar"><span /><span /><span /></div>
            <div className="atj-preview__big" style={{ color: C.primary }}>$91,134.99</div>
            <Spark />
          </motion.div>
          <motion.div className={`atj-preview atj-preview--light ${!dark ? 'active' : ''}`} whileHover={{ y: -6 }}>
            <div className="atj-preview__bar"><span /><span /><span /></div>
            <div className="atj-preview__big" style={{ color: C.secondary }}>$91,134.99</div>
            <Spark stroke={C.secondary} />
          </motion.div>
        </div>
      </FadeUp>
    </section>
  )
}
/*Pricing*/
function Pricing() {
  return (
    <section className="atj-section" id="pricing">
      <SectionHead label="Pricing" title="Simple, Transparent Pricing"
        sub="Start free, upgrade when you're ready. No hidden fees, cancel anytime." />
      <div className="atj-plans">
        {PLANS.map((plan) => (
          <FadeUp key={plan.name}>
            <div className={`atj-plan ${plan.popular ? 'atj-plan--popular' : ''}`}>
              {plan.popular && <div className="atj-plan__badge">Most Popular</div>}
              <div className="atj-plan__name">{plan.name}</div>
              <div className="atj-plan__price">{plan.price}<span className="atj-plan__period">/{plan.period}</span></div>
              <p className="atj-plan__desc">{plan.desc}</p>
              <Link to={plan.ctaPath} className={`atj-btn ${plan.ghost ? 'atj-btn--ghost' : 'atj-btn--primary'} atj-plan__cta`}>
                {plan.cta} <Arrow />
              </Link>
              <div className="atj-plan__divider" />
              <ul className="atj-plan__features">
                {plan.features.map((f) => (
                  <li key={f} className="atj-plan__feature">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <polyline points="2,7 5.5,10.5 12,3.5" stroke={C.primary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </FadeUp>
        ))}
      </div>
    </section>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   Testimonial
   ────────────────────────────────────────────────────────────────────────── */
function Testimonial() {
  return (
    <section className="atj-section">
      <FadeUp>
        <GlassCard className="atj-quote" lift={false}>
          <div className="atj-quote__mark">“</div>
          <p className="atj-quote__txt">
            AI Trading Journal completely transformed our trading workflow and performance analysis.
          </p>
          <div className="atj-quote__who">
  <img
    src="/images/kim-saksith.jpg"
    alt="KIM Saksith"
    className="atj-avatar"
  />

  <div>
    <div className="atj-quote__name">KIM Saksith</div>
    <div className="atj-quote__role">Partner · Trader</div>
  </div>
</div>
        </GlassCard>
      </FadeUp>
    </section>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   Final CTA
   ────────────────────────────────────────────────────────────────────────── */
function FinalCTA() {
  return (
    <section className="atj-section">
      <FadeUp>
        <GlassCard className="atj-cta" lift={false}>
          <h2 className="atj-h2">Trade with Data, Not Emotion</h2>
          <p className="atj-lead" style={{ maxWidth: 520, margin: '0 auto' }}>
            Use AI-powered insights, trading analytics, and journaling tools to improve your consistency.
          </p>
          <div className="atj-hero__cta atj-hero__cta--center">
            <Link to="/register" className="atj-btn atj-btn--primary">Start Free Trial <Arrow /></Link>
            <Link to="#pricing" className="atj-btn atj-btn--ghost">View Pricing</Link>
          </div>
        </GlassCard>
      </FadeUp>
    </section>
  )
}
function LegalSections() {
  return (
    <>
      <section id="terms" className="atj-section" style={{ paddingBottom: 60 }}>
        <SectionHead label="Legal" title="Terms of Service" sub="Effective date: June 23, 2026" />
        <div className="atj-legal">
          {[
            { h: 'Acceptance of terms', p: 'By accessing or using TradeLog Terminal ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.' },
            { h: 'Description of service', p: 'TradeLog Terminal is an AI-powered trading journal platform that allows traders to log trades, analyze performance, and access AI-generated market signals. The Service is provided on a free and paid subscription basis.' },
            { h: 'User accounts', p: 'You must provide accurate information when creating an account. You are responsible for maintaining the security of your account. We reserve the right to suspend accounts that violate these terms.' },
            { h: 'Free and Pro plans', p: 'The free plan allows up to 10 trade entries and 3 AI signals per day. Pro plan subscribers receive unlimited trade entries and additional features. Subscription fees are billed in advance and you may cancel at any time.' },
            { h: 'Financial disclaimer', p: 'TradeLog Terminal is a journaling and analytics tool only. Nothing on this platform constitutes financial advice or investment recommendations. Trading involves significant risk of loss. Always consult a qualified financial advisor before making trading decisions.' },
            { h: 'Limitation of liability', p: 'To the fullest extent permitted by law, TradeLog Terminal shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service, including trading losses based on AI signals or analytics provided.' },
            { h: 'Contact', p: 'For questions about these Terms, contact us at: support@tradelog.app' },
          ].map((item) => (
            <div key={item.h} className="atj-legal__block">
              <h3 className="atj-legal__h">{item.h}</h3>
              <p className="atj-legal__p">{item.p}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="privacy" className="atj-section" style={{ paddingTop: 0 }}>
        <SectionHead label="Legal" title="Privacy Policy" sub="Effective date: June 23, 2026" />
        <div className="atj-legal">
          {[
            { h: 'Introduction', p: 'TradeLog Terminal is committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our Service.' },
            { h: 'Information we collect', p: 'We collect account information (name, email, profile photo via Google OAuth or email registration), trade data you input, usage data to improve the Service, and device data for security purposes.' },
            { h: 'How we use your information', p: 'To provide and maintain the Service, authenticate your identity, send account notifications, improve our AI models (anonymized only), process subscription payments, and comply with legal obligations.' },
            { h: 'Firebase & Google services', p: 'We use Firebase by Google for authentication, database, and file storage. If you sign in with Google, we receive your name, email, and profile photo only. We do not receive your Google password or payment information.' },
            { h: 'Data sharing', p: 'We do not sell, trade, or rent your personal information to third parties. We share data only with service providers necessary to operate the Service, or when required by law.' },
            { h: 'Your rights', p: 'You may access, correct, or delete your personal data at any time. You may also request a portable export of your trade data. To make a request, contact us at privacy@tradelog.app.' },
            { h: 'Security', p: 'We implement industry-standard security measures including HTTPS encryption and Firebase security rules. However, no method of internet transmission is 100% secure.' },
            { h: 'Contact', p: 'For privacy-related questions or data requests, contact us at: privacy@tradelog.app' },
          ].map((item) => (
            <div key={item.h} className="atj-legal__block">
              <h3 className="atj-legal__h">{item.h}</h3>
              <p className="atj-legal__p">{item.p}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
/* ──────────────────────────────────────────────────────────────────────────
   Footer
   ────────────────────────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="atj-footer">
      <div className="atj-footer__inner">
        <div className="atj-footer__brand">
          <Link to="/" className="atj-brand">
            <Logo size={28} />
            <span className="atj-brand__name">AI Trading Journal</span>
          </Link>
          <p className="atj-footer__tag">Trade with data, not emotion. AI-powered analysis across global markets.</p>
        </div>
        <div className="atj-footer__col">
          <div className="atj-footer__h">Product</div>
          {NAV.map((n) => 
  n.path.startsWith('#')
    ? <a key={n.label} href={n.path} className="atj-footer__link">{n.label}</a>
    : <Link key={n.label} to={n.path} className="atj-footer__link">{n.label}</Link>
)}
        </div>
       <div className="atj-footer__col">
  <div className="atj-footer__h">Company</div>
  <Link to="/risk-disclaimer" className="atj-footer__link">Risk Disclaimer</Link>
  <Link to="/terms" className="atj-footer__link">Terms of Service</Link>
  <Link to="/privacy" className="atj-footer__link">Privacy Policy</Link>
</div>
        <div className="atj-footer__col">
          <div className="atj-footer__h">Get started</div>
          <p className="atj-footer__tag">Join thousands trading with data, not emotion.</p>
          <Link to="/register" className="atj-btn atj-btn--primary atj-btn--sm">Create free account</Link>
        </div>
      </div>
      <div className="atj-footer__bottom">
        <span>© {new Date().getFullYear()} AI Trading Journal. All rights reserved.</span>
        <a href="https://t.me/AIJournalTrade" target="_blank" rel="noopener noreferrer" className="atj-footer__tg">
          Join community · Telegram
        </a>
      </div>
      <p className="atj-footer__disc">
        Signals are for educational and analysis purposes only. This is not financial advice. Trading involves risk and you can lose money.
      </p>
    </footer>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   Navbar (auth-aware, sticky glass)
   ────────────────────────────────────────────────────────────────────────── */
function Navbar() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`atj-nav ${scrolled ? 'atj-nav--scrolled' : ''}`}>
      <div className="atj-nav__inner">
        <Link to="/" className="atj-brand">
          <Logo size={32} />
          <span className="atj-brand__name">AI Trading Journal</span>
        </Link>

        <nav className="atj-nav__links">
         {NAV.map((n) => 
  n.path.startsWith('#') 
    ? <a key={n.label} href={n.path} className="atj-nav__link">{n.label}</a>
    : <Link key={n.label} to={n.path} className="atj-nav__link">{n.label}</Link>
)}
        </nav>

        <div className="atj-nav__actions">
          {user ? (
            <button className="atj-btn atj-btn--primary atj-btn--sm" onClick={() => navigate('/dashboard')}>Dashboard</button>
          ) : (
            <>
              <Link to="/login" className="atj-btn atj-btn--ghost atj-btn--sm">Login</Link>
              <Link to="/register" className="atj-btn atj-btn--primary atj-btn--sm">Sign Up</Link>
            </>
          )}
          <button className="atj-burger" aria-label="Menu" onClick={() => setOpen((o) => !o)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
              {open ? (<><line x1="5" y1="5" x2="19" y2="19" /><line x1="19" y1="5" x2="5" y2="19" /></>)
                : (<><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>)}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="atj-nav__mobile">
          {NAV.map((n) => 
  n.path.startsWith('#')
    ? <a key={n.label} href={n.path} className="atj-nav__link" onClick={() => setOpen(false)}>{n.label}</a>
    : <Link key={n.label} to={n.path} className="atj-nav__link" onClick={() => setOpen(false)}>{n.label}</Link>
)}
          <div className="atj-nav__mobile-cta">
            {user ? (
              <button className="atj-btn atj-btn--primary" onClick={() => { navigate('/dashboard'); setOpen(false) }}>Dashboard</button>
            ) : (
              <>
                <Link to="/login" className="atj-btn atj-btn--ghost" onClick={() => setOpen(false)}>Login</Link>
                <Link to="/register" className="atj-btn atj-btn--primary" onClick={() => setOpen(false)}>Sign Up</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   Page
   ────────────────────────────────────────────────────────────────────────── */
export default function HomePage() {
  return (
    <div className="atj-page">
      <Styles />
      <div className="atj-ambient" aria-hidden />
      <Navbar />
      <Hero />
      <Trusted />
      <Benefits />
      <Features />
      <Integrations />
      <ThemeSection />
      <Pricing />
      <Testimonial />
      <FinalCTA />
      <Footer />
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   Scoped styles
   ────────────────────────────────────────────────────────────────────────── */
function Styles() {
  return (
    <style>{`
:root {
  --bg:${C.bg}; --primary:${C.primary}; --secondary:${C.secondary};
  --muted:${C.muted}; --glow:${C.glow}; --border:${C.border}; --card:${C.card};
}
.atj-page * { box-sizing: border-box; }
.atj-page {
  background: var(--bg); color: #fff; position: relative; overflow-x: hidden;
  font-family: 'Inter','Segoe UI',system-ui,sans-serif; -webkit-font-smoothing: antialiased;
}
.atj-page a { text-decoration: none; }

/* Ambient background glows (no particles / no neural net) */
.atj-ambient { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
.atj-ambient::before, .atj-ambient::after {
  content:''; position:absolute; border-radius:50%; filter: blur(90px);
}
.atj-ambient::before { top:-12%; right:-10%; width:55vw; height:55vw; background: radial-gradient(circle, rgba(50,230,213,0.16), transparent 70%); }
.atj-ambient::after  { bottom:-18%; left:-8%; width:50vw; height:50vw; background: radial-gradient(circle, rgba(14,165,233,0.14), transparent 70%); }

/* Layout */
.atj-section { position: relative; z-index: 1; max-width: 1200px; margin: 0 auto; padding: 110px 28px; }
.atj-section--tight { padding-top: 0; padding-bottom: 24px; }

/* Typography */
.atj-eyebrow { font-size: 12px; font-weight: 700; letter-spacing: .2em; text-transform: uppercase; color: var(--primary); margin-bottom: 14px; }
.atj-eyebrow--solo { display:inline-block; }
.atj-h1 { font-size: clamp(38px, 5.4vw, 62px); font-weight: 800; line-height: 1.05; letter-spacing: -1.5px; margin: 0 0 22px; }
.atj-h2 { font-size: clamp(30px, 4vw, 46px); font-weight: 800; line-height: 1.12; letter-spacing: -1px; margin: 0 0 16px; }
.atj-h2--dark { color: #0B1220; }
.atj-lead { font-size: 17px; line-height: 1.7; color: var(--muted); margin: 0 0 0; }
.atj-lead--dark { color: #475569; }
.atj-grad {
  background: linear-gradient(90deg, var(--primary), var(--secondary));
  -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; color: transparent;
}

/* Glass */
.atj-glass {
  background: var(--card); border: 1px solid var(--border); border-radius: 22px;
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 20px 60px -30px rgba(0,0,0,.8);
}
.atj-glass--glow:hover { border-color: rgba(50,230,213,0.45); box-shadow: 0 24px 60px -24px var(--glow), inset 0 0 0 1px rgba(50,230,213,0.12); }

/* Buttons */
.atj-btn { display: inline-flex; align-items: center; gap: 8px; font-weight: 600; font-size: 15px; border-radius: 12px; padding: 14px 26px; cursor: pointer; border: 1px solid transparent; transition: transform .2s, box-shadow .2s, background .2s; font-family: inherit; }
.atj-btn--sm { padding: 10px 18px; font-size: 14px; }
.atj-btn--primary { color: #03121A; background: linear-gradient(135deg, var(--primary), var(--secondary)); box-shadow: 0 10px 30px -10px var(--glow); }
.atj-btn--primary:hover { transform: translateY(-2px); box-shadow: 0 16px 40px -10px rgba(50,230,213,0.6); }
.atj-btn--ghost { color: #fff; background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.16); }
.atj-btn--ghost:hover { background: rgba(255,255,255,0.09); transform: translateY(-2px); }

/* Brand */
.atj-brand { display: inline-flex; align-items: center; gap: 10px; }
.atj-brand__name { font-size: 17px; font-weight: 700; letter-spacing: -.3px; color: #fff; }

/* Navbar */
.atj-nav { position: sticky; top: 0; z-index: 100; transition: background .3s, border-color .3s, backdrop-filter .3s; border-bottom: 1px solid transparent; }
.atj-nav--scrolled { background: rgba(5,11,20,0.72); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); border-bottom-color: var(--border); }
.atj-nav__inner { max-width: 1200px; margin: 0 auto; height: 70px; padding: 0 28px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.atj-nav__links { display: flex; align-items: center; gap: 6px; }
.atj-nav__link { font-size: 14.5px; font-weight: 500; color: var(--muted); padding: 8px 14px; border-radius: 9px; transition: color .2s, background .2s; }
.atj-nav__link:hover { color: #fff; background: rgba(255,255,255,0.06); }
.atj-nav__actions { display: flex; align-items: center; gap: 10px; }
.atj-burger { display: none; width: 40px; height: 40px; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); border: 1px solid var(--border); border-radius: 10px; cursor: pointer; }
.atj-nav__mobile { display: none; }

/* Hero */
.atj-hero { position: relative; z-index: 1; overflow: hidden; }
.atj-hero__glow { position: absolute; left: 50%; bottom: -40%; width: 90vw; height: 70vh; transform: translateX(-50%); background: radial-gradient(ellipse at center, rgba(50,230,213,0.22), transparent 60%); pointer-events: none; }
.atj-hero__grid { max-width: 1240px; margin: 0 auto; padding: 70px 28px 90px; display: grid; grid-template-columns: 1.02fr 1fr; gap: 56px; align-items: center; }
.atj-hero__cta { display: flex; gap: 14px; margin: 34px 0; flex-wrap: wrap; }
.atj-hero__cta--center { justify-content: center; margin-bottom: 0; }
.atj-trustrow { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
.atj-avatars { display: flex; }
.atj-avatar { width: 34px; height: 34px; border-radius: 50%; border: 2px solid var(--bg); margin-left: -10px; display: inline-block; }
.atj-avatars .atj-avatar:first-child { margin-left: 0; }
.atj-trustrow__txt { font-size: 14px; color: var(--muted); }
.atj-trustrow__txt strong { color: #fff; }

/* Hero dashboard */
.atj-dash { padding: 24px; position: relative; z-index: 2; border-color: rgba(50,230,213,0.28); box-shadow: 0 40px 90px -40px var(--glow), inset 0 0 0 1px rgba(50,230,213,0.08); }
.atj-dash__top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; }
.atj-dash__cap { font-size: 12px; color: var(--muted); margin-bottom: 6px; }
.atj-dash__value { font-size: clamp(28px, 4vw, 40px); font-weight: 800; letter-spacing: -1px; }
.atj-dash__pnl { color: ${C.pos}; font-size: 14px; font-weight: 600; margin-top: 6px; }
.atj-dash__period { font-size: 12px; color: var(--muted); background: rgba(255,255,255,0.05); border: 1px solid var(--border); border-radius: 9px; padding: 8px 12px; white-space: nowrap; }
.atj-dash__body { display: grid; grid-template-columns: 1.4fr 1fr; gap: 16px; }
.atj-dash__chart { background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 14px; padding: 14px; }
.atj-dash__axis { display: flex; justify-content: space-between; font-size: 10px; color: var(--muted); margin-top: 6px; }
.atj-dash__stats { display: flex; flex-direction: column; gap: 10px; }
.atj-dash__stat { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px; }
.atj-dash__stat:last-child { border-bottom: none; }
.atj-dash__stat-l { font-size: 12px; color: var(--muted); }
.atj-dash__stat-v { font-size: 14px; font-weight: 700; }
.atj-dash__crypto { display: flex; gap: 10px; margin-top: 18px; }
.atj-coin { width: 34px; height: 34px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 15px; color: #fff; font-weight: 700; box-shadow: 0 6px 16px -6px rgba(0,0,0,.6); }

.atj-float { position: absolute; padding: 14px 16px; min-width: 150px; z-index: 3; }
.atj-float--tr { top: -26px; right: -22px; }
.atj-float--bl { bottom: -28px; left: -26px; }
.atj-float__l { font-size: 11px; color: var(--muted); margin-bottom: 4px; }
.atj-float__v { font-size: 20px; font-weight: 800; }

/* Trusted strip */
.atj-trusted { padding: 26px 36px; display: flex; flex-direction: column; gap: 14px; align-items: center; background: rgba(255,255,255,0.02); }
.atj-trusted__logos { display: flex; flex-wrap: wrap; gap: 38px; justify-content: center; align-items: center; }
.atj-trusted__logo { font-size: 20px; font-weight: 700; color: rgba(255,255,255,0.5); letter-spacing: -.4px; text-transform: lowercase; }
.atj-trusted__cap { font-size: 13px; color: var(--muted); text-align: center; }

/* Light section */
.atj-light { background: linear-gradient(180deg, #F8FAFC, #EEF2F7); color: #0B1220; position: relative; z-index: 1; }
.atj-light .atj-eyebrow { color: var(--secondary); }
.atj-benefits { display: grid; grid-template-columns: 1.25fr .9fr; gap: 40px; align-items: start; }
.atj-benefits__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 30px; }
.atj-bw { background: #fff; border: 1px solid #E6EBF2; border-radius: 18px; padding: 20px; box-shadow: 0 18px 40px -28px rgba(15,23,42,.4); }
.atj-bw__l { font-size: 13px; color: #64748B; margin-bottom: 8px; }
.atj-bw__v { font-size: 28px; font-weight: 800; color: #0B1220; letter-spacing: -.5px; }
.atj-bw__delta { font-size: 12px; font-weight: 600; margin-top: 8px; }
.atj-bw__delta.up { color: #059669; }
.atj-bw__delta.down { color: #DC2626; }
.atj-bw--feature { background: linear-gradient(135deg, var(--secondary), #1D4ED8); border: none; color: #fff; }
.atj-bw--feature .atj-bw__l { color: rgba(255,255,255,.8); }
.atj-bw--feature .atj-bw__delta.up { color: #BBF7D0; }
.atj-assistant { display: flex; flex-direction: column; gap: 12px; }
.atj-bubble { align-self: flex-start; background: #fff; border: 1px solid #E6EBF2; border-radius: 14px 14px 14px 4px; padding: 12px 16px; font-size: 14px; color: #334155; box-shadow: 0 14px 30px -24px rgba(15,23,42,.5); }
.atj-bubble:nth-child(2) { align-self: flex-end; border-radius: 14px 14px 4px 14px; background: #0B1220; color: #fff; border-color: #0B1220; }
.atj-ai { background: #0B1220 !important; color: #fff; padding: 18px; border: none !important; }
.atj-ai__top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.atj-ai__title { font-size: 13px; font-weight: 700; }
.atj-ai__tag { font-size: 11px; font-weight: 700; color: #03121A; background: var(--primary); border-radius: 6px; padding: 3px 10px; }
.atj-ai__txt { font-size: 13px; color: #94A3B8; line-height: 1.6; margin: 0 0 10px; }
.atj-ai__target { font-size: 13px; color: var(--primary); margin-bottom: 6px; }

/* Features */
.atj-features { display: grid; grid-template-columns: .85fr 1.15fr; gap: 40px; align-items: center; margin-top: 56px; }
.atj-iso { position: relative; min-height: 280px; }
.atj-iso__a, .atj-iso__b { position: absolute; padding: 18px 20px; min-width: 200px; }
.atj-iso__a { top: 20px; left: 0; transform: rotate(-4deg); z-index: 2; }
.atj-iso__b { bottom: 10px; right: 10px; transform: rotate(4deg); }
.atj-iso__cap { font-size: 12px; color: var(--muted); margin-bottom: 6px; }
.atj-iso__big { font-size: 26px; font-weight: 800; }
.atj-features__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.atj-feature { padding: 22px; height: 100%; }
.atj-feature__ico { width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg, rgba(50,230,213,0.16), rgba(14,165,233,0.16)); display: flex; align-items: center; justify-content: center; margin-bottom: 14px; }
.atj-feature__t { font-size: 15px; font-weight: 700; margin-bottom: 6px; }
.atj-feature__d { font-size: 13.5px; color: var(--muted); line-height: 1.6; }

/* Brokers */
.atj-brokers { display: flex; flex-wrap: wrap; justify-content: center; gap: 16px; margin-top: 56px; }
.atj-broker { width: 220px; }
.atj-broker { display: flex; align-items: center; gap: 14px; padding: 20px 22px; }
.atj-broker__badge { width: 44px; height: 44px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; font-weight: 800; font-size: 15px; color: #03121A; background: linear-gradient(135deg, var(--primary), var(--secondary)); }
.atj-broker__name { font-size: 16px; font-weight: 600; }

/* Theme section */
.atj-theme { display: flex; flex-direction: column; align-items: center; gap: 36px; margin-top: 48px; }
.atj-toggle { position: relative; width: 220px; height: 48px; border-radius: 30px; background: rgba(255,255,255,0.05); border: 1px solid var(--border); cursor: pointer; display: flex; align-items: center; }
.atj-toggle__dot { position: absolute; top: 4px; left: 4px; width: 104px; height: 38px; border-radius: 24px; background: linear-gradient(135deg, var(--primary), var(--secondary)); transition: transform .3s ease; }
.atj-toggle.on .atj-toggle__dot { transform: translateX(0); }
.atj-toggle:not(.on) .atj-toggle__dot { transform: translateX(104px); }
.atj-toggle__t { flex: 1; text-align: center; font-size: 14px; font-weight: 600; z-index: 1; color: #fff; }
.atj-theme__previews { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; width: 100%; max-width: 720px; }
.atj-preview { border-radius: 18px; padding: 22px; border: 1px solid var(--border); transition: opacity .3s, filter .3s; }
.atj-preview--dark { background: #06101C; }
.atj-preview--light { background: #F1F5F9; color: #0B1220; }
.atj-preview:not(.active) { opacity: .5; filter: saturate(.7); }
.atj-preview__bar { display: flex; gap: 6px; margin-bottom: 18px; }
.atj-preview__bar span { width: 9px; height: 9px; border-radius: 50%; background: rgba(148,163,184,.5); }
.atj-preview__big { font-size: 24px; font-weight: 800; margin-bottom: 8px; }

/* Testimonial */
.atj-quote { max-width: 820px; margin: 0 auto; padding: 48px 44px; text-align: center; position: relative; }
.atj-quote__mark { font-size: 80px; line-height: .6; color: var(--primary); opacity: .35; font-family: Georgia, serif; }
.atj-quote__txt { font-size: clamp(20px, 2.6vw, 28px); font-weight: 600; line-height: 1.45; margin: 8px 0 28px; }
.atj-quote__who { display: inline-flex; align-items: center; gap: 12px; }
.atj-quote__who .atj-avatar { margin: 0; }
.atj-quote__name { font-size: 15px; font-weight: 700; text-align: left; }
.atj-quote__role { font-size: 13px; color: var(--muted); text-align: left; }

/* CTA */
.atj-cta { max-width: 820px; margin: 0 auto; padding: 64px 40px; text-align: center; border-color: rgba(50,230,213,0.25); box-shadow: 0 40px 90px -40px var(--glow); }

/* Footer */
.atj-footer { position: relative; z-index: 1; border-top: 1px solid var(--border); background: rgba(255,255,255,0.015); padding: 64px 28px 32px; }
.atj-footer__inner { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 2fr 1fr 1fr 1.4fr; gap: 40px; }
.atj-footer__tag { font-size: 13.5px; color: var(--muted); line-height: 1.6; margin: 14px 0 16px; max-width: 280px; }
.atj-footer__h { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: rgba(255,255,255,.55); margin-bottom: 14px; }
.atj-footer__col { display: flex; flex-direction: column; gap: 10px; }
.atj-footer__link { font-size: 14px; color: var(--muted); }
.atj-footer__link:hover { color: #fff; }
.atj-footer__bottom { max-width: 1200px; margin: 36px auto 0; padding-top: 22px; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; gap: 14px; flex-wrap: wrap; font-size: 13px; color: var(--muted); }
.atj-footer__tg { color: var(--primary); background: rgba(50,230,213,0.08); border: 1px solid rgba(50,230,213,0.3); border-radius: 20px; padding: 6px 14px; }
.atj-footer__disc { max-width: 1200px; margin: 18px auto 0; font-size: 12px; color: rgba(148,163,184,.6); line-height: 1.6; }
/* Pricing */
.atj-plans { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 56px; max-width: 860px; margin-left: auto; margin-right: auto; }
.atj-plan { position: relative; background: var(--card); border: 1px solid var(--border); border-radius: 22px; padding: 36px 32px; backdrop-filter: blur(16px); height: 100%; }
.atj-plan--popular { border-color: rgba(50,230,213,0.45); box-shadow: 0 24px 60px -24px var(--glow), inset 0 0 0 1px rgba(50,230,213,0.12); }
.atj-plan__badge { position: absolute; top: -14px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, var(--primary), var(--secondary)); color: #03121A; font-size: 11px; font-weight: 700; padding: 4px 16px; border-radius: 20px; white-space: nowrap; }
.atj-plan__name { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: .15em; color: var(--muted); margin-bottom: 12px; }
.atj-plan__price { font-size: 52px; font-weight: 800; letter-spacing: -2px; line-height: 1; margin-bottom: 6px; }
.atj-plan__period { font-size: 16px; font-weight: 500; color: var(--muted); letter-spacing: 0; }
.atj-plan__desc { font-size: 14px; color: var(--muted); line-height: 1.6; margin: 12px 0 24px; }
.atj-plan__cta { width: 100%; justify-content: center; }
.atj-plan__divider { height: 1px; background: var(--border); margin: 24px 0; }
.atj-plan__features { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }
.atj-plan__feature { display: flex; align-items: center; gap: 10px; font-size: 14px; color: var(--muted); }
@media (max-width: 560px) { .atj-plans { grid-template-columns: 1fr; } }
/* Responsive */
@media (max-width: 980px) {
  .atj-nav__links { display: none; }
  .atj-burger { display: flex; }
  .atj-nav__actions .atj-btn { display: none; }
  .atj-nav--scrolled .atj-nav__mobile, .atj-nav__mobile { display: flex; }
  .atj-nav__mobile { flex-direction: column; gap: 6px; padding: 14px 24px 22px; background: rgba(5,11,20,0.96); backdrop-filter: blur(18px); border-bottom: 1px solid var(--border); }
  .atj-nav__mobile .atj-nav__link { padding: 12px 14px; font-size: 15px; }
  .atj-nav__mobile-cta { display: flex; gap: 10px; margin-top: 10px; }
  .atj-nav__mobile-cta .atj-btn { flex: 1; justify-content: center; }
  .atj-hero__grid { grid-template-columns: 1fr; gap: 60px; padding-bottom: 70px; }
  .atj-benefits { grid-template-columns: 1fr; gap: 30px; }
  .atj-features { grid-template-columns: 1fr; gap: 60px; }
  .atj-footer__inner { grid-template-columns: 1fr 1fr; }
  .atj-float--tr { right: 0; }
  .atj-float--bl { left: 0; }

  
}
@media (max-width: 560px) {
  .atj-section { padding: 72px 20px; }
  .atj-hero__grid { padding: 40px 20px 60px; }
  .atj-benefits__grid { grid-template-columns: 1fr; }
  .atj-features__grid { grid-template-columns: 1fr; }
  .atj-brokers { grid-template-columns: 1fr; }
  .atj-dash__body { grid-template-columns: 1fr; }
  .atj-theme__previews { grid-template-columns: 1fr; }
  .atj-footer__inner { grid-template-columns: 1fr; }
  .atj-float { display: none; }
  .atj-trusted__logos { gap: 22px; }
}
  .atj-legal { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 48px; max-width: 960px; margin-left: auto; margin-right: auto; }
.atj-legal__block { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 24px 26px; }
.atj-legal__h { font-size: 14px; font-weight: 700; color: var(--primary); margin-bottom: 10px; }
.atj-legal__p { font-size: 13.5px; color: var(--muted); line-height: 1.75; margin: 0; }
@media (max-width: 680px) { .atj-legal { grid-template-columns: 1fr; } }
    `}</style>
  )
}
