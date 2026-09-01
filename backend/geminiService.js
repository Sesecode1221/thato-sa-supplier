const { GoogleGenAI } = require('@google/genai');

// Helper to get GoogleGenAI client
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

// Helper to call Gemini models with resilient fallback across models (e.g. gemini-3.7-flash -> gemini-flash-latest -> gemini-3.1-flash-lite)
async function generateContentResilient(genAI, { contents, config }) {
  const candidateModels = [
    'gemini-3.7-flash',
    'gemini-flash-latest',
    'gemini-3.1-flash-lite'
  ];

  let lastError = null;
  for (const model of candidateModels) {
    try {
      const response = await genAI.models.generateContent({
        model,
        contents,
        config
      });
      return response;
    } catch (err) {
      lastError = err;
      // If error is 503 (high demand) or 429/unavailable, try next candidate model
      const errMsg = err?.message || '';
      const isTransient = errMsg.includes('503') || errMsg.includes('UNAVAILABLE') || errMsg.includes('high demand') || errMsg.includes('ResourceExhausted');
      if (isTransient) {
        console.warn(`Model ${model} unavailable due to temporary demand spike. Trying alternative model...`);
        continue;
      }
      // For non-transient errors, break and fall back to domain logic
      break;
    }
  }
  throw lastError;
}

// Fallback intelligent domain logic for South African B2B market if API key is not yet set
function getFallbackProductViability(product) {
  const name = product.name || 'Product';
  const cat = product.category || 'General';
  const moq = Number(product.moq) || 50;

  let viabilityScore = 84;
  let demandLevel = 'High';
  let strengths = [
    'Strong domestic demand across South African retail & industrial SMEs',
    'Favorable MOQ structure suitable for local small businesses',
    'High potential for repeat procurement orders'
  ];
  let risks = [
    'Import competition on pricing from overseas discount wholesalers',
    'Supply chain lead time variability in regional provinces'
  ];
  let recommendations = [
    'Highlight local South African stock availability and fast door-to-door delivery',
    'Offer tiered quantity discounts (e.g. 50, 200, 500+ units) to incentivize larger basket sizes',
    'Provide free sample swatches or trial units for verified business buyers'
  ];

  if (cat.toLowerCase().includes('ppe') || cat.toLowerCase().includes('safety')) {
    viabilityScore = 92;
    demandLevel = 'High';
    strengths.push('Mandatory workplace compliance driving non-negotiable procurement');
    recommendations.push('Promote SABS / CE certification prominently on quotes');
  } else if (cat.toLowerCase().includes('pack')) {
    viabilityScore = 89;
    demandLevel = 'High';
    strengths.push('Booming e-commerce and logistics growth in Gauteng and Western Cape');
    recommendations.push('Offer biodegradable and custom-branded packaging options');
  } else if (cat.toLowerCase().includes('cloth')) {
    viabilityScore = 86;
    demandLevel = 'High';
    strengths.push('Strong corporate gifting and branded workwear demand');
    recommendations.push('Bundle screen printing and embroidery services directly with garment sales');
  }

  return {
    viabilityScore,
    demandLevel,
    pricingAnalysis: `The price range for ${name} sits within the competitive band for SA commercial procurement. Consider adding volume tiers in ZAR.`,
    competitiveStrengths: strengths,
    risksAndChallenges: risks,
    actionableRecommendations: recommendations,
    recommendedMOQ: moq > 0 ? moq : 50,
    marketTrends: 'South African B2B buyers are increasingly prioritizing verified local stock to avoid port delays and currency volatility.',
    sourcingStrategy: 'Maintain a 3-week rolling buffer stock in central distribution hubs (Johannesburg/Cape Town/Durban).',
    targetIndustries: ['Retail & Boutiques', 'Corporate Offices', 'Hospitality & Logistics', 'Construction & Mining']
  };
}

function getFallbackSupplierCompetitiveness(supplierInfo) {
  return {
    competitiveScore: 88,
    strategicPillars: [
      'Rapid Quotation Response (< 2 hours)',
      'Verified South African Business Credibility & B-BBEE Recognition',
      'Flexible SME-Friendly Payment & MOQ Terms',
      'Transparent Logistics & Lead Time Commitments'
    ],
    pricingStrategies: [
      'Implement 3-Tier Volume Pricing (Sample Tier, SME Starter Tier, Bulk Enterprise Tier)',
      'Display clear Ex-Works vs Delivered pricing across major SA metropolitan corridors',
      'Provide early-settlement discounts for prompt EFT payments'
    ],
    operationalTips: [
      'Maintain an up-to-date digital inventory catalog with high-resolution product photography',
      'Set automated WhatsApp / SMS dispatch alerts for order tracking',
      'Establish courier partnerships with localized courier networks (e.g. The Courier Guy, RAM, Dawn Wing)'
    ],
    localAdvantageTips: [
      'Emphasize "Proudly South African" or local assembly advantages against volatile USD import cycles',
      'Offer localized returns and exchange warranties that overseas suppliers cannot match',
      'Provide dedicated account managers for high-volume repeat buyers'
    ],
    marketOpportunities: [
      'Eco-friendly & sustainable packaging alternatives for food and cosmetics',
      'Specialized industrial safety gear for growing clean-energy / solar installations',
      'Custom corporate uniforms and promotional gear for Year-End SME campaigns'
    ]
  };
}

