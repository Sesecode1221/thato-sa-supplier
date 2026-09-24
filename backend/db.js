const bcrypt = require('bcryptjs');

// In-Memory Database Store seeded with initial data
const users = [];
const suppliers = [];
const products = [];
const quotes = [];
const siteMetrics = [
  { id: 'singleton', totalVisits: 4321, totalQuotes: 124, totalMessages: 57 }
];

// Verification Providers: Deprecated in favor of Supplier-Choice Payment Gateways (PayFast, Yoco, Peach, Ozow, SnapScan, PayGate)
const externalVerificationProviders = [];

// Supported South African Payment Gateways for Supplier Business Profile & Payout Verification
const supportedPaymentGateways = [
  {
    id: 'payfast',
    name: 'PayFast by Network One',
    tagline: "South Africa's #1 B2B & eCommerce Payment Gateway",
    setupUrl: 'https://www.payfast.co.za/merchant/register',
    portalUrl: 'https://www.payfast.co.za/user/login',
    logo: 'fa-credit-card',
    color: '#e11d48',
    supportedPaymentMethods: ['Credit & Debit Cards (Visa / Mastercard)', 'Instant EFT', 'Capitec Pay', 'Mobicred', 'Masterpass'],
    settlementSpeed: 'Daily auto-payout (T+1) to SA Bank Accounts',
    requirements: ['CIPC Company Registration Number or Sole Prop ID', 'FICA Proof of Business Operating Address', 'South African Business Bank Account Confirmation Letter'],
    isPopular: true,
    testMerchantExample: 'PF-1049281',
    description: 'Direct merchant profile onboarding with automated FICA and instant payout setup to any South African bank account.'
  },
  {
    id: 'yoco',
    name: 'Yoco South Africa',
    tagline: 'Modern Digital Payments & Fast FICA Approval for SA SMEs',
    setupUrl: 'https://www.yoco.com/za/online-payments/',
    portalUrl: 'https://portal.yoco.co.za/',
    logo: 'fa-mobile-screen-button',
    color: '#0284c7',
    supportedPaymentMethods: ['Visa & Mastercard Online', 'Yoco Gateway Links', 'Apple Pay', 'Instant EFT'],
    settlementSpeed: '1 to 2 business days direct settlement',
    requirements: ['CIPC Registered Details', 'Active SA Bank Account for Payouts', 'Director South African ID or Passport'],
    isPopular: true,
    testMerchantExample: 'YOCO-BIZ-884920',
    description: 'Fast digital onboarding built specifically for South African growing enterprises with simple merchant dashboard and payout tracking.'
  },
  {
    id: 'peach',
    name: 'Peach Payments',
    tagline: 'Enterprise-Grade Payment Orchestration & B2B Settlements',
    setupUrl: 'https://www.peachpayments.com/join',
    portalUrl: 'https://dashboard.peachpayments.com/',
    logo: 'fa-shield-halved',
    color: '#f97316',
    supportedPaymentMethods: ['Card (3D Secure 2.0)', 'Peach Pay Instant EFT', 'Debit Order (AEDO/NAEDO)', 'Scan to Pay'],
    settlementSpeed: 'Daily or weekly automated settlement schedule',
    requirements: ['Registered Enterprise Profile', 'SARS Tax Clearance / PIN', 'Proof of Banking Account (Within 3 Months)'],
    isPopular: false,
    testMerchantExample: 'PP-M-449102',
    description: 'High-volume payment gateway ideal for medium-to-large suppliers handling large purchase orders and customized payment workflows.'
  },
  {
    id: 'ozow',
    name: 'Ozow Instant EFT & Pay',
    tagline: 'Zero-Chargeback Instant Bank-to-Bank Payments',
    setupUrl: 'https://ozow.com/get-started',
    portalUrl: 'https://merchants.ozow.com/',
    logo: 'fa-bolt',
    color: '#10b981',
    supportedPaymentMethods: ['Instant EFT across 9 major SA Banks (Capitec, FNB, Standard Bank, Absa, Nedbank, Investec, etc.)', 'Ozow PIN', 'QR Pay'],
    settlementSpeed: 'Instant or same-day batch settlement',
    requirements: ['CIPC Registration Certificate', 'Proof of Active Bank Account', 'FICA Authorised Representative Details'],
    isPopular: true,
    testMerchantExample: 'OZOW-MERCH-77319',
    description: 'Eliminates card transaction fees with direct automated EFT settlements and bank-grade encryption.'
  },
  {
    id: 'snapscan',
    name: 'SnapScan Merchant Solutions',
    tagline: 'Instant QR & Web Billing via Standard Bank Infrastructure',
    setupUrl: 'https://snapscan.co.za/merchant',
    portalUrl: 'https://pos.snapscan.co.za/',
    logo: 'fa-qrcode',
    color: '#3b82f6',
    supportedPaymentMethods: ['SnapScan In-App & QR', 'Mastercard & Visa Linked Wallets', 'EFT Links'],
    settlementSpeed: 'Next business day direct bank transfer',
    requirements: ['Valid South African Bank Account', 'Company or Sole Proprietor Registration Documents', 'Proof of Residential/Business Address'],
    isPopular: false,
    testMerchantExample: 'SNAP-M-90218',
    description: 'Standard Bank backed mobile payment solutions with instant payment notifications and seamless invoice settlements.'
  },
  {
    id: 'paygate',
    name: 'DPO PayGate',
    tagline: 'Global & SADC Cross-Border Multi-Currency Payment Gateway',
    setupUrl: 'https://paygate.co.za/open-an-account',
    portalUrl: 'https://backoffice.paygate.co.za/',
    logo: 'fa-globe',
    color: '#8b5cf6',
    supportedPaymentMethods: ['Multi-Currency Cards (ZAR, USD, EUR, GBP)', 'DPO Pay', 'PayPal Cross-Border', 'SiD Secure EFT'],
    settlementSpeed: 'T+2 settlement with multi-currency reserve support',
    requirements: ['Commercial Business Entity Registration', 'Audited or Certified Financial Banking Confirmation', 'Director FICA Records'],
    isPopular: false,
    testMerchantExample: 'DPO-PG-55102',
    description: 'Designed for suppliers trading across South Africa and the wider SADC / African region with multi-currency checkout capability.'
  }
];

