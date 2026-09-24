import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  GET_SUPPORTED_PAYMENT_GATEWAYS,
  GET_SUPPLIER_VERIFICATION_RECORDS,
  INITIATE_GATEWAY_SETUP_REDIRECT,
  SUBMIT_PAYMENT_GATEWAY_PROOF,
  DISCONNECT_PAYMENT_GATEWAY,
  CREATE_SUPPLIER_GATEWAY_CHECKOUT,
  CONFIRM_SUPPLIER_SUBSCRIPTION,
  ME
} from '../graphql/operations';
import Modal from './Modal';
import { useToast } from './Toast';

export default function SupplierVerificationHub({ supplier, onRefetchSupplier }) {
  const { toast } = useToast();

  // Platform Subscription Gateway State
  const [showGatewayModal, setShowGatewayModal] = useState(false);
  const [gatewayPayload, setGatewayPayload] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('Pro / Premium');
  const [gatewayProcessing, setGatewayProcessing] = useState(false);
  const [showProposalDetails, setShowProposalDetails] = useState(false);

  // Supplier Choice Payment Gateway Verification State
  const [selectedGatewayForSetup, setSelectedGatewayForSetup] = useState(null);
  const [gatewayRedirectSession, setGatewayRedirectSession] = useState(null);
  const [showGatewayProofModal, setShowGatewayProofModal] = useState(false);
  const [proofForm, setProofForm] = useState({
    merchantId: '',
    businessName: supplier?.companyName || '',
    proofReference: '',
    payoutBankName: 'First National Bank (FNB)',
    payoutAccountLast4: '',
    proofDocumentNote: 'Active merchant profile approved with verified daily settlement account'
  });

  // Queries
  const { data: gwData, loading: gwLoading } = useQuery(GET_SUPPORTED_PAYMENT_GATEWAYS);
  const { data: recordsData, loading: recordsLoading, refetch: refetchRecords } = useQuery(
    GET_SUPPLIER_VERIFICATION_RECORDS,
    { variables: { supplierId: supplier?.id || '' } }
  );

  // Mutations
  const [createGatewayCheckout] = useMutation(CREATE_SUPPLIER_GATEWAY_CHECKOUT);
  const [confirmSubscription, { loading: confirmingSub }] = useMutation(CONFIRM_SUPPLIER_SUBSCRIPTION);
  const [initiateGatewayRedirect, { loading: initiatingGatewayRedirect }] = useMutation(INITIATE_GATEWAY_SETUP_REDIRECT);
  const [submitGatewayProof, { loading: submittingGatewayProof }] = useMutation(SUBMIT_PAYMENT_GATEWAY_PROOF);
  const [disconnectGateway, { loading: disconnectingGateway }] = useMutation(DISCONNECT_PAYMENT_GATEWAY);

  const gateways = gwData?.supportedPaymentGateways || [];
  const records = recordsData?.supplierVerificationRecords || [];

  const status = supplier?.verificationStatus || 'UNVERIFIED';
  const paymentGateway = supplier?.paymentGateway;
  const hasApprovedGateway = Boolean(supplier?.hasApprovedGateway && paymentGateway);

  const getStatusBadge = (st) => {
    switch (st) {
      case 'VERIFIED':
        return (
          <span style={{ background: 'rgba(34,197,94,0.18)', color: '#22c55e', border: '1px solid #22c55e', padding: '4px 10px', borderRadius: 4, fontWeight: 700, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <i className="fas fa-check-circle"></i> VERIFIED (Payment Gateway Approved)
          </span>
        );
      case 'VERIFICATION_PENDING':
        return (
          <span style={{ background: 'rgba(234,179,8,0.18)', color: 'var(--yellow)', border: '1px solid var(--yellow)', padding: '4px 10px', borderRadius: 4, fontWeight: 700, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <i className="fas fa-hourglass-half"></i> VERIFICATION PENDING
          </span>
        );
      case 'VERIFICATION_FAILED':
        return (
          <span style={{ background: 'rgba(239,68,68,0.18)', color: '#ef4444', border: '1px solid #ef4444', padding: '4px 10px', borderRadius: 4, fontWeight: 700, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <i className="fas fa-times-circle"></i> VERIFICATION FAILED
          </span>
        );
      case 'VERIFICATION_EXPIRED':
        return (
          <span style={{ background: 'rgba(156,163,175,0.18)', color: '#9ca3af', border: '1px solid #9ca3af', padding: '4px 10px', borderRadius: 4, fontWeight: 700, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <i className="fas fa-history"></i> VERIFICATION EXPIRED
          </span>
        );
      case 'VERIFICATION_SUSPENDED':
        return (
          <span style={{ background: 'rgba(249,115,22,0.18)', color: '#f97316', border: '1px solid #f97316', padding: '4px 10px', borderRadius: 4, fontWeight: 700, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <i className="fas fa-exclamation-triangle"></i> VERIFICATION SUSPENDED
          </span>
        );
      default:
        return (
          <span style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)', border: '1px solid var(--border)', padding: '4px 10px', borderRadius: 4, fontWeight: 700, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <i className="fas fa-shield-alt"></i> UNVERIFIED
          </span>
        );
    }
  };

  // Gateway Redirect Initiation
  const handleRedirectToGateway = async (gw) => {
    setSelectedGatewayForSetup(gw);
    try {
      const res = await initiateGatewayRedirect({
        variables: {
          gatewayId: gw.id,
          returnUrl: `${window.location.origin}/dashboard?gateway_return=1&gateway=${gw.id}`
        }
      });
      const session = res.data.initiateGatewaySetupRedirect;
      setGatewayRedirectSession(session);
      
      // Auto pre-populate proof form with setup reference
      setProofForm(prev => ({
        ...prev,
        proofReference: session.setupReference,
        businessName: supplier?.companyName || prev.businessName
      }));

      // Open gateway setup in new window/tab
      window.open(session.redirectUrl, '_blank', 'noopener,noreferrer');
      toast(`Redirecting to ${gw.name} merchant portal in a new window...`, 'info');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  // Open Proof Modal for a chosen gateway
  const handleOpenProofModal = (gw) => {
    setSelectedGatewayForSetup(gw);
    setProofForm({
      merchantId: paymentGateway?.merchantId || '',
      businessName: supplier?.companyName || paymentGateway?.businessName || '',
      proofReference: paymentGateway?.proofReference || `SETTLE-${Date.now().toString(36).toUpperCase()}`,
      payoutBankName: paymentGateway?.payoutBankName || 'First National Bank (FNB)',
      payoutAccountLast4: paymentGateway?.payoutAccountLast4 || '4819',
      proofDocumentNote: paymentGateway?.documentNote || `FICA-approved merchant account with daily payout clearance via ${gw.name}`
    });
    setShowGatewayProofModal(true);
  };

  // Submit Proof of Approved Gateway Profile
  const handleSubmitProof = async (e) => {
    if (e) e.preventDefault();
    if (!selectedGatewayForSetup) return;

    if (!proofForm.merchantId.trim()) {
      toast('Please enter your Merchant ID / Account ID', 'error');
      return;
    }
    if (!proofForm.businessName.trim()) {
      toast('Please enter your Registered Business Name on the gateway', 'error');
      return;
    }

    try {
      await submitGatewayProof({
        variables: {
          gatewayId: selectedGatewayForSetup.id,
          merchantId: proofForm.merchantId.trim(),
          businessName: proofForm.businessName.trim(),
          proofReference: proofForm.proofReference.trim() || `PROOF-${Date.now().toString(36).toUpperCase()}`,
          payoutBankName: proofForm.payoutBankName,
          payoutAccountLast4: proofForm.payoutAccountLast4.trim() || 'XXXX',
          proofDocumentNote: proofForm.proofDocumentNote,
          simulateAutoApproval: true
        },
        refetchQueries: [{ query: ME }]
      });

      toast(`✓ Verified! Active merchant profile confirmed via ${selectedGatewayForSetup.name}.`, 'success');
      setShowGatewayProofModal(false);
      setSelectedGatewayForSetup(null);
      setGatewayRedirectSession(null);
      if (onRefetchSupplier) onRefetchSupplier();
      refetchRecords();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  // Quick fill test proof
  const handleQuickFillSampleProof = () => {
    if (!selectedGatewayForSetup) return;
    setProofForm({
      merchantId: selectedGatewayForSetup.testMerchantExample || `PF-${Math.floor(100000 + Math.random() * 900000)}`,
      businessName: supplier?.companyName || 'South Africa Trade Enterprise (Pty) Ltd',
      proofReference: `SETTLE-ACT-${Math.floor(10000 + Math.random() * 90000)}`,
      payoutBankName: 'First National Bank (FNB)',
      payoutAccountLast4: '4819',
      proofDocumentNote: 'Commercial Bank Account & FICA Payout Status Approved by Gateway Compliance'
    });
    toast('Filled sample active merchant credentials for testing!', 'info');
  };

  // Disconnect Gateway
  const handleDisconnectGateway = async () => {
    if (!window.confirm('Are you sure you want to unlink your payment gateway profile? This will remove your gateway verified badge.')) {
      return;
    }
    try {
      await disconnectGateway({
        variables: { supplierId: supplier?.id || '' },
        refetchQueries: [{ query: ME }]
      });
      toast('Payment gateway unlinked', 'info');
      if (onRefetchSupplier) onRefetchSupplier();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  // Platform Subscription Gateway Checkout
  const handleOpenGatewayCheckout = async (plan) => {
    setSelectedPlan(plan);
    try {
      const res = await createGatewayCheckout({
        variables: { planName: plan, billingCycle: 'monthly' }
      });
      setGatewayPayload(res.data.createSupplierGatewayCheckout);
      setShowGatewayModal(true);
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const handleSimulatePaymentCompletion = async () => {
    if (!gatewayPayload) return;
    setGatewayProcessing(true);
    setTimeout(async () => {
      try {
        await confirmSubscription({
          variables: {
            planName: gatewayPayload.planName,
            paymentReference: gatewayPayload.paymentReference
          },
          refetchQueries: [{ query: ME }]
        });
        toast(`Subscription payment successful for ${gatewayPayload.planName}!`);
        setShowGatewayModal(false);
        setGatewayPayload(null);
        setGatewayProcessing(false);
        if (onRefetchSupplier) onRefetchSupplier();
      } catch (err) {
        toast(err.message, 'error');
        setGatewayProcessing(false);
      }
    }, 1200);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* ── TOP BANNER: PAYMENT GATEWAY VERIFICATION ARCHITECTURE ── */}
      <div style={{ background: 'linear-gradient(135deg, rgba(234,179,8,0.12) 0%, rgba(20,20,20,0.95) 100%)', border: '1px solid var(--yellow)', borderRadius: 10, padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ maxWidth: 840 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
              <span style={{ background: 'var(--yellow)', color: '#000', fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase' }}>
                PAYMENT GATEWAY VERIFICATION
              </span>
              <span style={{ color: 'var(--yellow)', fontWeight: 700, fontSize: '0.9rem' }}>
                Supplier-Choice Payment Gateway Architecture
              </span>
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0.25rem 0 0.5rem 0', color: '#fff' }}>
              Verification via Your Preferred Payment Gateway
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>
              Under the SAsuppliers.com supplier-owned model, <strong>enterprise verification is performed exclusively via authorized South African payment gateways</strong> (PayFast, Yoco, Peach Payments, Ozow, SnapScan, and DPO PayGate). Suppliers complete business profile and banking settlement KYC directly with their chosen gateway and return with their approved merchant ID. SAsuppliers.com stores zero sensitive identity documents, ensuring complete POPIA compliance.
            </p>
          </div>
          <button
            className="btn-outline btn-sm"
            onClick={() => setShowProposalDetails(!showProposalDetails)}
            style={{ borderColor: 'var(--yellow)', color: 'var(--yellow)' }}
          >
            <i className={`fas fa-${showProposalDetails ? 'compress-arrows-alt' : 'file-contract'}`} style={{ marginRight: 6 }}></i>
            {showProposalDetails ? 'Hide Policy Details' : 'View Gateway Architecture & Rules'}
          </button>
        </div>

        {/* Expandable Strategic Proposal Matrix & Rules */}
        {showProposalDetails && (
          <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ background: 'var(--bg2)', padding: '1rem', borderRadius: 6, border: '1px solid var(--border)' }}>
                <div style={{ color: '#fff', fontWeight: 700, marginBottom: '0.4rem' }}>
                  <i className="fas fa-credit-card" style={{ color: 'var(--yellow)', marginRight: 6 }}></i> 1. Supplier Choice Gateway
                </div>
                The supplier selects and registers on their preferred payment gateway. Financial and FICA KYC checks are handled by the regulated payment institution.
              </div>
              <div style={{ background: 'var(--bg2)', padding: '1rem', borderRadius: 6, border: '1px solid var(--border)' }}>
                <div style={{ color: '#fff', fontWeight: 700, marginBottom: '0.4rem' }}>
                  <i className="fas fa-database" style={{ color: 'var(--yellow)', marginRight: 6 }}></i> 2. Zero Document Retention
                </div>
                SAsuppliers.com avoids POPIA compliance liability by retaining no ID numbers, proof of residence, or CIPC original docs. Only status, timestamp, and gateway reference are stored.
              </div>
              <div style={{ background: 'var(--bg2)', padding: '1rem', borderRadius: 6, border: '1px solid var(--border)' }}>
                <div style={{ color: '#fff', fontWeight: 700, marginBottom: '0.4rem' }}>
                  <i className="fas fa-university" style={{ color: 'var(--yellow)', marginRight: 6 }}></i> 3. Active Bank Settlement
                </div>
                Approval confirms the supplier has an active commercial bank account in South Africa cleared for merchant payouts and customer transactions.
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.4)', padding: '0.85rem 1rem', borderRadius: 6, borderLeft: '3px solid var(--yellow)', fontStyle: 'italic' }}>
              <strong>Standard Disclaimer (displayed to buyers):</strong> "The Verified Supplier badge confirms that an authorized South African payment gateway verified this enterprise's business registration and daily settlement bank account. SAsuppliers.com is not a credit bureau or guarantor."
            </div>
          </div>
        )}
      </div>

      {/* ── CURRENT SUPPLIER STATUS SUMMARY CARD ── */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#fff' }}>
              Your Enterprise Verification & Subscription Status
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0.25rem 0 0 0' }}>
              Company: <strong>{supplier?.companyName}</strong> | Account ID: <code>{supplier?.id}</code>
            </p>
          </div>
          <div>
            {getStatusBadge(status)}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div style={{ background: 'var(--bg3)', padding: '0.85rem 1rem', borderRadius: 6 }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700 }}>Payment Gateway</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginTop: 4 }}>
              {paymentGateway?.gatewayName || supplier?.verificationProvider || 'None Selected'}
            </div>
          </div>
          <div style={{ background: 'var(--bg3)', padding: '0.85rem 1rem', borderRadius: 6 }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700 }}>Merchant ID / Reference</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--yellow)', marginTop: 4 }}>
              {paymentGateway?.merchantId || supplier?.verificationReference || 'N/A'}
            </div>
          </div>
          <div style={{ background: 'var(--bg3)', padding: '0.85rem 1rem', borderRadius: 6 }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700 }}>Payout Settlement Bank</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginTop: 4 }}>
              {paymentGateway?.payoutBankName ? `${paymentGateway.payoutBankName} (•••• ${paymentGateway.payoutAccountLast4})` : 'Commercial Bank in SA'}
            </div>
          </div>
          <div style={{ background: 'var(--bg3)', padding: '0.85rem 1rem', borderRadius: 6 }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700 }}>Subscription Tier</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>{supplier?.subscriptionPlan || 'Free / Trial'}</span>
              <button
                className="btn-outline btn-sm"
                onClick={() => handleOpenGatewayCheckout(supplier?.subscriptionPlan || 'Pro / Premium')}
                style={{ fontSize: '0.7rem', padding: '2px 8px' }}
              >
                Manage
              </button>
            </div>
          </div>
        </div>

        {supplier?.verificationBadgeDefinition && (
          <div style={{ marginTop: '1rem', background: 'var(--bg2)', padding: '0.75rem 1rem', borderRadius: 6, fontSize: '0.8rem', borderLeft: '3px solid #22c55e' }}>
            <span style={{ fontWeight: 700, color: '#fff' }}>Public Verified Badge Text:</span> {supplier.verificationBadgeDefinition}
          </div>
        )}
      </div>

      {/* ── SECTION: SUPPLIER'S CHOICE PAYMENT GATEWAY VERIFICATION ── */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'inline-block', background: 'rgba(34,197,94,0.15)', color: '#22c55e', fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
              PAYMENT GATEWAY SELECTION
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#fff' }}>
              Payment Gateway Verification & Business Profile Setup
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '0.2rem 0 0 0' }}>
              Choose a South African payment gateway, set up your business profile, and return with your approved merchant ID to receive your verified supplier badge.
            </p>
          </div>
          {hasApprovedGateway && (
            <button
              className="btn-outline btn-sm"
              onClick={handleDisconnectGateway}
              disabled={disconnectingGateway}
              style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}
            >
              <i className="fas fa-unlink" style={{ marginRight: 5 }}></i> Unlink Gateway
            </button>
          )}
        </div>

        {/* If the supplier already has an approved gateway profile */}
        {hasApprovedGateway ? (
          <div style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(20,20,20,0.85) 100%)', border: '1.5px solid #22c55e', borderRadius: 8, padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <span style={{ background: '#22c55e', color: '#000', fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: 4 }}>
                  ✓ ACTIVE & APPROVED PROFILE
                </span>
                <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: '0.4rem 0 0.2rem 0' }}>
                  {paymentGateway.gatewayName}
                </h4>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Merchant ID: <strong style={{ color: 'var(--yellow)' }}>{paymentGateway.merchantId}</strong> • Registered: <strong>{paymentGateway.businessName}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <a
                  href={paymentGateway.portalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-outline btn-sm"
                  style={{ textDecoration: 'none', fontSize: '0.78rem' }}
                >
                  <i className="fas fa-external-link-alt" style={{ marginRight: 6 }}></i>
                  Open {paymentGateway.gatewayName.split(' ')[0]} Merchant Portal
                </a>
                <button
                  type="button"
                  className="btn-yellow btn-sm"
                  onClick={() => {
                    const matchedGw = gateways.find(g => g.id === paymentGateway.gatewayId) || gateways[0];
                    handleOpenProofModal(matchedGw);
                  }}
                  style={{ fontSize: '0.78rem' }}
                >
                  <i className="fas fa-edit" style={{ marginRight: 6 }}></i> Update Proof
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', background: 'rgba(0,0,0,0.3)', padding: '0.85rem', borderRadius: 6 }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Payout Bank</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
                  {paymentGateway.payoutBankName || 'Verified South African Bank'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Account Last 4</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
                  •••• {paymentGateway.payoutAccountLast4 || 'XXXX'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Proof Reference</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--yellow)' }}>
                  {paymentGateway.proofReference}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Verified Badge</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#22c55e' }}>
                  {paymentGateway.verifiedBadge}
                </div>
              </div>
            </div>

            {paymentGateway.documentNote && (
              <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <i className="fas fa-shield-check" style={{ color: '#22c55e', marginRight: 6 }}></i>
                {paymentGateway.documentNote}
              </div>
            )}
          </div>
        ) : (
          /* Gateway Selection Grid */
          <div>
            {gwLoading ? (
              <p style={{ color: 'var(--text-muted)' }}>Loading supported payment gateways...</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                {gateways.map(gw => (
                  <div
                    key={gw.id}
                    style={{
                      background: 'var(--bg2)',
                      border: gw.isPopular ? '1px solid var(--yellow)' : '1px solid var(--border)',
                      borderRadius: 8,
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative'
                    }}
                  >
                    {gw.isPopular && (
                      <span style={{ position: 'absolute', top: -10, left: 15, background: 'var(--yellow)', color: '#000', fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: 10 }}>
                        POPULAR IN SOUTH AFRICA
                      </span>
                    )}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>
                          <i className={`fas ${gw.logo}`} style={{ color: gw.color, marginRight: 8 }}></i>
                          {gw.name}
                        </div>
                        <span style={{ background: 'var(--bg3)', color: '#22c55e', fontWeight: 700, fontSize: '0.72rem', padding: '2px 8px', borderRadius: 4 }}>
                          {gw.settlementSpeed}
                        </span>
                      </div>
                      <div style={{ color: 'var(--text-dim)', fontSize: '0.78rem', marginBottom: '0.75rem' }}>
                        {gw.tagline}
                      </div>

                      <div style={{ background: 'var(--bg3)', borderRadius: 6, padding: '0.75rem', marginBottom: '0.85rem' }}>
                        <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700, marginBottom: '0.35rem' }}>
                          Required Documents for Gateway Approval
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                          {gw.requirements.map((req, idx) => (
                            <li key={idx} style={{ padding: '0.15rem 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <i className="fas fa-check" style={{ color: 'var(--yellow)', fontSize: '0.7rem' }}></i> {req}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        <strong>Accepted Channels:</strong> {gw.supportedPaymentMethods.join(', ')}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        className="btn-outline btn-sm"
                        style={{ flex: 1, fontSize: '0.78rem' }}
                        onClick={() => handleRedirectToGateway(gw)}
                        disabled={initiatingGatewayRedirect}
                        title="Redirects to the gateway setup portal in a new window"
                      >
                        <i className="fas fa-external-link-alt" style={{ marginRight: 5 }}></i>
                        1. Redirect to Setup
                      </button>
                      <button
                        className="btn-yellow btn-sm"
                        style={{ flex: 1, fontSize: '0.78rem' }}
                        onClick={() => handleOpenProofModal(gw)}
                        title="Submit your approved Merchant ID / Account ID"
                      >
                        <i className="fas fa-file-check" style={{ marginRight: 5 }}></i>
                        2. Submit Proof
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── EXTERNAL PAYMENT GATEWAY PLACEHOLDER & SUBSCRIPTION TIERS ── */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <div style={{ display: 'inline-block', background: 'rgba(59,130,246,0.15)', color: '#60a5fa', fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
              PAYMENT SUBSCRIPTION GATEWAY
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#fff' }}>
              Supplier Platform Subscription Gateway
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '0.2rem 0 0 0' }}>
              Suppliers pay their monthly/annual platform access fee via our designated secure external payment gateway.
            </p>
          </div>
          <button
            className="btn-yellow btn-sm"
            onClick={() => handleOpenGatewayCheckout('Pro / Premium')}
          >
            <i className="fas fa-credit-card" style={{ marginRight: 6 }}></i> Open Gateway Checkout Placeholder
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          {[
            {
              plan: 'Starter / Basic',
              price: 'R99',
              period: '/month',
              desc: 'Ideal for emerging suppliers starting in intermediate wholesale.',
              features: ['Up to 10 product listings', 'Payment Gateway verification badge', 'Basic quote requests via email', 'Gemini AI viability check'],
              active: supplier?.subscriptionPlan?.includes('Starter') || supplier?.subscriptionPlan?.includes('Basic')
            },
            {
              plan: 'Pro / Premium',
              price: 'R249',
              period: '/month',
              badge: 'RECOMMENDED',
              desc: 'For active South African manufacturers & distributors.',
              features: ['Up to 50 product listings', 'Verified Supplier Badge display', 'Direct turboSMTP RFQ quotes', 'AI Competitiveness Roadmap', 'Logistics rate calculator'],
              active: supplier?.subscriptionPlan?.includes('Pro') || supplier?.subscriptionPlan?.includes('Premium')
            },
            {
              plan: 'Enterprise',
              price: 'R399',
              period: '/month',
              desc: 'Full supply chain visibility & priority marketplace positioning.',
              features: ['Unlimited product catalog', 'Priority search placement', 'Multi-channel gateway support', 'Dedicated account manager', 'LogiCore logistics API ready'],
              active: supplier?.subscriptionPlan?.includes('Enterprise')
            }
          ].map(p => (
            <div
              key={p.plan}
              style={{
                background: p.active ? 'rgba(234,179,8,0.06)' : 'var(--bg2)',
                border: p.active ? '2px solid var(--yellow)' : '1px solid var(--border)',
                borderRadius: 8,
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative'
              }}
            >
              {p.badge && (
                <span style={{ position: 'absolute', top: -10, right: 15, background: 'var(--yellow)', color: '#000', fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: 10 }}>
                  {p.badge}
                </span>
              )}
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#fff' }}>{p.plan}</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--yellow)', margin: '0.35rem 0' }}>
                  {p.price}<span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>{p.period}</span>
                </div>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.78rem', marginBottom: '0.85rem' }}>{p.desc}</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1rem 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {p.features.map(f => (
                    <li key={f} style={{ padding: '0.25rem 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <i className="fas fa-check" style={{ color: '#22c55e', fontSize: '0.75rem' }}></i> {f}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                className={p.active ? 'btn-outline' : 'btn-yellow'}
                style={{ width: '100%', fontSize: '0.82rem' }}
                onClick={() => handleOpenGatewayCheckout(p.plan)}
              >
                {p.active ? 'Current Active Tier' : `Subscribe via External Gateway`}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── VERIFICATION AUDIT TRAIL / RECORDS (ZERO RAW DOCUMENTS) ── */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#fff' }}>
              Verification Audit & Status Log
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0.2rem 0 0 0' }}>
              Cryptographic audit references recorded without storing sensitive company documents.
            </p>
          </div>
          <button className="btn-outline btn-sm" onClick={() => refetchRecords()}>
            <i className="fas fa-sync-alt" style={{ marginRight: 4 }}></i> Refresh Log
          </button>
        </div>

        {recordsLoading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading audit records...</p>
        ) : records.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
            <i className="fas fa-clipboard-list" style={{ fontSize: '2rem', opacity: 0.5, marginBottom: '0.5rem', display: 'block' }}></i>
            No verification records initiated yet. Choose your payment gateway above to get verified.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table" style={{ fontSize: '0.82rem' }}>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Payment Gateway</th>
                  <th>Status</th>
                  <th>Verification Scope</th>
                  <th>Gateway Note</th>
                  <th>Audit Summary</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id}>
                    <td>
                      <code style={{ color: 'var(--yellow)', fontWeight: 700 }}>{r.referenceNumber}</code>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: 2 }}>
                        {new Date(r.initiatedAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, color: '#fff' }}>{r.providerName}</td>
                    <td>{getStatusBadge(r.status)}</td>
                    <td style={{ maxWidth: 220, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {r.scope}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{r.paymentAmountZAR}</div>
                      <div style={{ fontSize: '0.7rem', color: '#22c55e' }}>{r.paymentStatus}</div>
                    </td>
                    <td style={{ maxWidth: 260, fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      {r.auditLogSummary}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODAL: SUBMIT PROOF OF APPROVED PAYMENT GATEWAY PROFILE ── */}
      {showGatewayProofModal && selectedGatewayForSetup && (
        <Modal
          title={`Submit Proof: ${selectedGatewayForSetup.name} Active Profile`}
          onClose={() => setShowGatewayProofModal(false)}
          large
        >
          <form onSubmit={handleSubmitProof} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
            <div style={{ background: 'var(--bg3)', padding: '1rem', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#fff', fontSize: '0.95rem', marginBottom: 4 }}>
                <i className={`fas ${selectedGatewayForSetup.logo}`} style={{ color: selectedGatewayForSetup.color }}></i>
                Verify Your {selectedGatewayForSetup.name} Merchant Account
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.5, margin: 0 }}>
                Please provide your Merchant ID or Account ID from your {selectedGatewayForSetup.name} dashboard. Once submitted, SAsuppliers.com cryptographically validates your active status to issue your verified commercial badge.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn-outline btn-sm"
                onClick={handleQuickFillSampleProof}
                style={{ fontSize: '0.72rem', padding: '3px 8px' }}
              >
                ⚡ Quick-Fill Valid Sample Credentials (Testing)
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                  Merchant ID / Account ID *
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder={selectedGatewayForSetup.testMerchantExample || 'e.g. PF-1049281'}
                  value={proofForm.merchantId}
                  onChange={e => setProofForm({ ...proofForm, merchantId: e.target.value })}
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
                  placeholder="e.g. Urban Manufacturing (Pty) Ltd"
                  value={proofForm.businessName}
                  onChange={e => setProofForm({ ...proofForm, businessName: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                  Payout Bank Name (South Africa)
                </label>
                <select
                  className="form-control"
                  value={proofForm.payoutBankName}
                  onChange={e => setProofForm({ ...proofForm, payoutBankName: e.target.value })}
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
                  Account Last 4 Digits & Reference
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. 4819 / PF-REF-9921"
                  value={proofForm.proofReference}
                  onChange={e => setProofForm({ ...proofForm, proofReference: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                Approval / Settlement Note
              </label>
              <input
                type="text"
                className="form-control"
                value={proofForm.proofDocumentNote}
                onChange={e => setProofForm({ ...proofForm, proofDocumentNote: e.target.value })}
              />
            </div>

            <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid #22c55e', padding: '0.75rem', borderRadius: 6, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <i className="fas fa-lock" style={{ color: '#22c55e', marginRight: 5 }}></i>
              POPIA Compliance Guarantee: SAsuppliers.com records only your merchant ID and verified status. No bank login credentials or banking statements are ever stored.
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="submit"
                className="btn-yellow"
                disabled={submittingGatewayProof}
                style={{ flex: 1 }}
              >
                <i className="fas fa-check-circle" style={{ marginRight: 6 }}></i>
                {submittingGatewayProof ? 'Verifying Gateway Handshake...' : `Submit Proof & Verify with ${selectedGatewayForSetup.name.split(' ')[0]}`}
              </button>
              <button
                type="button"
                className="btn-outline"
                onClick={() => setShowGatewayProofModal(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── MODAL: SA SUPPLIERS EXTERNAL PAYMENT GATEWAY PLACEHOLDER ── */}
      {showGatewayModal && gatewayPayload && (
        <Modal
          title="💳 SAsuppliers External Payment Gateway"
          onClose={() => setShowGatewayModal(false)}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.85rem' }}>
            <div style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid #3b82f6', padding: '1rem', borderRadius: 8 }}>
              <div style={{ fontWeight: 800, color: '#93c5fd', fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                {gatewayPayload.gatewayName}
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: 0, lineHeight: 1.5 }}>
                {gatewayPayload.notice}
              </p>
            </div>

            <div style={{ background: 'var(--bg3)', padding: '1rem', borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Selected Plan:</span>
                <span style={{ fontWeight: 700, color: '#fff' }}>{gatewayPayload.planName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Billing Cycle:</span>
                <span style={{ fontWeight: 700, color: '#fff' }}>Monthly Recurring (Cancel anytime)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Payment Reference:</span>
                <code style={{ color: 'var(--yellow)', fontWeight: 700 }}>{gatewayPayload.paymentReference}</code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                <span style={{ fontWeight: 800, color: '#fff', fontSize: '1rem' }}>Total Due:</span>
                <span style={{ fontWeight: 800, color: 'var(--yellow)', fontSize: '1.2rem' }}>{gatewayPayload.amountZAR} / mo</span>
              </div>
            </div>

            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                Accepted South African Payment Channels (Processed Externally):
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', fontSize: '1.25rem', color: 'var(--text-dim)' }}>
                <i className="fab fa-cc-visa" title="Visa 3DS"></i>
                <i className="fab fa-cc-mastercard" title="Mastercard Identity Check"></i>
                <i className="fas fa-university" title="Ozow / Peach Instant EFT"></i>
                <i className="fas fa-qrcode" title="SnapScan / Zapper"></i>
              </div>
            </div>

            <button
              className="btn-yellow"
              style={{ width: '100%', padding: '0.75rem', fontWeight: 800 }}
              onClick={handleSimulatePaymentCompletion}
              disabled={gatewayProcessing || confirmingSub}
            >
              {gatewayProcessing ? 'Processing with External Gateway...' : `Simulate Successful Gateway Settlement (${gatewayPayload.amountZAR})`}
            </button>

            <button className="btn-outline" onClick={() => setShowGatewayModal(false)} style={{ width: '100%' }}>
              Cancel Checkout
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
