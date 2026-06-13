'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogoIcon, UserIcon } from '@/components/Icons'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (data.success) {
        router.push('/admin/dashboard')
      } else {
        setError(data.error || 'Invalid email or password. Please try again.')
      }
    } catch (err) {
      setError('Unable to connect to the server. Check your connection.')
    }
    setLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ animation: 'modalIn 0.2s ease-out' }}>
        {/* Branding */}
        <div className="flex-center" style={{ marginBottom: 24 }}>
          <div style={{
            width: 56, height: 56,
            background: 'linear-gradient(135deg, var(--accent) 0%, var(--primary) 100%)',
            borderRadius: 'var(--radius-md)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px var(--accent-glow)',
          }}>
            <LogoIcon width={28} height={28} stroke="#fff" />
          </div>
        </div>
        <h1 style={{ textAlign: 'center', fontSize: 24, marginBottom: 4, fontWeight: 600 }}>
          AgencyOS
        </h1>
        <p style={{ textAlign: 'center', marginBottom: 28, fontSize: 13, lineHeight: 1.5 }}>
          Sign in to your agency control center
        </p>

        {error && (
          <div className="error-msg" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="10" cy="10" r="8" />
              <path d="M10 6v4" />
              <path d="M10 13.5v.01" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@agency.com"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <div className="password-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 10s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5Z" />
                    <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8.43 4.22A8.28 8.28 0 0 1 10 4c5 0 8 5 8 5a1.57 1.57 0 0 1-.38.5" />
                    <path d="M3 3l14 14" />
                    <path d="M6.61 6.61a3.5 3.5 0 0 0 4.79 4.78" />
                    <path d="M2 10s.9-1.77 2.5-3.17" />
                    <path d="M15.49 12.57A7.5 7.5 0 0 0 18 10s-3-5-8-5a7.68 7.68 0 0 0-1.49.14" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex-between" style={{ marginBottom: 20 }}>
            <div className="checkbox-row" style={{ margin: 0 }}>
              <input
                type="checkbox"
                id="remember"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
              />
              <label htmlFor="remember">Remember me</label>
            </div>
            <button type="button" className="forgot-link" onClick={() => alert('Password reset flow not configured yet')}>
              Forgot password?
            </button>
          </div>

          <button className="btn btn-primary btn-full" type="submit" disabled={loading}
            style={{ height: 42, fontSize: 14, fontWeight: 600 }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-link">
          Don&apos;t have an account? <a href="/signup">Create one</a>
        </div>
      </div>
    </div>
  )
}
