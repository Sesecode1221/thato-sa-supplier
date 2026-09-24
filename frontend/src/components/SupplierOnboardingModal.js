import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  GET_SUPPORTED_PAYMENT_GATEWAYS,
  INITIATE_GATEWAY_SETUP_REDIRECT,
  SUBMIT_PAYMENT_GATEWAY_PROOF,
  CREATE_SUPPLIER_GATEWAY_CHECKOUT,
  CONFIRM_SUPPLIER_SUBSCRIPTION,
  ME
} from '../graphql/operations';
import { useToast } from './Toast';

export default function SupplierOnboardingModal({ supplier, onComplete, onClose }) {
  const { toast } = useToast();
  
  const hasExistingVerification = supplier?.verificationStatus === 'VERIFIED' || supplier?.hasApprovedGateway;
  const initialStep = (hasExistingVerification && (!supplier?.subscriptionPlan || supplier?.subscriptionStatus !== 'active'))
    ? 2
    : 1;

  const [currentStep, setCurrentStep] = useState(initialStep);

  // Payment Gateway Verification State
  const [selectedGatewayId, setSelectedGatewayId] = useState(supplier?.preferredGatewayId || 'payfast');
  const [gatewayRedirectSession, setGatewayRedirectSession] = useState(null);
  const [gatewayForm, setGatewayForm] = useState({
    merchantId: supplier?.paymentGateway?.merchantId || '',
    businessName: supplier?.paymentGateway?.businessName || supplier?.companyName || '',
    proofReference: supplier?.paymentGateway?.proofReference || '',
    payoutBankName: supplier?.paymentGateway?.payoutBankName || 'First National Bank (FNB)',
    payoutAccountLast4: supplier?.paymentGateway?.payoutAccountLast4 || '',
    proofDocumentNote: supplier?.paymentGateway?.documentNote || 'Approved merchant profile with FICA-cleared settlement account'
  });
  const [approvedGateway, setApprovedGateway] = useState(supplier?.paymentGateway || null);

  // Subscription State
  const [selectedPlan, setSelectedPlan] = useState('Pro / Premium');
  const [checkoutPayload, setCheckoutPayload] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Status flags
  const [verificationDone, setVerificationDone] = useState(Boolean(hasExistingVerification));
  const [subscriptionDone, setSubscriptionDone] = useState(supplier?.subscriptionStatus === 'active');

  // GraphQL queries and mutations
  const { data: gwData, loading: gwLoading } = useQuery(GET_SUPPORTED_PAYMENT_GATEWAYS);

  const [initiateGatewayRedirect, { loading: initiatingGateway }] = useMutation(INITIATE_GATEWAY_SETUP_REDIRECT);
  const [submitGatewayProof, { loading: submittingProof }] = useMutation(SUBMIT_PAYMENT_GATEWAY_PROOF);
  const [createGatewayCheckout, { loading: checkingOut }] = useMutation(CREATE_SUPPLIER_GATEWAY_CHECKOUT);
  const [confirmSubscription, { loading: confirming }] = useMutation(CONFIRM_SUPPLIER_SUBSCRIPTION);

  const gateways = gwData?.supportedPaymentGateways || [];
  const selectedGateway = gateways.find(g => g.id === selectedGatewayId) || gateways[0];

  // Action: Redirect to payment gateway of supplier's choice
  const handleRedirectToGateway = async () => {
    if (!selectedGateway) return;
    try {
      const res = await initiateGatewayRedirect({
        variables: {
          gatewayId: selectedGatewayId,
          returnUrl: `${window.location.origin}/dashboard?gateway_return=1&gateway=${selectedGatewayId}`
        }
      });
      const session = res.data.initiateGatewaySetupRedirect;
      setGatewayRedirectSession(session);
      
      // Auto-prefill proof reference with setup reference
      if (session.setupReference) {
        setGatewayForm(prev => ({
          ...prev,
          proofReference: prev.proofReference || session.setupReference,
          businessName: supplier?.companyName || prev.businessName
        }));
      }

      // Open the gateway's merchant setup portal in a new browser window/tab
      window.open(session.redirectUrl, '_blank', 'noopener,noreferrer');
      toast(`Redirecting to ${session.gatewayName} onboarding in a new window!`, 'info');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  // Action: Submit proof of approved gateway profile
  const handleSubmitGatewayProof = async (e) => {
    if (e) e.preventDefault();
    if (!gatewayForm.merchantId.trim()) {
      toast('Please enter your Merchant ID / Account ID from your gateway dashboard', 'error');
      return;
    }
    if (!gatewayForm.businessName.trim()) {
      toast('Please enter your registered business name', 'error');
      return;
    }

    try {
      const res = await submitGatewayProof({
        variables: {
          gatewayId: selectedGatewayId,
          merchantId: gatewayForm.merchantId.trim(),
          businessName: gatewayForm.businessName.trim(),
          proofReference: gatewayForm.proofReference.trim() || `PROOF-${Date.now().toString(36).toUpperCase()}`,
          payoutBankName: gatewayForm.payoutBankName,
          payoutAccountLast4: gatewayForm.payoutAccountLast4.trim() || '8821',
          proofDocumentNote: gatewayForm.proofDocumentNote,
          simulateAutoApproval: true
        },
        refetchQueries: [{ query: ME }]
      });

      const updatedSupplier = res.data.submitPaymentGatewayProof;
      setApprovedGateway(updatedSupplier.paymentGateway);
      setVerificationDone(true);
      toast(`✓ Verified! Active merchant profile confirmed via ${selectedGateway?.name || 'payment gateway'}.`, 'success');
      
      // Transition to subscription step
      setTimeout(() => {
        setCurrentStep(2);
      }, 1000);
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  // Helper: Quick-fill test proof for convenience
  const handleQuickFillSampleProof = () => {
    const sampleId = selectedGateway?.testMerchantExample || `PF-${Math.floor(100000 + Math.random() * 900000)}`;
    setGatewayForm({
      merchantId: sampleId,
      businessName: supplier?.companyName || 'South Africa Trade Enterprise',
      proofReference: `SETTLE-ACT-${Math.floor(10000 + Math.random() * 90000)}`,
      payoutBankName: 'First National Bank (FNB)',
      payoutAccountLast4: '4819',
      proofDocumentNote: 'Commercial Bank Account & FICA Payout Status Approved by Gateway Compliance'
    });
    toast('Filled sample active merchant credentials for testing!', 'info');
  };

  // Step 2 Action: Launch Subscription Gateway Checkout
  const handleStartSubscriptionCheckout = async (plan) => {
    const targetPlan = plan || selectedPlan;
    setSelectedPlan(targetPlan);
    try {
      const res = await createGatewayCheckout({
        variables: { planName: targetPlan, billingCycle: 'monthly' }
      });
      setCheckoutPayload(res.data.createSupplierGatewayCheckout);
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  // Simulate payment completion
  const handleSimulateSubscriptionSuccess = async () => {
    if (!checkoutPayload) return;
    setProcessingPayment(true);
    setTimeout(async () => {
      try {
        await confirmSubscription({
          variables: {
            planName: checkoutPayload.planName,
            paymentReference: checkoutPayload.paymentReference
          },
          refetchQueries: [{ query: ME }]
        });
        setSubscriptionDone(true);
        setProcessingPayment(false);
        setCheckoutPayload(null);
        toast(`Subscription activated! Welcome to SAsuppliers Pro wholesale network.`);
        setCurrentStep(3);
      } catch (err) {
        toast(err.message, 'error');
        setProcessingPayment(false);
      }
    }, 1200);
  };

  const handleFinishOnboarding = () => {
    if (onComplete) onComplete();
    if (onClose) onClose();
  };

  return (
    <div className="modal-backdrop" style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div className="modal-content" style={{
        background: 'var(--card-bg)',
        border: '1.5px solid var(--border)',
        borderRadius: 12,
        maxWidth: 880,
        width: '100%',
        maxHeight: '92vh',
        overflowY: 'auto',
        padding: '1.75rem',
        boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
      }}>
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.35rem' }}>
              <span style={{ background: 'var(--yellow)', color: '#000', fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: 4 }}>
                ONBOARDING STEP {currentStep} OF 3
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Account: <strong>{supplier?.companyName}</strong>
              </span>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#fff' }}>
              Verify Your Business Profile via Payment Gateway
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: '0.25rem 0 0 0', lineHeight: 1.5 }}>
              SAsuppliers uses regulated South African payment gateways to verify your business registration and bank settlement account with zero document liability.
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}
            >
              ×
            </button>
          )}
        </div>

        {/* Multi-step Breadcrumbs Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', background: 'var(--bg3)', padding: '0.85rem 1.25rem', borderRadius: 8, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: currentStep === 1 ? 1 : (verificationDone ? 0.9 : 0.5) }}>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: verificationDone ? '#22c55e' : (currentStep === 1 ? 'var(--yellow)' : 'var(--bg2)'),
              color: currentStep === 1 && !verificationDone ? '#000' : '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.85rem'
            }}>
              {verificationDone ? '✓' : '1'}
            </div>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: currentStep === 1 ? 'var(--yellow)' : '#fff' }}>
                Payment Gateway Verification
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                {verificationDone ? 'Approved & Verified' : 'Gateway Merchant Proof'}
              </div>
            </div>
          </div>

          <div style={{ width: 40, height: 2, background: verificationDone ? '#22c55e' : 'var(--border)' }}></div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: currentStep === 2 ? 1 : (subscriptionDone ? 0.9 : 0.5) }}>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: subscriptionDone ? '#22c55e' : (currentStep === 2 ? 'var(--yellow)' : 'var(--bg2)'),
              color: currentStep === 2 && !subscriptionDone ? '#000' : '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.85rem'
            }}>
              {subscriptionDone ? '✓' : '2'}
            </div>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: currentStep === 2 ? 'var(--yellow)' : '#fff' }}>
                Platform Subscription
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                {subscriptionDone ? 'Subscribed' : 'Card / Instant EFT'}
              </div>
            </div>
          </div>

          <div style={{ width: 40, height: 2, background: subscriptionDone ? '#22c55e' : 'var(--border)' }}></div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: currentStep === 3 ? 1 : 0.5 }}>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: currentStep === 3 ? '#22c55e' : 'var(--bg2)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.85rem'
            }}>
              3
            </div>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: currentStep === 3 ? '#22c55e' : '#fff' }}>
                Catalog Ready
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Publish listings</div>
            </div>
          </div>
        </div>

        {/* STEP 1: PAYMENT GATEWAY VERIFICATION ONLY */}
        {currentStep === 1 && (
          <div>
            <div style={{ background: 'rgba(234,179,8,0.06)', border: '1px solid var(--yellow)', padding: '0.85rem 1rem', borderRadius: 8, marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: 'var(--yellow)', fontSize: '0.85rem', marginBottom: 4 }}>
                <i className="fas fa-info-circle"></i> How Payment Gateway Verification Works:
              </div>
              <p style={{ margin: 0, fontSize: '0.79rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                1. <strong>Select your preferred payment gateway</strong> below and click <em>"Redirect to Gateway to Setup Business Profile"</em>.<br />
                2. In the gateway portal, submit your business registration details and South African bank confirmation for daily settlement.<br />
                3. Return to SAsuppliers.com and enter your <strong>Merchant ID / Account ID</strong> and proof reference. SAsuppliers.com validates your status to activate your verified supplier badge.
              </p>
            </div>

            {/* Gateway Selection Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
              {gateways.map(gw => (
                <div
                  key={gw.id}
                  onClick={() => { setSelectedGatewayId(gw.id); setGatewayRedirectSession(null); }}
                  style={{
                    background: selectedGatewayId === gw.id ? 'var(--bg3)' : 'var(--bg2)',
                    border: `1.5px solid ${selectedGatewayId === gw.id ? 'var(--yellow)' : 'var(--border)'}`,
                    borderRadius: 8,
                    padding: '0.85rem',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                >
                  {gw.isPopular && (
                    <span style={{ position: 'absolute', top: -8, right: 8, background: 'var(--yellow)', color: '#000', fontSize: '0.62rem', fontWeight: 800, padding: '1px 6px', borderRadius: 3 }}>
                      POPULAR IN SA
                    </span>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <input
                      type="radio"
                      checked={selectedGatewayId === gw.id}
                      onChange={() => setSelectedGatewayId(gw.id)}
                      style={{ cursor: 'pointer' }}
                    />
                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#fff' }}>
                      <i className={`fas ${gw.logo}`} style={{ color: gw.color, marginRight: 6 }}></i>
                      {gw.name}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginBottom: 6 }}>
                    {gw.tagline}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#22c55e', fontWeight: 700 }}>
                    ⚡ {gw.settlementSpeed}
                  </div>
                </div>
              ))}
            </div>

            {/* Gateway Details & Actions */}
            {selectedGateway && (
              <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '1.25rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <i className={`fas ${selectedGateway.logo}`} style={{ color: selectedGateway.color, fontSize: '1.2rem' }}></i>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#fff' }}>
                        {selectedGateway.name}
                      </h3>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0.25rem 0 0 0' }}>
                      {selectedGateway.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="btn-outline btn-sm"
                    onClick={handleRedirectToGateway}
                    disabled={initiatingGateway}
                    style={{ borderColor: 'var(--yellow)', color: 'var(--yellow)', fontWeight: 700 }}
                  >
                    <i className="fas fa-external-link-alt" style={{ marginRight: 6 }}></i>
                    {initiatingGateway ? 'Preparing Gateway Redirect...' : `Redirect to ${selectedGateway.name.split(' ')[0]} to Setup Business Profile`}
                  </button>
                </div>

                {/* Redirect session confirmation banner */}
                {gatewayRedirectSession && (
                  <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid #22c55e', borderRadius: 6, padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.8rem' }}>
                    <div style={{ fontWeight: 700, color: '#22c55e', marginBottom: 2 }}>
                      ✓ Gateway Redirect Portal Launched (Reference: <code>{gatewayRedirectSession.setupReference}</code>)
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>
                      A new tab was opened at <code>{gatewayRedirectSession.redirectUrl}</code>. Complete your setup on {selectedGateway.name} and return here to enter your merchant credentials.
                    </div>
                  </div>
                )}

                {/* Proof Form */}
                <form onSubmit={handleSubmitGatewayProof} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: '#fff' }}>
                      Submit Proof of Approved Active Merchant Profile:
                    </h4>
                    <button
                      type="button"
                      className="btn-outline btn-sm"
                      onClick={handleQuickFillSampleProof}
                      style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                    >
                      ⚡ Quick-Fill Valid Sample Credentials (Testing)
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                        Merchant ID / Account ID *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder={selectedGateway.testMerchantExample || 'e.g. PF-1049281'}
                        value={gatewayForm.merchantId}
                        onChange={e => setGatewayForm({ ...gatewayForm, merchantId: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                        Registered Business Name on Gateway *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Urban Apparel SA (Pty) Ltd"
                        value={gatewayForm.businessName}
                        onChange={e => setGatewayForm({ ...gatewayForm, businessName: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                        Payout Settlement Bank (South Africa)
                      </label>
                      <select
                        className="form-control"
                        value={gatewayForm.payoutBankName}
                        onChange={e => setGatewayForm({ ...gatewayForm, payoutBankName: e.target.value })}
                      >
                        <option value="First National Bank (FNB)">First National Bank (FNB)</option>
                        <option value="Standard Bank">Standard Bank</option>
                        <option value="Nedbank">Nedbank</option>
                        <option value="Absa Bank">Absa Bank</option>
                        <option value="Capitec Bank">Capitec Bank</option>
                        <option value="Investec">Investec</option>
                        <option value="Discovery Bank">Discovery Bank</option>
                        <option value="TymeBank">TymeBank</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                        Account Last 4 Digits / Reference
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. 4819 / PF-REF-9921"
                        value={gatewayForm.proofReference}
                        onChange={e => setGatewayForm({ ...gatewayForm, proofReference: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button
                      type="submit"
                      className="btn-yellow"
                      disabled={submittingProof}
                      style={{ flex: 1, fontWeight: 800 }}
                    >
                      <i className="fas fa-check-circle" style={{ marginRight: 6 }}></i>
                      {submittingProof ? 'Verifying Gateway Proof...' : `Confirm & Verify with ${selectedGateway.name.split(' ')[0]}`}
                    </button>
                    {verificationDone && (
                      <button
                        type="button"
                        className="btn-outline"
                        onClick={() => setCurrentStep(2)}
                      >
                        Next: Subscription →
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: PLATFORM SUBSCRIPTION GATEWAY */}
        {currentStep === 2 && (
          <div>
            <div style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid #3b82f6', padding: '0.85rem 1rem', borderRadius: 8, marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: 800, color: '#93c5fd', fontSize: '0.9rem', marginBottom: 2 }}>
                Step 2 of 3: Activate Your Marketplace Supplier Subscription
              </div>
              <p style={{ margin: 0, fontSize: '0.79rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Your business profile was verified via your payment gateway! Complete platform access activation via our designated South African payment gateway.
              </p>
            </div>

            {/* Plans Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              {[
                {
                  name: 'Starter / Basic',
                  price: 'R99',
                  period: '/month',
                  desc: 'For emerging micro-manufacturers & new suppliers.',
                  features: ['10 catalog listings', 'Payment Gateway verification badge', 'Standard RFQ routing', 'Basic AI viability check']
                },
                {
                  name: 'Pro / Premium',
                  price: 'R249',
                  period: '/month',
                  badge: 'RECOMMENDED',
                  desc: 'For active South African manufacturers & distributors.',
                  features: ['50 catalog listings', 'Official Verified Supplier Badge', 'turboSMTP RFQ quotes with direct reply', 'Full AI Competitiveness roadmap', 'Logistics calculator ready']
                },
                {
                  name: 'Enterprise',
                  price: 'R399',
                  period: '/month',
                  desc: 'Full visibility, priority SEO & unlimited wholesale catalog.',
                  features: ['Unlimited listings', 'Top search placement', 'Multi-channel gateway support', 'Dedicated support manager']
                }
              ].map(plan => (
                <div
                  key={plan.name}
                  onClick={() => setSelectedPlan(plan.name)}
                  style={{
                    background: selectedPlan === plan.name ? 'rgba(234,179,8,0.06)' : 'var(--bg2)',
                    border: `2px solid ${selectedPlan === plan.name ? 'var(--yellow)' : 'var(--border)'}`,
                    borderRadius: 8,
                    padding: '1.15rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative'
                  }}
                >
                  {plan.badge && (
                    <span style={{ position: 'absolute', top: -10, right: 12, background: 'var(--yellow)', color: '#000', fontSize: '0.62rem', fontWeight: 800, padding: '2px 8px', borderRadius: 10 }}>
                      {plan.badge}
                    </span>
                  )}
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff' }}>{plan.name}</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--yellow)', margin: '0.25rem 0' }}>
                      {plan.price}<span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>{plan.period}</span>
                    </div>
                    <p style={{ color: 'var(--text-dim)', fontSize: '0.76rem', marginBottom: '0.75rem' }}>{plan.desc}</p>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      {plan.features.map(f => (
                        <li key={f} style={{ padding: '0.15rem 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <i className="fas fa-check" style={{ color: '#22c55e', fontSize: '0.7rem' }}></i> {f}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    className={selectedPlan === plan.name ? 'btn-yellow btn-sm' : 'btn-outline btn-sm'}
                    style={{ marginTop: '1rem', width: '100%' }}
                    onClick={(e) => { e.stopPropagation(); handleStartSubscriptionCheckout(plan.name); }}
                  >
                    Select {plan.name.split('/')[0]}
                  </button>
                </div>
              ))}
            </div>

            {/* Active Checkout Screen */}
            {checkoutPayload ? (
              <div style={{ background: 'var(--bg3)', border: '1.5px solid var(--yellow)', borderRadius: 8, padding: '1.25rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ fontWeight: 800, color: '#fff' }}>External Gateway Checkout Session</div>
                  <code style={{ color: 'var(--yellow)', fontWeight: 700 }}>{checkoutPayload.paymentReference}</code>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  Amount Due: <strong style={{ color: 'var(--yellow)', fontSize: '1.1rem' }}>{checkoutPayload.amountZAR}</strong> / month for <strong>{checkoutPayload.planName}</strong>
                </div>
                <button
                  type="button"
                  className="btn-yellow"
                  style={{ width: '100%', padding: '0.75rem', fontWeight: 800 }}
                  onClick={handleSimulateSubscriptionSuccess}
                  disabled={processingPayment || confirming}
                >
                  {processingPayment ? 'Processing with Payment Gateway...' : `Simulate Payment Settlement (${checkoutPayload.amountZAR})`}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button type="button" className="btn-outline btn-sm" onClick={() => setCurrentStep(1)}>
                  ← Back to Gateway Verification
                </button>
                <button
                  type="button"
                  className="btn-yellow"
                  onClick={() => handleStartSubscriptionCheckout(selectedPlan)}
                  disabled={checkingOut}
                >
                  <i className="fas fa-credit-card" style={{ marginRight: 6 }}></i>
                  {checkingOut ? 'Generating Gateway Checkout...' : `Proceed to Gateway Checkout (${selectedPlan.split('/')[0]})`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: SUCCESS & PUBLISH READY */}
        {currentStep === 3 && (
          <div style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 1rem auto' }}>
              ✓
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', margin: '0 0 0.5rem 0' }}>
              Supplier Account Fully Verified & Active!
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: 520, margin: '0 auto 1.5rem auto', lineHeight: 1.6 }}>
              Your business profile is verified through your payment gateway with commercial daily settlement enabled, and your <strong>{selectedPlan}</strong> subscription is active. You can now publish products to buyers across South Africa.
            </p>

            <div style={{ display: 'inline-flex', gap: '0.75rem', alignItems: 'center', background: 'var(--bg2)', padding: '0.75rem 1.25rem', borderRadius: 8, marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
              <span style={{ background: '#22c55e', color: '#000', fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: 4 }}>
                VERIFIED BADGE ACTIVE
              </span>
              <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 700 }}>
                {approvedGateway ? approvedGateway.verifiedBadge : '✓ Verified Payment Gateway Merchant'}
              </span>
            </div>

            <div>
              <button
                type="button"
                className="btn-yellow"
                style={{ padding: '0.75rem 2rem', fontWeight: 800, fontSize: '0.95rem' }}
                onClick={handleFinishOnboarding}
              >
                Go to Supplier Hub & Manage Products →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
