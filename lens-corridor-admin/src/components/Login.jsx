import { useEffect, useMemo, useState } from 'react'
import { buildApiUrl } from '../lib/api'

const Login = ({ onLogin }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(() => sessionStorage.getItem('adminAuthNotice') || '')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const adminBaseUrl = useMemo(() => {
    return buildApiUrl('')
  }, [])

  useEffect(() => {
    if (error) {
      sessionStorage.removeItem('adminAuthNotice')
    }
  }, [error])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${adminBaseUrl}/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      let data = {}
      try {
        data = await res.json()
      } catch {
        // Backend may return empty body on some errors.
        data = {}
      }

      if (!res.ok) {
        throw new Error(data?.error || 'Login failed')
      }


      if (!data?.token) {
        throw new Error('Token missing from response')
      }

      // Store token for subsequent /admin/profile calls.
      localStorage.setItem('adminToken', data.token)
      localStorage.setItem('adminUser', JSON.stringify(data.user))

      // Optional: verify token immediately via profile endpoint.
      const profileRes = await fetch(`${adminBaseUrl}/admin/profile`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${data.token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!profileRes.ok) {
        const profileData = await profileRes.json().catch(() => ({}))
        throw new Error(profileData?.error || 'Failed to fetch admin profile')
      }

      // If everything is OK, notify parent.
      onLogin(data.user)
    } catch (err) {
      setError(err?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="login-shell min-h-screen grid place-items-center p-7">
      <div className="login-card max-w-4xl w-full grid grid-cols-1 gap-3 p-4 rounded-[28px]">
        <div
          className="login-copy p-6 rounded-[22px]"
          style={{
            background: 'linear-gradient(135deg, rgba(26, 111, 212, 0.12), rgba(245, 166, 35, 0.10))',
            border: '1px solid rgba(26, 111, 212, 0.12)',
          }}
        >
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl text-sm font-extrabold text-white shadow-lg bg-gradient-to-br from-blue-600 to-blue-500">
            LC
          </div>
          <p className="eyebrow uppercase tracking-wider text-xs font-bold mb-3">Optical Store Management</p>
          <h3 className="font-fraunces text-3xl font-bold leading-tight mb-3 text-[#1a1a2e]">Admin Access Portal</h3>
          <p className="mx-auto max-w-xl text-sm leading-6 text-slate-600">
            Sign in to manage masters, stores, employees, and sales operations from the same dashboard environment.
          </p>
        </div>
        <div
          className="login-panel p-5 rounded-[22px] flex flex-col justify-center"
          style={{
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(235, 243, 255, 0.84))',
            border: '1px solid rgba(26, 111, 212, 0.12)',
          }}
        >
          <p className="eyebrow uppercase tracking-wider text-xs font-bold mb-2">Sign in</p>
          <h2 className="text-2xl font-bold mb-1 text-[#1a1a2e]">Welcome back</h2>
          <p className="mb-4 text-sm text-slate-500">Use your admin or manager credentials to continue to the control center.</p>

          {error ? (
            <div className="mb-4 rounded-xl border border-[rgba(239,68,68,0.22)] bg-[rgba(239,68,68,0.08)] text-[rgba(185,28,28,1)] px-4 py-3 text-sm font-bold">
              {error}
            </div>
          ) : null}

          <form className="form-wire space-y-3 mb-4" onSubmit={handleSubmit}>
            <div className="field space-y-2">
              <label className="block text-xs font-bold text-muted uppercase tracking-wide">User ID / Email</label>
              <input
                className="input filled h-11 w-full px-4 rounded-2xl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="text"
                autoComplete="username"
                required
              />
            </div>

            <div className="field space-y-2">
              <label className="block text-xs font-bold text-muted uppercase tracking-wide">Password</label>
              <input
                className="input filled h-11 px-4 rounded-2xl"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="current-password"
                required
              />
            </div>

            <div className="login-actions space-y-2">
              <button
                type="submit"
                className="primary-btn w-full rounded-2xl py-3.5 px-4 text-white font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Entering...' : 'Enter Dashboard'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}

export default Login


