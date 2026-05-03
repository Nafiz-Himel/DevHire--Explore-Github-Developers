import { useState, useEffect, useCallback, useMemo } from "react";
import Sidebar from "./Sidebar";
import "./Dashboard.css";
import "./Developers.css";
import { FaLinkedin, FaTwitter, FaFacebook, FaInstagram, FaGithub, FaGlobe, FaEnvelope } from "react-icons/fa";

const roleOptions = [
  "Frontend Developer",
  "Backend Developer",
  "Fullstack Developer",
  "DevOps Engineer",
  "Mobile Developer",
];

const skillsByRole = {
  "Frontend Developer": [
    "React",
    "Vue.js",
    "Angular",
    "TypeScript",
    "HTML5",
    "CSS3",
    "Tailwind CSS",
    "Next.js",
    "Sass",
    "Bootstrap",
  ],
  "Backend Developer": [
    "Node.js",
    "Python",
    "Java",
    "Go",
    "PostgreSQL",
    "MongoDB",
    "Redis",
    "Docker",
    "MySQL",
    "Express.js",
  ],
  "Fullstack Developer": [
    "React",
    "Node.js",
    "TypeScript",
    "Python",
    "PostgreSQL",
    "MongoDB",
    "Docker",
    "Next.js",
    "Express.js",
  ],
  "DevOps Engineer": [
    "Docker",
    "Kubernetes",
    "AWS",
    "Azure",
    "GCP",
    "Jenkins",
    "Terraform",
    "Linux",
    "Nginx",
  ],
  "Mobile Developer": [
    "React Native",
    "Flutter",
    "Swift",
    "Kotlin",
    "Firebase",
    "Dart",
    "Android Studio",
  ],
};

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

