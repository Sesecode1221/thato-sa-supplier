import React, { useState } from 'react';
import { useLazyQuery } from '@apollo/client';
import { ANALYZE_PRODUCT_VIABILITY } from '../graphql/operations';
import Modal from './Modal';

export default function GeminiProductViabilityModal({ product, onClose }) {
  const [analyzedData, setAnalyzedData] = useState(null);
  const [runAnalysis, { loading, error }] = useLazyQuery(ANALYZE_PRODUCT_VIABILITY, {
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      if (data?.analyzeProductViability) {
        setAnalyzedData(data.analyzeProductViability);
      }
    }
  });

  React.useEffect(() => {
    if (product) {
      runAnalysis({
        variables: {
          id: product.id,
          name: product.name,
          category: product.category,
          priceRange: product.priceRange,
          moq: product.moq,
          description: product.description
        }
      });
    }
  }, [product, runAnalysis]);

  const scoreColor = (score) => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#F5C518';
    return '#ef4444';
  };

  return (
    <Modal title={`✨ Gemini AI Product Viability: ${product?.name || ''}`} onClose={onClose}>
      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <i className="fas fa-brain fa-spin" style={{ fontSize: '2.5rem', color: 'var(--yellow)' }}></i>
          <div style={{ marginTop: '1rem', fontWeight: 600, fontSize: '1.1rem' }}>
            Gemini 3.7 Flash is analyzing South African B2B market viability...
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
            Evaluating price band in ZAR, SME MOQ preferences, local sourcing advantages, and competitive risks.
          </p>
        </div>
      )}

      {error && !loading && (
        <div style={{ padding: '1.5rem', background: '#331111', border: '1px solid #ef4444', borderRadius: 8, color: '#ffaaaa' }}>
          <i className="fas fa-exclamation-triangle" style={{ marginRight: '0.5rem' }}></i>
          Failed to load AI analysis: {error.message}
        </div>
      )}

      {analyzedData && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Header Score Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #181818 0%, #252520 100%)',
            border: '1px solid var(--border-light)',
            borderRadius: 10,
            padding: '1.25rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                SA SME Market Viability Rating
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
                Demand Level: <span style={{ color: 'var(--yellow)' }}>{analyzedData.demandLevel}</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Optimal Recommended MOQ: <strong style={{ color: '#fff' }}>{analyzedData.recommendedMOQ} units</strong>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              background: '#111',
              border: `2px solid ${scoreColor(analyzedData.viabilityScore)}`,
              borderRadius: '50%',
              width: 76,
              height: 76,
              boxShadow: `0 0 15px ${scoreColor(analyzedData.viabilityScore)}33`
            }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: scoreColor(analyzedData.viabilityScore), lineHeight: 1 }}>
                {analyzedData.viabilityScore}%
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>Viable</div>
            </div>
          </div>

          {/* Pricing & Market Trends */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div style={{ background: 'var(--bg3)', padding: '1rem', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--yellow)', marginBottom: '0.4rem' }}>
                <i className="fas fa-tag" style={{ marginRight: '0.4rem' }}></i> Pricing Analysis (ZAR)
              </div>
              <p style={{ fontSize: '0.85rem', lineHeight: 1.5, color: '#ddd' }}>
                {analyzedData.pricingAnalysis}
              </p>
            </div>

            <div style={{ background: 'var(--bg3)', padding: '1rem', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#60a5fa', marginBottom: '0.4rem' }}>
                <i className="fas fa-chart-line" style={{ marginRight: '0.4rem' }}></i> SA Market Trends
              </div>
              <p style={{ fontSize: '0.85rem', lineHeight: 1.5, color: '#ddd' }}>
                {analyzedData.marketTrends}
              </p>
            </div>
          </div>

          {/* Strengths & Risks */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div style={{ background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.2)', padding: '1rem', borderRadius: 8 }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#4ade80', marginBottom: '0.5rem' }}>
                <i className="fas fa-check-circle" style={{ marginRight: '0.4rem' }}></i> Competitive Strengths
              </div>
              <ul style={{ paddingLeft: '1.2rem', fontSize: '0.825rem', color: '#e2e8f0', lineHeight: 1.6 }}>
                {analyzedData.competitiveStrengths.map((str, idx) => (
                  <li key={idx} style={{ marginBottom: '0.3rem' }}>{str}</li>
                ))}
              </ul>
            </div>

            <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1rem', borderRadius: 8 }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#f87171', marginBottom: '0.5rem' }}>
                <i className="fas fa-shield-alt" style={{ marginRight: '0.4rem' }}></i> Risks & Market Headwinds
              </div>
              <ul style={{ paddingLeft: '1.2rem', fontSize: '0.825rem', color: '#e2e8f0', lineHeight: 1.6 }}>
                {analyzedData.risksAndChallenges.map((risk, idx) => (
                  <li key={idx} style={{ marginBottom: '0.3rem' }}>{risk}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Actionable Recommendations */}
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-light)', padding: '1.2rem', borderRadius: 8 }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--yellow)', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <i className="fas fa-lightbulb"></i> How to Stay Competitive & Maximize Sales
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {analyzedData.actionableRecommendations.map((rec, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.85rem', color: '#eee', background: 'var(--bg2)', padding: '0.6rem 0.8rem', borderRadius: 6 }}>
                  <span style={{ color: 'var(--yellow)', fontWeight: 700 }}>#{idx + 1}</span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Target Industries */}
          {analyzedData.targetIndustries?.length > 0 && (
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Prime Target Buyer Industries in South Africa:
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {analyzedData.targetIndustries.map((ind, idx) => (
                  <span key={idx} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: 4, color: '#fff' }}>
                    🏢 {ind}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button className="btn-outline btn-sm" onClick={onClose}>
              Close Analysis
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
