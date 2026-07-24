import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const navItems = [
  { path: '/', label: 'Tableau de bord', icon: '📊', exact: true },
  { path: '/militants', label: 'Militants', icon: '👥' },
  { path: '/sections', label: 'Sections', icon: '🏛️' },
  { path: '/cellules', label: 'Cellules', icon: '🏢' },
];

const pageTitles = {
  '/': 'Tableau de bord',
  '/militants': 'Gestion des Militants',
  '/sections': 'Gestion des Sections',
  '/cellules': 'Gestion des Cellules',
};

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pageTitle = pageTitles[location.pathname] || 'SGM';

  return (
    <div className="dashboard-layout">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>🗳️ SGM</h2>
          <p className="sidebar-subtitle">Gestion des Militants</p>
        </div>

        <nav className="nav-links">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="user-details">
              <span className="user-name">{user?.username || 'Utilisateur'}</span>
              <span className="user-role">{user?.role || 'user'}</span>
            </div>
          </div>
          <button className="btn btn-logout" onClick={logout}>
            🚪 Déconnexion
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button className="hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>
              ☰
            </button>
            <h1>{pageTitle}</h1>
          </div>
          <div className="topbar-right">
            <span className="topbar-user">
              Bienvenue, <strong>{user?.username}</strong>
            </span>
          </div>
        </header>

        <div className="content-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
