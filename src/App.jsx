// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import AuthPage from './pages/AuthPage'
import JournalPage from './pages/JournalPage'
import TradePage from './pages/TradePage'
import AnalyticsPage from './pages/AnalyticsPage'

function PrivateRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/auth" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/" element={<PrivateRoute><JournalPage /></PrivateRoute>} />
      <Route path="/new" element={<PrivateRoute><TradePage /></PrivateRoute>} />
      <Route path="/edit/:id" element={<PrivateRoute><TradePage /></PrivateRoute>} />
      <Route path="/analytics" element={<PrivateRoute><AnalyticsPage /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
