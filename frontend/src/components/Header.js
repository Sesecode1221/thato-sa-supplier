import React, { useState } from 'react';
import { useAuth } from '../AuthContext';

export default function Header({ activeTab, setActiveTab, onLogin, onRegister }) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = (tab) => { setActiveTab(tab); setMobileOpen(false); };

  return (
    <header className="header">
      <div className="logo" onClick={() => nav('landing')}>
        <span className="logo-sa">SA</span>
        <span className="logo-suppliers">suppliers</span>
        <span className="logo-dot">.</span>
        <span className="logo-com">com</span>
      </div>

      <nav className="nav">
        {[['landing','Home'],['marketplace','Products'],['how-it-works','How It Works'],['about','About Us'],['contact','Contact Us']].map(([tab, label]) => (
          <button key={tab} className={`nav-btn${activeTab === tab ? ' active' : ''}`} onClick={() => nav(tab)}>{label}</button>
        ))}
        {(user?.role === 'supplier' || user?.role === 'admin') && (
          <button className={`nav-btn${activeTab === 'dashboard' ? ' active' : ''}`} onClick={() => nav('dashboard')}>Supplier Hub</button>
        )}
        {user?.role === 'admin' && (
          <button className={`nav-btn${activeTab === 'admin' ? ' active' : ''}`} onClick={() => nav('admin')}>Admin</button>
        )}
      </nav>

      <div className="header-actions">
        {user ? (
          <>
            <button className="btn-icon" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <i className="fas fa-user-circle"></i> {user.name?.split(' ')[0]}
            </button>
            <button className="btn-outline btn-sm" onClick={logout}>Logout</button>
          </>
        ) : (
          <>
            <button className="btn-icon" onClick={onLogin}><i className="fas fa-user"></i> Login</button>
            <button className="btn-yellow btn-sm" style={{ position: 'relative' }}>
              <i className="fas fa-shopping-cart"></i>
              <span className="cart-badge">0</span>
            </button>
          </>
        )}
        {/* Mobile hamburger */}
        <button className="btn-icon" style={{ display: 'none' }} onClick={() => setMobileOpen(!mobileOpen)}
          id="hamburger"><i className="fas fa-bars"></i></button>
      </div>
    </header>
  );
}
