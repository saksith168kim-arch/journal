// src/pages/SupportPage.jsx
import Layout from '../components/layout/Layout'

export default function SupportPage() {
  return (
    <Layout openCount={0}>
      <div style={{ maxWidth: 560, margin: '60px auto', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>💬</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-pri)', marginBottom: 8 }}>
          Support
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-mut)', lineHeight: 1.6 }}>
          Need help? Reach out at{' '}
          <a href="mailto:support@tradelog.app" style={{ color: 'var(--acc-main)' }}>
            support@tradelog.app
          </a>
        </p>
      </div>
    </Layout>
  )
}
