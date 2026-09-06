import React, { useState, useEffect, useRef } from 'react';

export default function LogiCorePartnerCard({ onPartnerClick }) {
  const [courierCount, setCourierCount] = useState(0);
  const [speedCount, setSpeedCount] = useState(0);
  const [ratingCount, setRatingCount] = useState('0.0');
  const [factIndex, setFactIndex] = useState(0);
  const [liveShipments, setLiveShipments] = useState(312);
  const [btnState, setBtnState] = useState('idle'); // 'idle' | 'connecting' | 'sent'
  const [rotating, setRotating] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const facts = [
    '⚡ 187 couriers live',
    '📦 120+ partners',
    '🚀 99.8% on-time',
    '🏆 top-rated network',
    '🌍 40+ cities',
    '📈 +22% growth'
  ];

  const TARGET_COURIERS = 187;
  const TARGET_SPEED = 28;
  const TARGET_RATING = 4.9;

  const animateValue = (start, target, duration, isFloat = false, setter) => {
    const startTime = performance.now();
    const update = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (target - start) * eased;
      if (isFloat) {
        setter(current.toFixed(1));
      } else {
        setter(Math.round(current));
      }
      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        setter(isFloat ? target.toFixed(1) : target);
      }
    };
    requestAnimationFrame(update);
  };

  const runCounters = () => {
    setCourierCount(0);
    setSpeedCount(0);
    setRatingCount('0.0');

    animateValue(0, TARGET_COURIERS, 1500, false, setCourierCount);
    setTimeout(() => {
      animateValue(0, TARGET_SPEED, 1300, false, setSpeedCount);
    }, 250);
    setTimeout(() => {
      animateValue(0, TARGET_RATING, 1300, true, setRatingCount);
    }, 450);

    setLiveShipments(Math.floor(280 + Math.random() * 120));
  };

  useEffect(() => {
    runCounters();

    const factInterval = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % facts.length);
    }, 3800);

    return () => clearInterval(factInterval);
  }, []);

  const handleRefresh = (e) => {
    if (e) e.stopPropagation();
    setRotating(true);
    runCounters();
    setTimeout(() => setRotating(false), 450);
  };

  const handleCtaClick = (e) => {
    e.preventDefault();
    if (btnState !== 'idle') return;

    setBtnState('connecting');
    setTimeout(() => {
      setBtnState('sent');
      if (onPartnerClick) onPartnerClick();
      setTimeout(() => {
        setBtnState('idle');
      }, 3000);
    }, 1100);
  };

  return (
    <div
      className={`logi-square ${isHovered ? 'hovered' : ''}`}
      id="logiSquare"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDoubleClick={handleRefresh}
    >
      {/* Brand head + dynamic tag */}
      <div className="brand-head">
        <div className="logo-badge">
          <i className="fas fa-cube"></i>
          <span>LogiCore <small>· network</small></span>
        </div>
        <div className="pulse-tag">
          <i className="fas fa-bolt"></i>
          <span id="dynamicStatus">
            {btnState === 'sent' ? '🤝 partner request sent!' : facts[factIndex]}
          </span>
        </div>
      </div>

      {/* Hero message */}
      <div className="hero-message">
        <h2>
          <span className="highlight">Power</span> your<br />
          deliveries with <span className="highlight">LogiCore</span>
        </h2>
        <div className="sub-message">
          <i className="fas fa-rocket"></i>
          <span>join the platform · 360° logistics</span>
          <i className="fas fa-arrow-right" style={{ color: '#3b9bd7' }}></i>
        </div>
      </div>

      {/* Dynamic stats + counters */}
      <div className="stats-grid" id="statsGrid">
        <div className="stat-item">
          <i className="fas fa-truck-fast"></i>
          <div>
            <span className="stat-number">{courierCount}</span>
            <span className="stat-label">couriers</span>
          </div>
        </div>
        <div className="stat-item">
          <i className="fas fa-clock"></i>
          <div>
            <span className="stat-number">{speedCount}</span>
            <span className="stat-label">min avg</span>
          </div>
        </div>
        <div className="stat-item">
          <i className="fas fa-star"></i>
          <div>
            <span className="stat-number">{ratingCount}</span>
            <span className="stat-label">★ rating</span>
          </div>
        </div>
      </div>

      {/* Partner CTA + marketing pitch */}
      <div className="partner-zone" id="partnerZone">
        <div className="partner-text">
          <i className="fas fa-handshake"></i>
          <span><strong>Partner with us</strong> · list your services &amp; grow</span>
        </div>
        <button
          className={`cta-btn ${btnState}`}
          id="ctaMain"
          onClick={handleCtaClick}
          type="button"
        >
          {btnState === 'connecting' && (
            <>
              <i className="fas fa-spinner fa-spin"></i> Connecting...
            </>
          )}
          {btnState === 'sent' && (
            <>
              <i className="fas fa-check-circle"></i> Partner interest sent!
            </>
          )}
          {btnState === 'idle' && (
            <>
              <i className="fas fa-plus-circle"></i> Become a partner
            </>
          )}
        </button>
      </div>

      {/* Dynamic footer */}
      <div className="foot-note">
        <i className="fas fa-circle" style={{ color: '#5fdb6b', fontSize: '0.5rem' }}></i>
        <span id="liveIndicator">● live on ecom · {liveShipments}+ shipments/h</span>
        <i
          className={`fas fa-sync-alt fa-fw ${rotating ? 'spin-fast' : ''}`}
          style={{ fontSize: '0.65rem', opacity: 0.7, cursor: 'pointer', marginLeft: '0.35rem' }}
          id="refreshIcon"
          onClick={handleRefresh}
          title="Click to refresh stats"
        ></i>
      </div>
    </div>
  );
}
