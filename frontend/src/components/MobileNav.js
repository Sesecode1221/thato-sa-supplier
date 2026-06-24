import React from 'react';
import { useAuth } from '../AuthContext';

const BASE_TABS = [
  { tab: 'landing', icon: 'fa-home', label: 'Home' },
  { tab: 'marketplace', icon: 'fa-th-large', label: 'Products' },
  { tab: 'suppliers', icon: 'fa-store', label: 'Suppliers' },
];

export default function MobileNav({ activeTab, setActiveTab, onLogin }) {
  const { user, logout } = useAuth();

  const tabs = [
    ...BASE_TABS,
    user
      ? (user.role === 'supplier' || user.role === 'admin'
          ? { tab: 'dashboard', icon: 'fa-tachometer-alt', label: 'Hub' }
          : null)
      : { tab: '__login', icon: 'fa-user', label: 'Login' },
    { tab: '__whatsapp', icon: 'fa-whatsapp fab', label: 'WhatsApp' },
  ].filter(Boolean);

  const handleTab = (tab) => {
    if (tab === '__login') { onLogin(); return; }
    if (tab === '__whatsapp') { window.open('https://wa.me/27710000000', '_blank'); return; }
    setActiveTab(tab);
  };

  return (
    <nav className="mobile-nav">
      <div className="mobile-nav-items">
        {tabs.map(({ tab, icon, label }) => (
          <button
            key={tab}
            className={`mobile-nav-item${activeTab === tab ? ' active' : ''}`}
            onClick={() => handleTab(tab)}
          >
            <i className={`fas ${icon}`}></i>
            <span>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
