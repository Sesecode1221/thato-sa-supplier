const { gql } = require('graphql-tag');

const typeDefs = gql`
  type User {
    id: String!
    email: String!
    name: String!
    role: String!
    company: String
    supplier: Supplier
  }

  type Supplier {
    id: String!
    companyName: String!
    location: String!
    phone: String!
    email: String!
    description: String!
    logo: String
    isPremium: Boolean!
    status: String!
    products: [Product!]!
    productCount: Int!
    
    # External Provider & Supplier-Owned Verification Model
    verificationStatus: String # UNVERIFIED, VERIFICATION_PENDING, VERIFIED, VERIFICATION_EXPIRED, VERIFICATION_FAILED, VERIFICATION_SUSPENDED, VERIFICATION_REVOKED
    verificationProvider: String
    verificationReference: String
    verificationDate: String
    expiryDate: String
    verificationScope: String
    verificationBadgeDefinition: String
    
    # Subscription & External Payment Gateway Details
    subscriptionPlan: String
    subscriptionStatus: String # active, pending_payment, past_due, trial, cancelled
    subscriptionRenewsAt: String

    # Payment Gateway Profile & Verification
    paymentGateway: SupplierPaymentGateway
    hasApprovedGateway: Boolean!
    preferredGatewayId: String
  }

  type SupplierPaymentGateway {
    gatewayId: String!
    gatewayName: String!
    merchantId: String!
    businessName: String!
    status: String! # APPROVED, PENDING_REVIEW, REJECTED
    approvedAt: String
    proofReference: String
    payoutBankName: String
    payoutAccountLast4: String
    settlementCurrency: String
    portalUrl: String!
    verifiedBadge: String!
    documentNote: String
  }

  type SupportedPaymentGateway {
    id: String!
    name: String!
    tagline: String!
    setupUrl: String!
    portalUrl: String!
    logo: String!
    color: String!
    supportedPaymentMethods: [String!]!
    settlementSpeed: String!
    requirements: [String!]!
    isPopular: Boolean!
    testMerchantExample: String!
    description: String!
  }

  type GatewayRedirectPayload {
    gatewayId: String!
    gatewayName: String!
    redirectUrl: String!
    setupReference: String!
    callbackUrl: String!
    instructions: [String!]!
  }

  type ExternalVerificationProvider {
    id: String!
    name: String!
    tagline: String!
    category: String!
    supportedChecks: [String!]!
    standardFeeZAR: String!
    turnaround: String!
    complianceCertifications: [String!]!
    statusEndpoint: String!
    isRecommended: Boolean!
    redirectUrl: String!
  }

  type ExternalVerificationRecord {
    id: String!
    supplierId: String!
    providerId: String!
    providerName: String!
    status: String!
    referenceNumber: String!
    initiatedAt: String!
    completedAt: String
    expiresAt: String
    scope: String!
    paymentAmountZAR: String!
    paymentGateway: String!
    paymentStatus: String!
    auditLogSummary: String!
  }

  type VerificationSessionPayload {
    sessionUrl: String!
    referenceNumber: String!
    providerName: String!
    providerId: String!
    gatewayPlaceholder: String!
    instructions: String!
    termsSummary: String!
  }

  type GatewaySubscriptionPayload {
    gatewayName: String!
    planName: String!
    amountZAR: String!
    checkoutUrl: String!
    paymentReference: String!
    isPlaceholder: Boolean!
    notice: String!
  }

  type Product {
    id: String!
    name: String!
    category: String!
    description: String!
    priceRange: String!
    moq: Int!
    image: String!
    supplier: Supplier!
  }

  type Quote {
    id: String!
    productId: String!
    buyerEmail: String!
    buyerName: String!
    message: String!
    quantity: Int!
    status: String!
    createdAt: String!
    product: Product
  }

  type SiteMetric {
    totalVisits: Int!
    totalQuotes: Int!
    totalMessages: Int!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  # Gemini AI Intelligence Types
  type AIProductViability {
    viabilityScore: Int!
    demandLevel: String!
    pricingAnalysis: String!
    competitiveStrengths: [String!]!
    risksAndChallenges: [String!]!
    actionableRecommendations: [String!]!
    recommendedMOQ: Int!
    marketTrends: String!
    sourcingStrategy: String!
    targetIndustries: [String!]!
  }

  type AISupplierCompetitiveness {
    competitiveScore: Int!
    strategicPillars: [String!]!
    pricingStrategies: [String!]!
    operationalTips: [String!]!
    localAdvantageTips: [String!]!
    marketOpportunities: [String!]!
  }

  type AIProductRecommendation {
    title: String!
    category: String!
    estimatedDemand: String!
    estimatedMargin: String!
    recommendedMOQ: String!
    whyViable: String!
    competitionLevel: String!
  }

  type AIMarketInsights {
    overview: String!
    topViableCategories: [String!]!
    recommendations: [AIProductRecommendation!]!
    supplierBestPractices: [String!]!
    rawAnalysis: String
  }

  type AIProductOptimization {
    optimizedTitle: String!
    optimizedDescription: String!
    suggestedPriceRange: String!
    suggestedMOQ: Int!
    valuePropositions: [String!]!
    targetBuyerPersona: String!
  }

  type Query {
    me: User
    suppliers(status: String): [Supplier!]!
    supplier(id: String!): Supplier
    products(search: String, category: String, supplierId: String): [Product!]!
    product(id: String!): Product
    quotes: [Quote!]!
    supplierQuotes: [Quote!]!
    myBuyerQuotes: [Quote!]!
    metrics: SiteMetric!
    categories: [String!]!

    # Gemini AI Queries
    analyzeProductViability(id: String, name: String, category: String, priceRange: String, moq: Int, description: String): AIProductViability!
    getSupplierCompetitivenessAdvice(supplierId: String, categoryFocus: String): AISupplierCompetitiveness!
    getMarketViabilityRecommendations(industry: String): AIMarketInsights!
    optimizeProductListing(name: String!, category: String, targetAudience: String, currentPrice: String, currentMoq: Int): AIProductOptimization!
    # External Provider Verification & Gateway Queries
    externalVerificationProviders: [ExternalVerificationProvider!]!
    supplierVerificationRecords(supplierId: String): [ExternalVerificationRecord!]!
    verificationModelProposal: String!
    supportedPaymentGateways: [SupportedPaymentGateway!]!
  }

  type Mutation {
    login(email: String!, password: String!): AuthPayload!
    register(email: String!, password: String!, name: String!, role: String!, company: String, location: String, phone: String, description: String): AuthPayload!
    updateProfile(name: String, company: String, phone: String, location: String, description: String, email: String): User!
    addProduct(name: String!, category: String!, description: String!, priceRange: String!, moq: Int!, image: String): Product!
    updateProduct(id: String!, name: String, category: String, description: String, priceRange: String, moq: Int, image: String): Product!
    deleteProduct(id: String!): Boolean!
    submitQuote(productId: String!, buyerName: String!, buyerEmail: String!, message: String!, quantity: Int): Quote!
    updateQuoteStatus(id: String!, status: String!): Quote!
    sendMessage(supplierId: String!, message: String!): Boolean!
    submitContactInquiry(name: String!, email: String!, subject: String, message: String!): Boolean!
    testEmailAlert(recipient: String): Boolean!
    updateSupplierStatus(id: String!, status: String!): Supplier!
    updateSupplierPermissions(id: String!, isPremium: Boolean, maxProducts: Int): Supplier!
    deleteSupplier(id: String!): Boolean!
    updateAdminSettings(autoApprove: Boolean): Boolean!

    # External Provider Verification & Payment Gateway Mutations
    initiateExternalVerification(providerId: String!, acknowledgedTerms: Boolean!): VerificationSessionPayload!
    simulateProviderWebhookOutcome(
      supplierId: String!
      providerId: String!
      outcomeStatus: String! # VERIFIED, VERIFICATION_FAILED, VERIFICATION_EXPIRED, VERIFICATION_SUSPENDED, VERIFICATION_REVOKED
      referenceNumber: String
      scope: String
    ): Supplier!
    createSupplierGatewayCheckout(planName: String!, billingCycle: String): GatewaySubscriptionPayload!
    confirmSupplierSubscription(planName: String!, paymentReference: String!): Supplier!

    # Supplier Choice Payment Gateway Verification & Profile Setup
    initiateGatewaySetupRedirect(gatewayId: String!, returnUrl: String): GatewayRedirectPayload!
    submitPaymentGatewayProof(
      gatewayId: String!
      merchantId: String!
      businessName: String!
      proofReference: String!
      payoutBankName: String
      payoutAccountLast4: String
      proofDocumentNote: String
      simulateAutoApproval: Boolean
    ): Supplier!
    disconnectPaymentGateway(supplierId: String): Supplier!
  }
`;

module.exports = typeDefs;
