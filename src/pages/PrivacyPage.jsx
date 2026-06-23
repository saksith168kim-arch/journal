import { Link } from 'react-router-dom'

const C = {
  bg: '#050B14', primary: '#32E6D5', secondary: '#0EA5E9',
  muted: '#94A3B8', border: 'rgba(255,255,255,0.08)', card: 'rgba(255,255,255,0.03)',
}

export default function PrivacyPage() {
  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: '#fff', fontFamily: 'Inter,system-ui,sans-serif' }}>
      <nav style={{ borderBottom: `1px solid ${C.border}`, padding: '16px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 17 }}>← AI Trading Journal</Link>
        <span style={{ fontSize: 12, color: C.muted }}>Last updated: June 23, 2026</span>
      </nav>
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '60px 28px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: C.primary, marginBottom: 14 }}>Legal</div>
        <h1 style={{ fontSize: 48, fontWeight: 800, letterSpacing: -1, marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ color: C.muted, marginBottom: 48 }}>Effective date: June 23, 2026</p>
        {[
          { h: 'Introduction', p: 'TradeLog Terminal is committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our Service.' },
          { h: 'Information we collect', p: 'We collect account information (name, email, profile photo via Google OAuth or email registration), trade data you input, usage data to improve the Service, and device data (browser type, IP address) for security purposes.' },
          { h: 'How we use your information', p: 'To provide and maintain the Service including your trading journal and analytics, authenticate your identity and manage your account, send important account notifications and service updates, improve our AI models and platform features (anonymized and aggregated only), process subscription payments, and comply with legal obligations.' },
          { h: 'Firebase & Google services', p: 'We use Firebase by Google for authentication, database storage, and file storage. Your data is stored securely in Firebase Firestore. If you sign in with Google, we receive your name, email address, and profile photo. We do not receive your Google password or payment information.' },
          { h: 'Data sharing', p: 'We do not sell, trade, or rent your personal information to third parties. We may share data only with service providers necessary to operate the Service (Firebase, payment processors), when required by law or court order, or in the event of a merger or acquisition with prior notice to users.' },
          { h: 'Data retention', p: 'We retain your account and trade data for as long as your account is active. If you delete your account, we will delete your personal data within 30 days, except where retention is required by law.' },
          { h: 'Your rights', p: 'You may access, correct, or delete your personal data at any time. You may also request a portable export of your trade data in a standard format. To make any data request, contact us at privacy@tradelog.app.' },
          { h: 'Security', p: 'We implement industry-standard security measures including encrypted data transmission (HTTPS), Firebase security rules, and authentication controls. However, no method of transmission over the internet is 100% secure.' },
          { h: 'Cookies', p: 'We use essential cookies and local storage to maintain your session and preferences such as language selection. We do not use advertising or tracking cookies.' },
          { h: 'Children\'s privacy', p: 'The Service is not directed at children under the age of 13. We do not knowingly collect personal information from children. If we become aware that a child has provided us with personal information, we will delete it immediately.' },
          { h: 'Changes to this policy', p: 'We may update this Privacy Policy periodically. We will notify you of significant changes via email or an in-app notification. Your continued use of the Service after changes constitutes acceptance of the updated policy.' },
          { h: 'Contact', p: 'For privacy-related questions or data requests, contact us at: privacy@tradelog.app' },
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