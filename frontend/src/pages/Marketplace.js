import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_PRODUCTS, GET_CATEGORIES, SUBMIT_QUOTE } from '../graphql/operations';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import GeminiProductViabilityModal from '../components/GeminiProductViabilityModal';

export default function Marketplace({ setActiveTab }) {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [selected, setSelected] = useState(null);
  const [quoteProduct, setQuoteProduct] = useState(null);
  const [analyzingProduct, setAnalyzingProduct] = useState(null);

  const { data, loading } = useQuery(GET_PRODUCTS, {
    variables: { search: search || undefined, category: category || undefined },
  });
  const { data: catData } = useQuery(GET_CATEGORIES);
  const [submitQuote, { loading: submitting }] = useMutation(SUBMIT_QUOTE);

  const products = data?.products || [];
  const categories = catData?.categories || [];

  const [quoteForm, setQuoteForm] = useState({ buyerName: '', buyerEmail: '', message: '', quantity: 1 });

  const handleQuote = async e => {
    e.preventDefault();
    if (!quoteForm.buyerName || !quoteForm.buyerEmail || !quoteForm.message) {
      toast('Please fill all fields', 'error'); return;
    }
    try {
      await submitQuote({ variables: { productId: quoteProduct.id, ...quoteForm, quantity: parseInt(quoteForm.quantity) } });
      toast('Quote request sent!');
      setQuoteProduct(null);
      setQuoteForm({ buyerName: '', buyerEmail: '', message: '', quantity: 1 });
    } catch (e) { toast(e.message, 'error'); }
  };

  return (
    <div className="page-container" style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>🇿🇦 Source Locally. Buy Smarter.</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Verified South African bulk suppliers, real MOQs & instant quotes powered by Gemini AI Market Intelligence
          </p>
        </div>
        {setActiveTab && (
          <button
            className="btn-yellow btn-sm"
            onClick={() => setActiveTab('ai-insights')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <i className="fas fa-brain"></i> Gemini Market Intelligence
          </button>
        )}
      </div>

      {/* Search */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div className="search-wrapper" style={{ flex: 1, minWidth: 200 }}>
            <i className="fas fa-search"></i>
            <input className="search-bar" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search product or supplier..." />
          </div>
          <select className="input" style={{ width: 'auto', minWidth: 140 }} value={category}
            onChange={e => setCategory(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button className="btn-outline btn-sm" onClick={() => { setSearch(''); setCategory(''); }}>Reset</button>
        </div>
      </div>

      {/* Category pills */}
      <div className="category-pills">
        <button className={`cat-pill${category === '' ? ' active' : ''}`} onClick={() => setCategory('')}>All</button>
        {categories.map(c => (
          <button key={c} className={`cat-pill${category === c ? ' active' : ''}`} onClick={() => setCategory(c)}>{c}</button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="products-grid">{[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-search"></i>
          <p>No products found. Try a different search.</p>
        </div>
      ) : (
        <div className="products-grid">
          {products.map(p => (
            <div className="product-card" key={p.id}>
              <div style={{ position: 'relative' }}>
                <img className="product-card-img" src={p.image} alt={p.name}
                  onError={e => { e.target.src = 'https://picsum.photos/400/300?grayscale'; }} />
                <button
                  type="button"
                  onClick={() => setAnalyzingProduct(p)}
                  title="Run Gemini AI Viability Analysis"
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    background: 'rgba(0,0,0,0.75)',
                    border: '1px solid var(--yellow)',
                    color: 'var(--yellow)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.25rem 0.5rem',
                    borderRadius: 4,
                    cursor: 'pointer',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <i className="fas fa-brain"></i> AI Viable
                </button>
              </div>

              <div className="product-card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.4rem' }}>
                  <div className="product-card-name">{p.name}</div>
                  {p.supplier?.isPremium && <span className="badge badge-active" style={{ fontSize: '0.6rem', whiteSpace: 'nowrap' }}>✓ Verified</span>}
                </div>
                <div className="product-card-meta">
                  <span><i className="fas fa-building" style={{ marginRight: 4, opacity: 0.5 }}></i>{p.supplier?.companyName}</span>
                  <span><i className="fas fa-map-marker-alt" style={{ marginRight: 4, opacity: 0.5 }}></i>{p.supplier?.location}</span>
                  <span>MOQ: {p.moq} units</span>
                </div>
                <div className="product-card-price">{p.priceRange}</div>
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
                  <button className="btn-outline btn-sm" style={{ flex: 1 }} onClick={() => setSelected(p)}>
                    <i className="fas fa-eye"></i> Details
                  </button>
                  <button className="product-card-btn" style={{ flex: 1, marginTop: 0 }} onClick={() => setQuoteProduct(p)}>
                    <i className="fas fa-envelope"></i> Quote
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Detail Modal */}
      {selected && (
        <Modal title={selected.name} onClose={() => setSelected(null)} large>
          <img src={selected.image} alt={selected.name} style={{ width: '100%', height: 260, objectFit: 'cover', borderRadius: 6, marginBottom: '1rem' }}
            onError={e => { e.target.src = 'https://picsum.photos/600/400?grayscale'; }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>{selected.description}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem', marginBottom: '1rem' }}>
            <div><span style={{ color: 'var(--text-dim)' }}>Price Range</span><br /><strong style={{ color: 'var(--yellow)' }}>{selected.priceRange}</strong></div>
            <div><span style={{ color: 'var(--text-dim)' }}>MOQ</span><br /><strong>{selected.moq} units</strong></div>
            <div><span style={{ color: 'var(--text-dim)' }}>Category</span><br /><strong>{selected.category}</strong></div>
            <div><span style={{ color: 'var(--text-dim)' }}>Supplier</span><br /><strong>{selected.supplier?.companyName}</strong></div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              className="btn-outline"
              style={{ color: 'var(--yellow)', borderColor: 'var(--yellow)' }}
              onClick={() => {
                const prod = selected;
                setSelected(null);
                setAnalyzingProduct(prod);
              }}
            >
              <i className="fas fa-brain"></i> AI Viability Analysis
            </button>
            <button className="btn-yellow" style={{ flex: 1 }} onClick={() => { setSelected(null); setQuoteProduct(selected); }}>
              Request Quote
            </button>
            <button className="btn-outline" onClick={() => setSelected(null)}>Close</button>
          </div>
        </Modal>
      )}

      {/* Quote Modal */}
      {quoteProduct && (
        <Modal title={`Quote: ${quoteProduct.name}`} onClose={() => setQuoteProduct(null)}>
          <form onSubmit={handleQuote}>
            <div className="input-group">
              <label className="input-label">Your Name</label>
              <input className="input" value={quoteForm.buyerName} onChange={e => setQuoteForm(f => ({ ...f, buyerName: e.target.value }))} placeholder="Full name" required />
            </div>
            <div className="input-group">
              <label className="input-label">Your Email</label>
              <input className="input" type="email" value={quoteForm.buyerEmail} onChange={e => setQuoteForm(f => ({ ...f, buyerEmail: e.target.value }))} placeholder="email@company.com" required />
            </div>
            <div className="input-group">
              <label className="input-label">Quantity</label>
              <input className="input" type="number" min="1" value={quoteForm.quantity} onChange={e => setQuoteForm(f => ({ ...f, quantity: e.target.value }))} />
            </div>
            <div className="input-group">
              <label className="input-label">Message / Specifications</label>
              <textarea className="input" rows="3" value={quoteForm.message} onChange={e => setQuoteForm(f => ({ ...f, message: e.target.value }))} placeholder="Describe your requirements..." required style={{ resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn-yellow" disabled={submitting} style={{ flex: 1 }}>
                {submitting ? 'Sending...' : 'Send Quote Request'}
              </button>
              <button type="button" className="btn-outline" onClick={() => setQuoteProduct(null)}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Gemini AI Viability Modal */}
      {analyzingProduct && (
        <GeminiProductViabilityModal
          product={analyzingProduct}
          onClose={() => setAnalyzingProduct(null)}
        />
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="product-card" style={{ opacity: 0.3 }}>
      <div style={{ height: 180, background: 'var(--bg3)' }}></div>
      <div className="product-card-body">
        {[100, 70, 50].map((w, i) => (
          <div key={i} style={{ height: 12, background: 'var(--bg3)', borderRadius: 4, marginBottom: 6, width: `${w}%` }}></div>
        ))}
      </div>
    </div>
  );
}
