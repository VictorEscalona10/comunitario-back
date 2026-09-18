import { useState } from 'react';
import Sidebar from './components/sidebar';
import Ingredients from './pages/Ingredients';
import './App.css';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Recipes from './pages/Recipes';
import Profile from './pages/Profile';
import Login from './pages/Login';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Layout principal protegido para usuarios autenticados
function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-container">
      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="main-content">
        {/* Mobile topbar */}
        <div className="mobile-topbar">
          <button
            className="menu-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="mobile-topbar-title">Almacenamiento</span>
        </div>

        {/* Main page content */}
        <div className="page-wrapper">
          <Routes>
            <Route path="/" element={<Recipes />} />
            <Route path="/ingredientes" element={<Ingredients />} />
            <Route path="/perfil" element={<Profile />} />
            <Route
              path="*"
              element={
                <div className="empty-state" style={{ minHeight: '60vh' }}>
                  <p style={{ fontSize: '3rem', fontWeight: 700, color: '#4F46E5' }}>404</p>
                  <p style={{ color: '#6B7280' }}>Página no encontrada</p>
                </div>
              }
            />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: '10px',
            fontSize: '0.875rem',
            fontFamily: 'Inter, sans-serif',
          },
        }}
      />
      <Routes>
        {/* Ruta pública de Autenticación */}
        <Route path="/login" element={<Login />} />

        {/* Rutas protegidas dentro del Dashboard */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}

export default App;