// Verification Records (stores cryptographic status reference from approved payment gateway - zero raw documents)
const verificationRecords = [
  {
    id: 'vrec_1',
    supplierId: 'sup1',
    providerId: 'payfast',
    providerName: 'PayFast by Network One',
    status: 'VERIFIED',
    referenceNumber: 'PF-APP-99482-ZA',
    initiatedAt: '2026-09-18T09:40:00Z',
    completedAt: '2026-09-18T10:00:00Z',
    expiresAt: '2027-09-18T10:00:00Z',
    scope: 'Merchant Profile Approval, Active FNB Settlement Account Verification & FICA Compliance',
    paymentAmountZAR: 'R 0.00 (Merchant Setup)',
    paymentGateway: 'PayFast Merchant Portal',
    paymentStatus: 'COMPLETED_TO_PROVIDER',
    auditLogSummary: 'Active PayFast merchant account PF-1049281 confirmed with verified daily bank payout settlement.'
  },
  {
    id: 'vrec_3',
    supplierId: 'sup3',
    providerId: 'peach',
    providerName: 'Peach Payments',
    status: 'VERIFIED',
    referenceNumber: 'PEACH-APP-55192-ZA',
    initiatedAt: '2026-08-10T12:00:00Z',
    completedAt: '2026-08-10T14:30:00Z',
    expiresAt: '2027-08-10T14:30:00Z',
    scope: 'Commercial Settlement Bank Verification & Enterprise Business Profile Clearance',
    paymentAmountZAR: 'R 0.00 (Merchant Setup)',
    paymentGateway: 'Peach Payments Console',
    paymentStatus: 'COMPLETED_TO_PROVIDER',
    auditLogSummary: 'Peach Payments merchant account PEACH-MID-44012 approved with verified commercial banking.'
  },
  {
    id: 'vrec_4',
    supplierId: 'sup4',
    providerId: 'ozow',
    providerName: 'Ozow Instant EFT',
    status: 'VERIFICATION_PENDING',
    referenceNumber: 'OZOW-PEND-88124',
    initiatedAt: '2026-09-22T08:15:00Z',
    completedAt: null,
    expiresAt: null,
    scope: 'Merchant Profile & Direct Settlement Account Registration',
    paymentAmountZAR: 'R 0.00 (Merchant Setup)',
    paymentGateway: 'Ozow Merchant Dashboard',
    paymentStatus: 'AWAITING_PROVIDER_PAYMENT',
    auditLogSummary: 'Supplier registered profile on Ozow merchant platform. Awaiting merchant token confirmation.'
  },
  {
    id: 'vrec_5',
    supplierId: 'sup5',
    providerId: 'yoco',
    providerName: 'Yoco South Africa',
    status: 'VERIFIED',
    referenceNumber: 'YOCO-APP-77301',
    initiatedAt: '2026-07-01T10:15:00Z',
    completedAt: '2026-07-01T11:00:00Z',
    expiresAt: '2027-07-01T11:00:00Z',
    scope: 'Enterprise Bank Payout Status & FICA Digital Signoff',
    paymentAmountZAR: 'R 0.00 (Merchant Setup)',
    paymentGateway: 'Yoco Business Portal',
    paymentStatus: 'COMPLETED_TO_PROVIDER',
    auditLogSummary: 'Yoco merchant profile YOCO-BIZ-884920 approved. Active payout verification recorded.'
  }
];

