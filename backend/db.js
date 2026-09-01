const bcrypt = require('bcryptjs');

// In-Memory Database Store seeded with initial data
const users = [];
const suppliers = [];
const products = [];
const quotes = [];
const siteMetrics = [
  { id: 'singleton', totalVisits: 4321, totalQuotes: 124, totalMessages: 57 }
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
    email: 'admin@sasuppliers.com',
    password: adminPass,
    name: 'System Admin',
    role: 'admin',
    company: '',
    createdAt: new Date()
  };

  const sup1User = {
    id: 'user_sup1',
    email: 'trade@urbanapparel.co.za',
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
    email: 'buyer@example.com',
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
    email: 'trade@urbanapparel.co.za',
    description: 'Leading supplier of bulk textiles & corporate wear.',
    logo: 'https://picsum.photos/id/82/100/100',
    isPremium: true,
    status: 'active',
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
  }
};

module.exports = { prisma };
