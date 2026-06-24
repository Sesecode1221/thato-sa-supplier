import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_SUPPLIER_PRODUCTS, ADD_PRODUCT, UPDATE_PRODUCT, DELETE_PRODUCT } from '../graphql/operations';
import { useAuth } from '../AuthContext';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';

const CATS = ['Clothing', 'PPE', 'Furniture', 'Packaging', 'Chemicals', 'Electronics', 'Food & Beverage', 'General'];
const MAX_PRODUCTS = 25;

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const supplierId = user?.supplier?.id;

  const { data, loading, refetch } = useQuery(GET_SUPPLIER_PRODUCTS, {
    variables: { supplierId: supplierId || '' }, skip: !supplierId
  });

  const [addProduct] = useMutation(ADD_PRODUCT);
  const [updateProduct] = useMutation(UPDATE_PRODUCT);
  const [deleteProduct] = useMutation(DELETE_PRODUCT);

  const [showAdd, setShowAdd] = useState(false);
  const [editProd, setEditProd] = useState(null);
  const [form, setForm] = useState({ name: '', category: 'General', description: '', priceRange: '', moq: 50, image: '' });

  const products = data?.products || [];
  const usagePercent = Math.min((products.length / MAX_PRODUCTS) * 100, 100);

  const openAdd = () => { setForm({ name: '', category: 'General', description: '', priceRange: '', moq: 50, image: '' }); setEditProd(null); setShowAdd(true); };
  const openEdit = (p) => { setForm({ name: p.name, category: p.category, description: p.description, priceRange: p.priceRange, moq: p.moq, image: p.image }); setEditProd(p); setShowAdd(true); };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name.trim()) { toast('Product name required', 'error'); return; }
    try {
      if (editProd) {
        await updateProduct({ variables: { id: editProd.id, ...form, moq: parseInt(form.moq) } });
        toast('Product updated');
      } else {
        await addProduct({ variables: { ...form, moq: parseInt(form.moq) } });
        toast('Product added!');
      }
      setShowAdd(false);
      refetch();
    } catch (err) { toast(err.message, 'error'); }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this product permanently?')) return;
    try {
      await deleteProduct({ variables: { id } });
      toast('Product deleted', 'error');
      refetch();
    } catch (e) { toast(e.message, 'error'); }
  };

  if (!user || user.role !== 'supplier') {
    return <div className="page-container"><div className="empty-state"><i className="fas fa-lock"></i><p>Supplier login required to access the Hub.</p></div></div>;
  }

  const supplier = user.supplier;

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>⚙️ {supplier?.companyName || user.name} Hub</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>Manage your products and profile</p>
        </div>
        <button className="btn-yellow" onClick={openAdd} disabled={products.length >= MAX_PRODUCTS}>
          <i className="fas fa-plus-circle"></i> Add New Product
        </button>
      </div>

      {/* Stats */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Product Listings</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{products.length} / {MAX_PRODUCTS}</div>
        </div>
        <div className="limit-bar"><div className="limit-fill" style={{ width: `${usagePercent}%` }}></div></div>
        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
          <StatPill icon="fa-box" label="Products" value={products.length} />
          <StatPill icon="fa-map-marker-alt" label="Location" value={supplier?.location || '—'} />
          <StatPill icon="fa-circle" label="Status" value={<span className={`badge badge-${supplier?.status}`}>{supplier?.status}</span>} />
          {supplier?.isPremium && <StatPill icon="fa-star" label="Tier" value={<span style={{ color: 'var(--yellow)' }}>⭐ Premium</span>} />}
        </div>
      </div>

      {/* Products grid */}
      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading products...</p>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-box-open"></i>
          <p>No products yet. Start listing your bulk inventory.</p>
          <button className="btn-yellow" style={{ marginTop: '1rem' }} onClick={openAdd}>Add First Product</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {products.map(p => (
            <div key={p.id} style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '1rem', display: 'flex', gap: '0.75rem' }}>
              <img src={p.image} alt={p.name} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
                onError={e => { e.target.src = 'https://picsum.photos/100/100?grayscale'; }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{p.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.category} | MOQ {p.moq}</div>
                <div style={{ color: 'var(--yellow)', fontWeight: 700, fontSize: '0.85rem', margin: '0.25rem 0' }}>{p.priceRange}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.description}</div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button style={{ background: 'none', color: 'var(--info)', fontSize: '0.78rem', fontWeight: 600 }} onClick={() => openEdit(p)}>
                    <i className="fas fa-edit"></i> Edit
                  </button>
                  <button style={{ background: 'none', color: 'var(--error)', fontSize: '0.78rem', fontWeight: 600 }} onClick={() => handleDelete(p.id)}>
                    <i className="fas fa-trash"></i> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showAdd && (
        <Modal title={editProd ? '✏️ Edit Product' : '📦 Add New Product'} onClose={() => setShowAdd(false)} large>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group" style={{ gridColumn: '1/-1' }}>
                <label className="input-label">Product Name *</label>
                <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Premium Cotton T-Shirts (Bulk)" required />
              </div>
              <div className="input-group">
                <label className="input-label">Category</label>
                <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">MOQ (units)</label>
                <input className="input" type="number" min="1" value={form.moq} onChange={e => setForm(f => ({ ...f, moq: e.target.value }))} />
              </div>
              <div className="input-group" style={{ gridColumn: '1/-1' }}>
                <label className="input-label">Description</label>
                <textarea className="input" rows="2" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Product details..." style={{ resize: 'vertical' }} />
              </div>
              <div className="input-group">
                <label className="input-label">Price Range</label>
                <input className="input" value={form.priceRange} onChange={e => setForm(f => ({ ...f, priceRange: e.target.value }))} placeholder="e.g. R 45 - R 85" />
              </div>
              <div className="input-group">
                <label className="input-label">Image URL</label>
                <input className="input" value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))} placeholder="https://..." />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn-yellow" style={{ flex: 1 }}>{editProd ? 'Update Product' : 'Add Product'}</button>
              <button type="button" className="btn-outline" onClick={() => setShowAdd(false)}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function StatPill({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
      <i className={`fas ${icon}`} style={{ color: 'var(--yellow)', opacity: 0.8 }}></i>
      <span style={{ color: 'var(--text-dim)' }}>{label}:</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}
