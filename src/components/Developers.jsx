import React, { useState, useEffect } from 'react';
import './Developers.css';

function Developers({ onSignOut, onNavigate }) {
  const [collapsed, setCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [notification, setNotification] = useState('');
  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    const savedRecent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    setRecentSearches(savedRecent);
  }, []);

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification('');
    }, 3000);
  };

  const updateRecentSearches = (username) => {
    const updated = [username, ...recentSearches.filter(name => name !== username)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const handleSearch = async (targetUsername) => {
    const username = targetUsername || searchTerm.trim();
    if (!username) {
      setError('Please enter a GitHub username');
      return;
    }

    setLoading(true);
    setError('');
    setProfile(null);
    setShowDetails(false);

    try {
      const response = await fetch(`https://api.github.com/users/${username}`, {
        headers: {
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (response.status === 404) {
        throw new Error('User not found. Please check the spelling.');
      } else if (response.status === 403) {
        throw new Error('API limit exceeded. Try again later.');
      } else if (!response.ok) {
        throw new Error('Network error. Please try again.');
      }

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

  const addToShortlist = () => {
    const savedShortlist = JSON.parse(localStorage.getItem('devShortlist') || '[]');
    const isAlreadyAdded = savedShortlist.some(item => item.id === profile.id);

    if (!isAlreadyAdded) {
      const updatedShortlist = [...savedShortlist, profile];
      localStorage.setItem('devShortlist', JSON.stringify(updatedShortlist));
      showNotification(`${profile.name || profile.login} added to shortlist!`);
    } else {
      showNotification('Already in shortlist.');
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    handleSearch();
  };

  return (
    <div className={`dashboard-shell ${collapsed ? 'collapsed' : ''}`}>
      {notification && (
        <div className="custom-toast">
          {notification}
        </div>
      )}

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
                        style={{
                          background: '#f0f2f5',
                          border: 'none',
                          padding: '4px 10px',
                          borderRadius: '15px',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          color: '#2563eb'
                        }}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
            {error && <p className="error-message" style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
          </div>

          {profile && !showDetails && (
            <div className="search-results-container">
              <div className="popular-developer-card">
                <img src={profile.avatar_url} alt={profile.login} className="popular-avatar" />
                <div className="popular-details">
                  <span className="popular-username">{profile.name || profile.login}</span>
                  <span className="popular-link">@{profile.login}</span>
                </div>
                <button type="button" className="popular-button" onClick={() => setShowDetails(true)}>
                  View Details
                </button>
              </div>
            </div>
          )}

          {profile && showDetails && (
            <div className="profile-details-wrapper">
              <button className="back-link" onClick={() => setShowDetails(false)} style={{ marginBottom: '20px', cursor: 'pointer', background: 'none', border: 'none', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '5px' }}>
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

                  <div className="action-buttons" style={{ marginLeft: 'auto', display: 'flex', gap: '10px', alignSelf: 'flex-start' }}>
                    <a href={profile.html_url} target="_blank" rel="noopener noreferrer" className="popular-button" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                       GitHub
                    </a>
                    <button onClick={addToShortlist} className="popular-button" style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none' }}>
                      + Shortlist
                    </button>
                  </div>
                </div>

                <div className="profile-details-grid">
                  <div>
                    <strong>Location</strong>
                    <p>{profile.location || 'N/A'}</p>
                  </div>
                  <div>
                    <strong>Company</strong>
                    <p>{profile.company || 'N/A'}</p>
                  </div>
                  <div>
                    <strong>Joined</strong>
                    <p>{new Date(profile.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!profile && !showDetails && (
            <div className="popular-developers-section" style={{ marginTop: '40px' }}>
              <div className="section-heading">
                <h2>POPULAR DEVELOPERS</h2>
              </div>
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
                      <a 
                        href={`https://github.com/${dev.username}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="popular-link"
                        style={{ textDecoration: 'none', color: '#2563eb', fontSize: '0.85rem' }}
                      >
                        GitHub profile
                      </a>
                    </div>
                    <button 
                      type="button" 
                      className="popular-button" 
                      onClick={() => handleSearch(dev.username)}
                    >
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