// backend/models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true },
  originalPrice: { type: Number, default: null },
  category: { type: String, required: true },
  subCategory: { type: String, default: null },
  brandId: { type: String, default: null },
  image: { type: String, default: '' },
  images: { type: [String], default: [] },
  videos: { type: [String], default: [] },
  badge: { type: String, default: null },
  stock: { type: Number, default: 0 },
  sizes: { type: [String], default: [] },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
}, {
  timestamps: false,
  toJSON: {
    transform: (doc, ret) => {
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

module.exports = mongoose.model('Product', productSchema);
