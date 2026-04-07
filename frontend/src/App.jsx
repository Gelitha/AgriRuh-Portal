import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Box, Button, Container, Typography } from '@mui/material'
import AppHeader from './components/AppHeader'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import RegisterPage from './pages/RegisterPage'
import StudentDashboard from './pages/StudentDashboard'
import QRScannerPage from './pages/QRScannerPage'
import SubmissionsPage from './pages/SubmissionsPage'
import GradesPage from './pages/GradesPage'
import AdminPage from './pages/AdminPage'
import './App.css'

const adminWorkspaceRoles = ['admin', 'lecturer', 'demonstrator']
const studentWorkspaceRoles = ['student', 'representative']

const getStoredRole = () => {
  try {
    const token = localStorage.getItem('access_token')
    if (!token) {
      return null
    }

    const encodedPayload = token.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(window.atob(encodedPayload))
    return payload?.role || null
  } catch (error) {
    return null
  }
}

function RequireAuth({ children }) {
  const location = useLocation()
  const token = localStorage.getItem('access_token')

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}

function RequireAdminWorkspace({ children }) {
  const role = getStoredRole()

  if (!adminWorkspaceRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function RequireStudentWorkspace({ children }) {
  const role = getStoredRole()

  if (adminWorkspaceRoles.includes(role)) {
    return <Navigate to="/admin" replace />
  }

  if (!studentWorkspaceRoles.includes(role)) {
    return <Navigate to="/" replace />
  }

  return children
}

function NotFoundPage() {
  return (
    <Box className="app-not-found">
      <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
        Page not found
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        The route you requested does not exist in this frontend.
      </Typography>
      <Button variant="contained" href="/">
        Go Home
      </Button>
    </Box>
  )
}

export default function App() {
  const location = useLocation()
  const hideShellChrome = location.pathname === '/login'

  return (
    <Box className="app-shell">
      {!hideShellChrome && <AppHeader />}
      <Box component="main" className="app-main">
        <Container maxWidth="xl" className="app-container">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <RequireStudentWorkspace>
                    <StudentDashboard />
                  </RequireStudentWorkspace>
                </RequireAuth>
              }
            />
            <Route
              path="/scanner"
              element={
                <RequireAuth>
                  <RequireStudentWorkspace>
                    <QRScannerPage />
                  </RequireStudentWorkspace>
                </RequireAuth>
              }
            />
            <Route
              path="/submissions"
              element={
                <RequireAuth>
                  <RequireStudentWorkspace>
                    <SubmissionsPage />
                  </RequireStudentWorkspace>
                </RequireAuth>
              }
            />
            <Route
              path="/grades"
              element={
                <RequireAuth>
                  <RequireStudentWorkspace>
                    <GradesPage />
                  </RequireStudentWorkspace>
                </RequireAuth>
              }
            />
            <Route
              path="/admin"
              element={
                <RequireAuth>
                  <RequireAdminWorkspace>
                    <AdminPage />
                  </RequireAdminWorkspace>
                </RequireAuth>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Container>
      </Box>
      {!hideShellChrome && (
       <Box component="footer" className="app-footer">
  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
    AgriRuh Laboratory Management System
  </Typography>

  <Typography variant="body2" sx={{ mt: 1 }}>
    Faculty of Agriculture, University of Ruhuna
  </Typography>

  <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
    Developed by Gelitha Jayawickram, 47th Batch
  </Typography>

  <Typography variant="caption" sx={{ display: 'block' }}>
    © {new Date().getFullYear()}
  </Typography>
</Box>
      )}
    </Box>
  )
}