function Developers({ onSignOut, onNavigate }) {
  const [username, setUsername] = useState("");
  const [userData, setUserData] = useState(null);
  const [repos, setRepos] = useState([]);
  const [socialAccounts, setSocialAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rateLimitRemaining, setRateLimitRemaining] = useState(null);
  const [rateLimitReset, setRateLimitReset] = useState(null);
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [githubToken, setGithubToken] = useState(() => {
    return localStorage.getItem("github_token") || "";
  });
  const [shortlistedDevs, setShortlistedDevs] = useState(() => {
    const saved = localStorage.getItem("devShortlist");
    return saved ? JSON.parse(saved) : [];
  });
  const [shortlistedRepos, setShortlistedRepos] = useState(() => {
    const saved = localStorage.getItem("shortlistedRepos");
    return saved ? JSON.parse(saved) : [];
  });
  const [recentSearches, setRecentSearches] = useState(() => {
    const saved = localStorage.getItem("recentSearches");
    return saved ? JSON.parse(saved) : [];
  });
  const [showReview, setShowReview] = useState(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [isCustomRole, setIsCustomRole] = useState(false);
  const [customRole, setCustomRole] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [rating, setRating] = useState(0);
  const [showRepoLabel, setShowRepoLabel] = useState(null);
  const [repoLabelText, setRepoLabelText] = useState("");
  const [shortlistRepoModal, setShortlistRepoModal] = useState(null);
  const [popularDevs, setPopularDevs] = useState([]);

  // Extract social links: website from blog, social accounts from GitHub API
  const socialLinks = useMemo(() => {
    const links = {
      linkedin: null,
      twitter: null,
      facebook: null,
      instagram: null,
      github: null,
      website: null,
    };

    // Add website from blog field
    if (userData?.blog) {
      const blogClean = userData.blog.startsWith('http')
        ? userData.blog
        : 'https://' + userData.blog;
      links.website = blogClean;
    }

    // Add social accounts from GitHub API
    socialAccounts.forEach((acc) => {
      const provider = acc.provider.toLowerCase();
      if (['linkedin', 'twitter', 'x', 'facebook', 'instagram', 'github'].includes(provider)) {
        const key = provider === 'x' ? 'twitter' : provider;
        links[key] = acc.url;
      }
    });

    // Fallback: use twitter_username if API didn't provide it
    if (!links.twitter && userData?.twitter_username) {
      links.twitter = `https://twitter.com/${userData.twitter_username}`;
    }

    return links;
  }, [socialAccounts, userData]);

  useEffect(() => {
    localStorage.setItem("devShortlist", JSON.stringify(shortlistedDevs));
  }, [shortlistedDevs]);

  useEffect(() => {
    localStorage.setItem("shortlistedRepos", JSON.stringify(shortlistedRepos));
  }, [shortlistedRepos]);

  useEffect(() => {
    localStorage.setItem("recentSearches", JSON.stringify(recentSearches));
  }, [recentSearches]);

  // Cache utility functions
  const getCachedData = (key) => {
    const cached = localStorage.getItem(`github_cache_${key}`);
    if (!cached) return null;
    try {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp > CACHE_DURATION) {
        localStorage.removeItem(`github_cache_${key}`);
        return null;
      }
      return data;
    } catch {
      localStorage.removeItem(`github_cache_${key}`);
      return null;
    }
  };

  const setCachedData = (key, data) => {
    localStorage.setItem(
      `github_cache_${key}`,
      JSON.stringify({ data, timestamp: Date.now() })
    );
  };

  // Save token to localStorage
  const handleTokenSave = (token) => {
    setGithubToken(token);
    if (token) {
      localStorage.setItem("github_token", token);
    } else {
      localStorage.removeItem("github_token");
    }
  };

  // Get fetch headers with optional auth token
  const getFetchHeaders = useCallback(() => {
    const headers = {};
    if (githubToken) {
      headers.Authorization = `token ${githubToken}`;
    }
    return headers;
  }, [githubToken]);

  // Update rate limit info from response headers
  const updateRateLimit = (response) => {
    const remaining = response.headers.get("X-RateLimit-Remaining");
    const reset = response.headers.get("X-RateLimit-Reset");
    if (remaining !== null) setRateLimitRemaining(parseInt(remaining));
    if (reset !== null) setRateLimitReset(parseInt(reset) * 1000);
  };

  // Format time until rate limit reset
  const getTimeUntilReset = () => {
    if (!rateLimitReset) return "";
    const diff = rateLimitReset - Date.now();
    if (diff <= 0) return "now";
    const minutes = Math.ceil(diff / 60000);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""}`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  useEffect(() => {
    const popularUsernames = [
      "torvalds",
      "gaearon",
      "sindresorhus",
      "addyosmani",
      "tj",
      "mdo",
      "fat",
    ];
    const fetchPopular = async () => {
      try {
        const headers = getFetchHeaders();
        const results = await Promise.all(
          popularUsernames.map((u) =>
            fetch(`https://api.github.com/users/${u}`, { headers })
              .then((r) => {
                updateRateLimit(r);
                return r.json();
              })
          ),
        );
        setPopularDevs(results.filter((dev) => !dev.message));
      } catch (err) {
        console.error("Failed to fetch popular developers", err);
      }
    };
    fetchPopular();
  }, [githubToken, getFetchHeaders]);

  const fetchEmailFromCommits = async (username, repos) => {
    const reposToCheck = repos
      .filter(r => !r.fork)
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 3);

    for (const repo of reposToCheck) {
      try {
        const commitsRes = await fetch(
          `https://api.github.com/repos/${username}/${repo.name}/commits?per_page=10`
        );
        if (!commitsRes.ok) continue;

        const commits = await commitsRes.json();
        for (const commit of commits) {
          const email = commit.commit?.author?.email;
          if (email && !email.includes("users.noreply.github.com")) {
            return email;
          }
        }
      } catch {
        continue;
      }
    }
    return null;
  };

  const getDeveloperSkills = (repos) => {
    const langCount = {};
    repos.forEach(repo => {
      if (repo.language) {
        langCount[repo.language] = (langCount[repo.language] || 0) + 1;
      }
    });
    return Object.entries(langCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  };

  const performSearch = async (searchTerm) => {
    const term = searchTerm || username;
    if (!term?.trim()) return;

    setLoading(true);
    setError("");
    setSocialAccounts([]);

    // Check cache first
    const cachedUser = getCachedData(`user_${term}`);
    const cachedRepos = getCachedData(`repos_${term}`);
    const cachedSocial = getCachedData(`social_${term}`);

    if (cachedUser && cachedRepos && cachedSocial) {
      setUserData(cachedUser);
      setRepos(cachedRepos);
      setSocialAccounts(cachedSocial);
      setLoading(false);
      if (!recentSearches.includes(term)) {
        setRecentSearches((prev) => [term, ...prev].slice(0, 10));
      }
      return;
    }

    try {
      const headers = getFetchHeaders();

      const userRes = await fetch(`https://api.github.com/users/${term}`, { headers });
      updateRateLimit(userRes);

      if (userRes.status === 403) {
        const resetTime = getTimeUntilReset();
        throw new Error(
          resetTime
            ? `API rate limit exceeded. Resets in ${resetTime}.${!githubToken ? " Add a token for 5000 requests/hour." : ""}`
            : "API rate limit exceeded. Please try again later."
        );
      }
      if (!userRes.ok) throw new Error("User not found");

      const userData = await userRes.json();
      setCachedData(`user_${term}`, userData);

      const reposRes = await fetch(
        `https://api.github.com/users/${term}/repos?per_page=100`,
        { headers }
      );
      updateRateLimit(reposRes);
      const reposData = await reposRes.json();
      setCachedData(`repos_${term}`, reposData);

      // Fetch social accounts from GitHub API
      const socialRes = await fetch(
        `https://api.github.com/users/${term}/social_accounts`,
        { headers }
      );
      updateRateLimit(socialRes);
      let socialData = [];
      if (socialRes.ok) {
        socialData = await socialRes.json();
        setCachedData(`social_${term}`, socialData);
      }
      setSocialAccounts(socialData);

      let finalUserData = { ...userData };
      if (!userData.email && reposData.length > 0) {
        const emailFromCommits = await fetchEmailFromCommits(term, reposData);
        if (emailFromCommits) {
          finalUserData.email = emailFromCommits;
        }
      }

      setUserData(finalUserData);
      setRepos(reposData);

      if (!recentSearches.includes(term)) {
        setRecentSearches((prev) => [term, ...prev].slice(0, 10));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    await performSearch();
  };

  const handleShortlistDev = (dev) => {
    const isShortlisted = shortlistedDevs.some((d) => d.login === dev.login);
    if (isShortlisted) {
      setShortlistedDevs((prev) => prev.filter((d) => d.login !== dev.login));
    } else {
      setShowReview(dev.login);
      setSelectedRole("");
      setIsCustomRole(false);
      setCustomRole("");
      setReviewMessage("");
      setSelectedSkills([]);
      setRating(0);
    }
  };

  const confirmShortlistDev = (dev) => {
    const devWithReview = {
      ...dev,
      role: isCustomRole ? customRole : selectedRole,
      message: reviewMessage,
      skills: selectedSkills,
      rating: rating,
    };
    setShortlistedDevs((prev) => [...prev, devWithReview]);
    setShowReview(null);
    setSelectedRole("");
    setIsCustomRole(false);
    setCustomRole("");
    setReviewMessage("");
    setSelectedSkills([]);
    setRating(0);
  };

  const handleShortlistRepo = (repo) => {
    const isShortlisted = shortlistedRepos.some((r) => r.id === repo.id);
    if (isShortlisted) {
      setShortlistRepoModal({ repo, action: 'remove' });
    } else {
      setShortlistRepoModal({ repo, action: 'shortlist' });
      setRepoLabelText("");
    }
  };

  const confirmRepoShortlist = () => {
    if (!shortlistRepoModal) return;
    const { repo, action } = shortlistRepoModal;

    if (action === 'remove') {
      setShortlistedRepos((prev) => prev.filter((r) => r.id !== repo.id));
    } else {
      const repoWithLabel = {
        ...repo,
        label: repoLabelText,
        ownerLogin: repo.owner.login,
        ownerAvatar: repo.owner.avatar_url,
      };
      setShortlistedRepos((prev) => [...prev, repoWithLabel]);
    }

    setShortlistRepoModal(null);
    setRepoLabelText("");
  };

  const handleSignOut = () => {
    if (onSignOut) onSignOut();
  };

  const clearAllRecentSearches = () => {
    setRecentSearches([]);
  };

  return (
    <Sidebar currentPage="developers" onNavigate={onNavigate} onSignOut={handleSignOut}>
      <div className="dashboard">
        {!userData && (
        <div className="dashboard-nav">
          <div className="dashboard-title">Developers</div>
          <div className="dashboard-logo">DH</div>
        </div>
        )}

        <div className="dashboard-main">
          {!userData && (
          <div className="dashboard-heading">
            <h1>Developers</h1>
            <p>Search and explore GitHub developers.</p>
          </div>
          )}

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
                {loading ? "Searching..." : "Search"}
              </button>
            </form>

            {rateLimitRemaining !== null && (
              <div className="rate-limit-info">
                <span className="rate-limit-text">
                  {githubToken ? "Authenticated" : "Public"} API: {rateLimitRemaining} requests remaining
                  {rateLimitReset && rateLimitRemaining < 10 && (
                    <span className="rate-limit-reset"> (resets in {getTimeUntilReset()})</span>
                  )}
                </span>
                <button
                  className="token-toggle-btn"
                  onClick={() => setShowTokenInput(!showTokenInput)}
                >
                  {showTokenInput ? "Hide" : "Token"}
                </button>
              </div>
            )}

            {showTokenInput && (
              <div className="token-input-section">
                <input
                  type="password"
                  placeholder="GitHub Personal Access Token"
                  value={githubToken}
                  onChange={(e) => handleTokenSave(e.target.value)}
                  className="token-input"
                />
                <span className="token-hint">
                  {githubToken ? "Token saved (5000 req/hr)" : "Add token for 5000 req/hr"}
                </span>
              </div>
            )}

            {recentSearches.length > 0 && (
              <div className="recent-searches">
                <div className="recent-header">
                  <span>Recent Searches:</span>
                  <button
                    className="clear-all-btn"
                    onClick={clearAllRecentSearches}
                  >
                    Clear All
                  </button>
                </div>
                <div className="recent-list">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      className="recent-item"
                      onClick={() => {
                        setUsername(search);
                        performSearch(search);
                      }}
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!userData && popularDevs.length > 0 && (
              <div className="popular-profiles-section">
                <h3 className="popular-profiles-heading">Popular Profiles</h3>
                <p className="popular-profiles-subtext">
                  Discover and explore these popular GitHub developers.
                </p>
                <div className="popular-profiles-grid">
                  {popularDevs.map((dev) => (
                    <div
                      key={dev.id}
                      className="popular-profile-card"
                      onClick={() => performSearch(dev.login)}
                    >
                      <img
                        src={dev.avatar_url}
                        alt={dev.login}
                        className="popular-profile-avatar"
                      />
                      <div className="popular-profile-info">
                        <span className="popular-profile-name">
                          {dev.name || dev.login}
                        </span>
                        <span className="popular-profile-username">
                          @{dev.login}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {error && <div className="error-message">{error}</div>}

          {userData && (
            <div className="user-profile">
              <div className="profile-header">
                <img
                  src={userData.avatar_url}
                  alt={userData.login}
                  className="avatar"
                />
                <div className="profile-info">
                  <h2>{userData.name || userData.login}</h2>
                  <p>@{userData.login}</p>
                  {userData.bio && <p className="bio">{userData.bio}</p>}

                  <button
                    className={`shortlist-dev-btn ${shortlistedDevs.some((d) => d.login === userData.login) ? "shortlisted" : ""}`}
                    onClick={() => handleShortlistDev(userData)}
                  >
                    {shortlistedDevs.some((d) => d.login === userData.login)
                      ? "Remove from Shortlist"
                      : "Shortlist Developer"}
                  </button>

                  <h4 className="contact-info-title">Contact Info</h4>
                  <div className="contact-info">
                    {socialLinks.website && (
                      <a href={socialLinks.website} target="_blank" rel="noopener noreferrer" className="contact-item">
                        <FaGlobe className="contact-icon" /> <span className="contact-text">{socialLinks.website}</span>
                      </a>
                    )}

                    {userData.email && (
                      <a href={`mailto:${userData.email}`} className="contact-item" title={userData.email}>
                        <FaEnvelope className="contact-icon" /> <span className="contact-text">{userData.email}</span>
                      </a>
                    )}

                    {socialLinks.linkedin && (
                      <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="contact-item">
                        <FaLinkedin className="contact-icon" /> <span className="contact-text">{socialLinks.linkedin}</span>
                      </a>
                    )}

                    {socialLinks.twitter && (
                      <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="contact-item">
                        <FaTwitter className="contact-icon" /> <span className="contact-text">{socialLinks.twitter}</span>
                      </a>
                    )}

                    {socialLinks.facebook && (
                      <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="contact-item">
                        <FaFacebook className="contact-icon" /> <span className="contact-text">{socialLinks.facebook}</span>
                      </a>
                    )}

                    {socialLinks.instagram && (
                      <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="contact-item">
                        <FaInstagram className="contact-icon" /> <span className="contact-text">{socialLinks.instagram}</span>
                      </a>
                    )}

                    {socialLinks.github && (
                      <a href={socialLinks.github} target="_blank" rel="noopener noreferrer" className="contact-item">
                        <FaGithub className="contact-icon" /> <span className="contact-text">{socialLinks.github}</span>
                      </a>
                    )}

                    {!socialLinks.website && !userData.email && !socialLinks.linkedin &&
                     !socialLinks.twitter && !socialLinks.facebook && !socialLinks.instagram && !socialLinks.github && (
                      <p className="no-contact-info">No public contact information available.</p>
                    )}
                  </div>

                  <div className="profile-stats">
                    <div className="stat-item">
                      <span className="stat-value">{userData.public_repos}</span>
                      <span className="stat-label">Repos</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">{userData.followers}</span>
                      <span className="stat-label">Followers</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">{userData.following}</span>
                      <span className="stat-label">Following</span>
                    </div>
                  </div>

                  <div className="profile-details">
                    <h4>Professional Details</h4>
                    {userData.company && (
                      <div className="detail-item">
                        <span className="detail-icon">🏢</span>
                        <span>{userData.company}</span>
                      </div>
                    )}
                    {userData.location && (
                      <div className="detail-item">
                        <span className="detail-icon">📍</span>
                        <span>{userData.location}</span>
                      </div>
                    )}
                    <div className="detail-item">
                      <span className="detail-icon">💼</span>
                      <span
                        className={`hireable-badge ${userData.hireable ? "available" : "not-available"}`}
                      >
                        {userData.hireable ? "Available for hire" : "Not available for hire"}
                      </span>
                    </div>
                  </div>

                  <div className="account-info">
                    <h4>Account Info</h4>
                    <div className="detail-item">
                      <span className="detail-icon">📅</span>
                      <span>Joined: {new Date(userData.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-icon">⏱️</span>
                      <span>Last active: {new Date(userData.updated_at).toLocaleDateString()}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-icon">🔗</span>
                      <a
                        href={userData.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="detail-link"
                      >
                        View on GitHub
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {showReview === userData.login && (
                <div className="review-modal-overlay" onClick={() => setShowReview(null)}>
                  <div className="review-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="review-modal-header">
                      <h3>Review {userData.name || userData.login}</h3>
                      <button className="review-modal-close" onClick={() => setShowReview(null)}>✕</button>
                    </div>
                    <div className="review-modal-body">
                      <div className="review-field">
                        <label>Role:</label>
                        {isCustomRole ? (
                          <input
                            type="text"
                            value={customRole}
                            onChange={(e) => setCustomRole(e.target.value)}
                            placeholder="Enter custom role..."
                            className="role-input"
                            autoFocus
                          />
                        ) : (
                          <select
                            value={selectedRole}
                            onChange={(e) => {
                              if (e.target.value === "custom") {
                                setIsCustomRole(true);
                                setSelectedRole("");
                              } else {
                                setSelectedRole(e.target.value);
                                setSelectedSkills([]);
                              }
                            }}
                          >
                            <option value="">Select a role</option>
                            {roleOptions.map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                            <option value="custom">+ Type custom role...</option>
                          </select>
                        )}
                        {isCustomRole && (
                          <button
                            className="back-to-select"
                            onClick={() => {
                              setIsCustomRole(false);
                              setCustomRole("");
                            }}
                          >
                            ← Back to list
                          </button>
                        )}
                      </div>

                      {selectedRole && skillsByRole[selectedRole] && (
                        <div className="review-field">
                          <label>Skills:</label>
                          <div className="skills-container">
                            {skillsByRole[selectedRole].map((skill) => (
                              <button
                                key={skill}
                                className={`skill-btn ${selectedSkills.includes(skill) ? "selected" : ""}`}
                                onClick={() => {
                                  setSelectedSkills((prev) =>
                                    prev.includes(skill)
                                      ? prev.filter((s) => s !== skill)
                                      : [...prev, skill],
                                  );
                                }}
                              >
                                {skill}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="review-field">
                        <label>Rating:</label>
                        <div className="rating-container">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              className={`star-btn ${star <= rating ? "active" : ""}`}
                              onClick={() => setRating(star)}
                            >
                              ★
                            </button>
                          ))}
                          {rating > 0 && (
                            <span className="rating-text">{rating}/5</span>
                          )}
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
                    </div>
                    <div className="review-actions">
                      <button
                        className="confirm-btn"
                        onClick={() => confirmShortlistDev(userData)}
                      >
                        Confirm
                      </button>
                      <button
                        className="cancel-btn"
                        onClick={() => setShowReview(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {userData && repos.length > 0 && (
            <div className="repos-section">
              <div className="repos-header">
                <h3>Repositories ({repos.length})</h3>
              </div>
              <div className="repos-list">
                {repos.map((repo) => (
                  <div key={repo.id} className="repo-card">
                    <div className="repo-header">
                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="repo-name"
                      >
                        {repo.name}
                      </a>
                      {shortlistedRepos.some((r) => r.id === repo.id) && (
                        <span className="repo-shortlisted-badge">
                          Shortlisted
                        </span>
                      )}
                    </div>
                    {repo.description && (
                      <p className="repo-desc">{repo.description}</p>
                    )}
                    <div className="repo-meta">
                      {repo.language && (
                        <span className="repo-lang">{repo.language}</span>
                      )}
                      <span>⭐ {repo.stargazers_count}</span>
                      <span>🍴 {repo.forks_count}</span>
                    </div>
                    <div className="repo-actions">
                      <button
                        className={`shortlist-repo-btn ${shortlistedRepos.some((r) => r.id === repo.id) ? "shortlisted" : ""}`}
                        onClick={() => handleShortlistRepo(repo)}
                      >
                        {shortlistedRepos.some((r) => r.id === repo.id)
                          ? "Remove"
                          : "Shortlist Repo"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            )}
        </div>
      </div>

      {shortlistRepoModal && (
        <div className="review-modal-overlay" onClick={() => setShortlistRepoModal(null)}>
          <div className="review-modal" onClick={(e) => e.stopPropagation()}>
            <div className="review-modal-header">
              <h3>
                {shortlistRepoModal.action === 'remove'
                  ? 'Remove Repository'
                  : 'Shortlist Repository'}
              </h3>
              <button className="review-modal-close" onClick={() => setShortlistRepoModal(null)}>✕</button>
            </div>
            <div className="review-modal-body">
              <div className="review-field">
                <label>Repository:</label>
                <span>{shortlistRepoModal.repo.name}</span>
              </div>

              {shortlistRepoModal.action === 'shortlist' && (
                <div className="review-field">
                  <label>Label (optional):</label>
                  <input
                    type="text"
                    placeholder="Enter label..."
                    value={repoLabelText}
                    onChange={(e) => setRepoLabelText(e.target.value)}
                    className="role-input"
                  />
                </div>
              )}

              {shortlistRepoModal.action === 'remove' && (
                <p style={{color: '#dc2626', fontSize: '0.9rem'}}>
                  Are you sure you want to remove this repository from shortlist?
                </p>
              )}
            </div>
            <div className="review-actions">
              <button
                className="confirm-btn"
                onClick={confirmRepoShortlist}
              >
                {shortlistRepoModal.action === 'remove' ? 'Confirm Remove' : 'Shortlist'}
              </button>
              <button
                className="cancel-btn"
                onClick={() => setShortlistRepoModal(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </Sidebar>
  );
}

export default Developers;
