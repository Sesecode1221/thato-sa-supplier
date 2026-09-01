import React from 'react';
import { useAuth } from '../AuthContext';

const BASE_TABS = [
  { tab: 'landing', icon: 'fa-home', label: 'Home' },
  { tab: 'marketplace', icon: 'fa-th-large', label: 'Products' },
  { tab: 'ai-insights', icon: 'fa-brain', label: 'AI Market' },
  { tab: 'suppliers', icon: 'fa-store', label: 'Suppliers' },
];

export default function MobileNav({ activeTab, setActiveTab, onLogin }) {
  const { user } = useAuth();

  const tabs = [
    ...BASE_TABS,
    user
      ? (user.role === 'supplier' || user.role === 'admin'
          ? { tab: 'dashboard', icon: 'fa-tachometer-alt', label: 'Hub' }
          : null)
      : { tab: '__login', icon: 'fa-user', label: 'Login' }
  ].filter(Boolean);

  const handleTab = (tab) => {
    if (tab === '__login') { onLogin(); return; }
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