function getFallbackMarketRecommendations(industry) {
  return {
    overview: 'South African B2B procurement in 2026 is experiencing a strong pivot toward localized supply chains, load-shedding resilient operations, and agile SME micro-orders.',
    topViableCategories: [
      'Industrial Safety & PPE (SABS Approved)',
      'Eco-Friendly Food & Retail Packaging',
      'Corporate Apparel & Branded Workwear',
      'Solar & Energy Storage Support Hardware',
      'Commercial Cleaning & Industrial Chemicals'
    ],
    recommendations: [
      {
        title: 'Recyclable Kraft Paper Delivery Bags & Corrugated Boxes',
        category: 'Packaging',
        estimatedDemand: 'Very High',
        estimatedMargin: '35% - 48%',
        recommendedMOQ: '250 - 500 units',
        whyViable: 'Massive surge in quick-commerce and food delivery across major South African metros seeking plastic-free compliance.',
        competitionLevel: 'Moderate'
      },
      {
        title: 'High-Visibility Work Vests & Steel-Toe Safety Boots',
        category: 'PPE',
        estimatedDemand: 'High',
        estimatedMargin: '30% - 42%',
        recommendedMOQ: '50 - 100 units',
        whyViable: 'Continuous demand from construction, mining, and courier fleets with strict legal safety requirements.',
        competitionLevel: 'Moderate-High'
      },
      {
        title: 'Heavyweight Combed Cotton Promotional T-Shirts (180gsm)',
        category: 'Clothing',
        estimatedDemand: 'High',
        estimatedMargin: '40% - 55%',
        recommendedMOQ: '100 units',
        whyViable: 'Essential blank canvas for marketing agencies, brand activations, and corporate uniform supply.',
        competitionLevel: 'High'
      },
      {
        title: 'Commercial Multi-Surface Degreaser & Sanitizer Drums (25L)',
        category: 'Chemicals',
        estimatedDemand: 'Steady High',
        estimatedMargin: '45% - 60%',
        recommendedMOQ: '10 drums',
        whyViable: 'High repeat order rate from restaurants, schools, logistics depots, and healthcare facilities.',
        competitionLevel: 'Low-Moderate'
      }
    ],
    supplierBestPractices: [
      'Offer instant digital quotes with downloadable PDF capability',
      'Keep sample kits readily available for immediate courier dispatch to prospective buyers',
      'Provide clear B-BBEE Level status certificates on supplier profiles',
      'Ensure catalog items specify exact dimensions, weight, and material composition'
    ],
    rawAnalysis: 'Overall B2B marketplace momentum favors suppliers with strong inventory visibility, quick response times, and agile fulfillment across South Africa.'
  };
}

async function analyzeProductViabilityWithGemini(product) {
  const genAI = getGenAI();
  if (!genAI) {
    return getFallbackProductViability(product);
  }

  try {
    const prompt = `You are an expert South African B2B Trade & Market Viability Analyst.
Analyze the following product listing for the South African SME B2B marketplace (SAsuppliers.com):

Product Name: ${product.name}
Category: ${product.category || 'General'}
Price Range: ${product.priceRange || 'Not specified'}
Minimum Order Quantity (MOQ): ${product.moq || '50'}
Description: ${product.description || 'No description provided'}

Evaluate this product specifically in the context of the South African economy, SME procurement habits, ZAR pricing, competition, logistics, and compliance (e.g. SABS, local sourcing).

Respond STRICTLY in JSON format matching this exact schema:
{
  "viabilityScore": <integer from 1 to 100 representing market viability>,
  "demandLevel": "<High | Very High | Moderate | Emerging | Niche>",
  "pricingAnalysis": "<2-3 sentence analysis of price point and margins in ZAR>",
  "competitiveStrengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "risksAndChallenges": ["<risk 1>", "<risk 2>"],
  "actionableRecommendations": ["<recommendation 1>", "<recommendation 2>", "<recommendation 3>"],
  "recommendedMOQ": <integer suggested optimal MOQ for SA SMEs>,
  "marketTrends": "<insight on latest market trajectory in South Africa>",
  "sourcingStrategy": "<sourcing and supply chain advice>",
  "targetIndustries": ["<industry 1>", "<industry 2>", "<industry 3>"]
}`;

    const response = await generateContentResilient(genAI, {
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2
      }
    });

    const parsed = JSON.parse(response.text.trim());
    return {
      viabilityScore: Number(parsed.viabilityScore) || 85,
      demandLevel: parsed.demandLevel || 'High',
      pricingAnalysis: parsed.pricingAnalysis || 'Competitive pricing with viable commercial margins in ZAR.',
      competitiveStrengths: Array.isArray(parsed.competitiveStrengths) ? parsed.competitiveStrengths : ['Strong SME buyer demand'],
      risksAndChallenges: Array.isArray(parsed.risksAndChallenges) ? parsed.risksAndChallenges : ['Import pricing competition'],
      actionableRecommendations: Array.isArray(parsed.actionableRecommendations) ? parsed.actionableRecommendations : ['Offer bulk volume discounts'],
      recommendedMOQ: Number(parsed.recommendedMOQ) || Number(product.moq) || 50,
      marketTrends: parsed.marketTrends || 'Growing preference for verified local South African suppliers.',
      sourcingStrategy: parsed.sourcingStrategy || 'Maintain local buffer stock to ensure rapid delivery.',
      targetIndustries: Array.isArray(parsed.targetIndustries) ? parsed.targetIndustries : ['Retail', 'Corporate', 'Industrial']
    };
  } catch (err) {
    console.warn('Gemini API call failed, using domain fallback:', err.message);
    return getFallbackProductViability(product);
  }
}

