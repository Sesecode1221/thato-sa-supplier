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
  }
`;

module.exports = typeDefs;
