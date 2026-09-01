const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('./db');
const {
  analyzeProductViabilityWithGemini,
  getSupplierCompetitivenessAdviceWithGemini,
  getMarketViabilityRecommendationsWithGemini,
  optimizeProductListingWithGemini
} = require('./geminiService');

const JWT_SECRET = process.env.JWT_SECRET || 'sasuppliers_secret';

function getUser(ctx) {
  if (!ctx.user) throw new Error('Authentication required');
  return ctx.user;
}

function requireRole(ctx, ...roles) {
  const user = getUser(ctx);
  if (!roles.includes(user.role)) throw new Error(`Access denied. Required: ${roles.join(' or ')}`);
  return user;
}

const resolvers = {
  Query: {
    me: async (_, __, ctx) => {
      if (!ctx.user) return null;
      return prisma.user.findUnique({ where: { id: ctx.user.id }, include: { supplier: true } });
    },

    suppliers: async (_, { status }) => {
      const where = status ? { status } : {};
      return prisma.supplier.findMany({ where, orderBy: [{ isPremium: 'desc' }, { createdAt: 'asc' }], include: { products: true } });
    },

    supplier: async (_, { id }) =>
      prisma.supplier.findUnique({ where: { id }, include: { products: true } }),

    products: async (_, { search, category, supplierId }) => {
      const where = {
        supplier: { status: 'active' },
        ...(supplierId && { supplierId }),
        ...(category && { category }),
        ...(search && {
          OR: [
            { name: { contains: search } },
            { supplier: { companyName: { contains: search } } }
          ]
        })
      };
      return prisma.product.findMany({ where, include: { supplier: true }, orderBy: { createdAt: 'desc' } });
    },

    product: async (_, { id }) =>
      prisma.product.findUnique({ where: { id }, include: { supplier: true } }),

    quotes: async (_, __, ctx) => {
      requireRole(ctx, 'admin');
      return prisma.quote.findMany({ orderBy: { createdAt: 'desc' } });
    },

    metrics: async (_, __, ctx) => {
      requireRole(ctx, 'admin');
      return prisma.siteMetric.findUnique({ where: { id: 'singleton' } });
    },

    categories: async () => {
      const cats = await prisma.product.groupBy({ by: ['category'] });
      return cats.map(c => c.category);
    },

    // Gemini AI Queries
    analyzeProductViability: async (_, { id, name, category, priceRange, moq, description }) => {
      let prod = { name, category, priceRange, moq, description };
      if (id) {
        const found = await prisma.product.findUnique({ where: { id }, include: { supplier: true } });
        if (found) {
          prod = {
            name: name || found.name,
            category: category || found.category,
            priceRange: priceRange || found.priceRange,
            moq: moq || found.moq,
            description: description || found.description
          };
        }
      }
      return analyzeProductViabilityWithGemini(prod);
    },

    getSupplierCompetitivenessAdvice: async (_, { supplierId, categoryFocus }, ctx) => {
      let targetSupplierId = supplierId;
      if (!targetSupplierId && ctx?.user) {
        const userRecord = await prisma.user.findUnique({ where: { id: ctx.user.id }, include: { supplier: true } });
        targetSupplierId = userRecord?.supplier?.id;
      }

      let supplierName = 'South African SME Supplier';
      let location = 'Johannesburg / Gauteng, South Africa';
      let productsCount = 5;
      let catFocus = categoryFocus || 'General Wholesale & Manufacturing';

      if (targetSupplierId) {
        const sup = await prisma.supplier.findUnique({ where: { id: targetSupplierId }, include: { products: true } });
        if (sup) {
          supplierName = sup.companyName;
          location = sup.location || location;
          productsCount = sup.products?.length || 0;
          if (sup.products?.length > 0 && !categoryFocus) {
            catFocus = sup.products[0].category;
          }
        }
      }

      return getSupplierCompetitivenessAdviceWithGemini({
        supplierName,
        location,
        categoryFocus: catFocus,
        currentProductsCount: productsCount
      });
    },

    getMarketViabilityRecommendations: async (_, { industry }) => {
      return getMarketViabilityRecommendationsWithGemini({ industry });
    },

    optimizeProductListing: async (_, { name, category, targetAudience, currentPrice, currentMoq }) => {
      return optimizeProductListingWithGemini({
        name,
        category,
        targetAudience,
        currentPrice,
        currentMoq
      });
    }
  },

  Mutation: {
    login: async (_, { email, password }) => {
      const user = await prisma.user.findUnique({ where: { email }, include: { supplier: true } });
      if (!user || !(await bcrypt.compare(password, user.password)))
        throw new Error('Invalid email or password');
      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
      return { token, user };
    },

    register: async (_, { email, password, name, role, company, location, phone, description }) => {
      const exists = await prisma.user.findUnique({ where: { email } });
      if (exists) throw new Error('Email already registered');
      const hashed = await bcrypt.hash(password, 10);

      let userData = { email, password: hashed, name, role, company };

      if (role === 'supplier') {
        const autoApprove = true;
        userData.supplier = {
          create: {
            companyName: company || name,
            location: location || 'South Africa',
            phone: phone || '+27 00 000 0000',
            email,
            description: description || 'B2B Supplier',
            logo: 'https://picsum.photos/id/1/100/100',
            status: autoApprove ? 'active' : 'pending'
          }
        };
      }

      const user = await prisma.user.create({ data: userData, include: { supplier: true } });
      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
      return { token, user };
    },

    updateProfile: async (_, args, ctx) => {
      const user = getUser(ctx);
      const { name, company, phone, location, description, email } = args;
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { ...(name && { name }), ...(company && { company }), ...(email && { email }) },
        include: { supplier: true }
      });
      if (updated.supplier && (phone || location || description || company)) {
        await prisma.supplier.update({
          where: { id: updated.supplier.id },
          data: {
            ...(phone && { phone }),
            ...(location && { location }),
            ...(description && { description }),
            ...(company && { companyName: company }),
            ...(email && { email })
          }
        });
      }
      return prisma.user.findUnique({ where: { id: user.id }, include: { supplier: true } });
    },

    addProduct: async (_, { name, category, description, priceRange, moq, image }, ctx) => {
      const user = requireRole(ctx, 'supplier', 'admin');
      const supplier = await prisma.supplier.findUnique({ where: { userId: user.id } });
      if (!supplier) throw new Error('Supplier profile not found');
      return prisma.product.create({
        data: { name, category, description, priceRange, moq, image: image || 'https://picsum.photos/id/48/400/300', supplierId: supplier.id },
        include: { supplier: true }
      });
    },

    updateProduct: async (_, { id, ...fields }, ctx) => {
      const user = requireRole(ctx, 'supplier', 'admin');
      const product = await prisma.product.findUnique({ where: { id }, include: { supplier: true } });
      if (!product) throw new Error('Product not found');
      if (user.role !== 'admin' && product.supplier.userId !== user.id) throw new Error('Unauthorized');
      const data = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined));
      return prisma.product.update({ where: { id }, data, include: { supplier: true } });
    },

    deleteProduct: async (_, { id }, ctx) => {
      const user = requireRole(ctx, 'supplier', 'admin');
      const product = await prisma.product.findUnique({ where: { id }, include: { supplier: true } });
      if (!product) throw new Error('Product not found');
      if (user.role !== 'admin' && product.supplier.userId !== user.id) throw new Error('Unauthorized');
      await prisma.product.delete({ where: { id } });
      return true;
    },

    submitQuote: async (_, { productId, buyerName, buyerEmail, message, quantity }) => {
      const quote = await prisma.quote.create({ data: { productId, buyerName, buyerEmail, message, quantity: quantity || 1 } });
      await prisma.siteMetric.update({ where: { id: 'singleton' }, data: { totalQuotes: { increment: 1 } } });
      return quote;
    },

    sendMessage: async (_, { supplierId, message }, ctx) => {
      await prisma.siteMetric.update({ where: { id: 'singleton' }, data: { totalMessages: { increment: 1 } } });
      return true;
    },

    updateSupplierStatus: async (_, { id, status }, ctx) => {
      requireRole(ctx, 'admin');
      return prisma.supplier.update({ where: { id }, data: { status }, include: { products: true } });
    },

    updateSupplierPermissions: async (_, { id, isPremium }, ctx) => {
      requireRole(ctx, 'admin');
      const data = {};
      if (isPremium !== undefined) data.isPremium = isPremium;
      return prisma.supplier.update({ where: { id }, data, include: { products: true } });
    },

    deleteSupplier: async (_, { id }, ctx) => {
      requireRole(ctx, 'admin');
      await prisma.supplier.delete({ where: { id } });
      return true;
    },

    updateAdminSettings: async (_, { autoApprove }, ctx) => {
      requireRole(ctx, 'admin');
      return true;
    }
  },

  Supplier: {
    products: (parent) => prisma.product.findMany({ where: { supplierId: parent.id } }),
    productCount: (parent) => prisma.product.count({ where: { supplierId: parent.id } })
  },

  Product: {
    supplier: (parent) => prisma.supplier.findUnique({ where: { id: parent.supplierId } })
  },

  User: {
    supplier: (parent) => parent.supplierId
      ? prisma.supplier.findUnique({ where: { id: parent.supplierId } })
      : prisma.supplier.findUnique({ where: { userId: parent.id } }).catch(() => null)
  }
};

module.exports = resolvers;
