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

  type Query {
    me: User
    suppliers(status: String): [Supplier!]!
    supplier(id: String!): Supplier
    products(search: String, category: String, supplierId: String): [Product!]!
    product(id: String!): Product
    quotes: [Quote!]!
    metrics: SiteMetric!
    categories: [String!]!
  }

  type Mutation {
    login(email: String!, password: String!): AuthPayload!
    register(email: String!, password: String!, name: String!, role: String!, company: String, location: String, phone: String, description: String): AuthPayload!
    updateProfile(name: String, company: String, phone: String, location: String, description: String, email: String): User!
    addProduct(name: String!, category: String!, description: String!, priceRange: String!, moq: Int!, image: String): Product!
    updateProduct(id: String!, name: String, category: String, description: String, priceRange: String, moq: Int, image: String): Product!
    deleteProduct(id: String!): Boolean!
    submitQuote(productId: String!, buyerName: String!, buyerEmail: String!, message: String!, quantity: Int): Quote!
    sendMessage(supplierId: String!, message: String!): Boolean!
    updateSupplierStatus(id: String!, status: String!): Supplier!
    updateSupplierPermissions(id: String!, isPremium: Boolean, maxProducts: Int): Supplier!
    deleteSupplier(id: String!): Boolean!
    updateAdminSettings(autoApprove: Boolean): Boolean!
  }
`;

module.exports = typeDefs;
