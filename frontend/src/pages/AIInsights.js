import React, { useState } from 'react';
import { useQuery, useLazyQuery } from '@apollo/client';
import { GET_MARKET_VIABILITY_RECOMMENDATIONS, GET_SUPPLIER_COMPETITIVENESS, ANALYZE_PRODUCT_VIABILITY } from '../graphql/operations';
import { useAuth } from '../AuthContext';
import GeminiProductViabilityModal from '../components/GeminiProductViabilityModal';

const INDUSTRIES = [
  'All B2B Sectors',
  'Packaging & Warehousing',
  'PPE & Industrial Safety',
  'Textiles, Clothing & Corporate Wear',
  'Chemicals & Commercial Cleaning',
  'Renewable Energy & Solar Support',
  'Office & Commercial Furniture'
];

export default function AIInsights({ setActiveTab }) {
  const { user } = useAuth();
  const [selectedIndustry, setSelectedIndustry] = useState('All B2B Sectors');
  const [customProductQuery, setCustomProductQuery] = useState({
    name: '',
    category: 'Packaging',
    priceRange: 'R 50 - R 200',
    moq: 50,
    description: ''
  });
  const [analyzingProduct, setAnalyzingProduct] = useState(null);

  // Market Viability Query
  const { data: marketData, loading: marketLoading, refetch: refetchMarket } = useQuery(
    GET_MARKET_VIABILITY_RECOMMENDATIONS,
    { variables: { industry: selectedIndustry } }
  );

  // Supplier Competitiveness Advice
  const { data: compData, loading: compLoading, refetch: refetchComp } = useQuery(
    GET_SUPPLIER_COMPETITIVENESS,
    {
      variables: {
        supplierId: user?.supplier?.id || '',
        categoryFocus: selectedIndustry !== 'All B2B Sectors' ? selectedIndustry : ''
      }
    }
  );

  const market = marketData?.getMarketViabilityRecommendations;
  const comp = compData?.getSupplierCompetitivenessAdvice;

  const handleRunCustomAnalysis = (e) => {
    e.preventDefault();
    if (!customProductQuery.name.trim()) return;
    setAnalyzingProduct({ ...customProductQuery });
  };

  return (
    <div className="page-container" style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Hero Header */}
      <div style={{
        background: 'linear-gradient(135deg, #161616 0%, #201e12 60%, #2a2505 100%)',
        border: '1px solid #4a3e10',
        borderRadius: 12,
        padding: '2.5rem 2rem',
        marginBottom: '2rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(245, 197, 24, 0.15)', border: '1px solid rgba(245, 197, 24, 0.4)', padding: '0.35rem 0.85rem', borderRadius: 20, fontSize: '0.8rem', color: 'var(--yellow)', fontWeight: 700, marginBottom: '1rem' }}>
          <i className="fas fa-brain"></i> POWERED BY GEMINI 3.7 FLASH
        </div>
        <h1 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.4rem)', fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: '0.5rem' }}>
          South African SME B2B <span style={{ color: 'var(--yellow)' }}>Market Intelligence & Viability</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: 720, lineHeight: 1.6 }}>
          Real-time AI analysis on trending high-demand products, margin potentials, competitor positioning, and actionable operational strategies to help SA suppliers stay competitive and win high-volume procurement contracts.
        </p>

        {/* Industry Switcher */}
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {INDUSTRIES.map((ind) => (
            <button
              key={ind}
              onClick={() => setSelectedIndustry(ind)}
              style={{
                background: selectedIndustry === ind ? 'var(--yellow)' : 'rgba(255,255,255,0.06)',
                color: selectedIndustry === ind ? '#000' : '#fff',
                border: selectedIndustry === ind ? 'none' : '1px solid var(--border)',
                fontWeight: 600,
                fontSize: '0.8rem',
                padding: '0.45rem 0.9rem',
                borderRadius: 6,
                transition: 'all 0.15s'
              }}
            >
              {ind}
            </button>
          ))}
        </div>
      </div>

      {/* Grid: Recommended High-Viability Products */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fas fa-chart-line" style={{ color: 'var(--yellow)' }}></i> High-Demand Viable Products to Stock & Supply
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Identified by Gemini AI based on current South African SME trade demand and margin elasticity.
            </p>
          </div>
          <button
            className="btn-outline btn-sm"
            onClick={() => refetchMarket()}
            disabled={marketLoading}
          >
            <i className={`fas fa-sync-alt ${marketLoading ? 'fa-spin' : ''}`}></i> Refresh Analysis
          </button>
        </div>

        {marketLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--card-bg)', borderRadius: 8 }}>
            <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '2rem', color: 'var(--yellow)' }}></i>
            <div style={{ marginTop: '0.75rem', color: 'var(--text-muted)' }}>Analyzing viable product trends...</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {market?.recommendations?.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 10,
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <span style={{ background: 'var(--bg3)', color: 'var(--yellow)', fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: 4, textTransform: 'uppercase' }}>
                      {item.category}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: item.competitionLevel === 'Low' ? '#4ade80' : '#f59e0b' }}>
                      Competition: {item.competitionLevel}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem', lineHeight: 1.3 }}>
                    {item.title}
                  </h3>

                  <p style={{ fontSize: '0.825rem', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '1rem' }}>
                    {item.whyViable}
                  </p>
                </div>

                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: 'var(--bg2)', padding: '0.6rem 0.75rem', borderRadius: 6, marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Est. Margin:</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#22c55e' }}>{item.estimatedMargin}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Rec. MOQ:</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>{item.recommendedMOQ}</div>
                    </div>
                  </div>

                  <button
                    className="btn-outline btn-sm"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => setAnalyzingProduct({ name: item.title, category: item.category, moq: 50, priceRange: 'Competitive ZAR' })}
                  >
                    <i className="fas fa-microscope"></i> Deep Viability Breakdown
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Supplier Competitiveness Strategy Roadmap */}
      <div style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '1.75rem',
        marginBottom: '2.5rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fas fa-shield-alt" style={{ color: 'var(--yellow)' }}></i> Supplier Competitiveness & Resilience Roadmap
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Actionable operational strategies to win against imports and stay the preferred supplier in South Africa.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Readiness Score: <strong style={{ color: '#22c55e', fontSize: '1.1rem' }}>{comp?.competitiveScore || 88}%</strong>
            </span>
            <button className="btn-outline btn-sm" onClick={() => refetchComp()} disabled={compLoading}>
              <i className={`fas fa-sync-alt ${compLoading ? 'fa-spin' : ''}`}></i>
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
          {/* Pricing & Volume Strategy */}
          <div style={{ background: 'var(--bg2)', padding: '1.2rem', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--yellow)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <i className="fas fa-coins"></i> Pricing & Payment Strategies
            </div>
            <ul style={{ paddingLeft: '1.2rem', fontSize: '0.825rem', color: '#ddd', lineHeight: 1.6 }}>
              {comp?.pricingStrategies?.map((item, i) => (
                <li key={i} style={{ marginBottom: '0.4rem' }}>{item}</li>
              ))}
            </ul>
          </div>

          {/* Operational Speed & Logistics */}
          <div style={{ background: 'var(--bg2)', padding: '1.2rem', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#60a5fa', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <i className="fas fa-truck-fast"></i> Logistics & Fulfillment
            </div>
            <ul style={{ paddingLeft: '1.2rem', fontSize: '0.825rem', color: '#ddd', lineHeight: 1.6 }}>
              {comp?.operationalTips?.map((item, i) => (
                <li key={i} style={{ marginBottom: '0.4rem' }}>{item}</li>
              ))}
            </ul>
          </div>

          {/* Local Advantage over Imports */}
          <div style={{ background: 'var(--bg2)', padding: '1.2rem', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#4ade80', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <i className="fas fa-map-marker-alt"></i> Local SA Domestic Advantage
            </div>
            <ul style={{ paddingLeft: '1.2rem', fontSize: '0.825rem', color: '#ddd', lineHeight: 1.6 }}>
              {comp?.localAdvantageTips?.map((item, i) => (
                <li key={i} style={{ marginBottom: '0.4rem' }}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Interactive Custom Product Viability Checker Form */}
      <div style={{
        background: 'linear-gradient(135deg, #191919 0%, #222018 100%)',
        border: '1px solid var(--border-light)',
        borderRadius: 12,
        padding: '1.75rem'
      }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="fas fa-bolt" style={{ color: 'var(--yellow)' }}></i> Instant AI Viability Simulator for Any Product
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Thinking of manufacturing or importing a new line? Test its viability score and market demand instantly.
          </p>
        </div>

        <form onSubmit={handleRunCustomAnalysis} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Product Name / Idea</label>
            <input
              className="form-input"
              value={customProductQuery.name}
              onChange={(e) => setCustomProductQuery({ ...customProductQuery, name: e.target.value })}
              placeholder="e.g. Biodegradable Courier Bags, Solar Inverter Casing"
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Category</label>
            <select
              className="form-input"
              value={customProductQuery.category}
              onChange={(e) => setCustomProductQuery({ ...customProductQuery, category: e.target.value })}
            >
              {INDUSTRIES.filter(x => x !== 'All B2B Sectors').map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Target Price Range (ZAR)</label>
            <input
              className="form-input"
              value={customProductQuery.priceRange}
              onChange={(e) => setCustomProductQuery({ ...customProductQuery, priceRange: e.target.value })}
              placeholder="e.g. R 80 - R 150"
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Planned MOQ (Units)</label>
            <input
              type="number"
              className="form-input"
              value={customProductQuery.moq}
              onChange={(e) => setCustomProductQuery({ ...customProductQuery, moq: parseInt(e.target.value) || 1 })}
            />
          </div>

          <button type="submit" className="btn-yellow" style={{ height: 42, justifyContent: 'center' }}>
            <i className="fas fa-sparkles"></i> Analyze Viability
          </button>
        </form>
      </div>

      {analyzingProduct && (
        <GeminiProductViabilityModal
          product={analyzingProduct}
          onClose={() => setAnalyzingProduct(null)}
        />
      )}
    </div>
  );
}
