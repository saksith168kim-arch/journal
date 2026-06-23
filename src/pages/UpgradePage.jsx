// src/pages/UpgradePage.jsx
import Layout from '../components/layout/Layout'

export default function UpgradePage() {
  return (
    <Layout openCount={0}>
      <div style={{ maxWidth: 560, margin: '60px auto', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⭐</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-pri)', marginBottom: 8 }}>
          Upgrade to Pro
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-mut)', lineHeight: 1.6 }}>
          Pro features coming soon. Stay tuned for advanced analytics, unlimited trades, and more.
        </p>
      </div>
    </Layout>
  )
}
