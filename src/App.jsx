// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import AuthPage from './pages/AuthPage'
import JournalPage from './pages/JournalPage'
import TradePage from './pages/TradePage'
import AnalyticsPage from './pages/AnalyticsPage'
import ToolsPage from './pages/ToolsPage'
import DisciplinePage from './pages/DisciplinePage'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()

  // Still checking Firebase session — show nothing (AuthProvider already shows nothing while loading)
  if (loading) return null

  // Session confirmed empty → redirect to login
  return user ? children : <Navigate to="/auth" replace />
}

function AuthRoute({ children }) {
  const { user, loading } = useAuth()

  // Wait for Firebase before deciding to redirect away from /auth
  if (loading) return null

  // Already logged in → go straight to app
  return user ? <Navigate to="/" replace /> : children
}

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthRoute><AuthPage /></AuthRoute>} />
      <Route path="/" element={<PrivateRoute><JournalPage /></PrivateRoute>} />
      <Route path="/new" element={<PrivateRoute><TradePage /></PrivateRoute>} />
      <Route path="/edit/:id" element={<PrivateRoute><TradePage /></PrivateRoute>} />
      <Route path="/analytics" element={<PrivateRoute><AnalyticsPage /></PrivateRoute>} />
      <Route path="/tools" element={<PrivateRoute><ToolsPage /></PrivateRoute>} />
      <Route path="/discipline" element={<PrivateRoute><DisciplinePage /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