function genId(prefix = 'c') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Seed initial users and suppliers
function seedInitialData() {
  const adminPass = bcrypt.hashSync('admin123', 10);
  const supplierPass = bcrypt.hashSync('supplier123', 10);
  const buyerPass = bcrypt.hashSync('buyer123', 10);

  const adminUser = {
    id: 'user_admin',
    email: 'thatohatsimothudi@gmail.com',
    password: adminPass,
    name: 'System Admin',
    role: 'admin',
    company: '',
    createdAt: new Date()
  };

  const sup1User = {
    id: 'user_sup1',
    email: 'sesethu@greenbdgafrica.com',
    password: supplierPass,
    name: 'Urban Manager',
    role: 'supplier',
    company: 'Urban Apparel SA',
    createdAt: new Date()
  };

  const sup2User = {
    id: 'user_sup2',
    email: 'hello@packright.co.za',
    password: supplierPass,
    name: 'PackRight Manager',
    role: 'supplier',
    company: 'PackRight Solutions',
    createdAt: new Date()
  };

  const sup3User = {
    id: 'user_sup3',
    email: 'orders@safetyfirst.co.za',
    password: supplierPass,
    name: 'Safety Manager',
    role: 'supplier',
    company: 'Safety First Supplies',
    createdAt: new Date()
  };

  const sup4User = {
    id: 'user_sup4',
    email: 'info@bulkstorage.co.za',
    password: supplierPass,
    name: 'Bulk Manager',
    role: 'supplier',
    company: 'Bulk Storage Africa',
    createdAt: new Date()
  };

  const sup5User = {
    id: 'user_sup5',
    email: 'trade@homestyle.co.za',
    password: supplierPass,
    name: 'HomeStyle Manager',
    role: 'supplier',
    company: 'HomeStyle Furniture',
    createdAt: new Date()
  };

  const buyerUser = {
    id: 'user_buyer1',
    email: 'aphelelesesethu719@gmail.com',
    password: buyerPass,
    name: 'John Buyer',
    role: 'buyer',
    company: 'Retail Holdings',
    createdAt: new Date()
  };

  users.push(adminUser, sup1User, sup2User, sup3User, sup4User, sup5User, buyerUser);

  const sup1 = {
    id: 'sup1',
    userId: sup1User.id,
    companyName: 'Urban Apparel SA',
    location: 'Johannesburg, Gauteng',
    phone: '+27 11 222 3344',
    email: 'sesethu@greenbdgafrica.com',
    description: 'Leading supplier of bulk textiles & corporate wear.',
    logo: 'https://picsum.photos/id/82/100/100',
    isPremium: true,
    status: 'active',
    verificationStatus: 'VERIFIED',
    verificationProvider: 'PayFast by Network One',
    verificationReference: 'PF-APP-99482-ZA',
    verificationDate: '2026-09-18T10:00:00Z',
    expiryDate: '2027-09-18T10:00:00Z',
    verificationScope: 'Merchant Profile Approval, SA Bank Account Verification & FICA Settlement Clearance',
    verificationBadgeDefinition: 'Verified Supplier: Completed payment gateway business profile approval with PayFast. Active settlement bank account confirmed.',
    paymentGateway: {
      gatewayId: 'payfast',
      gatewayName: 'PayFast by Network One',
      merchantId: 'PF-1049281',
      businessName: 'Urban Apparel SA (Pty) Ltd',
      status: 'APPROVED',
      approvedAt: '2026-09-18T10:00:00Z',
      proofReference: 'PF-APP-99482-ZA',
      payoutBankName: 'First National Bank (FNB)',
      payoutAccountLast4: '4819',
      settlementCurrency: 'ZAR',
      portalUrl: 'https://www.payfast.co.za/user/login',
      verifiedBadge: '✓ PayFast Verified Merchant',
      documentNote: 'CIPC Enterprise & FICA Bank Settlement Confirmed by PayFast Compliance'
    },
    hasApprovedGateway: true,
    preferredGatewayId: 'payfast',
    subscriptionPlan: 'Pro / Premium',
    subscriptionStatus: 'active',
    subscriptionRenewsAt: '2027-09-18T10:00:00Z',
    createdAt: new Date(Date.now() - 500000)
  };

  const sup2 = {
    id: 'sup2',
    userId: sup2User.id,
    companyName: 'PackRight Solutions',
    location: 'Cape Town, Western Cape',
    phone: '+27 21 555 6677',
    email: 'hello@packright.co.za',
    description: 'Eco-friendly industrial packaging and storage.',
    logo: 'https://picsum.photos/id/12/100/100',
    isPremium: false,
    status: 'active',
    verificationStatus: 'UNVERIFIED',
    verificationProvider: null,
    verificationReference: null,
    verificationDate: null,
    expiryDate: null,
    verificationScope: null,
    verificationBadgeDefinition: null,
    paymentGateway: null,
    hasApprovedGateway: false,
    preferredGatewayId: null,
    subscriptionPlan: 'Starter / Basic',
    subscriptionStatus: 'active',
    subscriptionRenewsAt: '2027-01-15T10:00:00Z',
    createdAt: new Date(Date.now() - 400000)
  };

  const sup3 = {
    id: 'sup3',
    userId: sup3User.id,
    companyName: 'Safety First Supplies',
    location: 'Durban, KZN',
    phone: '+27 31 765 4321',
    email: 'orders@safetyfirst.co.za',
    description: 'Premium PPE: helmets, vests, gloves.',
    logo: 'https://picsum.photos/id/20/100/100',
    isPremium: true,
    status: 'active',
    verificationStatus: 'VERIFIED',
    verificationProvider: 'Peach Payments',
    verificationReference: 'PEACH-APP-55192-ZA',
    verificationDate: '2026-08-10T14:30:00Z',
    expiryDate: '2027-08-10T14:30:00Z',
    verificationScope: 'Commercial Settlement Bank Verification & Enterprise Business Profile Clearance',
    verificationBadgeDefinition: 'Verified Supplier: Completed payment gateway business profile approval with Peach Payments. Active settlement bank account confirmed.',
    paymentGateway: {
      gatewayId: 'peach',
      gatewayName: 'Peach Payments',
      merchantId: 'PP-M-449102',
      businessName: 'Safety First Supplies (Pty) Ltd',
      status: 'APPROVED',
      approvedAt: '2026-08-10T14:30:00Z',
      proofReference: 'PEACH-FICA-88192',
      payoutBankName: 'Standard Bank',
      payoutAccountLast4: '7721',
      settlementCurrency: 'ZAR',
      portalUrl: 'https://dashboard.peachpayments.com/',
      verifiedBadge: '✓ Peach Payments Verified Merchant',
      documentNote: 'Commercial Bank Account Ownership & FICA Settlement Verified'
    },
    hasApprovedGateway: true,
    preferredGatewayId: 'peach',
    subscriptionPlan: 'Enterprise',
    subscriptionStatus: 'active',
    subscriptionRenewsAt: '2027-08-10T14:30:00Z',
    createdAt: new Date(Date.now() - 300000)
  };

  const sup4 = {
    id: 'sup4',
    userId: sup4User.id,
    companyName: 'Bulk Storage Africa',
    location: 'Pretoria, Gauteng',
    phone: '+27 12 345 6789',
    email: 'info@bulkstorage.co.za',
    description: 'Heavy-duty shelving and industrial bins.',
    logo: 'https://picsum.photos/id/42/100/100',
    isPremium: false,
    status: 'pending',
    verificationStatus: 'VERIFICATION_PENDING',
    verificationProvider: 'Ozow Instant EFT & Pay',
    verificationReference: 'OZOW-PEND-88124',
    verificationDate: '2026-09-22T08:15:00Z',
    expiryDate: null,
    verificationScope: 'Merchant Profile & Direct Settlement Account Registration with Ozow',
    verificationBadgeDefinition: 'Verification Pending: Merchant profile submitted to Ozow. Bank settlement confirmation in progress.',
    paymentGateway: {
      gatewayId: 'ozow',
      gatewayName: 'Ozow Instant EFT & Pay',
      merchantId: 'OZOW-M-9921',
      businessName: 'Bulk Storage Africa (Pty) Ltd',
      status: 'PENDING_REVIEW',
      approvedAt: null,
      proofReference: 'OZOW-PEND-88124',
      payoutBankName: 'Nedbank',
      payoutAccountLast4: '3301',
      settlementCurrency: 'ZAR',
      portalUrl: 'https://hub.ozow.com/',
      verifiedBadge: '⏳ Ozow Merchant Review Pending',
      documentNote: 'Awaiting Ozow bank settlement handshake'
    },
    hasApprovedGateway: false,
    preferredGatewayId: 'ozow',
    subscriptionPlan: 'Starter / Basic',
    subscriptionStatus: 'pending_payment',
    subscriptionRenewsAt: null,
    createdAt: new Date(Date.now() - 200000)
  };

  const sup5 = {
    id: 'sup5',
    userId: sup5User.id,
    companyName: 'HomeStyle Furniture',
    location: 'Johannesburg, Gauteng',
    phone: '+27 10 987 6543',
    email: 'trade@homestyle.co.za',
    description: 'Modern office desks, dining chairs, storage.',
    logo: 'https://picsum.photos/id/55/100/100',
    isPremium: true,
    status: 'active',
    verificationStatus: 'VERIFIED',
    verificationProvider: 'Yoco South Africa',
    verificationReference: 'YOCO-APP-77301',
    verificationDate: '2026-07-01T11:00:00Z',
    expiryDate: '2027-07-01T11:00:00Z',
    verificationScope: 'Enterprise Bank Payout Status & FICA Digital Signoff via Yoco',
    verificationBadgeDefinition: 'Verified Supplier: Completed payment gateway business profile approval with Yoco. Active settlement bank account confirmed.',
    paymentGateway: {
      gatewayId: 'yoco',
      gatewayName: 'Yoco South Africa',
      merchantId: 'YOCO-BIZ-884920',
      businessName: 'HomeStyle Furniture (Pty) Ltd',
      status: 'APPROVED',
      approvedAt: '2026-07-01T11:00:00Z',
      proofReference: 'YOCO-APP-77301',
      payoutBankName: 'Absa Bank',
      payoutAccountLast4: '9912',
      settlementCurrency: 'ZAR',
      portalUrl: 'https://portal.yoco.co.za/',
      verifiedBadge: '✓ Yoco Verified Merchant',
      documentNote: 'CIPC Enterprise & FICA Bank Settlement Confirmed by Yoco'
    },
    hasApprovedGateway: true,
    preferredGatewayId: 'yoco',
    subscriptionPlan: 'Pro / Premium',
    subscriptionStatus: 'active',
    subscriptionRenewsAt: '2027-07-01T11:00:00Z',
    createdAt: new Date(Date.now() - 100000)
  };

  suppliers.push(sup1, sup2, sup3, sup4, sup5);

  products.push(
    {
      id: 'prod1',
      supplierId: 'sup1',
      name: 'Premium Cotton T-Shirts (Bulk)',
      category: 'Clothing',
      description: '100% combed cotton, ideal for branding. Available in all sizes.',
      priceRange: 'R 45 - R 85',
      moq: 100,
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
      createdAt: new Date(Date.now() - 600000)
    },
    {
      id: 'prod2',
      supplierId: 'sup1',
      name: 'Custom Printed Workwear',
      category: 'Clothing',
      description: 'Logo printing available, durable fabric for industrial use.',
      priceRange: 'R 60 - R 120',
      moq: 50,
      image: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=400',
      createdAt: new Date(Date.now() - 500000)
    },
    {
      id: 'prod3',
      supplierId: 'sup3',
      name: 'Industrial Safety Helmets',
      category: 'PPE',
      description: 'Adjustable, shock-resistant, CE certified. SABS approved.',
      priceRange: 'R 70 - R 120',
      moq: 100,
      image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400',
      createdAt: new Date(Date.now() - 400000)
    },
    {
      id: 'prod4',
      supplierId: 'sup2',
      name: 'Heavy-Duty Plastic Crates',
      category: 'Packaging',
      description: 'Stackable industrial crates, ideal for warehousing and logistics.',
      priceRange: 'R 120 - R 250',
      moq: 50,
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
      createdAt: new Date(Date.now() - 300000)
    },
    {
      id: 'prod5',
      supplierId: 'sup2',
      name: 'Eco Kraft Paper Bags (Bulk)',
      category: 'Packaging',
      description: 'Biodegradable, print-ready, 100% recyclable kraft bags.',
      priceRange: 'R 2 - R 8',
      moq: 500,
      image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400',
      createdAt: new Date(Date.now() - 200000)
    },
    {
      id: 'prod6',
      supplierId: 'sup5',
      name: 'Modern Office Desk (Bulk)',
      category: 'Furniture',
      description: 'Minimalist L-shaped office desks, flat-pack for easy assembly.',
      priceRange: 'R 1200 - R 2400',
      moq: 10,
      image: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400',
      createdAt: new Date(Date.now() - 100000)
    }
  );
}

