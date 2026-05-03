const fs = require('fs');

const content = `import React, { useState, useEffect } from 'react';
import './Developers.css';

const roleOptions = [
  'Frontend Developer',
  'Backend Developer',
  'Fullstack Developer',
  'DevOps Engineer',
  'Mobile Developer'
];

const frontendSkills = ['React', 'TypeScript', 'Vue.js', 'Angular', 'HTML5', 'CSS3', 'Tailwind CSS', 'Next.js'];

function Developers({ onSignOut, onNavigate }) {
  const [collapsed, setCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [profile, setProfile] = useState(null);
  const [repos, setRepos] = useState([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [notification, setNotification] = useState('');
  const [recentSearches, setRecentSearches] = useState([]);
  const [shortlistedRepos, setShortlistedRepos] = useState([]);
  const [showRepoLabelDropdown, setShowRepoLabelDropdown] = useState(false);
  const [selectedRepoLabel, setSelectedRepoLabel] = useState(null);
  const [repoToShortlist, setRepoToShortlist] = useState(null);

  const [selectedRole, setSelectedRole] = useState(null);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [roleMessage, setRoleMessage] = useState('');
  const [frontendFeatures, setFrontendFeatures] = useState([]);

  useEffect(() => {
    const savedRecent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    setRecentSearches(savedRecent);
    const savedRepos = JSON.parse(localStorage.getItem('shortlistedRepos') || '[]');
    setShortlistedRepos(savedRepos);
  }, []);

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  const updateRecentSearches = (username) => {
    const updated = [username, ...recentSearches.filter(name => name !== username)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
    showNotification('Recent searches cleared');
  };

  const handleSearch = async (targetUsername) => {
    const username = targetUsername || searchTerm.trim();
    if (!username) { setError('Please enter a GitHub username'); return; }

    setLoading(true);
    setError('');
    setProfile(null);
    setRepos([]);
    setShowDetails(false);

    try {
      const response = await fetch(\`https://api.github.com/users/\${username}\`, {
        headers: { 'Accept': 'application/vnd.github.v3+json' }
      });

      if (response.status === 404) throw new Error('User not found. Please check the spelling.');
      else if (response.status === 403) throw new Error('API limit exceeded. Try again later.');
      else if (!response.ok) throw new Error('Network error. Please try again.');

      const data = await response.json();
      setProfile(data);
      updateRecentSearches(username);

      const currentCount = parseInt(localStorage.getItem('searchCount') || '0');
      localStorage.setItem('searchCount', (currentCount + 1).toString());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRepos = async (username) => {
    setReposLoading(true);
    try {
      const response = await fetch(
        \`https://api.github.com/users/\${username}/repos?sort=updated&per_page=30\`,
        { headers: { 'Accept': 'application/vnd.github.v3+json' } }
      );
      if (!response.ok) throw new Error('Failed to fetch repos');
      const data = await response.json();
      setRepos(data);
    } catch (err) {
      showNotification('Could not load repositories.');
    } finally {
      setReposLoading(false);
    }
  };

  const handleViewDetails = () => {
    setShowDetails(true);
    fetchRepos(profile.login);
  };

  const toggleRoleDropdown = () => {
    if (showRoleDropdown) {
      setSelectedRole(null);
      setRoleMessage('');
      setFrontendFeatures([]);
    }
    setShowRoleDropdown(v => !v);
  };

  const selectRole = (role) => {
    setSelectedRole(role);
    if (role !== 'Frontend Developer') setFrontendFeatures([]);
  };

  const toggleFrontendFeature = (skill) => {
    setFrontendFeatures(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const addToShortlist = () => {
    const savedShortlist = JSON.parse(localStorage.getItem('devShortlist') || '[]');
    const isAlreadyAdded = savedShortlist.some(item => item.id === profile.id);
    if (!isAlreadyAdded) {
      const devToAdd = {
        ...profile,
        role: selectedRole,
        message: roleMessage,
        frontendFeatures: selectedRole === 'Frontend Developer' ? frontendFeatures : []
      };
      localStorage.setItem('devShortlist', JSON.stringify([...savedShortlist, devToAdd]));
      showNotification(\`\${profile.name || profile.login} added to shortlist!\`);
      setSelectedRole(null);
      setRoleMessage('');
      setFrontendFeatures([]);
      setShowRoleDropdown(false);
    } else {
      showNotification('Already in shortlist.');
    }
  };

  const toggleRepoShortlist = (repo) => {
    const current = JSON.parse(localStorage.getItem('shortlistedRepos') || '[]');
    const isAdded = current.some(r => r.id === repo.id);
    if (isAdded) {
      const updated = current.filter(r => r.id !== repo.id);
      localStorage.setItem('shortlistedRepos', JSON.stringify(updated));
      setShortlistedRepos(updated);
      showNotification(\`"\${repo.name}" removed from repo shortlist.\`);
    } else {
      setRepoToShortlist(repo);
      setShowRepoLabelDropdown(true);
    }
  };

  const confirmRepoShortlist = () => {
    const current = JSON.parse(localStorage.getItem('shortlistedRepos') || '[]');
    const updated = [...current, {
      ...repoToShortlist,
      ownerLogin: profile.login,
      ownerAvatar: profile.avatar_url,
      label: selectedRepoLabel
    }];
    localStorage.setItem('shortlistedRepos', JSON.stringify(updated));
    setShortlistedRepos(updated);
    showNotification(\`"\${repoToShortlist.name}" added to repo shortlist!\`);
    setRepoToShortlist(null);
    setSelectedRepoLabel(null);
    setShowRepoLabelDropdown(false);
  };

  const cancelRepoShortlist = () => {
    setRepoToShortlist(null);
    setSelectedRepoLabel(null);
    setShowRepoLabelDropdown(false);
  };

  const isRepoShortlisted = (repoId) => shortlistedRepos.some(r => r.id === repoId);

  const handleSubmit = (event) => {
    event.preventDefault();
    handleSearch();
  };

  return (
    <div className={\`dashboard-shell \${collapsed ? 'collapsed' : ''}\`}>
      {notification && <div className="custom-toast">{notification}</div>}

      <div className={\`side \${collapsed ? 'collapsed' : ''}\`}>
        <div className="side-logo">
          <div className="logo-mark">DH</div>
          <div className="logo-copy">DevHire</div>
        </div>
        <div className="side-nav">
          <button type="button" className="nav-link" onClick={() => onNavigate('dashboard')}>
            <span className="nav-icon">🏠</span>
            <span className="nav-label">Dashboard</span>
          </button>
          <button type="button" className="nav-link active">
            <span className="nav-icon">💻</span>
            <span className="nav-label">Developers</span>
          </button>
          <button type="button" className="nav-link" onClick={() => onNavigate('shortlist')}>
            <span className="nav-icon">⭐</span>
            <span className="nav-label">Shortlist</span>
          </button>
        </div>
        <div className="side-footer">
          <button type="button" className="footer-button" onClick={() => setCollapsed((v) => !v)}>
            <span className="nav-icon">↔</span>
            <span className="nav-label">Collapse</span>
          </button>
          <button type="button" className="footer-button logout" onClick={onSignOut}>
            <span className="nav-icon">🔓</span>
            <span className="nav-label">Logout</span>
          </button>
        </div>
      </div>

      <div className="dashboard">
        <div className="dashboard-nav">
          <div className="dashboard-title">Developers</div>
          <div className="dashboard-logo">DH</div>
        </div>

        <div className="dashboard-main">
          {!showDetails && (
            <div className="dashboard-heading">
              <h1>Developer Search</h1>
              <p>Search by username and open profiles for repository-level review.</p>
            </div>
          )}

          <div className="search-section">
            {!showDetails && (
              <>
                <form className="search-bar" onSubmit={handleSubmit}>
                  <input
                    type="text"
                    placeholder="Enter GitHub username"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button type="submit" disabled={loading}>
                    {loading ? 'Searching...' : 'Search'}
                  </button>
                </form>

                {recentSearches.length > 0 && (
                  <div className="recent-searches" style={{ marginTop: '10px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.85rem', color: '#666' }}>Recent:</span>
                    {recentSearches.map((name) => (
                      <button
                        key={name}
                        onClick={() => handleSearch(name)}
                        style={{ background: '#f0f2f5', border: 'none', padding: '4px 10px', borderRadius: '15px', fontSize: '0.8rem', cursor: 'pointer', color: '#2563eb' }}
                      >
                        {name}
                      </button>
                    ))}
                    <button
                      onClick={clearRecentSearches}
                      style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#dc2626', fontSize: '0.8rem', cursor: 'pointer' }}
                    >
                      Clear All
                    </button>
                  </div>
                )}
              </>
            )}
            {error && <p className="error-message" style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
          </div>

          {/* Search result card (before view details) */}
          {profile && !showDetails && (
            <div className="search-results-container">
              <div className="popular-developer-card">
                <img src={profile.avatar_url} alt={profile.login} className="popular-avatar" />
                <div className="popular-details">
                  <span className="popular-username">{profile.name || profile.login}</span>
                  <span className="popular-link">@{profile.login}</span>
                </div>
                <button type="button" className="popular-button" onClick={handleViewDetails}>
                  View Details
                </button>
              </div>
            </div>
          )}

          {/* Full profile details with repos */}
          {profile && showDetails && (
            <div className="profile-details-wrapper">
              <button
                className="back-link"
                onClick={() => setShowDetails(false)}
                style={{ marginBottom: '20px', cursor: 'pointer', background: 'none', border: 'none', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                ← Back to results
              </button>

              <div className="profile-info">
                <div className="profile-header">
                  <img src={profile.avatar_url} alt={profile.login} className="profile-avatar" />
                  <div className="profile-details">
                    <h2>{profile.name || profile.login}</h2>
                    <p className="profile-handle">@{profile.login}</p>
                    {profile.bio && <p className="profile-bio">{profile.bio}</p>}
                    <div className="profile-stats">
                      <div><span className="stat-value">{profile.public_repos}</span> Repositories</div>
                      <div><span className="stat-value">{profile.followers}</span> Followers</div>
                      <div><span className="stat-value">{profile.following}</span> Following</div>
                    </div>
                  </div>
                  <div className="action-buttons" style={{ marginLeft: 'auto', display: 'flex', gap: '10px', alignSelf: 'flex-start', position: 'relative' }}>
                    <a href={profile.html_url} target="_blank" rel="noopener noreferrer" className="popular-button" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      GitHub
                    </a>
                    <button onClick={toggleRoleDropdown} className="popular-button" style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none' }}>
                      {showRoleDropdown ? 'Cancel' : '+ Shortlist'}
                    </button>
                    {showRoleDropdown && (
                      <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px', zIndex: 10, minWidth: '220px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
                        {roleOptions.map(role => (
                          <div
                            key={role}
                            onClick={() => selectRole(role)}
                            style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: '8px', fontSize: '0.85rem', color: selectedRole === role ? '#2563eb' : '#334155', background: selectedRole === role ? '#eff6ff' : 'transparent' }}
                          >
                            {role}
                          </div>
                        ))}

                        {selectedRole === 'Frontend Developer' && (
                          <div style={{ marginTop: '8px', padding: '8px 0', borderTop: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '6px' }}>Frontend Features:</div>
                            {frontendSkills.map(skill => (
                              <label key={skill} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 0', fontSize: '0.85rem', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={frontendFeatures.includes(skill)}
                                  onChange={() => toggleFrontendFeature(skill)}
                                />
                                {skill}
                              </label>
                            ))}
                          </div>
                        )}

                        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '6px' }}>Message (optional):</div>
                          <textarea
                            value={roleMessage}
                            onChange={(e) => setRoleMessage(e.target.value)}
                            placeholder="Add notes about this developer..."
                            rows={3}
                            style={{ width: '100%', padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.85rem', resize: 'vertical', fontFamily: 'inherit' }}
                          />
                        </div>

                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                          <button
                            onClick={addToShortlist}
                            style={{ flex: 1, padding: '8px 12px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}
                          >
                            Confirm
                          </button>
                          <button
                            onClick={toggleRoleDropdown}
                            style={{ flex: 1, padding: '8px 12px', backgroundColor: '#fff', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="profile-details-grid">
                  <div><strong>Location</strong><p>{profile.location || 'N/A'}</p></div>
                  <div><strong>Company</strong><p>{profile.company || 'N/A'}</p></div>
                  <div><strong>Joined</strong><p>{new Date(profile.created_at).toLocaleDateString()}</p></div>
                </div>
              </div>

              {/* Repositories Section */}
              <div className="repos-section">
                <div className="repos-section-header">
                  <h3>Repositories</h3>
                  <span className="repos-shortlisted-badge">
                    {shortlistedRepos.filter(r => r.ownerLogin === profile.login).length} shortlisted
                  </span>
                </div>

                {reposLoading ? (
                  <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>Loading repositories...</div>
                ) : (
                  <div className="repos-grid">
                    {repos.map((repo) => {
                      const isShortlisted = isRepoShortlisted(repo.id);
                      return (
                        <div key={repo.id} className={\`repo-card \${isShortlisted ? 'repo-card--shortlisted' : ''}\`}>
                          <div className="repo-card-top">
                            <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="repo-name">
                              {repo.name}
                            </a>
                            <button
                              className={\`repo-shortlist-btn \${isShortlisted ? 'active' : ''}\`}
                              onClick={() => toggleRepoShortlist(repo)}
                              title={isShortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
                            >
                              {isShortlisted ? '★ Shortlisted' : '☆ Shortlist'}
                            </button>
                          </div>
                          {repo.description && (
                            <p className="repo-description">{repo.description}</p>
                          )}
                          <div className="repo-meta">
                            {repo.language && (
                              <span className="repo-lang">
                                <span className="lang-dot" />
                                {repo.language}
                              </span>
                            )}
                            <span className="repo-stat">⭐ {repo.stargazers_count}</span>
                            <span className="repo-stat">🍴 {repo.forks_count}</span>
                            {repo.license && <span className="repo-stat">📄 {repo.license.spdx_id}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {showRepoLabelDropdown && (
                  <div style={{ marginTop: '20px', padding: '16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '12px', color: '#1f2937' }}>
                      Add label for "\{repoToShortlist?.name}"
                    </div>
                    <input
                      type="text"
                      value={selectedRepoLabel || ''}
                      onChange={(e) => setSelectedRepoLabel(e.target.value)}
                      placeholder="Enter custom label (e.g., Fullstack Repo, API Repo...)"
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                      <button
                        onClick={confirmRepoShortlist}
                        disabled={!selectedRepoLabel}
                        style={{ flex: 1, padding: '8px 12px', backgroundColor: selectedRepoLabel ? '#2563eb' : '#d1d5db', color: '#fff', border: 'none', borderRadius: '8px', cursor: selectedRepoLabel ? 'pointer' : 'not-allowed', fontSize: '0.85rem' }}
                      >
                        Confirm
                      </button>
                      <button
                        onClick={cancelRepoShortlist}
                        style={{ flex: 1, padding: '8px 12px', backgroundColor: '#fff', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Popular developers section */}
          {!profile && !showDetails && (
            <div className="popular-developers-section" style={{ marginTop: '40px' }}>
              <div className="section-heading"><h2>POPULAR DEVELOPERS</h2></div>
              <div className="popular-developers-grid">
                {[
                  { username: 'octocat', avatar: 'https://github.com/octocat.png' },
                  { username: 'torvalds', avatar: 'https://github.com/torvalds.png' },
                  { username: 'gaearon', avatar: 'https://github.com/gaearon.png' },
                  { username: 'yyx990803', avatar: 'https://github.com/yyx990803.png' },
                ].map((dev) => (
                  <div key={dev.username} className="popular-developer-card">
                    <img src={dev.avatar} alt={dev.username} className="popular-avatar" />
                    <div className="popular-details">
                      <span className="popular-username">{dev.username}</span>
                      <a href={\`https://github.com/\${dev.username}\`} target="_blank" rel="noopener noreferrer" className="popular-link" style={{ textDecoration: 'none', color: '#2563eb', fontSize: '0.85rem' }}>
                        GitHub profile
                      </a>
                    </div>
                    <button type="button" className="popular-button" onClick={() => handleSearch(dev.username)}>
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Developers;
`;

fs.writeFileSync('src/components/Developers.jsx', content, 'utf8');
console.log('File written successfully! Length:', content.length);
