import { gql } from '@apollo/client';

export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user { id email name role company supplier { id companyName status } }
    }
  }
`;

export const REGISTER = gql`
  mutation Register($email: String!, $password: String!, $name: String!, $role: String!, $company: String, $location: String, $phone: String, $description: String) {
    register(email: $email, password: $password, name: $name, role: $role, company: $company, location: $location, phone: $phone, description: $description) {
      token
      user { id email name role company supplier { id companyName status } }
    }
  }
`;

export const ME = gql`
  query Me {
    me { id email name role company supplier { id companyName location phone email description logo isPremium status } }
  }
`;

export const GET_PRODUCTS = gql`
  query GetProducts($search: String, $category: String) {
    products(search: $search, category: $category) {
      id name category description priceRange moq image
      supplier { id companyName location email isPremium status }
    }
  }
`;

export const GET_SUPPLIERS = gql`
  query GetSuppliers($status: String) {
    suppliers(status: $status) {
      id companyName location phone email description logo isPremium status productCount
    }
  }
`;

export const GET_CATEGORIES = gql`
  query GetCategories { categories }
`;

export const GET_METRICS = gql`
  query GetMetrics { metrics { totalVisits totalQuotes totalMessages } }
`;

export const GET_ALL_SUPPLIERS_ADMIN = gql`
  query GetAllSuppliers {
    suppliers {
      id companyName location phone email description logo isPremium status productCount
    }
  }
`;

export const SUBMIT_QUOTE = gql`
  mutation SubmitQuote($productId: String!, $buyerName: String!, $buyerEmail: String!, $message: String!, $quantity: Int) {
    submitQuote(productId: $productId, buyerName: $buyerName, buyerEmail: $buyerEmail, message: $message, quantity: $quantity) {
      id status
    }
  }
`;

export const SEND_MESSAGE = gql`
  mutation SendMessage($supplierId: String!, $message: String!) {
    sendMessage(supplierId: $supplierId, message: $message)
  }
`;

export const ADD_PRODUCT = gql`
  mutation AddProduct($name: String!, $category: String!, $description: String!, $priceRange: String!, $moq: Int!, $image: String) {
    addProduct(name: $name, category: $category, description: $description, priceRange: $priceRange, moq: $moq, image: $image) {
      id name category description priceRange moq image supplier { id companyName }
    }
  }
`;

export const UPDATE_PRODUCT = gql`
  mutation UpdateProduct($id: String!, $name: String, $category: String, $description: String, $priceRange: String, $moq: Int, $image: String) {
    updateProduct(id: $id, name: $name, category: $category, description: $description, priceRange: $priceRange, moq: $moq, image: $image) {
      id name category description priceRange moq image
    }
  }
`;

export const DELETE_PRODUCT = gql`
  mutation DeleteProduct($id: String!) { deleteProduct(id: $id) }
`;

export const UPDATE_SUPPLIER_STATUS = gql`
  mutation UpdateSupplierStatus($id: String!, $status: String!) {
    updateSupplierStatus(id: $id, status: $status) { id status companyName }
  }
`;

export const UPDATE_SUPPLIER_PERMISSIONS = gql`
  mutation UpdateSupplierPermissions($id: String!, $isPremium: Boolean) {
    updateSupplierPermissions(id: $id, isPremium: $isPremium) { id isPremium companyName }
  }
`;

export const DELETE_SUPPLIER = gql`
  mutation DeleteSupplier($id: String!) { deleteSupplier(id: $id) }
`;

export const UPDATE_PROFILE = gql`
  mutation UpdateProfile($name: String, $company: String, $phone: String, $location: String, $description: String, $email: String) {
    updateProfile(name: $name, company: $company, phone: $phone, location: $location, description: $description, email: $email) {
      id email name role company supplier { id companyName location phone email description }
    }
  }
`;

export const GET_SUPPLIER_PRODUCTS = gql`
  query GetSupplierProducts($supplierId: String!) {
    products(supplierId: $supplierId) {
      id name category description priceRange moq image supplier { id companyName }
    }
  }
`;

// Gemini AI GraphQL Operations
export const ANALYZE_PRODUCT_VIABILITY = gql`
  query AnalyzeProductViability($id: String, $name: String, $category: String, $priceRange: String, $moq: Int, $description: String) {
    analyzeProductViability(id: $id, name: $name, category: $category, priceRange: $priceRange, moq: $moq, description: $description) {
      viabilityScore
      demandLevel
      pricingAnalysis
      competitiveStrengths
      risksAndChallenges
      actionableRecommendations
      recommendedMOQ
      marketTrends
      sourcingStrategy
      targetIndustries
    }
  }
`;

export const GET_SUPPLIER_COMPETITIVENESS = gql`
  query GetSupplierCompetitiveness($supplierId: String, $categoryFocus: String) {
    getSupplierCompetitivenessAdvice(supplierId: $supplierId, categoryFocus: $categoryFocus) {
      competitiveScore
      strategicPillars
      pricingStrategies
      operationalTips
      localAdvantageTips
      marketOpportunities
    }
  }
`;

export const GET_MARKET_VIABILITY_RECOMMENDATIONS = gql`
  query GetMarketViabilityRecommendations($industry: String) {
    getMarketViabilityRecommendations(industry: $industry) {
      overview
      topViableCategories
      recommendations {
        title
        category
        estimatedDemand
        estimatedMargin
        recommendedMOQ
        whyViable
        competitionLevel
      }
      supplierBestPractices
      rawAnalysis
    }
  }
`;

export const OPTIMIZE_PRODUCT_LISTING = gql`
  query OptimizeProductListing($name: String!, $category: String, $targetAudience: String, $currentPrice: String, $currentMoq: Int) {
    optimizeProductListing(name: $name, category: $category, targetAudience: $targetAudience, currentPrice: $currentPrice, currentMoq: $currentMoq) {
      optimizedTitle
      optimizedDescription
      suggestedPriceRange
      suggestedMOQ
      valuePropositions
      targetBuyerPersona
    }
  }
`;

export const SUBMIT_CONTACT_INQUIRY = gql`
  mutation SubmitContactInquiry($name: String!, $email: String!, $subject: String, $message: String!) {
    submitContactInquiry(name: $name, email: $email, subject: $subject, message: $message)
  }
`;

export const TEST_EMAIL_ALERT = gql`
  mutation TestEmailAlert($recipient: String) {
    testEmailAlert(recipient: $recipient)
  }
`;

export const GET_SUPPLIER_QUOTES = gql`
  query GetSupplierQuotes {
    supplierQuotes {
      id
      productId
      buyerName
      buyerEmail
      message
      quantity
      status
      createdAt
      product {
        id
        name
        priceRange
        moq
        supplier {
          id
          companyName
          email
        }
      }
    }
  }
`;

export const GET_MY_BUYER_QUOTES = gql`
  query GetMyBuyerQuotes {
    myBuyerQuotes {
      id
      productId
      buyerName
      buyerEmail
      message
      quantity
      status
      createdAt
      product {
        id
        name
        priceRange
        moq
        supplier {
          id
          companyName
          email
          phone
        }
      }
    }
  }
`;

export const UPDATE_QUOTE_STATUS = gql`
  mutation UpdateQuoteStatus($id: String!, $status: String!) {
    updateQuoteStatus(id: $id, status: $status) {
      id
      status
    }
  }
`;
