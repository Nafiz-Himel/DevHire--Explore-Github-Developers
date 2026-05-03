import { useState, useEffect, useCallback } from "react";
import Sidebar from "./Sidebar";
import "./Dashboard.css";
import "./Developers.css";

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
  const [reviewMessage, setReviewMessage] = useState("");
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [rating, setRating] = useState(0);
  const [showRepoLabel, setShowRepoLabel] = useState(null);
  const [repoLabelText, setRepoLabelText] = useState("");
  const [popularDevs, setPopularDevs] = useState([]);

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
      "paulirish",
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

    // Check cache first
    const cachedUser = getCachedData(`user_${term}`);
    const cachedRepos = getCachedData(`repos_${term}`);

    if (cachedUser && cachedRepos) {
      setUserData(cachedUser);
      setRepos(cachedRepos);
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
      setReviewMessage("");
      setSelectedSkills([]);
      setRating(0);
    }
  };

  const confirmShortlistDev = (dev) => {
    const devWithReview = {
      ...dev,
      role: selectedRole,
      message: reviewMessage,
      skills: selectedSkills,
      rating: rating,
    };
    setShortlistedDevs((prev) => [...prev, devWithReview]);
    setShowReview(null);
    setSelectedRole("");
    setReviewMessage("");
    setSelectedSkills([]);
    setRating(0);
  };

  const handleShortlistRepo = (repo) => {
    const isShortlisted = shortlistedRepos.some((r) => r.id === repo.id);
    if (isShortlisted) {
      setShortlistedRepos((prev) => prev.filter((r) => r.id !== repo.id));
    } else {
      setShowRepoLabel(repo.id);
      setRepoLabelText("");
    }
  };

  const confirmRepoLabel = (repo) => {
    const repoWithLabel = {
      ...repo,
      label: repoLabelText,
      ownerLogin: repo.owner.login,
      ownerAvatar: repo.owner.avatar_url,
    };
    setShortlistedRepos((prev) => [...prev, repoWithLabel]);
    setShowRepoLabel(null);
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

          {userData && (() => {
            const linkedInMatch = userData.bio && userData.bio.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w-]+/i);
            const linkedInUrl = linkedInMatch
              ? (linkedInMatch[0].startsWith('http') ? linkedInMatch[0] : 'https://' + linkedInMatch[0])
              : null;

            return (
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
                  <h4 className="contact-info-title">Contact Info</h4>
                  <div className="contact-info">
                    {userData.blog && (
                      <a
                        href={
                          userData.blog.startsWith("http")
                            ? userData.blog
                            : `https://${userData.blog}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="contact-item"
                        title={userData.blog}
                      >
                        <span role="img" aria-label="website">🌐</span> <span className="contact-text">{userData.blog}</span>
                      </a>
                    )}
                    {userData.email && (
                      <a
                        href={`mailto:${userData.email}`}
                        className="contact-item"
                        title={userData.email}
                      >
                        <span role="img" aria-label="email">📧</span> <span className="contact-text">{userData.email}</span>
                      </a>
                    )}
                    {linkedInUrl && (
                      <a
                        href={linkedInUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="contact-item"
                      >
                        <span role="img" aria-label="linkedin">💼</span> <span className="contact-text">LinkedIn</span>
                      </a>
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
                    {userData.twitter_username && (
                      <div className="detail-item">
                        <span className="detail-icon">🐦</span>
                        <a
                          href={`https://twitter.com/${userData.twitter_username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="detail-link"
                        >
                          @{userData.twitter_username}
                        </a>
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

                  {repos.length > 0 && getDeveloperSkills(repos).length > 0 && (
                    <div className="skills-section">
                      <h4>Skills & Technologies</h4>
                      <div className="skills-tags">
                        {getDeveloperSkills(repos).map(([lang, count]) => (
                          <span key={lang} className="skill-tag">
                            {lang}
                            <span className="skill-count">{count}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

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

                  <button
                    className={`shortlist-dev-btn ${shortlistedDevs.some((d) => d.login === userData.login) ? "shortlisted" : ""}`}
                    onClick={() => handleShortlistDev(userData)}
                  >
                    {shortlistedDevs.some((d) => d.login === userData.login)
                      ? "Remove from Shortlist"
                      : "Shortlist Developer"}
                  </button>

                  {showReview === userData.login && (
                    <div className="review-section">
                      <h3>Review Developer</h3>
                      <div className="review-field">
                        <label>Role:</label>
                        <select
                          value={selectedRole}
                          onChange={(e) => {
                            setSelectedRole(e.target.value);
                            setSelectedSkills([]);
                          }}
                        >
                          <option value="">Select a role</option>
                          {roleOptions.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
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
                  )}
                </div>
              </div>
            );
          })()}

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
                      <button
                        className={`shortlist-repo-btn ${shortlistedRepos.some((r) => r.id === repo.id) ? "shortlisted" : ""}`}
                        onClick={() => handleShortlistRepo(repo)}
                      >
                        {shortlistedRepos.some((r) => r.id === repo.id)
                          ? "Remove"
                          : "Shortlist Repo"}
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
                            <button
                              className="confirm-btn"
                              onClick={() => confirmRepoLabel(repo)}
                            >
                              Confirm
                            </button>
                            <button
                              className="cancel-btn"
                              onClick={() => setShowRepoLabel(null)}
                            >
                              Cancel
                            </button>
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
    </Sidebar>
  );
}

export default Developers;
