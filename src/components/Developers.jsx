import { useState, useEffect } from 'react';
import './Dashboard.css';
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
  const [username, setUsername] = useState('');
  const [userData, setUserData] = useState(null);
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shortlistedDevs, setShortlistedDevs] = useState(() => {
    const saved = localStorage.getItem('devShortlist');
    return saved ? JSON.parse(saved) : [];
  });
  const [shortlistedRepos, setShortlistedRepos] = useState(() => {
    const saved = localStorage.getItem('shortlistedRepos');
    return saved ? JSON.parse(saved) : [];
  });
  const [recentSearches, setRecentSearches] = useState(() => {
    const saved = localStorage.getItem('recentSearches');
    return saved ? JSON.parse(saved) : [];
  });
  const [showReview, setShowReview] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [reviewMessage, setReviewMessage] = useState('');
  const [selectedFrontendFeatures, setSelectedFrontendFeatures] = useState([]);
  const [showRepoLabel, setShowRepoLabel] = useState(null);
  const [repoLabelText, setRepoLabelText] = useState('');

  useEffect(() => {
    localStorage.setItem('devShortlist', JSON.stringify(shortlistedDevs));
  }, [shortlistedDevs]);

  useEffect(() => {
    localStorage.setItem('shortlistedRepos', JSON.stringify(shortlistedRepos));
  }, [shortlistedRepos]);

  useEffect(() => {
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
  }, [recentSearches]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    setError('');
    setUserData(null);
    setRepos([]);

    try {
      const userRes = await fetch(`https://api.github.com/users/${username}`);
      if (!userRes.ok) throw new Error('User not found');
      const userData = await userRes.json();

      const reposRes = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`);
      const reposData = await reposRes.json();

      setUserData(userData);
      setRepos(reposData);

      if (!recentSearches.includes(username)) {
        setRecentSearches(prev => [username, ...prev].slice(0, 10));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleShortlistDev = (dev) => {
    const isShortlisted = shortlistedDevs.some(d => d.login === dev.login);
    if (isShortlisted) {
      setShortlistedDevs(prev => prev.filter(d => d.login !== dev.login));
    } else {
      setShowReview(dev.login);
      setSelectedRole('');
      setReviewMessage('');
      setSelectedFrontendFeatures([]);
    }
  };

  const confirmShortlistDev = (dev) => {
    const devWithReview = {
      ...dev,
      role: selectedRole,
      message: reviewMessage,
      frontendFeatures: selectedFrontendFeatures
    };
    setShortlistedDevs(prev => [...prev, devWithReview]);
    setShowReview(null);
    setSelectedRole('');
    setReviewMessage('');
    setSelectedFrontendFeatures([]);
  };

  const handleShortlistRepo = (repo) => {
    const isShortlisted = shortlistedRepos.some(r => r.id === repo.id);
    if (isShortlisted) {
      setShortlistedRepos(prev => prev.filter(r => r.id !== repo.id));
    } else {
      setShowRepoLabel(repo.id);
      setRepoLabelText('');
    }
  };

  const confirmRepoLabel = (repo) => {
    const repoWithLabel = {
      ...repo,
      label: repoLabelText,
      ownerLogin: repo.owner.login,
      ownerAvatar: repo.owner.avatar_url
    };
    setShortlistedRepos(prev => [...prev, repoWithLabel]);
    setShowRepoLabel(null);
    setRepoLabelText('');
  };

  const handleNavigate = (page) => {
    if (onNavigate) onNavigate(page);
  };

  const handleSignOut = () => {
    if (onSignOut) onSignOut();
  };

  const clearAllRecentSearches = () => {
    setRecentSearches([]);
  };

  const toggleFrontendFeature = (skill) => {
    if (selectedFrontendFeatures.includes(skill)) {
      setSelectedFrontendFeatures(prev => prev.filter(s => s !== skill));
    } else {
      setSelectedFrontendFeatures(prev => [...prev, skill]);
    }
  };

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
            {!collapsed && <span className="nav-label">Dashboard</span>}
          </button>
          <button type="button" className="nav-link active">
            <span className="nav-icon">💻</span>
            {!collapsed && <span className="nav-label">Developers</span>}
          </button>
          <button type="button" className="nav-link" onClick={() => onNavigate('shortlist')}>
            <span className="nav-icon">⭐</span>
            {!collapsed && <span className="nav-label">Shortlist</span>}
          </button>
        </div>

        <div className="side-footer">
          <button type="button" className="footer-button" onClick={() => setCollapsed((v) => !v)}>
            <span className="nav-icon">↔</span>
            {!collapsed && <span className="footer-label">Collapse</span>}
          </button>
          <button type="button" className="footer-button logout" onClick={handleSignOut}>
            <span className="nav-icon">🔓</span>
            {!collapsed && <span className="footer-label">Logout</span>}
          </button>
        </div>
      </div>

      <div className="dashboard">
        <div className="dashboard-nav">
          <div className="dashboard-title">Developers</div>
          <div className="dashboard-logo">DH</div>
        </div>

        <div className="dashboard-main">
          <div className="dashboard-heading">
            <h1>Developers</h1>
            <p>Search and explore GitHub developers.</p>
          </div>

          <div className="search-section">
            <form onSubmit={handleSearch} className="search-form">
              <input
                type="text"
                placeholder="Enter GitHub username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="search-btn" disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
              </button>
            </form>

            {recentSearches.length > 0 && (
              <div className="recent-searches">
                <div className="recent-header">
                  <span>Recent Searches:</span>
                  <button className="clear-all-btn" onClick={clearAllRecentSearches}>Clear All</button>
                </div>
                <div className="recent-list">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      className="recent-item"
                      onClick={() => setUsername(search)}
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {error && <div className="error-message">{error}</div>}

          {userData && (
            <div className="user-profile">
              <div className="profile-header">
                <img src={userData.avatar_url} alt={userData.login} className="avatar" />
                <div className="profile-info">
                  <h2>{userData.name || userData.login}</h2>
                  <p>@{userData.login}</p>
                  {userData.bio && <p className="bio">{userData.bio}</p>}
                  <div className="contact-info">
                    {userData.email && (
                      <div className="contact-item">
                        <span>Email: {userData.email}</span>
                      </div>
                    )}
                    {userData.blog && (
                      <div className="contact-item">
                        <span>Portfolio: <a href={userData.blog} target="_blank" rel="noopener noreferrer">{userData.blog}</a></span>
                      </div>
                    )}
                  </div>
                  <button
                    className={`shortlist-dev-btn ${shortlistedDevs.some(d => d.login === userData.login) ? 'shortlisted' : ''}`}
                    onClick={() => handleShortlistDev(userData)}
                  >
                    {shortlistedDevs.some(d => d.login === userData.login) ? 'Remove from Shortlist' : 'Shortlist Developer'}
                  </button>

                  {showReview === userData.login && (
                    <div className="review-section">
                      <h3>Review Developer</h3>
                      <div className="review-field">
                        <label>Role:</label>
                        <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                          <option value="">Select a role</option>
                          {roleOptions.map(role => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      </div>
                      <div className="review-field">
                        <label>Frontend Features:</label>
                        <div className="frontend-skills">
                          {frontendSkills.map(skill => (
                            <button
                              key={skill}
                              className={`skill-btn ${selectedFrontendFeatures.includes(skill) ? 'selected' : ''}`}
                              onClick={() => toggleFrontendFeature(skill)}
                            >
                              {skill}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="review-field">
                        <label>Message:</label>
                        <textarea
                          value={reviewMessage}
                          onChange={(e) => setReviewMessage(e.target.value)}
                          placeholder="Add a message about this developer..."
                          rows={3}
                        />
                      </div>
                      <div className="review-actions">
                        <button className="confirm-btn" onClick={() => confirmShortlistDev(userData)}>Confirm</button>
                        <button className="cancel-btn" onClick={() => setShowReview(null)}>Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="repos-section">
                <div className="repos-header">
                  <h3>Repositories ({repos.length})</h3>
                </div>
                <div className="repos-list">
                  {repos.map(repo => (
                    <div key={repo.id} className="repo-card">
                      <div className="repo-header">
                        <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="repo-name">
                          {repo.name}
                        </a>
                        {shortlistedRepos.some(r => r.id === repo.id) && <span className="repo-shortlisted-badge">Shortlisted</span>}
                      </div>
                      {repo.description && <p className="repo-desc">{repo.description}</p>}
                      <div className="repo-meta">
                        {repo.language && <span className="repo-lang">{repo.language}</span>}
                        <span>⭐ {repo.stargazers_count}</span>
                        <span>🍴 {repo.forks_count}</span>
                      </div>
                      <button
                        className={`shortlist-repo-btn ${shortlistedRepos.some(r => r.id === repo.id) ? 'shortlisted' : ''}`}
                        onClick={() => handleShortlistRepo(repo)}
                      >
                        {shortlistedRepos.some(r => r.id === repo.id) ? 'Remove' : 'Shortlist Repo'}
                      </button>

                      {showRepoLabel === repo.id && (
                        <div className="repo-label-section">
                          <input
                            type="text"
                            placeholder="Enter label (e.g., React Project, Portfolio)"
                            value={repoLabelText}
                            onChange={(e) => setRepoLabelText(e.target.value)}
                            className="repo-label-input"
                          />
                          <div className="repo-label-actions">
                            <button className="confirm-btn" onClick={() => confirmRepoLabel(repo)}>Confirm</button>
                            <button className="cancel-btn" onClick={() => setShowRepoLabel(null)}>Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Developers;
