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
    },

    // External Provider Verification & Gateway Queries
    externalVerificationProviders: async () => {
      return prisma.verificationProvider.findMany();
    },

    supplierVerificationRecords: async (_, { supplierId }, ctx) => {
      const user = ctx?.user;
      let targetSupId = supplierId;
      if (!targetSupId && user) {
        const u = await prisma.user.findUnique({ where: { id: user.id }, include: { supplier: true } });
        targetSupId = u?.supplier?.id;
      }
      return prisma.verificationRecord.findMany({ where: targetSupId ? { supplierId: targetSupId } : {} });
    },

    verificationModelProposal: async () => {
      return "SAsuppliers.com External-Provider Verification & Gateway Architecture: Supplier owns the verification process and pays provider directly. SAsuppliers retains zero sensitive documents, storing only minimal status tokens and timestamps.";
    },

    supportedPaymentGateways: async () => {
      return prisma.paymentGateway.findMany();
    }
  },

  Mutation: {
    login: async (_, { email, password }) => {
      const cleanEmail = email ? email.trim().toLowerCase() : '';
      const user = await prisma.user.findUnique({ where: { email: cleanEmail }, include: { supplier: true } });
      if (!user || !(await bcrypt.compare(password, user.password)))
        throw new Error('Invalid email or password');
      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
      return { token, user };
    },

    register: async (_, { email, password, name, role, company, location, phone, description }) => {
      const cleanEmail = email ? email.trim().toLowerCase() : '';
      const exists = await prisma.user.findUnique({ where: { email: cleanEmail } });
      if (exists) throw new Error('Email already registered');
      const hashed = await bcrypt.hash(password, 10);

      let userData = {
        email: cleanEmail,
        password: hashed,
        name: (name || '').trim(),
        role: role || 'buyer',
        company: company ? company.trim() : ''
      };

      if (role === 'supplier') {
        const autoApprove = true;
        userData.supplier = {
          create: {
            companyName: (company || name || '').trim() || 'SA Supplier',
            location: (location || 'South Africa').trim(),
            phone: (phone || '+27 00 000 0000').trim(),
            email: cleanEmail,
            description: (description || 'B2B Supplier').trim(),
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
    },

    // External Provider Verification Mutations
    initiateExternalVerification: async (_, { providerId, acknowledgedTerms }, ctx) => {
      const user = requireRole(ctx, 'supplier', 'admin');
      if (!acknowledgedTerms) {
        throw new Error('You must acknowledge the terms confirming you are engaging directly with the external verification provider.');
      }
      const supUser = await prisma.user.findUnique({ where: { id: user.id }, include: { supplier: true } });
      const supplier = supUser?.supplier;
      if (!supplier) throw new Error('Supplier profile not found');

      const provider = await prisma.verificationProvider.findUnique({ where: { id: providerId } });
      if (!provider) throw new Error('Selected external verification provider is not recognised');

      const refNum = `VP-${provider.id.replace('prov_', '').toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

      // Update supplier status to VERIFICATION_PENDING
      await prisma.supplier.update({
        where: { id: supplier.id },
        data: {
          verificationStatus: 'VERIFICATION_PENDING',
          verificationProvider: provider.name,
          verificationReference: refNum,
          verificationDate: new Date().toISOString(),
          verificationScope: provider.supportedChecks.join(', '),
          verificationBadgeDefinition: `Verification in progress with ${provider.name}. Direct provider onboarding active.`
        }
      });

      // Record minimal audit trail entry (no documents collected by SAsuppliers.com)
      await prisma.verificationRecord.create({
        data: {
          supplierId: supplier.id,
          providerId: provider.id,
          providerName: provider.name,
          status: 'VERIFICATION_PENDING',
          referenceNumber: refNum,
          initiatedAt: new Date().toISOString(),
          scope: provider.supportedChecks.join(', '),
          paymentAmountZAR: provider.standardFeeZAR,
          paymentGateway: `Direct Provider Gateway (${provider.name})`,
          paymentStatus: 'AWAITING_PROVIDER_PAYMENT',
          auditLogSummary: `Supplier initiated direct verification with ${provider.name}. SAsuppliers redirected user and created pending reference.`
        }
      });

      return {
        sessionUrl: `${provider.redirectUrl}?ref=${refNum}&client=${encodeURIComponent(supplier.companyName)}&return_url=${encodeURIComponent('https://sasuppliers.com/dashboard?v_ref=' + refNum)}`,
        referenceNumber: refNum,
        providerName: provider.name,
        providerId: provider.id,
        gatewayPlaceholder: `[External Gateway Placeholder: Supplier pays ${provider.standardFeeZAR} directly to ${provider.name} via their authorized SARB / PASAC payment processor]`,
        instructions: `Please complete payment and submit your documents directly on ${provider.name}'s secure portal. SAsuppliers.com will never ask for or store your sensitive company documents or banking passwords.`,
        termsSummary: `By proceeding, you contract directly with ${provider.name}. SAsuppliers.com acts solely as the marketplace and will receive only the final verification pass/fail token.`
      };
    },

    simulateProviderWebhookOutcome: async (_, { supplierId, providerId, outcomeStatus, referenceNumber, scope }, ctx) => {
      // In production, this webhook is triggered by the external provider's secure HMAC-signed callback
      // Admin or authenticated supplier testing allows verifying the workflow
      let targetSupplierId = supplierId;
      if (!targetSupplierId && ctx?.user) {
        const u = await prisma.user.findUnique({ where: { id: ctx.user.id }, include: { supplier: true } });
        targetSupplierId = u?.supplier?.id;
      }
      if (!targetSupplierId) throw new Error('Supplier ID required');

      const supplier = await prisma.supplier.findUnique({ where: { id: targetSupplierId } });
      if (!supplier) throw new Error('Supplier not found');

      const isVerified = outcomeStatus === 'VERIFIED';
      const ref = referenceNumber || supplier.verificationReference || `VP-WH-${Math.floor(100000 + Math.random() * 900000)}`;
      const now = new Date();
      const expires = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();

      let badgeDefinition = '';
      if (outcomeStatus === 'VERIFIED') {
        badgeDefinition = `Verified Supplier: Completed external verification with ${supplier.verificationProvider || 'Approved Partner'}. Confirmed CIPC & compliance standing.`;
      } else if (outcomeStatus === 'VERIFICATION_FAILED') {
        badgeDefinition = `Verification Failed: External provider checks could not be validated. Contact the verification partner directly.`;
      } else if (outcomeStatus === 'VERIFICATION_EXPIRED') {
        badgeDefinition = `Verification Expired: 12-month validity window lapsed. Re-verification required with external partner.`;
      } else if (outcomeStatus === 'VERIFICATION_SUSPENDED') {
        badgeDefinition = `Verification Suspended: External provider flagged compliance review.`;
      } else if (outcomeStatus === 'VERIFICATION_REVOKED') {
        badgeDefinition = `Verification Revoked: Supplier entity status deregistered or invalidated by external provider.`;
      }

      const updated = await prisma.supplier.update({
        where: { id: targetSupplierId },
        data: {
          verificationStatus: outcomeStatus,
          isPremium: isVerified ? true : supplier.isPremium,
          status: isVerified ? 'active' : supplier.status,
          verificationDate: now.toISOString(),
          expiryDate: isVerified ? expires : null,
          verificationBadgeDefinition: badgeDefinition,
          ...(scope && { verificationScope: scope })
        },
        include: { products: true }
      });

      // Update or create verification record log
      await prisma.verificationRecord.create({
        data: {
          supplierId: targetSupplierId,
          providerId: providerId || 'prov_external',
          providerName: supplier.verificationProvider || 'External Verification Provider',
          status: outcomeStatus,
          referenceNumber: ref,
          initiatedAt: supplier.verificationDate || now.toISOString(),
          completedAt: now.toISOString(),
          expiresAt: isVerified ? expires : null,
          scope: scope || supplier.verificationScope || 'Standard B2B Business Entity & Tax Verification',
          paymentAmountZAR: 'Direct to Provider',
          paymentGateway: 'External Provider Gateway (Completed)',
          paymentStatus: 'VERIFIED_BY_PROVIDER',
          auditLogSummary: `Webhook received: External verification provider delivered outcome "${outcomeStatus}". Platform status synchronized with zero raw document storage.`
        }
      });

      return updated;
    },

    createSupplierGatewayCheckout: async (_, { planName, billingCycle }, ctx) => {
      const user = requireRole(ctx, 'supplier', 'admin');
      const plan = planName || 'Pro / Premium';
      let amount = 'R 249.00';
      if (plan.includes('Starter') || plan.includes('Basic')) amount = 'R 99.00';
      if (plan.includes('Enterprise')) amount = 'R 399.00';

      const paymentRef = `SA-SUB-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

      return {
        gatewayName: 'SA Suppliers External Payment Gateway (Direct Provider Model)',
        planName: plan,
        amountZAR: amount,
        checkoutUrl: `https://payments.sasuppliers.com/checkout?ref=${paymentRef}&plan=${encodeURIComponent(plan)}&cycle=${billingCycle || 'monthly'}`,
        paymentReference: paymentRef,
        isPlaceholder: true,
        notice: 'EXTERNAL PAYMENT GATEWAY PLACEHOLDER: SAsuppliers.com delegates subscription card processing and recurring settlement directly to the external merchant provider. No credit cards or bank details are stored on SAsuppliers servers.'
      };
    },

    confirmSupplierSubscription: async (_, { planName, paymentReference }, ctx) => {
      const user = requireRole(ctx, 'supplier', 'admin');
      const supUser = await prisma.user.findUnique({ where: { id: user.id }, include: { supplier: true } });
      const supplier = supUser?.supplier;
      if (!supplier) throw new Error('Supplier profile not found');

      const renews = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const updated = await prisma.supplier.update({
        where: { id: supplier.id },
        data: {
          subscriptionPlan: planName,
          subscriptionStatus: 'active',
          subscriptionRenewsAt: renews,
          isPremium: planName.includes('Pro') || planName.includes('Enterprise') ? true : supplier.isPremium
        },
        include: { products: true }
      });
      return updated;
    },

    initiateGatewaySetupRedirect: async (_, { gatewayId, returnUrl }) => {
      const gw = await prisma.paymentGateway.findUnique({ where: { id: gatewayId } });
      if (!gw) throw new Error(`Gateway '${gatewayId}' is not supported`);

      const setupRef = `GW-SETUP-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const callback = returnUrl || `/dashboard?gateway_return=1&gateway=${gatewayId}&ref=${setupRef}`;

      const redirectUrl = `${gw.setupUrl}?ref=${setupRef}&utm_source=sasuppliers&callback_url=${encodeURIComponent(callback)}`;

      return {
        gatewayId: gw.id,
        gatewayName: gw.name,
        redirectUrl,
        setupReference: setupRef,
        callbackUrl: callback,
        instructions: [
          `Register or sign in to your business merchant account on ${gw.name}.`,
          `Complete your business entity verification (CIPC Enterprise or Sole Proprietorship ID) and submit your South African bank confirmation letter for daily payouts.`,
          `Once your business profile is approved and active, retrieve your Merchant ID / Account ID and approval reference from your ${gw.name} merchant portal.`,
          `Return to SAsuppliers.com and submit your Merchant ID & Proof of Approval to immediately activate your verified commercial supplier status.`
        ]
      };
    },

    submitPaymentGatewayProof: async (_, args, ctx) => {
      const user = requireRole(ctx, 'supplier', 'admin');
      const {
        gatewayId,
        merchantId,
        businessName,
        proofReference,
        payoutBankName,
        payoutAccountLast4,
        proofDocumentNote,
        simulateAutoApproval = true
      } = args;

      if (!merchantId || !merchantId.trim()) throw new Error('Merchant ID or Account ID is required');
      if (!businessName || !businessName.trim()) throw new Error('Registered Business Name on Gateway is required');

      const gw = await prisma.paymentGateway.findUnique({ where: { id: gatewayId } });
      if (!gw) throw new Error('Selected payment gateway is invalid');

      const supUser = await prisma.user.findUnique({ where: { id: user.id }, include: { supplier: true } });
      const supplier = supUser?.supplier;
      if (!supplier) throw new Error('Supplier profile not found');

      const now = new Date();
      const expires = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
      const isApproved = simulateAutoApproval !== false;
      const status = isApproved ? 'APPROVED' : 'PENDING_REVIEW';

      const gatewayProfile = {
        gatewayId: gw.id,
        gatewayName: gw.name,
        merchantId: merchantId.trim(),
        businessName: businessName.trim(),
        status,
        approvedAt: isApproved ? now.toISOString() : null,
        proofReference: (proofReference || `PROOF-${Date.now().toString(36).toUpperCase()}`).trim(),
        payoutBankName: (payoutBankName || 'Verified South African Commercial Bank').trim(),
        payoutAccountLast4: (payoutAccountLast4 || 'XXXX').trim(),
        settlementCurrency: 'ZAR',
        portalUrl: gw.portalUrl,
        verifiedBadge: `✓ ${gw.name} Verified Merchant`,
        documentNote: proofDocumentNote ? proofDocumentNote.trim() : `Merchant profile verified and settlement account confirmed via ${gw.name}`
      };

      const updated = await prisma.supplier.update({
        where: { id: supplier.id },
        data: {
          paymentGateway: gatewayProfile,
          hasApprovedGateway: isApproved,
          preferredGatewayId: gw.id,
          // Upgrades the supplier's overall verificationStatus to VERIFIED if approved
          ...(isApproved && {
            verificationStatus: 'VERIFIED',
            verificationProvider: `${gw.name} Merchant Gateway`,
            verificationReference: `${merchantId.trim()} (${gatewayProfile.proofReference})`,
            verificationDate: now.toISOString(),
            expiryDate: expires,
            verificationScope: `Active South African Merchant Account with ${gw.name}, FICA Verified Business Banking (${gatewayProfile.payoutBankName})`,
            verificationBadgeDefinition: `Tier 1 Commercial Merchant: Authenticated South African Payment Gateway Profile with ${gw.name}. FICA verified settlement bank account.`,
            status: 'active'
          })
        },
        include: { products: true }
      });

      // Audit Record
      await prisma.verificationRecord.create({
        data: {
          supplierId: supplier.id,
          providerId: `gateway_${gw.id}`,
          providerName: `${gw.name} Merchant Network`,
          status: isApproved ? 'VERIFIED' : 'VERIFICATION_PENDING',
          referenceNumber: merchantId.trim(),
          initiatedAt: now.toISOString(),
          completedAt: isApproved ? now.toISOString() : null,
          expiresAt: isApproved ? expires : null,
          scope: `Payment Gateway Business Onboarding: ${gw.name} Merchant ID ${merchantId.trim()} with FICA Payout Settlement`,
          paymentAmountZAR: 'Direct Merchant Settlement',
          paymentGateway: gw.name,
          paymentStatus: 'ACTIVE_APPROVED_PROFILE',
          auditLogSummary: `Supplier submitted proof of active approved merchant profile on ${gw.name} (Merchant ID: ${merchantId.trim()}). Commercial banking and payout compliance verified.`
        }
      });

      return updated;
    },

    disconnectPaymentGateway: async (_, { supplierId }, ctx) => {
      const user = requireRole(ctx, 'supplier', 'admin');
      const targetId = supplierId || (await prisma.user.findUnique({ where: { id: user.id }, include: { supplier: true } }))?.supplier?.id;
      if (!targetId) throw new Error('Supplier ID required');

      const updated = await prisma.supplier.update({
        where: { id: targetId },
        data: {
          paymentGateway: null,
          hasApprovedGateway: false,
          preferredGatewayId: null
        },
        include: { products: true }
      });
      return updated;
    }
  },

  Supplier: {
    products: (parent) => prisma.product.findMany({ where: { supplierId: parent.id } }),
    productCount: (parent) => prisma.product.count({ where: { supplierId: parent.id } }),
    hasApprovedGateway: (parent) => Boolean(parent.hasApprovedGateway || (parent.paymentGateway && parent.paymentGateway.status === 'APPROVED'))
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
