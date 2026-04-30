import React, { useState, useEffect } from 'react'
import './Dashboard.css'

function Shortlist({ onSignOut, onNavigate }) {
  const [collapsed, setCollapsed] = useState(false)
  const [shortlistedDevs, setShortlistedDevs] = useState([])

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('devShortlist') || '[]')
    setShortlistedDevs(data)
  }, [])

  const handleRemove = (id) => {
    const updatedList = shortlistedDevs.filter(dev => dev.id !== id)
    setShortlistedDevs(updatedList)
    localStorage.setItem('devShortlist', JSON.stringify(updatedList))
  }

  return (
    <div className={`dashboard-shell ${collapsed ? 'collapsed' : ''}`}>
      <div className={`side ${collapsed ? 'collapsed' : ''}`}>
        <div className="side-logo">
          <div className="logo-mark">DH</div>
          <div className="logo-copy">DevHire</div>
        </div>

        <div className="side-nav">
          <button type="button" className="nav-link" onClick={() => onNavigate('dashboard')}>
            <span className="nav-icon">🏠</span>
            <span className="nav-label">Dashboard</span>
          </button>
          <button type="button" className="nav-link" onClick={() => onNavigate('developers')}>
            <span className="nav-icon">💻</span>
            <span className="nav-label">Developers</span>
          </button>
          <button type="button" className="nav-link active">
            <span className="nav-icon">⭐</span>
            <span className="nav-label">Shortlist</span>
          </button>
        </div>

        <div className="side-footer">
          <button
            type="button"
            className="footer-button"
            onClick={() => setCollapsed((value) => !value)}
          >
            <span className="nav-icon">↔</span>
            <span className="footer-label">Collapse</span>
          </button>
          <button type="button" className="footer-button logout" onClick={onSignOut}>
            <span className="nav-icon">🔓</span>
            <span className="footer-label">Logout</span>
          </button>
        </div>
      </div>

      <div className="dashboard">
        <div className="dashboard-nav">
          <div className="dashboard-title">Shortlist</div>
          <div className="dashboard-logo">DH</div>
        </div>

        <div className="dashboard-main">
          <div className="dashboard-heading">
            <h1>Shortlist</h1>
            <p>Your shortlisted developers and candidates.</p>
          </div>

          <div className="shortlist-content">
            {shortlistedDevs.length > 0 ? (
              <div className="popular-developers-grid">
                {shortlistedDevs.map((dev) => (
                  <div key={dev.id} className="popular-developer-card">
                    <img src={dev.avatar_url} alt={dev.login} className="popular-avatar" />
                    <div className="popular-details">
                      <span className="popular-username">{dev.name || dev.login}</span>
                      <a href={dev.html_url} target="_blank" rel="noopener noreferrer" className="popular-link">
                        @{dev.login}
                      </a>
                    </div>
                    <button 
                      type="button" 
                      className="popular-button" 
                      onClick={() => handleRemove(dev.id)}
                      style={{ color: '#dc2626', borderColor: '#fecaca' }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                <p>No shortlisted developers yet. Go to Developers page to add candidates to your shortlist.</p>
                <button 
                  onClick={() => onNavigate('developers')}
                  style={{ marginTop: '15px', padding: '10px 20px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Find Developers
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Shortlist