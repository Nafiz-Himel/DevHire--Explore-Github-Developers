import { useState, useEffect } from "react";
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

function Developers({ onSignOut, onNavigate }) {
  const [username, setUsername] = useState("");
  const [userData, setUserData] = useState(null);
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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
        const results = await Promise.all(
          popularUsernames.map((u) =>
            fetch(`https://api.github.com/users/${u}`).then((r) => r.json()),
          ),
        );
        setPopularDevs(results.filter((dev) => !dev.message));
      } catch (err) {
        console.error("Failed to fetch popular developers", err);
      }
    };
    fetchPopular();
  }, []);

  const performSearch = async (searchTerm) => {
    const term = searchTerm || username;
    if (!term?.trim()) return;

    setLoading(true);
    setError("");
    setUserData(null);
    setRepos([]);

    try {
      const userRes = await fetch(`https://api.github.com/users/${term}`);

      if (userRes.status === 403) {
        throw new Error("API rate limit exceeded. Please try again later.");
      }
      if (!userRes.ok) throw new Error("User not found");

      const userData = await userRes.json();

      const reposRes = await fetch(
        `https://api.github.com/users/${term}/repos?per_page=100`,
      );
      const reposData = await reposRes.json();

      setUserData(userData);
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

  const handleNavigate = (page) => {
    if (onNavigate) onNavigate(page);
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
                  <div className="contact-info">
                    {userData.email && (
                      <a
                        href={`mailto:${userData.email}`}
                        className="contact-item"
                      >
                        📧 {userData.email}
                      </a>
                    )}
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
                      >
                        🌐 {userData.blog}
                      </a>
                    )}
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
