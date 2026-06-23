import { Link } from 'react-router-dom'

const C = {
  bg: '#050B14', primary: '#32E6D5', secondary: '#0EA5E9',
  muted: '#94A3B8', border: 'rgba(255,255,255,0.08)', card: 'rgba(255,255,255,0.03)',
}

export default function TermsPage() {
  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: '#fff', fontFamily: 'Inter,system-ui,sans-serif' }}>
      <nav style={{ borderBottom: `1px solid ${C.border}`, padding: '16px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 17 }}>← AI Trading Journal</Link>
        <span style={{ fontSize: 12, color: C.muted }}>Last updated: June 23, 2026</span>
      </nav>
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '60px 28px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: C.primary, marginBottom: 14 }}>Legal</div>
        <h1 style={{ fontSize: 48, fontWeight: 800, letterSpacing: -1, marginBottom: 8 }}>Terms of Service</h1>
        <p style={{ color: C.muted, marginBottom: 48 }}>Effective date: June 23, 2026</p>
        {[
          { h: 'Acceptance of terms', p: 'By accessing or using TradeLog Terminal ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.' },
          { h: 'Description of service', p: 'TradeLog Terminal is an AI-powered trading journal platform that allows traders to log trades, analyze performance, and access AI-generated market signals. The Service is provided on a free and paid subscription basis.' },
          { h: 'User accounts', p: 'You must provide accurate and complete information when creating an account. You are responsible for maintaining the security of your account and password. You may not share your account with others or use another person\'s account. We reserve the right to suspend or terminate accounts that violate these terms.' },
          { h: 'Free and Pro plans', p: 'The free plan allows up to 10 trade entries and 3 AI signals per day. Pro plan subscribers receive unlimited trade entries and additional features as described on the pricing page. Subscription fees are billed in advance. You may cancel at any time, and your access will continue until the end of the current billing period.' },
          { h: 'Acceptable use', p: 'You agree not to use the Service for any unlawful purpose, attempt to gain unauthorized access to any part of the Service, reverse engineer or resell any part of the Service, upload malicious code or interfere with the Service\'s operation, or use AI signals as sole financial advice without independent judgment.' },
          { h: 'Financial disclaimer', p: 'TradeLog Terminal is a journaling and analytics tool only. Nothing on this platform constitutes financial advice, investment recommendations, or trading signals guaranteed to produce profit. Trading involves significant risk of loss. Always consult a qualified financial advisor before making trading decisions.' },
          { h: 'Intellectual property', p: 'All content, features, and functionality of the Service are owned by TradeLog Terminal and protected by applicable intellectual property laws. Your trade data belongs to you — we do not claim ownership over data you enter into the platform.' },
          { h: 'Limitation of liability', p: 'To the fullest extent permitted by law, TradeLog Terminal shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service, including trading losses based on AI signals or analytics provided.' },
          { h: 'Changes to terms', p: 'We may update these Terms at any time. We will notify users of significant changes via email or an in-app notice. Continued use of the Service after changes constitutes acceptance of the new terms.' },
          { h: 'Contact', p: 'For questions about these Terms of Service, contact us at: support@tradelog.app' },
        ].map((item) => (
          <div key={item.h} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '24px 28px', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: C.primary, marginBottom: 10 }}>{item.h}</h3>
            <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.8, margin: 0 }}>{item.p}</p>
          </div>
        ))}
      </div>
    </div>
  )
}