import { useState } from 'react'
import { LogoMark } from './LogoMark'

export function AuthGate({ onLogin, onRegister, onContinueGuest }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  const emailIsValid = /\S+@\S+\.\S+/.test(form.email)
  const passwordIsValid = form.password.length >= 6
  const nameIsValid = mode === 'login' ? true : form.name.trim().length >= 2

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    try {
      setSubmitting(true)
      setMessage('')

      if (mode === 'login') {
        await onLogin({
          email: form.email,
          password: form.password,
        })
      } else {
        await onRegister(form)
      }
    } catch (error) {
      setMessage(error.message || 'Unable to continue.')
    } finally {
      setSubmitting(false)
    }
  }

  const validationMessage =
    mode === 'register' && !nameIsValid && form.name
      ? 'Enter at least 2 characters for your name.'
      : form.email && !emailIsValid
        ? 'Enter a valid email address.'
        : form.password && !passwordIsValid
          ? 'Password must be at least 6 characters.'
          : ''

  return (
    <div className="auth-shell">
      <section className="auth-hero">
        <LogoMark />
        <p className="auth-tagline">Smart planning for loans, cover, and wealth growth.</p>
        <h1>Personal finance planning with account-based persistence.</h1>
        <p className="auth-copy">
          Build loan plans, insurance estimates, and SIP strategies with a clean
          financial workspace. Sign in to keep everything saved, or continue as a guest.
        </p>
        <div className="auth-highlight-row">
          <div className="auth-highlight">
            <strong>Privacy-first storage</strong>
            <span>Your account data stays tied to you, with clear separation from guest usage.</span>
          </div>
          <div className="auth-highlight">
            <strong>Protected sessions</strong>
            <span>Secure sign-in keeps your saved plans available when you return.</span>
          </div>
          <div className="auth-highlight">
            <strong>Local guest workspace</strong>
            <span>Explore instantly without an account, then sign in whenever you want persistence.</span>
          </div>
        </div>
        <div className="trust-panel">
          <div className="trust-panel-copy">
            <strong>Designed for trust</strong>
            <p>
              FinVista keeps account sessions protected, separates guest data from saved
              user records, and gives you a cleaner workspace for sensitive financial planning.
            </p>
          </div>
          <div className="trust-panel-stats">
            <div>
              <span>Account mode</span>
              <strong>Persistent plans</strong>
            </div>
            <div>
              <span>Guest mode</span>
              <strong>Device-only workspace</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="auth-card">
        <div className="auth-toggle">
          <button
            type="button"
            className={`nav-button ${mode === 'login' ? 'active' : ''}`}
            onClick={() => setMode('login')}
          >
            Login
          </button>
          <button
            type="button"
            className={`nav-button ${mode === 'register' ? 'active' : ''}`}
            onClick={() => setMode('register')}
          >
            Create account
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {message ? (
            <p className="auth-message auth-message-error" role="alert" aria-live="assertive">
              {message}
            </p>
          ) : null}

          {mode === 'register' ? (
            <label className="field">
              <span>Full name</span>
              <div className={`input-shell ${form.name ? (nameIsValid ? 'is-valid' : 'is-invalid') : ''}`}>
                <input
                  required
                  aria-invalid={form.name ? !nameIsValid : undefined}
                  aria-describedby="name-help"
                  value={form.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  placeholder="Poonam Sharma"
                />
                <span className="input-status" aria-hidden="true">
                  {nameIsValid && form.name ? 'OK' : form.name ? '!' : ''}
                </span>
              </div>
              <small id="name-help">
                {form.name && !nameIsValid
                  ? 'Enter at least 2 characters.'
                  : 'Use your real name for your saved workspace.'}
              </small>
            </label>
          ) : null}

          <label className="field">
            <span>Email</span>
            <div className={`input-shell ${form.email ? (emailIsValid ? 'is-valid' : 'is-invalid') : ''}`}>
              <input
                required
                type="email"
                aria-invalid={form.email ? !emailIsValid : undefined}
                aria-describedby="email-help"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                placeholder="you@example.com"
              />
              <span className="input-status" aria-hidden="true">
                {emailIsValid && form.email ? 'OK' : form.email ? '!' : ''}
              </span>
            </div>
            <small id="email-help">
              {form.email && !emailIsValid
                ? 'Enter a valid email address.'
                : 'We use this for secure access to your saved plans.'}
            </small>
          </label>

          <label className="field">
            <span>Password</span>
            <div className={`input-shell ${form.password ? (passwordIsValid ? 'is-valid' : 'is-invalid') : ''}`}>
              <input
                required
                type="password"
                minLength="6"
                aria-invalid={form.password ? !passwordIsValid : undefined}
                aria-describedby="password-help"
                value={form.password}
                onChange={(event) => updateField('password', event.target.value)}
                placeholder="Minimum 6 characters"
              />
              <span className="input-status" aria-hidden="true">
                {passwordIsValid && form.password ? 'OK' : form.password ? '!' : ''}
              </span>
            </div>
            <small id="password-help">
              {form.password && !passwordIsValid
                ? 'Password must be at least 6 characters.'
                : 'Choose a secure password with 6 or more characters.'}
            </small>
          </label>

          {validationMessage ? (
            <p className="validation-banner" role="status" aria-live="polite">
              {validationMessage}
            </p>
          ) : null}

          <div className="cta-row">
            <button className="primary-button" type="submit" disabled={submitting}>
              {submitting
                ? 'Please wait...'
                : mode === 'login'
                  ? 'Welcome back to FinVista'
                  : 'Create your FinVista account'}
            </button>
            <button className="guest-button" type="button" onClick={onContinueGuest}>
              Continue in guest mode
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
