const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('./db');
const {
  analyzeProductViabilityWithGemini,
  getSupplierCompetitivenessAdviceWithGemini,
  getMarketViabilityRecommendationsWithGemini,
  optimizeProductListingWithGemini
} = require('./geminiService');
const {
  sendSupplierQuoteAlert,
  sendBuyerQuoteConfirmation,
  sendSupplierMessageAlert,
  sendContactInquiryAlert,
  sendEmail
} = require('./emailService');

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
      return prisma.quote.findMany({ orderBy: { createdAt: 'desc' }, include: { product: { include: { supplier: true } } } });
    },

    supplierQuotes: async (_, __, ctx) => {
      const user = requireRole(ctx, 'supplier', 'admin');
      let supplierId = null;
      if (user.role === 'supplier') {
        const userRecord = await prisma.user.findUnique({ where: { id: user.id }, include: { supplier: true } });
        supplierId = userRecord?.supplier?.id;
        if (!supplierId) return [];
      }
      return prisma.quote.findMany({
        where: supplierId ? { product: { supplierId } } : {},
        orderBy: { createdAt: 'desc' },
        include: { product: { include: { supplier: true } } }
      });
    },

    myBuyerQuotes: async (_, __, ctx) => {
      const user = getUser(ctx);
      const userRecord = await prisma.user.findUnique({ where: { id: user.id } });
      if (!userRecord?.email) return [];
      return prisma.quote.findMany({
        where: { buyerEmail: userRecord.email },
        orderBy: { createdAt: 'desc' },
        include: { product: { include: { supplier: true } } }
      });
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
      const parsedQty = quantity ? Number(quantity) : 1;
      const quote = await prisma.quote.create({
        data: {
          productId,
          buyerName,
          buyerEmail,
          message: message || '',
          quantity: parsedQty
        }
      });
      await prisma.siteMetric.update({ where: { id: 'singleton' }, data: { totalQuotes: { increment: 1 } } });

      // Fetch product and associated supplier for email dispatch
      try {
        const product = await prisma.product.findUnique({
          where: { id: productId },
          include: { supplier: true }
        });

        const supplierEmail = product?.supplier?.email || 'sales@sasuppliers.com';
        const supplierName = product?.supplier?.companyName || 'Verified Supplier';
        const productName = product?.name || 'Product';

        // Dispatch turboSMTP automated alerts asynchronously
        Promise.allSettled([
          sendSupplierQuoteAlert({
            supplierEmail,
            supplierName,
            buyerName,
            buyerEmail,
            productName,
            quantity: parsedQty,
            message,
            quoteId: quote.id
          }),
          sendBuyerQuoteConfirmation({
            buyerEmail,
            buyerName,
            productName,
            quantity: parsedQty,
            supplierName,
            supplierEmail
          })
        ]).catch(err => console.error('[turboSMTP Dispatch Error]', err.message));
      } catch (err) {
        console.error('[Quote Email Lookup Error]', err.message);
      }

      return quote;
    },

    updateQuoteStatus: async (_, { id, status }, ctx) => {
      const user = requireRole(ctx, 'supplier', 'admin');
      const quote = await prisma.quote.findUnique({
        where: { id },
        include: { product: { include: { supplier: true } } }
      });
      if (!quote) throw new Error('Quote not found');
      if (user.role === 'supplier' && quote.product?.supplier?.userId !== user.id) {
        throw new Error('Unauthorized');
      }

      const updated = await prisma.quote.update({
        where: { id },
        data: { status },
        include: { product: { include: { supplier: true } } }
      });

      // Send status update notification to buyer
      if (quote.buyerEmail) {
        sendEmail({
          to: quote.buyerEmail,
          subject: `[Quote Status Updated: ${status.toUpperCase()}] Your RFQ for ${quote.product?.name || 'Product'}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #111111; color: #e5e5e5; padding: 24px; border-radius: 8px; border: 1px solid #333;">
              <h2 style="color: #eab308; font-size: 18px; margin-top: 0;">Quote Status Updated</h2>
              <p>Hello <strong>${quote.buyerName}</strong>, your quote request for <strong>${quote.product?.name}</strong> has been updated to <strong style="color: #eab308; text-transform: uppercase;">${status}</strong> by <strong>${quote.product?.supplier?.companyName || 'the supplier'}</strong>.</p>
              <div style="background: #1c1c1c; padding: 15px; border-radius: 6px; margin: 15px 0;">
                <p style="margin: 0 0 6px 0;"><strong>Product:</strong> ${quote.product?.name}</p>
                <p style="margin: 0 0 6px 0;"><strong>Quantity:</strong> ${quote.quantity} units</p>
                <p style="margin: 0;"><strong>Supplier Contact:</strong> ${quote.product?.supplier?.email || 'sales@sasuppliers.com'}</p>
              </div>
              <a href="mailto:${quote.product?.supplier?.email || 'sales@sasuppliers.com'}" 
                 style="background-color: #eab308; color: #000; font-weight: bold; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Contact Supplier
              </a>
            </div>
          `
        }).catch(err => console.error('[Quote Status Email Error]', err.message));
      }

      return updated;
    },

    sendMessage: async (_, { supplierId, message }, ctx) => {
      await prisma.siteMetric.update({ where: { id: 'singleton' }, data: { totalMessages: { increment: 1 } } });
      try {
        const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
        const senderName = ctx.user ? (ctx.user.name || ctx.user.email) : 'Prospective Buyer';
        const senderEmail = ctx.user ? ctx.user.email : 'buyer@sasuppliers.com';

        if (supplier?.email) {
          sendSupplierMessageAlert({
            supplierEmail: supplier.email,
            supplierName: supplier.companyName,
            senderName,
            senderEmail,
            message
          }).catch(err => console.error('[Message Email Error]', err.message));
        }
      } catch (e) {
        console.error('[Send message lookup error]', e.message);
      }
      return true;
    },

    submitContactInquiry: async (_, { name, email, subject, message }) => {
      try {
        await sendContactInquiryAlert({ name, email, subject, message });
        return true;
      } catch (err) {
        console.error('[Contact Inquiry Error]', err.message);
        return false;
      }
    },

    testEmailAlert: async (_, { recipient }) => {
      const target = recipient || 'aphelelesesethu719@gmail.com';
      try {
        const result = await sendEmail({
          to: target,
          subject: '[turboSMTP Test] SAsuppliers.com Automated Email Verification',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; padding: 24px; background: #111; color: #fff; border-radius: 8px; border: 1px solid #333;">
              <h2 style="color: #eab308; margin-top: 0;">turboSMTP Test Successful</h2>
              <p>This is a test notification confirming that <strong>turboSMTP</strong> is active and delivering automated emails on <strong>SAsuppliers.com</strong>.</p>
              <div style="background: #1c1c1c; padding: 12px; border-radius: 4px; font-size: 13px; color: #aaa;">
                Timestamp: ${new Date().toISOString()}<br/>
                Host: pro.turbo-smtp.com / TurboSMTP API v2
              </div>
            </div>
          `
        });
        return result.success !== false;
      } catch (err) {
        console.error('[Test Email Error]', err.message);
        return false;
      }
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

  Quote: {
    product: (parent) => parent.product || prisma.product.findUnique({ where: { id: parent.productId }, include: { supplier: true } })
  },

  User: {
    supplier: (parent) => parent.supplierId
      ? prisma.supplier.findUnique({ where: { id: parent.supplierId } })
      : prisma.supplier.findUnique({ where: { userId: parent.id } }).catch(() => null)
  }
};

module.exports = resolvers;