async function getSupplierCompetitivenessAdviceWithGemini({ supplierName, location, categoryFocus, currentProductsCount }) {
  const genAI = getGenAI();
  if (!genAI) {
    return getFallbackSupplierCompetitiveness({ supplierName, location, categoryFocus });
  }

  try {
    const prompt = `You are a Senior Strategic B2B Consultant for South African suppliers and SME manufacturers.
Generate a comprehensive competitiveness roadmap for this supplier:

Supplier Name: ${supplierName || 'SA Supplier'}
Location: ${location || 'South Africa'}
Category Focus: ${categoryFocus || 'General B2B Wholesale'}
Active Products Count: ${currentProductsCount || 5}

Provide concrete, highly actionable strategies to stay competitive, win more RFQs/Quotes, improve profit margins, and outperform both domestic competitors and cheap imports in South Africa.

Respond STRICTLY in JSON format with this structure:
{
  "competitiveScore": <integer 1-100 current competitiveness potential>,
  "strategicPillars": ["<pillar 1>", "<pillar 2>", "<pillar 3>", "<pillar 4>"],
  "pricingStrategies": ["<strategy 1>", "<strategy 2>", "<strategy 3>"],
  "operationalTips": ["<operational tip 1>", "<operational tip 2>", "<operational tip 3>"],
  "localAdvantageTips": ["<local advantage 1>", "<local advantage 2>", "<local advantage 3>"],
  "marketOpportunities": ["<opportunity 1>", "<opportunity 2>", "<opportunity 3>"]
}`;

    const response = await generateContentResilient(genAI, {
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3
      }
    });

    const parsed = JSON.parse(response.text.trim());
    return {
      competitiveScore: Number(parsed.competitiveScore) || 88,
      strategicPillars: Array.isArray(parsed.strategicPillars) ? parsed.strategicPillars : [],
      pricingStrategies: Array.isArray(parsed.pricingStrategies) ? parsed.pricingStrategies : [],
      operationalTips: Array.isArray(parsed.operationalTips) ? parsed.operationalTips : [],
      localAdvantageTips: Array.isArray(parsed.localAdvantageTips) ? parsed.localAdvantageTips : [],
      marketOpportunities: Array.isArray(parsed.marketOpportunities) ? parsed.marketOpportunities : []
    };
  } catch (err) {
    console.warn('Gemini API call failed, using fallback:', err.message);
    return getFallbackSupplierCompetitiveness({ supplierName, location, categoryFocus });
  }
}

