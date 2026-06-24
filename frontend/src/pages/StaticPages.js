import React from 'react';

export function HowItWorks({ setActiveTab, onRegister }) {
  const steps = [
    { num: '01', icon: 'fa-user-plus', title: 'Register as a Supplier', desc: 'Create your account and list your company profile on SAsuppliers.com. Verification takes 24–48 hours.' },
    { num: '02', icon: 'fa-box-open', title: 'List Your Products', desc: 'Upload your bulk products with pricing, MOQs, and images. Buyers across SA can instantly discover them.' },
    { num: '03', icon: 'fa-envelope-open-text', title: 'Receive Quote Requests', desc: 'Buyers submit instant quote requests. You respond directly with pricing and lead times.' },
    { num: '04', icon: 'fa-handshake', title: 'Close the Deal', desc: 'Connect directly with buyers, negotiate terms, and fulfil orders your way.' },
  ];
  return (
    <div className="page-container">
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.75rem' }}>How It Works</h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: 560, margin: '0 auto' }}>
          SAsuppliers connects South African SME buyers with verified local bulk suppliers. Here's how to get started.
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        {steps.map(s => (
          <div key={s.num} style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '1.5rem', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-12px', left: '1.25rem', background: 'var(--yellow)', color: '#000', fontWeight: 800, fontSize: '0.8rem', padding: '2px 10px', borderRadius: 20 }}>{s.num}</div>
            <i className={`fas ${s.icon}`} style={{ fontSize: '2rem', color: 'var(--yellow)', marginBottom: '0.75rem', display: 'block', marginTop: '0.5rem' }}></i>
            <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem' }}>{s.title}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>{s.desc}</div>
          </div>
        ))}
      </div>
      <div className="cta-section">
        <h2>Ready to get started?</h2>
        <p>Join hundreds of SA suppliers already growing with us.</p>
        <div className="cta-btns">
          <button className="btn-yellow" onClick={onRegister}><i className="fas fa-store"></i> Register as Supplier</button>
          <button className="btn-outline" onClick={() => setActiveTab('marketplace')}><i className="fas fa-search"></i> Browse Products</button>
        </div>
      </div>
    </div>
  );
}

export function About({ setActiveTab }) {
  return (
    <div className="page-container">
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>About SAsuppliers.com</h1>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: '1.5rem' }}>
          SAsuppliers.com is South Africa's dedicated B2B marketplace for intermediate goods — raw materials, components, and bulk supplies. We connect verified local suppliers with SME buyers looking to manufacture, package, and grow their businesses.
        </p>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: '1.5rem' }}>
          Our platform focuses on bulk trade: textiles, chemicals, engineering components, packaging, PPE, and more. Every supplier undergoes manual onboarding — no fly-by-nights.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {[['150+', 'Verified Suppliers'], ['1000+', 'Products Listed'], ['500+', 'Quote Requests/Month']].map(([num, lbl]) => (
            <div key={lbl} style={{ background: 'var(--card-bg)', border: '1px solid var(--yellow)', borderRadius: 8, padding: '1.25rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--yellow)' }}>{num}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{lbl}</div>
            </div>
          ))}
        </div>
        <button className="btn-yellow" onClick={() => setActiveTab('marketplace')}>Browse Marketplace</button>
      </div>
    </div>
  );
}

export function Contact() {
  const [form, setForm] = React.useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = React.useState(false);
  const handle = e => { e.preventDefault(); setSent(true); };

  return (
    <div className="page-container">
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Contact Us</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Get in touch with the SAsuppliers team.</p>
        {sent ? (
          <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid #22c55e', borderRadius: 8, padding: '2rem', textAlign: 'center' }}>
            <i className="fas fa-check-circle" style={{ fontSize: '2.5rem', color: '#22c55e', marginBottom: '1rem', display: 'block' }}></i>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>Message sent!</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>We'll get back to you within 1 business day.</div>
          </div>
        ) : (
          <form onSubmit={handle}>
            {[['name','Your Name','text'],['email','Email Address','email'],['subject','Subject','text']].map(([key, ph, type]) => (
              <div className="input-group" key={key}>
                <label className="input-label">{ph}</label>
                <input className="input" type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={ph} required />
              </div>
            ))}
            <div className="input-group">
              <label className="input-label">Message</label>
              <textarea className="input" rows="5" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="How can we help?" required style={{ resize: 'vertical' }} />
            </div>
            <button type="submit" className="btn-yellow" style={{ width: '100%' }}>Send Message</button>
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              <div><i className="fas fa-phone" style={{ color: 'var(--yellow)', marginRight: 8 }}></i>071 000 0000</div>
              <div><i className="fas fa-envelope" style={{ color: 'var(--yellow)', marginRight: 8 }}></i>info@sasuppliers.com</div>
              <div><i className="fas fa-clock" style={{ color: 'var(--yellow)', marginRight: 8 }}></i>Mon – Fri: 08:00 – 17:00</div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
