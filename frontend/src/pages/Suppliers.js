import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_SUPPLIERS, SEND_MESSAGE, GET_SUPPLIER_PRODUCTS } from '../graphql/operations';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';

export default function Suppliers() {
  const { toast } = useToast();
  const { data, loading } = useQuery(GET_SUPPLIERS, { variables: { status: 'active' } });
  const [contactSupplier, setContactSupplier] = useState(null);
  const [productsSupplier, setProductsSupplier] = useState(null);
  const [msgText, setMsgText] = useState('');
  const [sendMessage, { loading: sending }] = useMutation(SEND_MESSAGE);

  const { data: prodData } = useQuery(GET_SUPPLIER_PRODUCTS, {
    variables: { supplierId: productsSupplier?.id || '' },
    skip: !productsSupplier
  });

  const handleSend = async e => {
    e.preventDefault();
    if (!msgText.trim()) { toast('Please enter a message', 'error'); return; }
    try {
      await sendMessage({ variables: { supplierId: contactSupplier.id, message: msgText } });
      toast(`Message sent to ${contactSupplier.companyName}`);
      setContactSupplier(null);
      setMsgText('');
    } catch (e) { toast(e.message, 'error'); }
  };

  const suppliers = data?.suppliers || [];

  return (
    <div className="page-container">
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>📦 Trusted B2B Suppliers in SA</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        {suppliers.length} verified suppliers
      </p>

      {loading ? (
        <div className="suppliers-grid">{[...Array(6)].map((_, i) => <SkeletonSupplier key={i} />)}</div>
      ) : suppliers.length === 0 ? (
        <div className="empty-state"><i className="fas fa-store"></i><p>No active suppliers yet.</p></div>
      ) : (
        <div className="suppliers-grid">
          {suppliers.map(s => (
            <div className="supplier-card" key={s.id}>
              <div className="supplier-card-top">
                <img className="supplier-logo" src={s.logo || 'https://picsum.photos/100/100'} alt={s.companyName}
                  onError={e => { e.target.src = 'https://picsum.photos/100/100'; }} />
                <div>
                  <div className="supplier-name">
                    {s.companyName}
                    {s.isPremium && <span className="premium-badge">⭐ PREMIUM</span>}
                  </div>
                  <div className="supplier-loc"><i className="fas fa-map-marker-alt" style={{ marginRight: 4, color: 'var(--yellow)' }}></i>{s.location}</div>
                </div>
              </div>
              <p className="supplier-desc">{s.description}</p>
              <div className="supplier-stats">
                <span><i className="fas fa-box" style={{ marginRight: 4 }}></i>{s.productCount} products</span>
                <span><i className="fas fa-phone" style={{ marginRight: 4 }}></i>{s.phone}</span>
              </div>
              <div className="supplier-actions">
                <button className="btn-contact" onClick={() => { setContactSupplier(s); setMsgText(''); }}>
                  <i className="fas fa-comment"></i> Contact
                </button>
                <button className="btn-products-link" onClick={() => setProductsSupplier(s)}>
                  <i className="fas fa-boxes"></i> Products
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Contact Modal */}
      {contactSupplier && (
        <Modal title={`Contact ${contactSupplier.companyName}`} onClose={() => setContactSupplier(null)}>
          <form onSubmit={handleSend}>
            <div className="input-group">
              <label className="input-label">Message</label>
              <textarea className="input" rows="4" value={msgText} onChange={e => setMsgText(e.target.value)}
                placeholder="Describe what you need..." style={{ resize: 'vertical' }} required />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn-yellow" disabled={sending} style={{ flex: 1 }}>
                {sending ? 'Sending...' : 'Send Message'}
              </button>
              <button type="button" className="btn-outline" onClick={() => setContactSupplier(null)}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Products Modal */}
      {productsSupplier && (
        <Modal title={`${productsSupplier.companyName} — Products`} onClose={() => setProductsSupplier(null)} large>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {(prodData?.products || []).length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No products listed yet.</p>
            ) : (
              (prodData?.products || []).map(p => (
                <div key={p.id} style={{ display: 'flex', gap: '0.75rem', background: 'var(--bg3)', borderRadius: 6, padding: '0.75rem', border: '1px solid var(--border)' }}>
                  <img src={p.image} alt={p.name} style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: 4 }}
                    onError={e => { e.target.src = 'https://picsum.photos/100/100?grayscale'; }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{p.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.category} | MOQ {p.moq}</div>
                    <div style={{ color: 'var(--yellow)', fontWeight: 700, fontSize: '0.875rem', marginTop: '0.2rem' }}>{p.priceRange}</div>
                  </div>
                </div>
              ))
            )}
          </div>
          <button className="btn-outline btn-sm" style={{ marginTop: '1rem', width: '100%' }} onClick={() => setProductsSupplier(null)}>Close</button>
        </Modal>
      )}
    </div>
  );
}

function SkeletonSupplier() {
  return (
    <div className="supplier-card" style={{ opacity: 0.3 }}>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem' }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--bg3)' }}></div>
        <div style={{ flex: 1 }}>
          <div style={{ height: 14, background: 'var(--bg3)', borderRadius: 4, marginBottom: 6, width: '70%' }}></div>
          <div style={{ height: 10, background: 'var(--bg3)', borderRadius: 4, width: '50%' }}></div>
        </div>
      </div>
      <div style={{ height: 10, background: 'var(--bg3)', borderRadius: 4, marginBottom: 4 }}></div>
      <div style={{ height: 10, background: 'var(--bg3)', borderRadius: 4, width: '80%' }}></div>
    </div>
  );
}
