import React, { useState } from 'react'
import './Login.css'

function Login({ onSignIn }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.')
      return
    }
    setError('')
    if (onSignIn) onSignIn()
  }

  return (
    <div className="login-container">
      <div className="login-brand">
        <div className="brand-logo">D</div>
        <div className="brand-copy">
          <span className="brand-line">DevHire</span>
          <p className="brand-subtitle">Recruitment Platform</p>
        </div>
      </div>

      <h2>Sign in to search and shortlist GitHub developers.</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            name="email"
            placeholder="Enter your email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            name="password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        {error && <p className="login-error">{error}</p>}
        <button type="submit">Sign In</button>
      </form>

      <p className="login-footer">
        Don't have an account? <a href="#">Sign Up</a>
      </p>
      <a href="#" className="back-home">Back to Home</a>
    </div>
  )
}

export default Login