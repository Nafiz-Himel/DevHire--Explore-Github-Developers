import React, { useState, useEffect } from 'react'
import './Dashboard.css'
import './Shorlist.css'

function Shortlist({ onSignOut, onNavigate }) {
  const [collapsed, setCollapsed] = useState(false)
  const [shortlistedDevs, setShortlistedDevs] = useState([])
  const [shortlistedRepos, setShortlistedRepos] = useState([])
  const [activeTab, setActiveTab] = useState('developers')

  useEffect(() => {
    const devData = JSON.parse(localStorage.getItem('devShortlist') || '[]')
    setShortlistedDevs(devData)
    const repoData = JSON.parse(localStorage.getItem('shortlistedRepos') || '[]')
    setShortlistedRepos(repoData)
  }, [])

  const handleRemoveDev = (id) => {
    const updatedList = shortlistedDevs.filter(dev => dev.id !== id)
    setShortlistedDevs(updatedList)
    localStorage.setItem('devShortlist', JSON.stringify(updatedList))
  }

  const handleRemoveRepo = (id) => {
    const updatedList = shortlistedRepos.filter(repo => repo.id !== id)
    setShortlistedRepos(updatedList)
    localStorage.setItem('shortlistedRepos', JSON.stringify(updatedList))
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
          <button type="button" className="footer-button" onClick={() => setCollapsed((value) => !value)}>
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
            <p>Your shortlisted developers and repositories.</p>
          </div>

          {/* Tabs */}
          <div className="shortlist-tabs">
            <button
              className={`shortlist-tab ${activeTab === 'developers' ? 'active' : ''}`}
              onClick={() => setActiveTab('developers')}
            >
              👤 Developers
              <span className="tab-count">{shortlistedDevs.length}</span>
            </button>
            <button
              className={`shortlist-tab ${activeTab === 'repos' ? 'active' : ''}`}
              onClick={() => setActiveTab('repos')}
            >
              📁 Repositories
              <span className="tab-count">{shortlistedRepos.length}</span>
            </button>
          </div>

          <div className="shortlist-content">
            {/* Developers Tab */}
            {activeTab === 'developers' && (
              shortlistedDevs.length > 0 ? (
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
                        onClick={() => handleRemoveDev(dev.id)}
                        style={{ color: '#dc2626', borderColor: '#fecaca' }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  <p>No shortlisted developers yet. Go to Developers page to add candidates.</p>
                  <button
                    onClick={() => onNavigate('developers')}
                    style={{ marginTop: '15px', padding: '10px 20px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                  >
                    Find Developers
                  </button>
                </div>
              )
            )}

            {/* Repos Tab */}
            {activeTab === 'repos' && (
              shortlistedRepos.length > 0 ? (
                <div className="shortlisted-repos-list">
                  {shortlistedRepos.map((repo) => (
                    <div key={repo.id} className="shortlisted-repo-card">
                      <div className="shortlisted-repo-owner">
                        <img src={repo.ownerAvatar} alt={repo.ownerLogin} className="repo-owner-avatar" />
                        <span className="repo-owner-name">{repo.ownerLogin}</span>
                      </div>
                      <div className="shortlisted-repo-info">
                        <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="shortlisted-repo-name">
                          {repo.name}
                        </a>
                        {repo.description && <p className="shortlisted-repo-desc">{repo.description}</p>}
                        <div className="repo-meta">
                          {repo.language && (
                            <span className="repo-lang">
                              <span className="lang-dot" />
                              {repo.language}
                            </span>
                          )}
                          <span className="repo-stat">⭐ {repo.stargazers_count}</span>
                          <span className="repo-stat">🍴 {repo.forks_count}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="popular-button"
                        onClick={() => handleRemoveRepo(repo.id)}
                        style={{ color: '#dc2626', borderColor: '#fecaca', alignSelf: 'flex-start', flexShrink: 0 }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  <p>No shortlisted repositories yet. View a developer's profile and shortlist their repos.</p>
                  <button
                    onClick={() => onNavigate('developers')}
                    style={{ marginTop: '15px', padding: '10px 20px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                  >
                    Browse Developers
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Shortlist