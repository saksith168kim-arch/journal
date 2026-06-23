// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

import HomePage from './pages/HomePage'
import AuthPage from './pages/AuthPage'
import JournalPage from './pages/JournalPage'
import TradePage from './pages/TradePage'
import AnalyticsPage from './pages/AnalyticsPage'
import ToolsPage from './pages/ToolsPage'
import DisciplinePage from './pages/DisciplinePage'
import AdminPage from './pages/AdminPage'
import SettingsPage from './pages/SettingsPage'
import UpgradePage from './pages/UpgradePage'
import SupportPage from './pages/SupportPage'
import TermsPage from './pages/TermsPage'
import PrivacyPage from './pages/PrivacyPage'

// ── Guards ────────────────────────────────────────────────────────────────────

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? children : <Navigate to="/login" replace />
}

function AuthRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/dashboard" replace /> : children
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<HomePage />} />
<Route path="/terms"   element={<TermsPage />} />    {/* ← add */}
<Route path="/privacy" element={<PrivacyPage />} />  {/* ← add */}
      {/* Auth — only for logged-out users */}
      <Route path="/login"    element={<AuthRoute><AuthPage /></AuthRoute>} />
      <Route path="/register" element={<AuthRoute><AuthPage /></AuthRoute>} />
      <Route path="/auth"     element={<AuthRoute><AuthPage /></AuthRoute>} />

      {/* Private — only for logged-in users */}
      <Route path="/dashboard"  element={<PrivateRoute><JournalPage /></PrivateRoute>} />
      <Route path="/journal"    element={<PrivateRoute><JournalPage /></PrivateRoute>} />
      <Route path="/new"        element={<PrivateRoute><TradePage /></PrivateRoute>} />
      <Route path="/edit/:id"   element={<PrivateRoute><TradePage /></PrivateRoute>} />
      <Route path="/analytics"  element={<PrivateRoute><AnalyticsPage /></PrivateRoute>} />
      <Route path="/tools"      element={<PrivateRoute><ToolsPage /></PrivateRoute>} />
      <Route path="/discipline" element={<PrivateRoute><DisciplinePage /></PrivateRoute>} />
      <Route path="/admin"      element={<PrivateRoute><AdminPage /></PrivateRoute>} />
      <Route path="/settings"   element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
      <Route path="/upgrade"    element={<PrivateRoute><UpgradePage /></PrivateRoute>} />
      <Route path="/support"    element={<PrivateRoute><SupportPage /></PrivateRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}