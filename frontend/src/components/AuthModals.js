import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { LOGIN, REGISTER } from '../graphql/operations';
import { useAuth } from '../AuthContext';
import Modal from './Modal';
import { useToast } from './Toast';

export function LoginModal({ onClose, onSwitchRegister }) {
  const { toast } = useToast();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [doLogin, { loading }] = useMutation(LOGIN);

  const handle = async e => {
    e.preventDefault();
    try {
      const { data } = await doLogin({ variables: { email, password } });
      login(data.login.token, data.login.user);
      toast(`Welcome ${data.login.user.name}`);
      onClose();
    } catch (err) { toast(err.message, 'error'); }
  };

  return (
    <Modal title="Login" onClose={onClose}>
      <form onSubmit={handle}>
        <div className="input-group">
          <label className="input-label">Email</label>
          <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@company.com" required autoFocus />
        </div>
        <div className="input-group">
          <label className="input-label">Password</label>
          <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
        </div>
        <button type="submit" className="btn-yellow" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
      
      <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
        No account?{' '}
        <button style={{ background: 'none', color: 'var(--yellow)', fontWeight: 600 }} onClick={onSwitchRegister}>Register here</button>
      </p>
    </Modal>
  );
}

export function RegisterModal({ onClose, onSwitchLogin }) {
  const { toast } = useToast();
  const { login } = useAuth();
  const [role, setRole] = useState('buyer');
  const [form, setForm] = useState({ name: '', email: '', password: '', company: '', location: '', phone: '', description: '' });
  const [doRegister, { loading }] = useMutation(REGISTER);

  const f = k => e => setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handle = async e => {
    e.preventDefault();
    if (role === 'supplier' && !form.company) { toast('Company name required', 'error'); return; }
    try {
      const { data } = await doRegister({ variables: { ...form, role } });
      login(data.register.token, data.register.user);
      toast('Account created!');
      onClose();
    } catch (err) { toast(err.message, 'error'); }
  };

  return (
    <Modal title="Create Account" onClose={onClose}>
      <form onSubmit={handle}>
        <div className="input-group">
          <label className="input-label">Account Type</label>
          <select className="input" value={role} onChange={e => setRole(e.target.value)}>
            <option value="buyer">Buyer</option>
            <option value="supplier">Supplier</option>
          </select>
        </div>
        <div className="input-group">
          <label className="input-label">Full Name *</label>
          <input className="input" value={form.name} onChange={f('name')} placeholder="Your full name" required />
        </div>
        <div className="input-group">
          <label className="input-label">Email *</label>
          <input className="input" type="email" value={form.email} onChange={f('email')} placeholder="email@company.com" required />
        </div>
        <div className="input-group">
          <label className="input-label">Password *</label>
          <input className="input" type="password" value={form.password} onChange={f('password')} placeholder="Min. 4 characters" required minLength={4} />
        </div>
        {role === 'supplier' && (
          <>
            <div className="input-group">
              <label className="input-label">Company Name *</label>
              <input className="input" value={form.company} onChange={f('company')} placeholder="e.g. Urban Apparel SA" required />
            </div>
            <div className="input-group">
              <label className="input-label">Location</label>
              <input className="input" value={form.location} onChange={f('location')} placeholder="City, Province" />
            </div>
            <div className="input-group">
              <label className="input-label">Phone</label>
              <input className="input" value={form.phone} onChange={f('phone')} placeholder="+27 11 000 0000" />
            </div>
            <div className="input-group">
              <label className="input-label">Company Description</label>
              <textarea className="input" rows="2" value={form.description} onChange={f('description')} placeholder="What do you supply?" style={{ resize: 'vertical' }} />
            </div>
          </>
        )}
        <button type="submit" className="btn-yellow" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>
      <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
        Already have an account?{' '}
        <button style={{ background: 'none', color: 'var(--yellow)', fontWeight: 600 }} onClick={onSwitchLogin}>Login</button>
      </p>
    </Modal>
  );
}
