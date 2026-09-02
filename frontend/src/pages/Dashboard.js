import React, { useState, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  GET_SUPPLIER_PRODUCTS,
  ADD_PRODUCT,
  UPDATE_PRODUCT,
  DELETE_PRODUCT,
  GET_SUPPLIER_COMPETITIVENESS,
  GET_SUPPLIER_QUOTES,
  GET_MY_BUYER_QUOTES,
  UPDATE_QUOTE_STATUS
} from '../graphql/operations';
import { useAuth } from '../AuthContext';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import GeminiProductViabilityModal from '../components/GeminiProductViabilityModal';
import GeminiProductOptimizerModal from '../components/GeminiProductOptimizerModal';

const CATS = ['Clothing', 'PPE', 'Furniture', 'Packaging', 'Chemicals', 'Electronics', 'Food & Beverage', 'General'];
const MAX_PRODUCTS = 25;

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const supplierId = user?.supplier?.id;
  const isSupplier = user?.role === 'supplier' || user?.role === 'admin';
  const isBuyer = user?.role === 'buyer';

  const [activeTab, setActiveTab] = useState(isSupplier ? 'catalog' : 'rfqs');

  const { data, loading, refetch } = useQuery(GET_SUPPLIER_PRODUCTS, {
    variables: { supplierId: supplierId || '' }, skip: !supplierId
  });

  const { data: compData, loading: compLoading, refetch: refetchComp } = useQuery(GET_SUPPLIER_COMPETITIVENESS, {
    variables: { supplierId: supplierId || '' }, skip: !supplierId
  });

  const { data: suppQuotesData, loading: suppQuotesLoading, refetch: refetchSuppQuotes } = useQuery(GET_SUPPLIER_QUOTES, {
    skip: !isSupplier
  });

  const { data: buyerQuotesData, loading: buyerQuotesLoading, refetch: refetchBuyerQuotes } = useQuery(GET_MY_BUYER_QUOTES, {
    skip: !user
  });

  const [addProduct] = useMutation(ADD_PRODUCT);
  const [updateProduct] = useMutation(UPDATE_PRODUCT);
  const [deleteProduct] = useMutation(DELETE_PRODUCT);
  const [updateQuoteStatus] = useMutation(UPDATE_QUOTE_STATUS);

  const [showAdd, setShowAdd] = useState(false);
  const [editProd, setEditProd] = useState(null);
  const [form, setForm] = useState({ name: '', category: 'General', description: '', priceRange: '', moq: 50, image: '' });
  const [imagePreview, setImagePreview] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Gemini Modals state
  const [analyzingProduct, setAnalyzingProduct] = useState(null);
  const [showOptimizer, setShowOptimizer] = useState(false);

  const products = data?.products || [];
  const supplierQuotes = suppQuotesData?.supplierQuotes || [];
  const buyerQuotes = buyerQuotesData?.myBuyerQuotes || [];
  const usagePercent = Math.min((products.length / MAX_PRODUCTS) * 100, 100);
  const comp = compData?.getSupplierCompetitivenessAdvice;

  const handleStatusChange = async (quoteId, newStatus) => {
    try {
      await updateQuoteStatus({ variables: { id: quoteId, status: newStatus } });
      toast(`RFQ status updated to ${newStatus}. Buyer notified via turboSMTP.`, 'success');
      refetchSuppQuotes();
      if (refetchBuyerQuotes) refetchBuyerQuotes();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const openAdd = () => {
    setForm({ name: '', category: 'General', description: '', priceRange: '', moq: 50, image: '' });
    setImagePreview('');
    setEditProd(null);
    setShowAdd(true);
  };

  const openEdit = (p) => {
    setForm({ name: p.name, category: p.category, description: p.description, priceRange: p.priceRange, moq: p.moq, image: p.image });
    setImagePreview(p.image || '');
    setEditProd(p);
    setShowAdd(true);
  };

  const handleImageFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast('Please select an image file', 'error'); return; }
    if (file.size > 5 * 1024 * 1024) { toast('Image must be under 5MB', 'error'); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      setImagePreview(dataUrl);
      setForm(f => ({ ...f, image: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleFileInput = (e) => handleImageFile(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleImageFile(e.dataTransfer.files[0]);
  };

  const clearImage = () => {
    setImagePreview('');
    setForm(f => ({ ...f, image: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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

  if (!user) {
    return <div className="page-container"><div className="empty-state"><i className="fas fa-lock"></i><p>Please log in to access your Trade Hub and Quote Tracker.</p></div></div>;
  }

  const supplier = user.supplier;

  return (
    <div className="page-container" style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>
            {isSupplier ? `⚙️ ${supplier?.companyName || user.name} Hub` : `📋 Buyer RFQ & Order Tracker`}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            {isSupplier
              ? 'Manage your bulk catalog, fulfill automated turboSMTP RFQ quote requests, and optimize your market competitiveness.'
              : 'Track your submitted quote requests, supplier response statuses, and direct email contacts.'}
          </p>
        </div>

        {isSupplier && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn-yellow" onClick={openAdd} disabled={products.length >= MAX_PRODUCTS}>
              <i className="fas fa-plus-circle"></i> Add New Product
            </button>
          </div>
        )}
      </div>

      {/* Tabs Navigation for Supplier vs Buyer */}
      {isSupplier && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
          <button
            className={`btn-sm ${activeTab === 'catalog' ? 'btn-yellow' : 'btn-outline'}`}
            onClick={() => setActiveTab('catalog')}
          >
            <i className="fas fa-boxes" style={{ marginRight: 5 }}></i> Product Catalog ({products.length})
          </button>
          <button
            className={`btn-sm ${activeTab === 'rfqs' ? 'btn-yellow' : 'btn-outline'}`}
            onClick={() => setActiveTab('rfqs')}
          >
            <i className="fas fa-envelope-open-text" style={{ marginRight: 5 }}></i> Incoming RFQs & Quotes ({supplierQuotes.length})
          </button>
        </div>
      )}

      {/* SUPPLIER RFQS TAB OR BUYER QUOTES VIEW */}
      {(activeTab === 'rfqs' || isBuyer) && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                  {isSupplier ? 'Incoming RFQs / Quote Inquiries' : 'Your Submitted Quote Requests'}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0.2rem 0 0 0' }}>
                  <i className="fas fa-bolt" style={{ color: 'var(--yellow)', marginRight: 4 }}></i>
                  Synchronized with turboSMTP automated email dispatch
                </p>
              </div>
              <button
                className="btn-outline btn-sm"
                onClick={() => { if (isSupplier) refetchSuppQuotes(); refetchBuyerQuotes(); }}
              >
                <i className="fas fa-sync-alt" style={{ marginRight: 4 }}></i> Refresh Quotes
              </button>
            </div>

            {isSupplier ? (
              supplierQuotes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                  <i className="fas fa-inbox" style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'block', opacity: 0.5 }}></i>
                  No quote requests received yet. When buyers request quotes on your products, you'll receive automated turboSMTP email alerts here and in your inbox.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {supplierQuotes.map(q => (
                    <div key={q.id} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 6, padding: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Product:</span>
                          <span style={{ fontWeight: 700, fontSize: '0.95rem', marginLeft: '0.35rem', color: '#fff' }}>{q.product?.name || 'Product'}</span>
                          <span style={{ marginLeft: '0.75rem', background: 'var(--bg3)', padding: '0.15rem 0.5rem', borderRadius: 4, fontSize: '0.75rem', color: 'var(--yellow)' }}>
                            Qty: {q.quantity} units
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status:</span>
                          <select
                            value={q.status || 'pending'}
                            onChange={(e) => handleStatusChange(q.id, e.target.value)}
                            style={{
                              background: q.status === 'approved' ? '#14532d' : q.status === 'rejected' ? '#7f1d1d' : 'var(--bg3)',
                              color: '#fff',
                              border: '1px solid var(--border)',
                              borderRadius: 4,
                              padding: '0.2rem 0.5rem',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            <option value="pending">⏳ Pending</option>
                            <option value="contacted">💬 Contacted</option>
                            <option value="approved">✅ Approved / Quoted</option>
                            <option value="rejected">❌ Declined</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ background: 'var(--bg3)', padding: '0.75rem', borderRadius: 4, fontSize: '0.82rem', marginBottom: '0.75rem', border: '1px solid var(--border-light)' }}>
                        <div style={{ color: 'var(--text-muted)', marginBottom: '0.25rem', fontSize: '0.75rem' }}>Buyer Note / Specifications:</div>
                        <div style={{ color: '#e5e5e5', fontStyle: q.message ? 'normal' : 'italic' }}>{q.message || 'No specific notes provided.'}</div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <div>
                          <span>Buyer: <strong style={{ color: '#fff' }}>{q.buyerName}</strong> ({q.buyerEmail})</span>
                          <span style={{ marginLeft: '1rem', fontSize: '0.72rem' }}>
                            {q.createdAt ? new Date(parseInt(q.createdAt) || q.createdAt).toLocaleDateString() : ''}
                          </span>
                        </div>
                        <a
                          href={`mailto:${q.buyerEmail}?subject=Quote%20for%20${encodeURIComponent(q.product?.name || 'Product')}%20-%20SAsuppliers.com`}
                          className="btn-yellow btn-sm"
                          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                          <i className="fas fa-reply"></i> Reply directly to {q.buyerEmail}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              buyerQuotes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                  <i className="fas fa-file-invoice" style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'block', opacity: 0.5 }}></i>
                  You have not submitted any quote requests yet. Browse the Marketplace to request quotes from verified suppliers!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {buyerQuotes.map(q => (
                    <div key={q.id} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 6, padding: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>{q.product?.name || 'Product'}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            Supplier: <strong style={{ color: 'var(--yellow)' }}>{q.product?.supplier?.companyName || 'Supplier'}</strong> &bull; MOQ: {q.product?.moq || 1} &bull; Qty Requested: <strong>{q.quantity}</strong>
                          </div>
                        </div>
                        <span className={`badge badge-${q.status || 'pending'}`} style={{ textTransform: 'uppercase', fontSize: '0.75rem' }}>
                          {q.status || 'pending'}
                        </span>
                      </div>

                      <div style={{ background: 'var(--bg3)', padding: '0.65rem 0.85rem', borderRadius: 4, fontSize: '0.8rem', color: '#ccc', margin: '0.5rem 0' }}>
                        <strong>Your Message:</strong> {q.message || 'No additional specifications provided.'}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <div>
                          <span>Supplier Email: <strong style={{ color: '#fff' }}>{q.product?.supplier?.email || 'sales@sasuppliers.com'}</strong></span>
                          {q.product?.supplier?.phone && <span style={{ marginLeft: '0.75rem' }}>Tel: {q.product.supplier.phone}</span>}
                        </div>
                        <a
                          href={`mailto:${q.product?.supplier?.email || 'sales@sasuppliers.com'}?subject=Follow-up%20on%20RFQ%20for%20${encodeURIComponent(q.product?.name || 'Product')}`}
                          className="btn-outline btn-sm"
                          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                          <i className="fas fa-envelope"></i> Email Supplier
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* SUPPLIER CATALOG TAB */}
      {isSupplier && activeTab === 'catalog' && (
        <>
          {/* Stats Bar */}
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Product Listings</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{products.length} / {MAX_PRODUCTS}</div>
            </div>
            <div className="limit-bar"><div className="limit-fill" style={{ width: `${usagePercent}%` }}></div></div>
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
              <StatPill icon="fa-box" label="Products" value={products.length} />
              <StatPill icon="fa-map-marker-alt" label="Location" value={supplier?.location || '—'} />
              <StatPill icon="fa-envelope" label="Email" value={supplier?.email || user?.email || '—'} />
              <StatPill icon="fa-circle" label="Status" value={<span className={`badge badge-${supplier?.status}`}>{supplier?.status}</span>} />
              {supplier?.isPremium && <StatPill icon="fa-star" label="Tier" value={<span style={{ color: 'var(--yellow)' }}>⭐ Premium</span>} />}
            </div>
          </div>

          {/* Gemini AI Competitiveness Advisor Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #181816 0%, #242211 100%)',
            border: '1px solid #5a4b14',
            borderRadius: 10,
            padding: '1.25rem',
            marginBottom: '2rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ background: 'var(--yellow)', color: '#000', padding: '0.2rem 0.5rem', borderRadius: 4, fontWeight: 800, fontSize: '0.75rem' }}>
                  GEMINI AI
                </span>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>
                  Supplier Competitiveness & Market Strategy Advisor
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Competitiveness Score: <strong style={{ color: '#22c55e', fontSize: '1rem' }}>{comp?.competitiveScore || 88}%</strong>
                </span>
                <button className="btn-outline btn-sm" onClick={() => refetchComp()} disabled={compLoading}>
                  <i className={`fas fa-sync-alt ${compLoading ? 'fa-spin' : ''}`}></i>
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginTop: '0.75rem' }}>
              <div style={{ background: 'var(--bg2)', padding: '0.85rem', borderRadius: 6, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--yellow)', marginBottom: '0.4rem' }}>
                  <i className="fas fa-bullseye"></i> Winning Pricing Strategy
                </div>
                <div style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                  {comp?.pricingStrategies?.[0] || 'Provide 3-tier volume pricing to attract small and enterprise buyers.'}
                </div>
              </div>

              <div style={{ background: 'var(--bg2)', padding: '0.85rem', borderRadius: 6, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#60a5fa', marginBottom: '0.4rem' }}>
                  <i className="fas fa-truck"></i> Speed & Logistics Edge
                </div>
                <div style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                  {comp?.operationalTips?.[0] || 'Commit to 24-48hr dispatch across major South African metropolitan corridors.'}
                </div>
              </div>

              <div style={{ background: 'var(--bg2)', padding: '0.85rem', borderRadius: 6, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4ade80', marginBottom: '0.4rem' }}>
                  <i className="fas fa-award"></i> Local SA SME Advantage
                </div>
                <div style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                  {comp?.localAdvantageTips?.[0] || 'Highlight instant warranty & local customer support over import competitors.'}
                </div>
              </div>
            </div>
          </div>

          {/* Products grid */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
              Your Listed Products ({products.length})
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Click <strong style={{ color: 'var(--yellow)' }}>✨ AI Viability</strong> on any item to run deep market analysis
            </span>
          </div>

          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading products...</p>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-box-open"></i>
              <p>No products yet. Start listing your bulk inventory.</p>
              <button className="btn-yellow" style={{ marginTop: '1rem' }} onClick={openAdd}>Add First Product</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
              {products.map(p => (
                <div key={p.id} style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <img src={p.image} alt={p.name} style={{ width: 84, height: 84, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
                      onError={e => { e.target.src = 'https://picsum.photos/100/100?grayscale'; }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem', lineHeight: 1.3 }}>{p.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.category} | MOQ {p.moq}</div>
                      <div style={{ color: 'var(--yellow)', fontWeight: 700, fontSize: '0.85rem', margin: '0.25rem 0' }}>{p.priceRange}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {p.description}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons with Gemini AI button */}
                  <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.6rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => setAnalyzingProduct(p)}
                      style={{
                        background: 'rgba(245, 197, 24, 0.12)',
                        border: '1px solid rgba(245, 197, 24, 0.35)',
                        color: 'var(--yellow)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0.35rem 0.65rem',
                        borderRadius: 4,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        cursor: 'pointer'
                      }}
                    >
                      <i className="fas fa-brain"></i> AI Viability Check
                    </button>

                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button style={{ background: 'none', color: 'var(--info)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }} onClick={() => openEdit(p)}>
                        <i className="fas fa-edit"></i> Edit
                      </button>
                      <button style={{ background: 'none', color: 'var(--error)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }} onClick={() => handleDelete(p.id)}>
                        <i className="fas fa-trash"></i> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add / Edit Modal with AI Optimizer */}
      {showAdd && (
        <Modal title={editProd ? '✏️ Edit Product' : '📦 Add New Product'} onClose={() => setShowAdd(false)} large>
          <div style={{ marginBottom: '1rem', background: 'var(--bg3)', padding: '0.65rem 0.85rem', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <i className="fas fa-sparkles" style={{ color: 'var(--yellow)', marginRight: '0.3rem' }}></i>
              Want high-converting B2B catalog copy and ZAR price recommendations?
            </span>
            <button
              type="button"
              className="btn-yellow btn-sm"
              onClick={() => setShowOptimizer(true)}
            >
              ✨ Optimize with Gemini AI
            </button>
          </div>

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
                <textarea className="input" rows="3" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Product details, specs, and commercial terms..." style={{ resize: 'vertical' }} />
              </div>
              <div className="input-group">
                <label className="input-label">Price Range</label>
                <input className="input" value={form.priceRange} onChange={e => setForm(f => ({ ...f, priceRange: e.target.value }))} placeholder="e.g. R 45 - R 85" />
              </div>
              <div className="input-group">
                <label className="input-label">Product Image</label>
                <div
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  style={{
                    border: `2px dashed ${dragOver ? 'var(--yellow)' : 'var(--border)'}`,
                    borderRadius: 8,
                    padding: imagePreview ? '0.5rem' : '1.25rem 1rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: dragOver ? 'rgba(255,200,0,0.05)' : 'var(--input-bg, var(--card-bg))',
                    transition: 'border-color 0.2s, background 0.2s',
                    position: 'relative',
                  }}
                >
                  {imagePreview ? (
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        style={{ width: '100%', maxHeight: 140, objectFit: 'cover', borderRadius: 6, display: 'block' }}
                      />
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); clearImage(); }}
                        style={{
                          position: 'absolute', top: 4, right: 4,
                          background: 'rgba(0,0,0,0.65)', color: '#fff',
                          border: 'none', borderRadius: '50%', width: 22, height: 22,
                          cursor: 'pointer', fontSize: '0.7rem', lineHeight: '22px', padding: 0,
                        }}
                        title="Remove image"
                      >✕</button>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                        Click to replace image
                      </div>
                    </div>
                  ) : (
                    <>
                      <i className="fas fa-cloud-upload-alt" style={{ fontSize: '1.75rem', color: 'var(--yellow)', marginBottom: '0.4rem', display: 'block' }}></i>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.2rem' }}>Click to upload or drag & drop</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PNG, JPG, WEBP — max 5MB</div>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  style={{ display: 'none' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button type="submit" className="btn-yellow" style={{ flex: 1 }}>{editProd ? 'Update Product' : 'Add Product'}</button>
              <button type="button" className="btn-outline" onClick={() => setShowAdd(false)}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Gemini AI Modals */}
      {analyzingProduct && (
        <GeminiProductViabilityModal
          product={analyzingProduct}
          onClose={() => setAnalyzingProduct(null)}
        />
      )}

      {showOptimizer && (
        <GeminiProductOptimizerModal
          initialData={form}
          onApply={(optimized) => {
            setForm(f => ({
              ...f,
              name: optimized.name || f.name,
              description: optimized.description || f.description,
              priceRange: optimized.priceRange || f.priceRange,
              moq: optimized.moq || f.moq
            }));
          }}
          onClose={() => setShowOptimizer(false)}
        />
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
