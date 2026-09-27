/**
 * WHIP & WHISK BAKE SALE - BACKEND SERVER
 * MongoDB Atlas + Render Deployment Ready
 * Node.js + Express + Mongoose
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Load .env (local dev only; Render uses env vars directly)
try { require('dotenv').config(); } catch (e) {}

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_PIN   = process.env.ADMIN_PIN || 'Mega130706';

if (!MONGODB_URI) {
  console.warn('⚠️  MONGODB_URI is not set. Running with in-memory storage only.');
}

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// ─── MongoDB Atlas Connection ──────────────────────────────────────────────────
let isMongoConnected = false;

async function connectDB () {
  if (!MONGODB_URI) return;
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      retryWrites: true
    });
    isMongoConnected = true;
    console.log('✅  Connected to MongoDB Atlas!');
  } catch (err) {
    console.warn('⚠️  MongoDB Atlas connection failed:', err.message);
    console.warn('ℹ️  Falling back to in-memory storage.');
  }
}

connectDB();

// Reconnect on disconnect
mongoose.connection.on('disconnected', () => {
  isMongoConnected = false;
  console.warn('🔌  MongoDB disconnected. Retrying in 5s…');
  setTimeout(connectDB, 5000);
});
mongoose.connection.on('connected', () => {
  isMongoConnected = true;
});

// ─── Mongoose Schemas ──────────────────────────────────────────────────────────
const OrderSchema = new mongoose.Schema({
  orderId:      { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  phone:        { type: String, required: true },
  email:        { type: String, default: '' },
  address:      { type: String, required: true },
  deliveryDate: { type: String, required: true },
  paymentMethod:{ type: String, default: 'COD' },
  items:        { type: Array,  required: true },
  subtotal:     { type: Number, required: true },
  deliveryFee:  { type: Number, required: true },
  total:        { type: Number, required: true },
  status:       { type: String, default: 'Pending' },
  cause:        { type: String, default: '' },
  notes:        { type: String, default: '' },
  createdAt:    { type: Date,   default: Date.now }
});

const ProductSchema = new mongoose.Schema({
  id:       { type: String, required: true, unique: true },
  name:     { type: String, required: true },
  price:    { type: Number, required: true },
  img:      { type: String, default: '' },
  desc:     { type: String, default: '' },
  category: { type: String, default: 'delight' }
});

const InquirySchema = new mongoose.Schema({
  name:      { type: String, required: true },
  email:     { type: String, required: true },
  message:   { type: String, required: true },
  createdAt: { type: Date,   default: Date.now }
});

const OrderModel   = mongoose.model('Order',   OrderSchema);
const ProductModel = mongoose.model('Product', ProductSchema);
const InquiryModel = mongoose.model('Inquiry', InquirySchema);

// ─── In-Memory Fallback ────────────────────────────────────────────────────────
let memoryOrders   = [];
let memoryInquiries = [];
const memoryProducts = {
  'cookie-tin':      { name: 'Yummy Soft Cookie Tin',            price: 14, img: 'assets/images/cookie_tin.jpg',       desc: 'Chocolate chip, oatmeal raisin & golden butter tin favorites',      category: 'box'    },
  'bento-cake':      { name: 'Mini Celebration Bento Cake',       price: 18, img: 'assets/images/bento_cake.jpg',       desc: 'Mini bento chocolate cakes, rainbow sprinkles & white chips',        category: 'arch'   },
  'brownie-pops':    { name: 'Heart Brownie Popsicles (Set of 3)',price: 12, img: 'assets/images/heart_brownie_pops.jpg',desc: 'Ribbon-tied brownie popsicles, sprinkles & chocolate skewers',       category: 'circle' },
  'fudge-box':       { name: 'Box of 4 Glazed Fudge Brownies',   price: 16, img: 'assets/images/fudge_brownies_box.jpg',desc: 'Dense chocolate fudge brownies with shiny dark cocoa glaze',         category: 'delight'},
  'brownie-skewers': { name: 'Dipped Brownie Bites Skewers (Pack)',price:10, img: 'assets/images/brownie_skewers.jpg',  desc: 'Bite-sized fudge brownies on bamboo skewers drizzled with white icing',category:'delight'}
};

// ─── REST API ──────────────────────────────────────────────────────────────────

// Health check (Render uses this to verify app is running)
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'Whip & Whisk Bake Sale',
    mongoAtlas: isMongoConnected,
    timestamp: new Date().toISOString()
  });
});

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { pin } = req.body;
  if (pin === ADMIN_PIN) {
    return res.json({ success: true, message: 'Authenticated' });
  }
  return res.status(401).json({ success: false, message: 'Incorrect password' });
});

// GET products
app.get('/api/products', async (_req, res) => {
  try {
    if (isMongoConnected) {
      const rows = await ProductModel.find({}).lean();
      if (rows.length > 0) {
        const out = {};
        rows.forEach(p => { out[p.id] = p; });
        return res.json(out);
      }
    }
  } catch (e) { console.error('GET /api/products error', e.message); }
  return res.json(memoryProducts);
});

// PUT update product rate
app.put('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const { price, name, desc } = req.body;
  try {
    // Update memory fallback
    if (memoryProducts[id]) {
      if (price !== undefined) memoryProducts[id].price = Number(price);
      if (name) memoryProducts[id].name = name;
      if (desc) memoryProducts[id].desc = desc;
    } else {
      memoryProducts[id] = { id, name: name || id, price: Number(price) || 10, desc: desc || '', category: 'delight' };
    }
    // Update Atlas
    if (isMongoConnected) {
      await ProductModel.findOneAndUpdate(
        { id },
        { id, price: Number(price), name: memoryProducts[id].name, desc: memoryProducts[id].desc },
        { upsert: true, new: true }
      );
    }
    return res.json({ success: true, product: memoryProducts[id] });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// POST new order
app.post('/api/orders', async (req, res) => {
  try {
    const data = req.body;
    if (!data.orderId || !data.customerName || !data.phone) {
      return res.status(400).json({ success: false, message: 'Missing required order fields (orderId, customerName, phone)' });
    }
    data.createdAt = new Date();
    data.status    = data.status || 'Pending';

    // Always store in memory (for same-session admin view)
    memoryOrders.unshift(data);

    // Persist to Atlas
    if (isMongoConnected) {
      try {
        await new OrderModel(data).save();
      } catch (dbErr) {
        if (dbErr.code === 11000) {
          // Duplicate orderId — ignore silently (order already saved)
        } else {
          throw dbErr;
        }
      }
    }
    return res.status(201).json({ success: true, order: data });
  } catch (e) {
    console.error('POST /api/orders error:', e.message);
    return res.status(500).json({ success: false, error: e.message });
  }
});

// GET all orders (admin)
app.get('/api/orders', async (_req, res) => {
  try {
    if (isMongoConnected) {
      const orders = await OrderModel.find({}).sort({ createdAt: -1 }).lean();
      return res.json(orders);
    }
  } catch (e) { console.error('GET /api/orders error', e.message); }
  return res.json(memoryOrders);
});

// PATCH order status
app.patch('/api/orders/:orderId/status', async (req, res) => {
  const { orderId } = req.params;
  const { status }  = req.body;
  try {
    const mem = memoryOrders.find(o => o.orderId === orderId);
    if (mem) mem.status = status;
    if (isMongoConnected) {
      await OrderModel.findOneAndUpdate({ orderId }, { status });
    }
    return res.json({ success: true, orderId, status });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// POST contact inquiry
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'name, email and message are required.' });
    }
    const inquiry = { name, email, message, createdAt: new Date() };
    memoryInquiries.unshift(inquiry);
    if (isMongoConnected) {
      await new InquiryModel(inquiry).save();
    }
    return res.status(201).json({ success: true, message: 'Inquiry received' });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// GET inquiries (admin)
app.get('/api/contact', async (_req, res) => {
  try {
    if (isMongoConnected) {
      const rows = await InquiryModel.find({}).sort({ createdAt: -1 }).lean();
      return res.json(rows);
    }
  } catch (e) { console.error('GET /api/contact error', e.message); }
  return res.json(memoryInquiries);
});

// Admin page shortcut
app.get('/admin', (_req, res) => res.sendFile(path.join(__dirname, 'admin.html')));

// Catch-all → index.html (SPA)
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// ─── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀  Whip & Whisk running at http://0.0.0.0:${PORT}`);
  console.log(`👑  Admin Panel  → http://localhost:${PORT}/admin.html`);
  console.log(`📡  Health Check → http://localhost:${PORT}/api/health`);
});