async function getMarketViabilityRecommendationsWithGemini({ industry }) {
  const genAI = getGenAI();
  if (!genAI) {
    return getFallbackMarketRecommendations(industry);
  }

  try {
    const prompt = `You are a Lead Market Intelligence Analyst for South African B2B Commerce.
Analyze the most viable, high-demand products and lucrative SME supply opportunities in South Africa for the industry: "${industry || 'All B2B Sectors'}".

Focus on real South African market realities (load shedding solutions, local textile & garment manufacturing, sustainable packaging regulations, industrial safety PPE, commercial sanitation, agricultural equipment).

Respond STRICTLY in JSON matching this schema:
{
  "overview": "<2-3 sentence market overview of high-demand sectors in SA>",
  "topViableCategories": ["<Category 1>", "<Category 2>", "<Category 3>", "<Category 4>", "<Category 5>"],
  "recommendations": [
    {
      "title": "<Specific product title>",
      "category": "<Category>",
      "estimatedDemand": "<Very High | High | Moderate>",
      "estimatedMargin": "<e.g. 35% - 50%>",
      "recommendedMOQ": "<e.g. 50 - 100 units>",
      "whyViable": "<Why this product is currently high-growth and viable in SA>",
      "competitionLevel": "<Low | Moderate | High>"
    }
  ],
  "supplierBestPractices": ["<best practice 1>", "<best practice 2>", "<best practice 3>", "<best practice 4>"],
  "rawAnalysis": "<Concluding strategic summary for suppliers>"
}`;

    const response = await generateContentResilient(genAI, {
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3
      }
    });

    const parsed = JSON.parse(response.text.trim());
    return {
      overview: parsed.overview || 'South African B2B market is surging with localized SME procurement opportunities.',
      topViableCategories: Array.isArray(parsed.topViableCategories) ? parsed.topViableCategories : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      supplierBestPractices: Array.isArray(parsed.supplierBestPractices) ? parsed.supplierBestPractices : [],
      rawAnalysis: parsed.rawAnalysis || 'Key success factor is rapid quote turnarounds and verified local inventory.'
    };
  } catch (err) {
    console.warn('Gemini API call failed, using fallback:', err.message);
    return getFallbackMarketRecommendations(industry);
  }
}

async function optimizeProductListingWithGemini({ name, category, targetAudience, currentPrice, currentMoq }) {
  const genAI = getGenAI();
  if (!genAI) {
    return {
      optimizedTitle: `${name} (Commercial Grade / Bulk)`,
      optimizedDescription: `Premium ${name} engineered specifically for South African commercial and industrial applications. Built to strict quality specifications with competitive volume pricing and reliable local dispatch.`,
      suggestedPriceRange: currentPrice || 'R 50 - R 150',
      suggestedMOQ: Number(currentMoq) || 50,
      valuePropositions: [
        'Guaranteed local South African stock for expedited delivery',
        'Bulk wholesale tiered pricing available for high-volume commercial buyers',
        'Quality-tested for rugged industrial and daily commercial use'
      ],
      targetBuyerPersona: targetAudience || 'South African SME Procurement Managers, Retailers, and Facility Contractors'
    };
  }

  try {
    const prompt = `You are a B2B E-commerce Optimization Specialist.
Optimize the following product listing to maximize conversion, quote inquiries, and buyer trust on the South African B2B Marketplace (SAsuppliers.com):

Product Name: ${name}
Category: ${category || 'General'}
Target Audience: ${targetAudience || 'South African SME Buyers & Corporate Procurement'}
Current Price Range: ${currentPrice || 'R 50 - R 150'}
Current MOQ: ${currentMoq || '50'}

Generate an optimized title, a persuasive B2B catalog description, suggested price range in ZAR, recommended MOQ, 3 sharp value propositions, and buyer persona.

Respond STRICTLY in JSON format:
{
  "optimizedTitle": "<High-converting B2B title>",
  "optimizedDescription": "<Engaging, professional B2B description with technical & commercial appeal>",
  "suggestedPriceRange": "<Price range in ZAR>",
  "suggestedMOQ": <integer optimal MOQ>,
  "valuePropositions": ["<Value prop 1>", "<Value prop 2>", "<Value prop 3>"],
  "targetBuyerPersona": "<Target buyer profile in South Africa>"
}`;

    const response = await generateContentResilient(genAI, {
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3
      }
    });

    const parsed = JSON.parse(response.text.trim());
    return {
      optimizedTitle: parsed.optimizedTitle || name,
      optimizedDescription: parsed.optimizedDescription || '',
      suggestedPriceRange: parsed.suggestedPriceRange || currentPrice || 'R 50 - R 150',
      suggestedMOQ: Number(parsed.suggestedMOQ) || Number(currentMoq) || 50,
      valuePropositions: Array.isArray(parsed.valuePropositions) ? parsed.valuePropositions : [],
      targetBuyerPersona: parsed.targetBuyerPersona || 'SA SME Buyers'
    };
  } catch (err) {
    console.warn('Gemini optimization call failed:', err.message);
    return {
      optimizedTitle: `${name} (Commercial Grade)`,
      optimizedDescription: `Premium ${name} engineered for high reliability and commercial performance in South Africa.`,
      suggestedPriceRange: currentPrice || 'R 50 - R 150',
      suggestedMOQ: Number(currentMoq) || 50,
      valuePropositions: ['Local SA stock', 'Commercial grade quality', 'Direct wholesale pricing'],
      targetBuyerPersona: 'SA SME Procurement Managers'
    };
  }
}

module.exports = {
  analyzeProductViabilityWithGemini,
  getSupplierCompetitivenessAdviceWithGemini,
  getMarketViabilityRecommendationsWithGemini,
  optimizeProductListingWithGemini
};
