/**
 * WHIP & WHISK BAKE SALE - BACKEND SERVER (Node.js + Express + Mongoose/MongoDB)
 * Fully compatible with MongoDB Compass & MongoDB Atlas for live database management.
 * Deployable on Render with automatic environment variable configuration.
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
try {
  require('dotenv').config();
} catch (e) {
  // dotenv is optional in environments where process.env is set directly
}

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/whip_whisk';
const ADMIN_PIN = process.env.ADMIN_PIN || 'Mega130706';

// Express Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// MongoDB Connection Setup
let isMongoConnected = false;

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000
}).then(() => {
  isMongoConnected = true;
  console.log('✅ Connected to MongoDB Database (Viewable in MongoDB Compass)');
}).catch(err => {
  console.warn('⚠️  MongoDB Connection Warning:', err.message);
  console.warn('ℹ️  Running in Standalone Hybrid Mode (Falling back to in-memory database storage)');
});

// ==========================================================================
// MONGOOSE SCHEMAS & MODELS
// ==========================================================================
const OrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, default: '' },
  address: { type: String, required: true },
  deliveryDate: { type: String, required: true },
  paymentMethod: { type: String, default: 'COD' },
  items: { type: Array, required: true },
  subtotal: { type: Number, required: true },
  deliveryFee: { type: Number, required: true },
  total: { type: Number, required: true },
  status: { type: String, default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
});

const ProductSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  img: { type: String, default: '' },
  desc: { type: String, default: '' },
  category: { type: String, default: 'delight' }
});

const InquirySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const OrderModel = mongoose.model('Order', OrderSchema);
const ProductModel = mongoose.model('Product', ProductSchema);
const InquiryModel = mongoose.model('Inquiry', InquirySchema);

// In-Memory Fallback Storage (Used if MongoDB server is offline during offline testing)
let memoryOrders = [];
let memoryInquiries = [];
let memoryProducts = {
  'cookie-tin': { name: 'Yummy Soft Cookie Tin', price: 14.00, img: 'assets/images/cookie_tin.jpg', desc: 'Chocolate chip, oatmeal raisin & golden butter tin favorites', category: 'box' },
  'bento-cake': { name: 'Mini Celebration Bento Cake', price: 18.00, img: 'assets/images/bento_cake.jpg', desc: 'Mini bento chocolate cakes, rainbow sprinkles & white chips', category: 'arch' },
  'brownie-pops': { name: 'Heart Brownie Popsicles (Set of 3)', price: 12.00, img: 'assets/images/heart_brownie_pops.jpg', desc: 'Ribbon-tied brownie popsicles, sprinkles & chocolate skewers', category: 'circle' },
  'fudge-box': { name: 'Box of 4 Glazed Fudge Brownies', price: 16.00, img: 'assets/images/fudge_brownies_box.jpg', desc: 'Dense chocolate fudge brownies with shiny dark cocoa glaze', category: 'delight' },
  'brownie-skewers': { name: 'Dipped Brownie Bites Skewers (Pack)', price: 10.00, img: 'assets/images/brownie_skewers.jpg', desc: 'Bite-sized fudge brownies on bamboo skewers drizzled with white icing', category: 'delight' }
};

// ==========================================================================
// REST API ENDPOINTS
// ==========================================================================

// Server Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    appName: 'Whip & Whisk Bake Sale API',
    databaseConnected: isMongoConnected,
    timestamp: new Date()
  });
});

// Admin PIN Authentication
app.post('/api/admin/login', (req, res) => {
  const { pin } = req.body;
  if (pin === ADMIN_PIN) {
    return res.json({ success: true, token: 'whip_whisk_admin_auth_verified', message: 'Authentication successful' });
  }
  return res.status(401).json({ success: false, message: 'Invalid Admin PIN' });
});

// GET Catalog / Products
app.get('/api/products', async (req, res) => {
  try {
    if (isMongoConnected) {
      const dbProducts = await ProductModel.find({});
      if (dbProducts && dbProducts.length > 0) {
        const formatted = {};
        dbProducts.forEach(p => { formatted[p.id] = p; });
        return res.json(formatted);
      }
    }
    return res.json(memoryProducts);
  } catch (err) {
    return res.json(memoryProducts);
  }
});

// PUT Update Product Price/Details (Rate Fixing by Admin)
app.put('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const { price, name, desc } = req.body;

  try {
    if (memoryProducts[id]) {
      if (price !== undefined) memoryProducts[id].price = Number(price);
      if (name) memoryProducts[id].name = name;
      if (desc) memoryProducts[id].desc = desc;
    } else {
      memoryProducts[id] = { id, name: name || id, price: Number(price) || 10, desc: desc || '', category: 'delight' };
    }

    if (isMongoConnected) {
      await ProductModel.findOneAndUpdate(
        { id },
        { id, price: Number(price), name: memoryProducts[id].name, desc: memoryProducts[id].desc },
        { upsert: true, new: true }
      );
    }
    return res.json({ success: true, product: memoryProducts[id] });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST Submit New Customer Order
app.post('/api/orders', async (req, res) => {
  try {
    const orderData = req.body;
    if (!orderData.orderId || !orderData.customerName || !orderData.phone) {
      return res.status(400).json({ success: false, message: 'Missing required order fields' });
    }

    orderData.createdAt = new Date();
    orderData.status = orderData.status || 'Pending';

    memoryOrders.unshift(orderData);

    if (isMongoConnected) {
      const newOrder = new OrderModel(orderData);
      await newOrder.save();
    }

    return res.status(201).json({ success: true, order: orderData });
  } catch (err) {
    console.error('Error saving order:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET All Orders (Admin Dashboard)
app.get('/api/orders', async (req, res) => {
  try {
    if (isMongoConnected) {
      const dbOrders = await OrderModel.find({}).sort({ createdAt: -1 });
      return res.json(dbOrders);
    }
    return res.json(memoryOrders);
  } catch (err) {
    return res.json(memoryOrders);
  }
});

// PATCH Update Order Status (Pending -> Preparing -> Dispatched -> Delivered)
app.patch('/api/orders/:orderId/status', async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  try {
    const memOrder = memoryOrders.find(o => o.orderId === orderId);
    if (memOrder) {
      memOrder.status = status;
    }

    if (isMongoConnected) {
      await OrderModel.findOneAndUpdate({ orderId }, { status });
    }

    return res.json({ success: true, orderId, status });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST Customer Contact Inquiry
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    const inquiry = { name, email, message, createdAt: new Date() };
    memoryInquiries.unshift(inquiry);

    if (isMongoConnected) {
      const newInquiry = new InquiryModel(inquiry);
      await newInquiry.save();
    }
    return res.status(201).json({ success: true, message: 'Inquiry received' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET Customer Inquiries (Admin)
app.get('/api/contact', async (req, res) => {
  try {
    if (isMongoConnected) {
      const inquiries = await InquiryModel.find({}).sort({ createdAt: -1 });
      return res.json(inquiries);
    }
    return res.json(memoryInquiries);
  } catch (err) {
    return res.json(memoryInquiries);
  }
});

// Serve Admin Dashboard Page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Catch-all route to serve index.html for SPA behavior
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Whip & Whisk Server running at http://localhost:${PORT}`);
  console.log(`👑 Admin Dashboard available at http://localhost:${PORT}/admin.html`);
});
