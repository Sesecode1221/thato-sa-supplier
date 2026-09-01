import React, { useState } from 'react';
import { useLazyQuery } from '@apollo/client';
import { OPTIMIZE_PRODUCT_LISTING } from '../graphql/operations';
import Modal from './Modal';
import { useToast } from './Toast';

export default function GeminiProductOptimizerModal({ initialData, onApply, onClose }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: initialData?.name || '',
    category: initialData?.category || 'General',
    targetAudience: 'South African SME Business Buyers & Procurement Managers',
    currentPrice: initialData?.priceRange || 'R 50 - R 150',
    currentMoq: initialData?.moq || 50
  });

  const [optimizedResult, setOptimizedResult] = useState(null);

  const [runOptimization, { loading }] = useLazyQuery(OPTIMIZE_PRODUCT_LISTING, {
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      if (data?.optimizeProductListing) {
        setOptimizedResult(data.optimizeProductListing);
        toast('Listing optimized with Gemini AI!');
      }
    },
    onError: (err) => {
      toast(err.message, 'error');
    }
  });

  const handleGenerate = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast('Please enter a product title to optimize', 'error');
      return;
    }
    runOptimization({
      variables: {
        name: form.name,
        category: form.category,
        targetAudience: form.targetAudience,
        currentPrice: form.currentPrice,
        currentMoq: parseInt(form.currentMoq) || 50
      }
    });
  };

  const handleApplyToForm = () => {
    if (!optimizedResult) return;
    onApply({
      name: optimizedResult.optimizedTitle,
      description: optimizedResult.optimizedDescription,
      priceRange: optimizedResult.suggestedPriceRange,
      moq: optimizedResult.suggestedMOQ
    });
    toast('Applied AI content to listing form!');
    onClose();
  };

  return (
    <Modal title="✨ Gemini AI Listing Optimizer" onClose={onClose}>
      <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ background: 'var(--bg3)', padding: '0.75rem 1rem', borderRadius: 6, fontSize: '0.825rem', color: 'var(--text-muted)' }}>
          <i className="fas fa-magic" style={{ color: 'var(--yellow)', marginRight: '0.4rem' }}></i>
          Gemini AI will craft a high-converting B2B catalog title, persuasive commercial copy, and optimal ZAR pricing/MOQ suggestions for the South African market.
        </div>

        <div className="form-group">
          <label className="form-label">Product Name / Draft</label>
          <input
            className="form-input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Cotton T-Shirts, Safety Helmets, Packaging Boxes"
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Category</label>
            <input
              className="form-input"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Current Price / MOQ</label>
            <input
              className="form-input"
              value={form.currentPrice}
              onChange={(e) => setForm({ ...form, currentPrice: e.target.value })}
              placeholder="e.g. R 80 - R 150"
            />
          </div>
        </div>

        <button type="submit" className="btn-yellow" disabled={loading} style={{ justifyContent: 'center' }}>
          {loading ? (
            <>
              <i className="fas fa-spinner fa-spin"></i> Generating with Gemini 3.7 Flash...
            </>
          ) : (
            <>
              <i className="fas fa-sparkles"></i> Generate AI Optimized Listing
            </>
          )}
        </button>
      </form>

      {optimizedResult && (
        <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--yellow)', textTransform: 'uppercase' }}>
              <i className="fas fa-check"></i> Generated AI Output
            </span>
            <button type="button" className="btn-yellow btn-sm" onClick={handleApplyToForm}>
              <i className="fas fa-arrow-down"></i> Apply to Product Form
            </button>
          </div>

          <div style={{ background: 'var(--bg2)', padding: '1rem', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Optimized B2B Title:</div>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', marginTop: '0.2rem' }}>
              {optimizedResult.optimizedTitle}
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>Commercial Catalog Description:</div>
            <div style={{ fontSize: '0.85rem', color: '#ddd', marginTop: '0.2rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
              {optimizedResult.optimizedDescription}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
              <div style={{ background: 'var(--bg3)', padding: '0.5rem 0.75rem', borderRadius: 6 }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Suggested Price Band:</span>
                <div style={{ fontWeight: 600, color: 'var(--yellow)', fontSize: '0.9rem' }}>{optimizedResult.suggestedPriceRange}</div>
              </div>
              <div style={{ background: 'var(--bg3)', padding: '0.5rem 0.75rem', borderRadius: 6 }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Suggested MOQ:</span>
                <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>{optimizedResult.suggestedMOQ} units</div>
              </div>
            </div>

            {optimizedResult.valuePropositions?.length > 0 && (
              <div style={{ marginTop: '0.75rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Key Selling Points:</div>
                <ul style={{ paddingLeft: '1.2rem', fontSize: '0.8rem', color: '#cbd5e1' }}>
                  {optimizedResult.valuePropositions.map((vp, idx) => (
                    <li key={idx}>{vp}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
