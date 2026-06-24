const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  await prisma.siteMetric.upsert({ where: { id: 'singleton' }, update: {}, create: { id: 'singleton', totalVisits: 4321, totalQuotes: 124, totalMessages: 57 } });

  const adminPass = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@sasuppliers.com' },
    update: {},
    create: { email: 'admin@sasuppliers.com', password: adminPass, name: 'System Admin', role: 'admin' }
  });

  const sup1Pass = await bcrypt.hash('supplier123', 10);
  const sup1User = await prisma.user.upsert({
    where: { email: 'trade@urbanapparel.co.za' },
    update: {},
    create: { email: 'trade@urbanapparel.co.za', password: sup1Pass, name: 'Urban Manager', role: 'supplier', company: 'Urban Apparel SA' }
  });

  const sup2Pass = await bcrypt.hash('supplier123', 10);
  const sup2User = await prisma.user.upsert({
    where: { email: 'hello@packright.co.za' },
    update: {},
    create: { email: 'hello@packright.co.za', password: sup2Pass, name: 'PackRight Manager', role: 'supplier', company: 'PackRight Solutions' }
  });

  const sup3Pass = await bcrypt.hash('supplier123', 10);
  const sup3User = await prisma.user.upsert({
    where: { email: 'orders@safetyfirst.co.za' },
    update: {},
    create: { email: 'orders@safetyfirst.co.za', password: sup3Pass, name: 'Safety Manager', role: 'supplier', company: 'Safety First Supplies' }
  });

  const sup4Pass = await bcrypt.hash('supplier123', 10);
  const sup4User = await prisma.user.upsert({
    where: { email: 'info@bulkstorage.co.za' },
    update: {},
    create: { email: 'info@bulkstorage.co.za', password: sup4Pass, name: 'Bulk Manager', role: 'supplier', company: 'Bulk Storage Africa' }
  });

  const sup5Pass = await bcrypt.hash('supplier123', 10);
  const sup5User = await prisma.user.upsert({
    where: { email: 'trade@homestyle.co.za' },
    update: {},
    create: { email: 'trade@homestyle.co.za', password: sup5Pass, name: 'HomeStyle Manager', role: 'supplier', company: 'HomeStyle Furniture' }
  });

  const buyerPass = await bcrypt.hash('buyer123', 10);
  await prisma.user.upsert({
    where: { email: 'buyer@example.com' },
    update: {},
    create: { email: 'buyer@example.com', password: buyerPass, name: 'John Buyer', role: 'buyer', company: 'Retail Holdings' }
  });

  const suppliers = [
    { userId: sup1User.id, companyName: 'Urban Apparel SA', location: 'Johannesburg, Gauteng', phone: '+27 11 222 3344', email: 'trade@urbanapparel.co.za', description: 'Leading supplier of bulk textiles & corporate wear.', logo: 'https://picsum.photos/id/82/100/100', isPremium: true, status: 'active' },
    { userId: sup2User.id, companyName: 'PackRight Solutions', location: 'Cape Town, Western Cape', phone: '+27 21 555 6677', email: 'hello@packright.co.za', description: 'Eco-friendly industrial packaging and storage.', logo: 'https://picsum.photos/id/12/100/100', isPremium: false, status: 'active' },
    { userId: sup3User.id, companyName: 'Safety First Supplies', location: 'Durban, KZN', phone: '+27 31 765 4321', email: 'orders@safetyfirst.co.za', description: 'Premium PPE: helmets, vests, gloves.', logo: 'https://picsum.photos/id/20/100/100', isPremium: true, status: 'active' },
    { userId: sup4User.id, companyName: 'Bulk Storage Africa', location: 'Pretoria, Gauteng', phone: '+27 12 345 6789', email: 'info@bulkstorage.co.za', description: 'Heavy-duty shelving and industrial bins.', logo: 'https://picsum.photos/id/42/100/100', isPremium: false, status: 'pending' },
    { userId: sup5User.id, companyName: 'HomeStyle Furniture', location: 'Johannesburg, Gauteng', phone: '+27 10 987 6543', email: 'trade@homestyle.co.za', description: 'Modern office desks, dining chairs, storage.', logo: 'https://picsum.photos/id/55/100/100', isPremium: true, status: 'active' },
  ];

  const createdSuppliers = [];
  for (const s of suppliers) {
    const existing = await prisma.supplier.findUnique({ where: { userId: s.userId } });
    if (!existing) {
      createdSuppliers.push(await prisma.supplier.create({ data: s }));
    } else {
      createdSuppliers.push(existing);
    }
  }

  const [s1, s2, s3, s4, s5] = createdSuppliers;

  const products = [
    { supplierId: s1.id, name: 'Premium Cotton T-Shirts (Bulk)', category: 'Clothing', description: '100% combed cotton, ideal for branding. Available in all sizes.', priceRange: 'R 45 - R 85', moq: 100, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400' },
    { supplierId: s1.id, name: 'Custom Printed Workwear', category: 'Clothing', description: 'Logo printing available, durable fabric for industrial use.', priceRange: 'R 60 - R 120', moq: 50, image: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=400' },
    { supplierId: s3.id, name: 'Industrial Safety Helmets', category: 'PPE', description: 'Adjustable, shock-resistant, CE certified. SABS approved.', priceRange: 'R 70 - R 120', moq: 100, image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400' },
    { supplierId: s2.id, name: 'Heavy-Duty Plastic Crates', category: 'Packaging', description: 'Stackable industrial crates, ideal for warehousing and logistics.', priceRange: 'R 120 - R 250', moq: 50, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400' },
    { supplierId: s2.id, name: 'Eco Kraft Paper Bags (Bulk)', category: 'Packaging', description: 'Biodegradable, print-ready, 100% recyclable kraft bags.', priceRange: 'R 2 - R 8', moq: 500, image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400' },
    { supplierId: s5.id, name: 'Modern Office Desk (Bulk)', category: 'Furniture', description: 'Minimalist L-shaped office desks, flat-pack for easy assembly.', priceRange: 'R 1200 - R 2400', moq: 10, image: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400' },
  ];

  for (const p of products) {
    const exists = await prisma.product.findFirst({ where: { name: p.name, supplierId: p.supplierId } });
    if (!exists) await prisma.product.create({ data: p });
  }

  console.log('✅ Seed complete');
}

main().catch(console.error).finally(() => prisma.$disconnect());
