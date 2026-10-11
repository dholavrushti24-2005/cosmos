// backend/scripts/migrate_sizes.js
// Seeds initial realistic sizes for existing Clothes, Footwear, and Rings

const mongoose = require('mongoose');
const { MONGODB_URI } = require('../config');
const Product = require('../models/Product');

async function migrateSizes() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const products = await Product.find({});
    let updatedCount = 0;

    for (const p of products) {
      let newSizes = [];
      const cat = (p.category || '').toLowerCase();
      const subCat = (p.subCategory || '').toLowerCase();
      const name = (p.name || '').toLowerCase();

      if (cat === 'clothes') {
        newSizes = ['XS', 'S', 'M', 'L', 'XL'];
      } else if (cat === 'fashion' && (subCat === 'heels' || subCat === 'sandals' || subCat === 'shoes' || name.includes('heel') || name.includes('sandal') || name.includes('shoe'))) {
        newSizes = ['UK 5', 'UK 6', 'UK 7', 'UK 8', 'UK 9'];
      } else if (cat === 'jewellery' && (subCat === 'rings' || (name.includes('ring') && !name.includes('earring')))) {
        newSizes = ['Size 6', 'Size 7', 'Size 8'];
      } else {
        newSizes = [];
      }

      p.sizes = newSizes;
      await p.save();
      if (newSizes.length > 0) {
        updatedCount++;
        console.log(`Updated ${p.name} (${p.id}) with sizes: ${newSizes.join(', ')}`);
      }
    }

    console.log(`\nSuccessfully updated ${updatedCount} products with size variants!`);
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

migrateSizes();
