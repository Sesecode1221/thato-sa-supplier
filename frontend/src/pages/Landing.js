import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_PRODUCTS } from '../graphql/operations';

export default function Landing({ setActiveTab, onRegister }) {
  const [email, setEmail] = useState('');
  const { data } = useQuery(GET_PRODUCTS, { variables: { search: '' } });
  const products = (data?.products || []).slice(0, 5);

  return (
    <>
      {/* ── HERO ── */}
      <div className="hero">
        <div className="hero-content">
          <p className="hero-pretitle">South Africa's B2B Marketplace & AI Intelligence</p>
          <h1>
            YOUR SOURCE FOR<br />
            <span>QUALITY INTERMEDIATE</span>
            <span>GOODS</span>
          </h1>
          <p className="hero-sub">
            Unbranded. Bulk quantities. Competitive prices.<br />
            Powered by Gemini AI to analyze viable products, optimize catalogs, and help South African suppliers stay competitive.
          </p>
          <div className="hero-btns">
            <button className="btn-yellow" onClick={() => setActiveTab('marketplace')}>
              BROWSE PRODUCTS &nbsp;→
            </button>
            <button className="btn-outline" onClick={() => setActiveTab('ai-insights')}>
              ✨ AI MARKET INTELLIGENCE
            </button>
          </div>
        </div>
        <div className="hero-image">
          <img
            src="https://images.unsplash.com/photo-1607082349566-187342175e2f?w=600&q=80"
            alt="Industrial Bulk Products"
            onError={e => { e.target.src = 'https://picsum.photos/600/400?grayscale'; }}
          />
        </div>
      </div>

      {/* ── FEATURES STRIP ── */}
      <div className="features-strip">
        {[
          { icon: 'fa-brain', title: 'GEMINI AI INSIGHTS', desc: 'Predict high-demand products & margins' },
          { icon: 'fa-boxes', title: 'BULK PRICING', desc: 'Better prices with higher quantities' },
          { icon: 'fa-truck', title: 'NATIONWIDE DELIVERY', desc: 'Fast and reliable delivery across South Africa' },
          { icon: 'fa-shield-alt', title: 'TRUSTED SA SUPPLIERS', desc: 'Verified local stock & SABS compliance' },
        ].map(f => (
          <div className="feature-item" key={f.title}>
            <div className="feature-icon"><i className={`fas ${f.icon}`}></i></div>
            <div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── AI MARKET SPOTLIGHT BANNER ── */}
      <div style={{ padding: '0 1.5rem', maxWidth: 1200, margin: '2rem auto 0 auto' }}>
        <div style={{
          background: 'linear-gradient(135deg, #181814 0%, #292612 100%)',
          border: '1px solid #5a4b14',
          borderRadius: 12,
          padding: '1.75rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem'
        }}>
          <div>
            <span style={{ background: 'var(--yellow)', color: '#000', fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: 4, textTransform: 'uppercase' }}>
              Gemini 3.7 Flash
            </span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginTop: '0.5rem', marginBottom: '0.25rem' }}>
              Want to know which products are most viable to supply in South Africa?
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: 650 }}>
              Access AI-driven margin forecasts, optimal MOQ benchmarks, and local resilience strategies to outperform cheap imports.
            </p>
          </div>
          <button className="btn-yellow" onClick={() => setActiveTab('ai-insights')}>
            Explore AI Insights &nbsp;→
          </button>
        </div>
      </div>

      {/* ── POPULAR PRODUCTS ── */}
      <div className="section">
        <div className="section-header">
          <div className="section-title">POPULAR PRODUCTS</div>
          <button className="btn-outline btn-sm" onClick={() => setActiveTab('marketplace')}>VIEW ALL PRODUCTS</button>
        </div>
        <div className="products-grid">
          {products.length === 0 ? (
            [...Array(5)].map((_, i) => <ProductSkeleton key={i} />)
          ) : (
            products.map(p => (
              <div className="product-card" key={p.id}>
                <img
                  className="product-card-img"
                  src={p.image}
                  alt={p.name}
                  onError={e => { e.target.src = 'https://picsum.photos/400/300?grayscale'; }}
                />
                <div className="product-card-body">
                  <div className="product-card-name">{p.name}</div>
                  <div className="product-card-meta">
                    <span>Category: {p.category}</span>
                    <span>MOQ: {p.moq} units</span>
                  </div>
                  <div className="product-card-price">{p.priceRange} / unit</div>
                  <button className="product-card-btn" onClick={() => setActiveTab('marketplace')}>
                    VIEW PRODUCT
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── FOOTER STRIP ── */}
      <div className="footer-strip">
        <div className="footer-strip-item">
          <div className="footer-strip-icon"><i className="fas fa-envelope"></i></div>
          <div>
            <div className="footer-strip-title">STAY UPDATED</div>
            <div className="footer-strip-text">Subscribe to get updates on new products and exclusive offers.</div>
            <div className="footer-subscribe">
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" type="email" />
              <button onClick={() => { setEmail(''); }}>SUBSCRIBE</button>
            </div>
          </div>
        </div>
        <div className="footer-strip-item">
          <div className="footer-strip-icon"><i className="fas fa-headset"></i></div>
          <div>
            <div className="footer-strip-title">NEED HELP?</div>
            <div className="footer-strip-text">WhatsApp / Call<br />071 000 0000</div>
          </div>
        </div>
        <div className="footer-strip-item">
          <div className="footer-strip-icon"><i className="fas fa-clock"></i></div>
          <div>
            <div className="footer-strip-title">BUSINESS HOURS</div>
            <div className="footer-strip-text">Mon – Fri: 08:00 – 17:00<br />Sat – Sun: Closed</div>
          </div>
        </div>
      </div>

      {/* ── SUBSCRIPTION PLANS ── */}
      <div className="section">
        <div className="section-title" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>📦 SUPPLIER SUBSCRIPTION PLANS</div>
        <div className="packages-grid">
          {[
            { icon: '🌱', name: 'Starter', price: 'R49', period: '/month', badge: null, features: ['Up to 10 product listings','Basic profile & contact','Quote requests via email', 'Gemini AI product viability check'], no: ['Premium badge'], btn: 'Get Started', cls: '' },
            { icon: '📈', name: 'Pro', price: 'R99', period: '/month', badge: 'Most Popular', features: ['Up to 50 product listings','Verified badge & higher ranking','Direct messaging + quote dashboard','AI Competitiveness Roadmap','Analytics: views & quote volume'], no: [], btn: 'Start 14-day trial', cls: 'featured' },
            { icon: '👑', name: 'Enterprise', price: 'R249', period: '/month', badge: null, features: ['Unlimited products','Priority support & featured placement','AI Market Intelligence & Margin Predictor','Logistics API integration ready'], no: [], btn: 'Contact Sales', cls: '' },
          ].map(pkg => (
            <div className={`package-card ${pkg.cls}`} key={pkg.name}>
              {pkg.badge && <div className="package-badge">{pkg.badge}</div>}
              <div className="package-icon">{pkg.icon}</div>
              <div className="package-name">{pkg.name}</div>
              <div className="package-price">{pkg.price}<span>{pkg.period}</span></div>
              <ul className="package-features">
                {pkg.features.map(f => <li key={f}><i className="fas fa-check"></i>{f}</li>)}
                {pkg.no.map(f => <li key={f}><i className="fas fa-times"></i>{f}</li>)}
              </ul>
              <button className="btn-yellow" style={{ width: '100%' }} onClick={onRegister}>{pkg.btn}</button>
            </div>
          ))}
        </div>
        <p style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.8rem', marginTop: '1rem' }}>
          *No hidden fees. Cancel anytime. First month 50% off for early suppliers.
        </p>
      </div>

      {/* ── CTA ── */}
      <div className="cta-section">
        <h2>Ready to transform your sourcing?</h2>
        <p>Join 150+ South African suppliers already listing on SAsuppliers.</p>
        <div className="cta-btns">
          <button className="btn-yellow" onClick={onRegister}><i className="fas fa-user-plus"></i> Register as Supplier</button>
          <button className="btn-outline" onClick={() => setActiveTab('marketplace')}><i className="fas fa-shopping-cart"></i> Browse as Buyer</button>
        </div>
      </div>
    </>
  );
}

function ProductSkeleton() {
  return (
    <div className="product-card" style={{ opacity: 0.4 }}>
      <div style={{ height: 180, background: 'var(--bg3)' }}></div>
      <div className="product-card-body">
        <div style={{ height: 16, background: 'var(--bg3)', borderRadius: 4, marginBottom: 8 }}></div>
        <div style={{ height: 12, background: 'var(--bg3)', borderRadius: 4, marginBottom: 4, width: '60%' }}></div>
        <div style={{ height: 20, background: 'var(--bg3)', borderRadius: 4, marginTop: 8 }}></div>
      </div>
    </div>
  );
}
