'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogoIcon } from '@/components/Icons'

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '', fullName: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignup(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) {
        router.push('/login?registered=1')
      } else {
        setError(data.error || 'Signup failed')
      }
    } catch (err) {
      setError('Connection error')
    }
    setLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Branding */}
        <div className="flex-center" style={{ marginBottom: 28 }}>
          <div style={{
            width: 48, height: 48,
            background: 'var(--accent)',
            borderRadius: 'var(--radius-md)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <LogoIcon width={24} height={24} stroke="#fff" />
          </div>
        </div>
        <h1 style={{ textAlign: 'center', fontSize: 22, marginBottom: 4 }}>Create Account</h1>
        <p style={{ textAlign: 'center', marginBottom: 24, fontSize: 13 }}>
          Get started with AgencyOS
        </p>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSignup}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              value={form.fullName}
              onChange={e => setForm(f => ({...f, fullName: e.target.value}))}
              placeholder="Ayan Shaikh"
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({...f, email: e.target.value}))}
              placeholder="you@agency.com"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <div className="password-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(f => ({...f, password: e.target.value}))}
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
          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-link">
          Already have an account? <Link href="/login">Sign in</Link>
        </div>
      </div>
    </div>
  )
}
