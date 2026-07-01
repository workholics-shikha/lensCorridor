import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'

import AdminPanel from './components/AdminPanel'
import Login from './components/Login'
import { buildApiUrl } from './lib/api'

const protectedAdminPaths = [
  '/dashboard',
  '/masters/lens-category',
  '/masters/lens-category/edit/:masterId',
  '/masters/eyepower',
  '/masters/frame-shapes',
  '/masters/power-type',
  '/stores',
  '/stores/new',
  '/stores/edit/:storeId',
  '/employees',
  '/employees/create',
  '/employees/edit/:employeeId',
  '/customers',
  '/orders',
  '/orders/:orderId',
  '/payments',
  '/returns',
  '/reports',
]

const ProtectedRoute = ({ authChecking, isLoggedIn, children }) => {
  if (authChecking) {
    return null
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  return children
}

const AppRoutes = () => {
  const navigate = useNavigate()
  const adminBaseUrl = buildApiUrl('')
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(localStorage.getItem('adminToken')))
  const [authChecking, setAuthChecking] = useState(() => Boolean(localStorage.getItem('adminToken')))
  const [adminUser, setAdminUser] = useState(() => {
    const storedUser = localStorage.getItem('adminUser')
    return storedUser ? JSON.parse(storedUser) : null
  })

  const clearAuthSession = ({ notice = '' } = {}) => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
    if (notice) {
      sessionStorage.setItem('adminAuthNotice', notice)
    } else {
      sessionStorage.removeItem('adminAuthNotice')
    }
    setIsLoggedIn(false)
    setAdminUser(null)
  }

  useEffect(() => {
    const token = localStorage.getItem('adminToken')

    if (!token) {
      setAuthChecking(false)
      return
    }

    const controller = new AbortController()

    const validateSession = async () => {
      try {
        const response = await fetch(`${adminBaseUrl}/admin/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        })

        const data = await response.json().catch(() => ({}))

        if (!response.ok) {
          clearAuthSession({
            notice: data?.error === 'Invalid token.'
              ? 'Your session expired. Please sign in again.'
              : (data?.error || 'Please sign in again.'),
          })
          return
        }

        setIsLoggedIn(true)
        setAdminUser(data || null)
        if (data) {
          localStorage.setItem('adminUser', JSON.stringify(data))
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          return
        }
      } finally {
        setAuthChecking(false)
      }
    }

    validateSession()

    return () => controller.abort()
  }, [adminBaseUrl])

  const handleLogin = (user) => {
    sessionStorage.removeItem('adminAuthNotice')
    setIsLoggedIn(true)
    setAdminUser(user)
    setAuthChecking(false)
    localStorage.setItem('adminUser', JSON.stringify(user))
    navigate('/dashboard', { replace: true })
  }

  const handleLogout = () => {
    clearAuthSession()
    setAuthChecking(false)
    navigate('/login', { replace: true })
  }

  const protectedAdminPanel = (
    <ProtectedRoute authChecking={authChecking} isLoggedIn={isLoggedIn}>
      <AdminPanel onLogout={handleLogout} user={adminUser} />
    </ProtectedRoute>
  )

  return (
    <Routes>
      <Route
        path="/login"
        element={authChecking ? null : (isLoggedIn ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />)}
      />

      <Route
        path="/"
        element={authChecking ? null : <Navigate to={isLoggedIn ? '/dashboard' : '/login'} replace />}
      />

      {protectedAdminPaths.map((path) => (
        <Route key={path} path={path} element={protectedAdminPanel} />
      ))}

      <Route
        path="*"
        element={authChecking ? null : <Navigate to={isLoggedIn ? '/dashboard' : '/login'} replace />}
      />
    </Routes>
  )
}

const App = () => (
  <BrowserRouter
    future={{
      v7_relativeSplatPath: true,
      v7_startTransition: true,
    }}
  >
    <AppRoutes />
  </BrowserRouter>
)

export default App
