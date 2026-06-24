import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import Header from './components/Header';
import MobileNav from './components/MobileNav';
import { ToastContainer, useToast } from './components/Toast';
import { LoginModal, RegisterModal } from './components/AuthModals';
import Landing from './pages/Landing';
import Marketplace from './pages/Marketplace';
import Suppliers from './pages/Suppliers';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import { HowItWorks, About, Contact } from './pages/StaticPages';

export default function App() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('landing');
  const [authModal, setAuthModal] = useState(null); // 'login' | 'register'

  const navTo = (tab) => {
    if (tab === 'dashboard' && (!user || (user.role !== 'supplier' && user.role !== 'admin'))) {
      toast('Supplier login required', 'error'); setAuthModal('login'); return;
    }
    if (tab === 'admin' && user?.role !== 'admin') {
      toast('Admin access only', 'error'); return;
    }
    setActiveTab(tab);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#111' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: 'var(--yellow)' }}></i>
          <div style={{ marginTop: '0.75rem', fontSize: '0.875rem' }}>Loading SAsuppliers...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header
        activeTab={activeTab}
        setActiveTab={navTo}
        onLogin={() => setAuthModal('login')}
        onRegister={() => setAuthModal('register')}
      />

      <main>
        {activeTab === 'landing' && <Landing setActiveTab={navTo} onRegister={() => setAuthModal('register')} />}
        {activeTab === 'marketplace' && <Marketplace />}
        {activeTab === 'suppliers' && <Suppliers />}
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'admin' && <Admin />}
        {activeTab === 'how-it-works' && <HowItWorks setActiveTab={navTo} onRegister={() => setAuthModal('register')} />}
        {activeTab === 'about' && <About setActiveTab={navTo} />}
        {activeTab === 'contact' && <Contact />}
      </main>

      <MobileNav activeTab={activeTab} setActiveTab={navTo} onLogin={() => setAuthModal('login')} />

      {authModal === 'login' && (
        <LoginModal
          onClose={() => setAuthModal(null)}
          onSwitchRegister={() => setAuthModal('register')}
        />
      )}
      {authModal === 'register' && (
        <RegisterModal
          onClose={() => setAuthModal(null)}
          onSwitchLogin={() => setAuthModal('login')}
        />
      )}

      <ToastContainer />
    </>
  );
}
