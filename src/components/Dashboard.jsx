import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './Dashboard.css';

function Dashboard({ onSignOut, onNavigate }) {
  const [collapsed, setCollapsed] = useState(false);
  const [stats, setStats] = useState({
    searched: 0,
    shortlisted: 0,
    repos: 0
  });

  useEffect(() => {
    const savedShortlist = JSON.parse(localStorage.getItem('devShortlist') || '[]');
    const totalRepos = savedShortlist.reduce((acc, curr) => acc + (curr.public_repos || 0), 0);
    
    const savedSearchCount = parseInt(localStorage.getItem('searchCount') || '0');

    setStats({
      searched: savedSearchCount, 
      shortlisted: savedShortlist.length,
      repos: totalRepos
    });
  }, []);

  const barData = [
    { name: 'Searched', value: stats.searched },
    { name: 'Shortlisted', value: stats.shortlisted },
    { name: 'Repositories', value: stats.repos },
  ];

  const pieData = [
    { name: 'Searched', value: stats.searched },
    { name: 'Shortlisted', value: stats.shortlisted },
    { name: 'Repositories', value: stats.repos },
  ];

  const COLORS = ['#4db6ac', '#26a69a', '#00796b'];

  return (
    <div className={`dashboard-shell ${collapsed ? 'collapsed' : ''}`}>
      <div className={`side ${collapsed ? 'collapsed' : ''}`}>
        <div className="side-logo">
          <div className="logo-mark">DH</div>
          <div className="logo-copy">DevHire</div>
        </div>

        <div className="side-nav">
          <button type="button" className="nav-link active" onClick={() => onNavigate('dashboard')}>
            <span className="nav-icon">🏠</span>
            {!collapsed && <span className="nav-label">Dashboard</span>}
          </button>
          <button type="button" className="nav-link" onClick={() => onNavigate('developers')}>
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
          <button type="button" className="footer-button logout" onClick={onSignOut}>
            <span className="nav-icon">🔓</span>
            {!collapsed && <span className="footer-label">Logout</span>}
          </button>
        </div>
      </div>

      <div className="dashboard">
        <div className="dashboard-nav">
          <div className="dashboard-title">Dashboard</div>
          <div className="dashboard-logo">DH</div>
        </div>

        <div className="dashboard-main">
          <div className="dashboard-heading">
            <h1>Dashboard</h1>
            <p>Overview of your recruitment activity and shortlisted candidates.</p>
          </div>

          <div className="dashboard-cards">
            <article className="dashboard-card">
              <div className="card-content">
                <div className="card-info">
                  <h3>TOTAL SEARCHED USERS</h3>
                  <p className="card-value">{stats.searched}</p>
                </div>
                <div className="card-icon-bg">🔎</div>
              </div>
            </article>
            <article className="dashboard-card">
              <div className="card-content">
                <div className="card-info">
                  <h3>TOTAL SHORTLISTED CANDIDATES</h3>
                  <p className="card-value">{stats.shortlisted}</p>
                </div>
                <div className="card-icon-bg">⭐</div>
              </div>
            </article>
            <article className="dashboard-card">
              <div className="card-content">
                <div className="card-info">
                  <h3>TOTAL REPOSITORIES (SHORTLIST)</h3>
                  <p className="card-value">{stats.repos}</p>
                </div>
                <div className="card-icon-bg">📁</div>
              </div>
            </article>
          </div>

          <div className="charts-container">
            <div className="chart-box">
              <h3>ACTIVITY BREAKDOWN</h3>
              <p>Comparative view of all metrics</p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="value" fill="#4db6ac" radius={[4, 4, 0, 0]} barSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-box">
              <h3>DISTRIBUTION</h3>
              <p>Proportional share across categories</p>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="pie-stats">
                <div className="pie-stat-item"><strong>{stats.searched}</strong><span>Searched</span></div>
                <div className="pie-stat-item"><strong>{stats.shortlisted}</strong><span>Shortlisted</span></div>
                <div className="pie-stat-item"><strong>{stats.repos}</strong><span>Repos</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;