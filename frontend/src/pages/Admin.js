import React from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  GET_ALL_SUPPLIERS_ADMIN, GET_METRICS,
  UPDATE_SUPPLIER_STATUS, UPDATE_SUPPLIER_PERMISSIONS, DELETE_SUPPLIER
} from '../graphql/operations';
import { useAuth } from '../AuthContext';
import { useToast } from '../components/Toast';

export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: supData, loading, refetch } = useQuery(GET_ALL_SUPPLIERS_ADMIN);
  const { data: metData } = useQuery(GET_METRICS);

  const [updateStatus] = useMutation(UPDATE_SUPPLIER_STATUS);
  const [updatePerms] = useMutation(UPDATE_SUPPLIER_PERMISSIONS);
  const [deleteSupplier] = useMutation(DELETE_SUPPLIER);

  if (!user || user.role !== 'admin') {
    return <div className="page-container"><div className="empty-state"><i className="fas fa-lock"></i><p>Admin access only.</p></div></div>;
  }

  const suppliers = supData?.suppliers || [];
  const metrics = metData?.metrics;
  const active = suppliers.filter(s => s.status === 'active').length;
  const pending = suppliers.filter(s => s.status === 'pending').length;

  const handleStatus = async (id, status) => {
    try {
      await updateStatus({ variables: { id, status } });
      toast(`Status updated to ${status}`);
      refetch();
    } catch (e) { toast(e.message, 'error'); }
  };

  const handlePremium = async (id, isPremium) => {
    try {
      await updatePerms({ variables: { id, isPremium } });
      toast(isPremium ? 'Premium granted ⭐' : 'Premium removed');
      refetch();
    } catch (e) { toast(e.message, 'error'); }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete supplier and all their products?')) return;
    try {
      await deleteSupplier({ variables: { id } });
      toast('Supplier deleted', 'error');
      refetch();
    } catch (e) { toast(e.message, 'error'); }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">👑 Admin Panel</h1>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-number" style={{ color: '#3b82f6' }}>{suppliers.length}</div>
          <div className="stat-label">Total Suppliers</div>
          <div className="stat-sub">{active} active</div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-number" style={{ color: 'var(--yellow)' }}>{pending}</div>
          <div className="stat-label">Pending Approval</div>
        </div>
        <div className="stat-card green">
          <div className="stat-number" style={{ color: '#22c55e' }}>{metrics?.totalQuotes || 0}</div>
          <div className="stat-label">Quote Requests</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-number" style={{ color: '#a855f7' }}>{metrics?.totalMessages || 0}</div>
          <div className="stat-label">Messages Sent</div>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="card-section">
        <div className="card-section-title">
          <span>🔐 Supplier Management</span>
        </div>
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading suppliers...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Location</th>
                  <th>Products</th>
                  <th>Status</th>
                  <th>Premium</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <img src={s.logo || 'https://picsum.photos/40/40'} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                          onError={e => { e.target.src = 'https://picsum.photos/40/40'; }} />
                        <div>
                          <div style={{ fontWeight: 600 }}>{s.companyName}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{s.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{s.location}</td>
                    <td style={{ textAlign: 'center' }}>{s.productCount}</td>
                    <td>
                      <select
                        className="input" style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.78rem' }}
                        value={s.status}
                        onChange={e => handleStatus(s.id, e.target.value)}
                      >
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </td>
                    <td>
                      {s.isPremium ? (
                        <button style={{ background: 'none', color: 'var(--yellow)', fontSize: '0.8rem', fontWeight: 700 }}
                          onClick={() => handlePremium(s.id, false)}>⭐ Premium</button>
                      ) : (
                        <button style={{ background: 'none', color: 'var(--text-dim)', fontSize: '0.78rem' }}
                          onClick={() => handlePremium(s.id, true)}>Grant ⭐</button>
                      )}
                    </td>
                    <td>
                      <button style={{ background: 'none', color: 'var(--error)', fontSize: '0.82rem', marginLeft: '0.5rem' }}
                        onClick={() => handleDelete(s.id)}>
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Metrics */}
      <div className="card-section">
        <div className="card-section-title">📊 Site Metrics</div>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', fontSize: '0.875rem' }}>
          <MetricItem icon="fa-eye" label="Total Visits" value={metrics?.totalVisits || 0} />
          <MetricItem icon="fa-envelope" label="Quote Requests" value={metrics?.totalQuotes || 0} />
          <MetricItem icon="fa-comment" label="Messages" value={metrics?.totalMessages || 0} />
        </div>
      </div>
    </div>
  );
}

function MetricItem({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg3)', padding: '0.75rem 1.25rem', borderRadius: 8, border: '1px solid var(--border)' }}>
      <i className={`fas ${icon}`} style={{ color: 'var(--yellow)', fontSize: '1.2rem' }}></i>
      <div>
        <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{value.toLocaleString()}</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{label}</div>
      </div>
    </div>
  );
}