seedInitialData();

function attachSupplierToProduct(p) {
  if (!p) return null;
  const sup = suppliers.find(s => s.id === p.supplierId) || null;
  return { ...p, supplier: sup };
}

function attachRelationsToSupplier(s) {
  if (!s) return null;
  const prods = products.filter(p => p.supplierId === s.id);
  return { ...s, products: prods };
}

function attachSupplierToUser(u) {
  if (!u) return null;
  const sup = suppliers.find(s => s.userId === u.id) || null;
  return { ...u, supplier: sup };
}

// In-Memory Prisma Mock
const prisma = {
  $disconnect: async () => {},

  user: {
    findUnique: async ({ where, include }) => {
      let u = null;
      if (where.id) u = users.find(x => x.id === where.id);
      else if (where.email) u = users.find(x => x.email.toLowerCase() === where.email.toLowerCase());
      if (!u) return null;
      return include?.supplier ? attachSupplierToUser(u) : { ...u };
    },
    create: async ({ data, include }) => {
      const id = genId('usr');
      const newUser = {
        id,
        email: data.email,
        password: data.password,
        name: data.name,
        role: data.role || 'buyer',
        company: data.company || null,
        createdAt: new Date()
      };
      users.push(newUser);

      if (data.supplier?.create) {
        const supId = genId('sup');
        const newSup = {
          id: supId,
          userId: id,
          companyName: data.supplier.create.companyName || data.name,
          location: data.supplier.create.location || 'South Africa',
          phone: data.supplier.create.phone || '+27 00 000 0000',
          email: data.supplier.create.email || data.email,
          description: data.supplier.create.description || 'B2B Supplier',
          logo: data.supplier.create.logo || 'https://picsum.photos/id/1/100/100',
          isPremium: false,
          status: data.supplier.create.status || 'active',
          verificationStatus: 'UNVERIFIED',
          verificationProvider: null,
          verificationReference: null,
          verificationDate: null,
          expiryDate: null,
          verificationScope: null,
          verificationBadgeDefinition: null,
          subscriptionPlan: null,
          subscriptionStatus: 'pending_payment',
          subscriptionRenewsAt: null,
          createdAt: new Date()
        };
        suppliers.push(newSup);
      }

      return include?.supplier ? attachSupplierToUser(newUser) : { ...newUser };
    },
    update: async ({ where, data, include }) => {
      const idx = users.findIndex(x => x.id === where.id);
      if (idx === -1) throw new Error('User not found');
      users[idx] = { ...users[idx], ...data };
      return include?.supplier ? attachSupplierToUser(users[idx]) : { ...users[idx] };
    },
    upsert: async ({ where, update, create }) => {
      let u = users.find(x => x.email === where.email);
      if (u) {
        Object.assign(u, update);
        return { ...u };
      }
      return prisma.user.create({ data: create });
    }
  },

  supplier: {
    findUnique: async ({ where, include }) => {
      let s = null;
      if (where.id) s = suppliers.find(x => x.id === where.id);
      else if (where.userId) s = suppliers.find(x => x.userId === where.userId);
      if (!s) return null;
      return include?.products ? attachRelationsToSupplier(s) : { ...s };
    },
    findMany: async ({ where = {}, orderBy = [], include } = {}) => {
      let result = suppliers.filter(s => {
        if (where.status && s.status !== where.status) return false;
        return true;
      });

      result.sort((a, b) => {
        if (a.isPremium !== b.isPremium) return b.isPremium ? 1 : -1;
        return a.createdAt - b.createdAt;
      });

      if (include?.products) {
        return result.map(attachRelationsToSupplier);
      }
      return result.map(s => ({ ...s }));
    },
    create: async ({ data, include }) => {
      const id = genId('sup');
      const newSup = {
        id,
        userId: data.userId,
        companyName: data.companyName,
        location: data.location || 'South Africa',
        phone: data.phone || '+27 00 000 0000',
        email: data.email,
        description: data.description || '',
        logo: data.logo || 'https://picsum.photos/id/1/100/100',
        isPremium: data.isPremium || false,
        status: data.status || 'pending',
        verificationStatus: 'UNVERIFIED',
        verificationProvider: null,
        verificationReference: null,
        verificationDate: null,
        expiryDate: null,
        verificationScope: null,
        verificationBadgeDefinition: null,
        subscriptionPlan: null,
        subscriptionStatus: 'pending_payment',
        subscriptionRenewsAt: null,
        paymentGateway: data.paymentGateway || null,
        hasApprovedGateway: Boolean(data.paymentGateway && data.paymentGateway.status === 'APPROVED'),
        preferredGatewayId: data.preferredGatewayId || null,
        createdAt: new Date()
      };
      suppliers.push(newSup);
      return include?.products ? attachRelationsToSupplier(newSup) : { ...newSup };
    },
    update: async ({ where, data, include }) => {
      const idx = suppliers.findIndex(x => x.id === where.id);
      if (idx === -1) throw new Error('Supplier not found');
      suppliers[idx] = { ...suppliers[idx], ...data };
      return include?.products ? attachRelationsToSupplier(suppliers[idx]) : { ...suppliers[idx] };
    },
    delete: async ({ where }) => {
      const idx = suppliers.findIndex(x => x.id === where.id);
      if (idx !== -1) suppliers.splice(idx, 1);
      return true;
    }
  },

  product: {
    findUnique: async ({ where, include }) => {
      const p = products.find(x => x.id === where.id);
      if (!p) return null;
      return include?.supplier ? attachSupplierToProduct(p) : { ...p };
    },
    findFirst: async ({ where, include }) => {
      const p = products.find(x => {
        if (where.name && x.name !== where.name) return false;
        if (where.supplierId && x.supplierId !== where.supplierId) return false;
        return true;
      });
      if (!p) return null;
      return include?.supplier ? attachSupplierToProduct(p) : { ...p };
    },
    findMany: async ({ where = {}, orderBy = {}, include } = {}) => {
      let result = products.filter(p => {
        const sup = suppliers.find(s => s.id === p.supplierId);
        if (where.supplier?.status && (!sup || sup.status !== where.supplier.status)) return false;
        if (where.supplierId && p.supplierId !== where.supplierId) return false;
        if (where.category && p.category.toLowerCase() !== where.category.toLowerCase()) return false;
        if (where.OR) {
          const matched = where.OR.some(cond => {
            if (cond.name?.contains) {
              return p.name.toLowerCase().includes(cond.name.contains.toLowerCase());
            }
            if (cond.supplier?.companyName?.contains) {
              return sup && sup.companyName.toLowerCase().includes(cond.supplier.companyName.contains.toLowerCase());
            }
            return false;
          });
          if (!matched) return false;
        }
        return true;
      });

      result.sort((a, b) => b.createdAt - a.createdAt);

      if (include?.supplier) {
        return result.map(attachSupplierToProduct);
      }
      return result.map(p => ({ ...p }));
    },
    create: async ({ data, include }) => {
      const id = genId('prod');
      const newProd = {
        id,
        supplierId: data.supplierId,
        name: data.name,
        category: data.category || 'General',
        description: data.description || '',
        priceRange: data.priceRange || 'R 0 - R 0',
        moq: Number(data.moq) || 1,
        image: data.image || 'https://picsum.photos/id/48/400/300',
        createdAt: new Date()
      };
      products.unshift(newProd);
      return include?.supplier ? attachSupplierToProduct(newProd) : { ...newProd };
    },
    update: async ({ where, data, include }) => {
      const idx = products.findIndex(x => x.id === where.id);
      if (idx === -1) throw new Error('Product not found');
      products[idx] = { ...products[idx], ...data };
      return include?.supplier ? attachSupplierToProduct(products[idx]) : { ...products[idx] };
    },
    delete: async ({ where }) => {
      const idx = products.findIndex(x => x.id === where.id);
      if (idx !== -1) products.splice(idx, 1);
      return true;
    },
    count: async ({ where = {} } = {}) => {
      return products.filter(p => {
        if (where.supplierId && p.supplierId !== where.supplierId) return false;
        return true;
      }).length;
    },
    groupBy: async ({ by = [] }) => {
      if (by.includes('category')) {
        const uniqueCats = [...new Set(products.map(p => p.category))];
        return uniqueCats.map(c => ({ category: c }));
      }
      return [];
    }
  },

  quote: {
    findMany: async ({ orderBy } = {}) => {
      const list = [...quotes];
      list.sort((a, b) => b.createdAt - a.createdAt);
      return list;
    },
    create: async ({ data }) => {
      const newQuote = {
        id: genId('quote'),
        productId: data.productId,
        buyerName: data.buyerName,
        buyerEmail: data.buyerEmail,
        message: data.message,
        quantity: data.quantity || 1,
        status: 'pending',
        createdAt: new Date()
      };
      quotes.unshift(newQuote);
      return newQuote;
    }
  },

  siteMetric: {
    findUnique: async ({ where }) => {
      return siteMetrics.find(x => x.id === where.id) || { id: 'singleton', totalVisits: 4321, totalQuotes: 124, totalMessages: 57 };
    },
    update: async ({ where, data }) => {
      let metric = siteMetrics.find(x => x.id === where.id);
      if (!metric) {
        metric = { id: 'singleton', totalVisits: 4321, totalQuotes: 124, totalMessages: 57 };
        siteMetrics.push(metric);
      }
      if (data.totalQuotes?.increment) metric.totalQuotes += data.totalQuotes.increment;
      if (data.totalMessages?.increment) metric.totalMessages += data.totalMessages.increment;
      if (data.totalVisits?.increment) metric.totalVisits += data.totalVisits.increment;
      return metric;
    },
    upsert: async ({ where, update, create }) => {
      let metric = siteMetrics.find(x => x.id === where.id);
      if (!metric) {
        metric = { ...create };
        siteMetrics.push(metric);
      } else {
        Object.assign(metric, update);
      }
      return metric;
    }
  },

  verificationProvider: {
    findMany: async () => [...externalVerificationProviders],
    findUnique: async ({ where }) => externalVerificationProviders.find(p => p.id === where.id) || null
  },

  paymentGateway: {
    findMany: async () => supportedPaymentGateways.map(g => ({ ...g })),
    findUnique: async ({ where }) => supportedPaymentGateways.find(g => g.id === where.id) || null
  },

  verificationRecord: {
    findMany: async ({ where = {} } = {}) => {
      let list = [...verificationRecords];
      if (where.supplierId) list = list.filter(r => r.supplierId === where.supplierId);
      list.sort((a, b) => new Date(b.initiatedAt) - new Date(a.initiatedAt));
      return list;
    },
    create: async ({ data }) => {
      const newRec = {
        id: genId('vrec'),
        supplierId: data.supplierId,
        providerId: data.providerId,
        providerName: data.providerName,
        status: data.status || 'VERIFICATION_PENDING',
        referenceNumber: data.referenceNumber,
        initiatedAt: data.initiatedAt || new Date().toISOString(),
        completedAt: data.completedAt || null,
        expiresAt: data.expiresAt || null,
        scope: data.scope,
        paymentAmountZAR: data.paymentAmountZAR || 'R 349.00',
        paymentGateway: data.paymentGateway || 'Direct Provider Gateway',
        paymentStatus: data.paymentStatus || 'COMPLETED_TO_PROVIDER',
        auditLogSummary: data.auditLogSummary || 'Direct external verification initiated.'
      };
      verificationRecords.unshift(newRec);
      return newRec;
    },
    update: async ({ where, data }) => {
      const idx = verificationRecords.findIndex(r => r.id === where.id || r.referenceNumber === where.referenceNumber);
      if (idx !== -1) {
        verificationRecords[idx] = { ...verificationRecords[idx], ...data };
        return verificationRecords[idx];
      }
      return null;
    }
  }
};

module.exports = { prisma, externalVerificationProviders, supportedPaymentGateways, verificationRecords };
