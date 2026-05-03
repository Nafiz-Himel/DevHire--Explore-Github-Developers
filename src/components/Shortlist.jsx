import React, { useState, useEffect } from 'react'
import './Dashboard.css'
import './Shortlist.css'

function Shortlist({ onSignOut, onNavigate }) {
  const [collapsed, setCollapsed] = useState(false)
  const [shortlistedDevs, setShortlistedDevs] = useState([])
  const [shortlistedRepos, setShortlistedRepos] = useState([])
  const [activeTab, setActiveTab] = useState('developers')
  const [filterRole, setFilterRole] = useState('All')
  const [uniqueRoles, setUniqueRoles] = useState([])
  const [expandedContacts, setExpandedContacts] = useState({})

  useEffect(() => {
    const devData = JSON.parse(localStorage.getItem('devShortlist') || '[]')
    setShortlistedDevs(devData)
    const repoData = JSON.parse(localStorage.getItem('shortlistedRepos') || '[]')
    setShortlistedRepos(repoData)

    const roles = new Set()
    devData.forEach(dev => {
      if (dev.role) roles.add(dev.role)
    })
    setUniqueRoles(['All', ...Array.from(roles)])
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

  const toggleContact = (devId) => {
    setExpandedContacts(prev => ({ ...prev, [devId]: !prev[devId] }))
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

          {activeTab === 'developers' && (
            <div className="filter-container">
              <span className="filter-label">Filter by Profession:</span>
              <select
                className="filter-select"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                {uniqueRoles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
          )}

          {activeTab === 'repos' && (
            <div className="filter-container">
              <span className="filter-label">Filter by Profession:</span>
              <select
                className="filter-select"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                {uniqueRoles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
          )}

          <div className="shortlist-content">
            {activeTab === 'developers' && (
              shortlistedDevs.length > 0 ? (
                <div className="shortlist-grid">
                  {shortlistedDevs
                    .filter(dev => {
                      if (filterRole === 'All') return true;
                      return dev.role === filterRole;
                    })
                    .map((dev) => (
                    <div key={dev.id} className="shortlist-card">
                      <img src={dev.avatar_url} alt={dev.login} className="card-avatar" />
                      <div className="card-details">
                        <span className="card-username">{dev.name || dev.login}</span>
                        <a href={dev.html_url} target="_blank" rel="noopener noreferrer" className="card-link">
                          @{dev.login}
                        </a>
                        {dev.role && <span className="role-tag">{dev.role}</span>}
                        {dev.message && <p className="dev-message">{dev.message}</p>}
                        {dev.frontendFeatures && dev.frontendFeatures.length > 0 && (
                          <div className="feature-tags-container">
                            {dev.frontendFeatures.map(skill => (
                              <span key={skill} className="feature-tag">{skill}</span>
                            ))}
                          </div>
                        )}

                        <button
                          onClick={() => toggleContact(dev.id)}
                          className="contact-toggle"
                        >
                          {expandedContacts[dev.id] ? 'Hide Contact ▲' : '📞 Contact ▼'}
                        </button>

                        {expandedContacts[dev.id] && (
                          <div className="contact-info">
                            {dev.email && (
                              <a href={`mailto:${dev.email}`} className="contact-item">📧 {dev.email}</a>
                            )}
                            {dev.blog && (
                              <a href={dev.blog.startsWith('http') ? dev.blog : `https://${dev.blog}`}
                                 target="_blank" rel="noopener noreferrer" className="contact-item">
                                🌐 {dev.blog}
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        className="remove-btn"
                        onClick={() => handleRemoveDev(dev.id)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>No shortlisted developers yet. Go to Developers page to add candidates.</p>
                  <button
                    onClick={() => onNavigate('developers')}
                    className="empty-state-btn"
                  >
                    Find Developers
                  </button>
                </div>
              )
            )}

            {activeTab === 'repos' && (
              shortlistedRepos.length > 0 ? (
                <div className="shortlisted-repos-list">
                  {shortlistedRepos
                    .filter(repo => {
                      if (filterRole === 'All') return true;
                      const devShortlist = JSON.parse(localStorage.getItem('devShortlist') || '[]');
                      const owner = devShortlist.find(dev => dev.login === repo.ownerLogin);
                      return owner && owner.role === filterRole;
                    })
                    .map((repo) => (
                    <div key={repo.id} className="shortlisted-repo-card">
                      <div className="shortlisted-repo-owner">
                        <img src={repo.ownerAvatar} alt={repo.ownerLogin} className="repo-owner-avatar" />
                        <span className="repo-owner-name">{repo.ownerLogin}</span>
                      </div>
                      <div className="shortlisted-repo-info">
                        <div className="repo-name-wrapper">
                          <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="shortlisted-repo-name">
                            {repo.name}
                          </a>
                          {repo.label && <span className="repo-label-tag">{repo.label}</span>}
                        </div>
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
                        className="remove-btn"
                        onClick={() => handleRemoveRepo(repo.id)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>No shortlisted repositories yet. View a developer's profile and shortlist their repos.</p>
                  <button
                    onClick={() => onNavigate('developers')}
                    className="empty-state-btn"
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
