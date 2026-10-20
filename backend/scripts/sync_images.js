const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const rootDir = path.join(__dirname, '..', '..');
const dbPath = path.join(rootDir, 'backend', 'data', 'database.json');
const raw = fs.readFileSync(dbPath, 'utf-8');
const data = JSON.parse(raw);

const brandImageMap = {
  'brand_001': '/assets/brands/luna-threads.svg',
  'brand_002': '/assets/brands/glow-co.svg',
  'brand_003': '/assets/brands/petal-studio.svg',
  'brand_004': '/assets/brands/bloom-beauty.svg',
};

const productImageMap = {
  'prod_001': '/assets/uploads/file-1788511780522-132494189.png',
  'prod_002': '/assets/products/denim-jacket.svg',
  'prod_003': '/assets/products/embroidered-kurti.svg',
  'prod_004': '/assets/products/hydra-glow-serum.svg',
  'prod_005': '/assets/products/matte-lipstick-set.svg',
  'prod_006': '/assets/products/rose-clay-mask.svg',
  'prod_007': '/assets/products/satin-slip-skirt.svg',
  'prod_008': '/assets/products/kajal-duo.svg',
  'prod_009': '/assets/products/crossbody-purse.svg',
  'prod_010': '/assets/products/stiletto-heels.svg',
  'prod_011': '/assets/products/uv-sunglasses.svg',
  'prod_012': '/assets/products/velvet-clutch.svg',
  'prod_013': '/assets/products/block-heel-sandals.svg',
  'prod_014': '/assets/products/choker-necklace.svg',
  'prod_015': '/assets/products/drop-earrings.svg',
  'prod_016': '/assets/products/charm-bracelet.svg',
  'prod_017': '/assets/products/gold-ring-set.svg',
};

// 1. Update database.json
for (const b of data.brands) {
  if (brandImageMap[b.id]) {
    b.logo = brandImageMap[b.id];
  }
}

for (const p of data.products) {
  if (productImageMap[p.id]) {
    p.image = productImageMap[p.id];
    p.images = [productImageMap[p.id]];
  }
}

fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
console.log('✓ Updated backend/data/database.json with valid product & brand images!');

// 2. Update MongoDB
async function updateMongo() {
  try {
    const connectDB = require(path.join(rootDir, 'backend', 'db'));
    const Product = require(path.join(rootDir, 'backend', 'models', 'Product'));
    const Brand = require(path.join(rootDir, 'backend', 'models', 'Brand'));

    await connectDB();
    console.log('Connected to MongoDB for image sync...');

    for (const [id, logo] of Object.entries(brandImageMap)) {
      await Brand.updateOne({ id }, { $set: { logo } });
    }
    console.log('✓ Updated MongoDB brands with logos');

    for (const [id, image] of Object.entries(productImageMap)) {
      await Product.updateOne({ id }, { $set: { image, images: [image] } });
    }
    console.log('✓ Updated MongoDB products with images');

    await mongoose.disconnect();
    console.log('✓ MongoDB sync complete!');
    process.exit(0);
  } catch (err) {
    console.error('Mongo sync error:', err.message);
    process.exit(1);
  }
}

updateMongo();
