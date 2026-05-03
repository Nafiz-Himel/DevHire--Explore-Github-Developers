import React, { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import './Dashboard.css'
import './Shortlist.css'

function Shortlist({ onSignOut, onNavigate }) {
  const [shortlistedDevs, setShortlistedDevs] = useState([])
  const [shortlistedRepos, setShortlistedRepos] = useState([])
  const [activeTab, setActiveTab] = useState('developers')
  const [filterRole, setFilterRole] = useState('All')
  const [uniqueRoles, setUniqueRoles] = useState([])
  const [contactModalDev, setContactModalDev] = useState(null)
  const [selectedDevs, setSelectedDevs] = useState([])
  const [selectedRepos, setSelectedRepos] = useState([])
  const [emailModal, setEmailModal] = useState(null)

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

  const openContactModal = (dev) => {
    setContactModalDev(dev)
  }

  const toggleSelectDev = (id) => {
    setSelectedDevs(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const toggleSelectRepo = (id) => {
    setSelectedRepos(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const selectAllVisible = () => {
    if (activeTab === 'developers') {
      const filtered = shortlistedDevs.filter(dev =>
        filterRole === 'All' ? true : dev.role === filterRole
      )
      const ids = filtered.map(d => d.id)
      setSelectedDevs(prev => prev.length === ids.length ? [] : ids)
    } else {
      const devShortlist = JSON.parse(localStorage.getItem('devShortlist') || '[]')
      const filtered = shortlistedRepos.filter(repo => {
        if (filterRole === 'All') return true
        const owner = devShortlist.find(d => d.login === repo.ownerLogin)
        return owner && owner.role === filterRole
      })
      const ids = filtered.map(r => r.id)
      setSelectedRepos(prev => prev.length === ids.length ? [] : ids)
    }
  }

  const openEmailModal = () => {
    const devShortlist = JSON.parse(localStorage.getItem('devShortlist') || '[]')
    const recipients = []

    shortlistedDevs
      .filter(d => selectedDevs.includes(d.id) && d.email)
      .forEach(d => {
        if (!recipients.find(r => r.email === d.email)) {
          recipients.push({ email: d.email, name: d.name || d.login })
        }
      })

    shortlistedRepos
      .filter(r => selectedRepos.includes(r.id))
      .forEach(r => {
        const owner = devShortlist.find(d => d.login === r.ownerLogin)
        if (owner && owner.email && !recipients.find(rec => rec.email === owner.email)) {
          recipients.push({ email: owner.email, name: owner.name || owner.login })
        }
      })

    if (recipients.length > 0) {
      setEmailModal({ recipients, subject: '', message: '' })
    }
  }

  const sendBulkEmail = () => {
    if (!emailModal || emailModal.recipients.length === 0) return
    const bcc = emailModal.recipients.map(r => r.email).join(',')
    const subject = encodeURIComponent(emailModal.subject)
    const body = encodeURIComponent(emailModal.message)
    window.location.href = `mailto:?bcc=${bcc}&subject=${subject}&body=${body}`
  }

  return (
    <Sidebar currentPage="shortlist" onNavigate={onNavigate} onSignOut={onSignOut}>
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

          <div className="bulk-actions-bar">
            <button className="select-all-btn" onClick={selectAllVisible}>
              {(activeTab === 'developers' ? selectedDevs : selectedRepos).length > 0
                ? 'Deselect All' : 'Select All'}
            </button>
            {(selectedDevs.length > 0 || selectedRepos.length > 0) && (
              <>
                <span className="selected-count">
                  {activeTab === 'developers' ? selectedDevs.length : selectedRepos.length} selected
                </span>
                <button className="email-selected-btn" onClick={openEmailModal}>
                  Email Selected
                </button>
              </>
            )}
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
                    <div key={dev.id} className={`shortlist-card ${selectedDevs.includes(dev.id) ? 'selected' : ''}`}>
                      <label className="card-checkbox">
                        <input type="checkbox" checked={selectedDevs.includes(dev.id)} onChange={() => toggleSelectDev(dev.id)} />
                        <span className="checkmark"></span>
                      </label>
                      <img src={dev.avatar_url} alt={dev.login} className="card-avatar" />
                      <div className="card-details">
                        <span className="card-username">{dev.name || dev.login}</span>
                        <a href={dev.html_url} target="_blank" rel="noopener noreferrer" className="card-link">
                          @{dev.login}
                        </a>
                        {dev.role && <span className="role-tag">{dev.role}</span>}
                        {dev.message && <p className="dev-message">{dev.message}</p>}
                        {dev.skills && dev.skills.length > 0 && (
                          <div className="skills-tags-container">
                            {dev.skills.map(skill => (
                              <span key={skill} className="skill-tag">{skill}</span>
                            ))}
                          </div>
                        )}
                        {dev.rating && (
                          <div className="dev-rating">★ {dev.rating}/5</div>
                        )}
                      </div>
                      <div className="card-actions">
                        <button
                          onClick={() => openContactModal(dev)}
                          className="contact-toggle"
                        >
                          Contact
                        </button>
                        <button
                          type="button"
                          className="remove-btn"
                          onClick={() => handleRemoveDev(dev.id)}
                        >
                          Remove
                        </button>
                      </div>
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
                    <div key={repo.id} className={`shortlisted-repo-card ${selectedRepos.includes(repo.id) ? 'selected' : ''}`}>
                      <label className="card-checkbox">
                        <input type="checkbox" checked={selectedRepos.includes(repo.id)} onChange={() => toggleSelectRepo(repo.id)} />
                        <span className="checkmark"></span>
                      </label>
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
                      <div className="card-actions">
                        <button
                          onClick={() => {
                            const owner = JSON.parse(localStorage.getItem('devShortlist') || '[]')
                              .find(dev => dev.login === repo.ownerLogin)
                            if (owner) openContactModal(owner)
                          }}
                          className="contact-toggle"
                        >
                          Contact
                        </button>
                        <button
                          type="button"
                          className="remove-btn"
                          onClick={() => handleRemoveRepo(repo.id)}
                        >
                          Remove
                        </button>
                      </div>
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
      {contactModalDev && (
        <div className="contact-modal-overlay" onClick={() => setContactModalDev(null)}>
          <div className="contact-modal" onClick={(e) => e.stopPropagation()}>
            <div className="contact-modal-header">
              <div className="modal-dev-info">
                <img src={contactModalDev.avatar_url} alt="" className="modal-avatar" />
                <span>{contactModalDev.name || contactModalDev.login}</span>
              </div>
              <button className="contact-modal-close" onClick={() => setContactModalDev(null)}>✕</button>
            </div>
            <div className="contact-modal-body">
              {contactModalDev.blog && (
                <a href={contactModalDev.blog.startsWith('http') ? contactModalDev.blog : `https://${contactModalDev.blog}`}
                   target="_blank" rel="noopener noreferrer" className="contact-modal-item">
                  🌐 {contactModalDev.blog}
                </a>
              )}
              {contactModalDev.email && (
                <a href={`mailto:${contactModalDev.email}`} className="contact-modal-item">
                  📧 {contactModalDev.email}
                </a>
              )}
            </div>
          </div>
        </div>
      )}
      {emailModal && (
        <div className="email-modal-overlay" onClick={() => setEmailModal(null)}>
          <div className="email-modal" onClick={e => e.stopPropagation()}>
            <div className="email-modal-header">
              <h3>Compose Email</h3>
              <button className="email-modal-close" onClick={() => setEmailModal(null)}>✕</button>
            </div>
            <div className="email-modal-body">
              <div className="email-recipients">
                <span className="recipients-label">Recipients ({emailModal.recipients.length}):</span>
                <div className="recipients-list">
                  {emailModal.recipients.map(r => (
                    <span key={r.email} className="recipient-chip">
                      {r.name} &lt;{r.email}&gt;
                      <button className="remove-recipient" onClick={() =>
                        setEmailModal(prev => ({ ...prev, recipients: prev.recipients.filter(rec => rec.email !== r.email) }))
                      }>✕</button>
                    </span>
                  ))}
                </div>
              </div>
              <input
                className="email-subject"
                placeholder="Subject"
                value={emailModal.subject}
                onChange={e => setEmailModal(prev => ({ ...prev, subject: e.target.value }))}
              />
              <textarea
                className="email-message"
                placeholder="Write your message..."
                rows={5}
                value={emailModal.message}
                onChange={e => setEmailModal(prev => ({ ...prev, message: e.target.value }))}
              />
            </div>
            <div className="email-modal-actions">
              <button className="cancel-email-btn" onClick={() => setEmailModal(null)}>Cancel</button>
              <button className="send-email-btn" onClick={sendBulkEmail}>Send via Email Client</button>
            </div>
          </div>
        </div>
      )}
    </Sidebar>
  )
}

export default Shortlist
