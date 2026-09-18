import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './sidebar.css';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar = ({ isOpen = false, onClose }: SidebarProps) => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    if (onClose) onClose();
    await logout();
  };

  const getInitials = () => {
    if (!user) return 'U';
    const first = user.name ? user.name.charAt(0).toUpperCase() : '';
    const last = user.last_name ? user.last_name.charAt(0).toUpperCase() : '';
    return `${first}${last}` || 'U';
  };

  return (
    <div className={`sidebar${isOpen ? ' sidebar-open' : ''}`}>
      {/* Brand */}
      <div className="sidebar-header">
        <h2>Almacenamiento</h2>
        <button className="sidebar-close-btn" onClick={onClose} aria-label="Cerrar menú">
          ×
        </button>
      </div>

      {/* Section label */}
      <p className="sidebar-section-label">Navegación</p>

      {/* Nav links */}
      <nav className="sidebar-nav">
        <ul>
          <li>
            <NavLink
              to="/"
              end
              className={({ isActive }) => (isActive ? 'active' : '')}
              onClick={onClose}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              Recetas
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/ingredientes"
              className={({ isActive }) => (isActive ? 'active' : '')}
              onClick={onClose}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                />
              </svg>
              Ingredientes
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/perfil"
              className={({ isActive }) => (isActive ? 'active' : '')}
              onClick={onClose}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              Perfil
            </NavLink>
          </li>
        </ul>
      </nav>

      {/* Footer / User Session */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{getInitials()}</div>
          <div className="sidebar-user-info">
            <p className="sidebar-user-name">
              {user ? `${user.name} ${user.last_name || ''}` : 'Usuario'}
            </p>
            <p className="sidebar-user-role">{user?.email || 'Sesión activa'}</p>
          </div>
          <button
            className="sidebar-logout-btn"
            onClick={handleLogout}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;