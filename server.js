/**
 * WHIP & WHISK BAKE SALE - BACKEND SERVER
 * Supabase + MongoDB Atlas + Vercel Serverless + Render Deployment Ready
 * Node.js + Express + Supabase JS + Mongoose
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

// Optional database drivers
let mongoose = null;
try { mongoose = require('mongoose'); } catch (e) {}

let createClient = null;
try { createClient = require('@supabase/supabase-js').createClient; } catch (e) {}

// Load .env in local dev
try { require('dotenv').config(); } catch (e) {}

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PIN = process.env.ADMIN_PIN || 'Mega130706';

// Supabase Environment Credentials
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

// MongoDB Atlas URI (optional alternative)
const MONGODB_URI = process.env.MONGODB_URI;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// ─── In-Memory Storage & Fallback ──────────────────────────────────────────────
let memoryOrders = [];
let memoryInquiries = [];
const memoryProducts = {
  'cookie-tin':      { id: 'cookie-tin',      name: 'Yummy Soft Cookie Tin',             price: 14, img: 'assets/images/cookie_tin.jpg',        desc: 'Chocolate chip, oatmeal raisin & golden butter tin favorites',       category: 'box'    },
  'bento-cake':      { id: 'bento-cake',      name: 'Mini Celebration Bento Cake',        price: 18, img: 'assets/images/bento_cake.jpg',        desc: 'Mini bento chocolate cakes, rainbow sprinkles & white chips',         category: 'arch'   },
  'brownie-pops':    { id: 'brownie-pops',    name: 'Heart Brownie Popsicles (Set of 3)', price: 12, img: 'assets/images/heart_brownie_pops.jpg', desc: 'Ribbon-tied brownie popsicles, sprinkles & chocolate skewers',        category: 'circle' },
  'fudge-box':       { id: 'fudge-box',       name: 'Box of 4 Glazed Fudge Brownies',    price: 16, img: 'assets/images/fudge_brownies_box.jpg', desc: 'Dense chocolate fudge brownies with shiny dark cocoa glaze',          category: 'delight'},
  'brownie-skewers': { id: 'brownie-skewers', name: 'Dipped Brownie Bites Skewers (Pack)',price: 10, img: 'assets/images/brownie_skewers.jpg',   desc: 'Bite-sized fudge brownies on bamboo skewers drizzled with white icing',category: 'delight'}
};

// ─── 1. Supabase Initialization ────────────────────────────────────────────────
let supabase = null;
let isSupabaseConnected = false;

if (SUPABASE_URL && SUPABASE_KEY && createClient) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false }
    });
    isSupabaseConnected = true;
    console.log('✅  Supabase Database client initialized successfully!');
  } catch (err) {
    console.warn('⚠️  Supabase initialization error:', err.message);
  }
} else {
  console.log('ℹ️  Supabase credentials not detected. (Set SUPABASE_URL & SUPABASE_KEY in .env or Vercel Environment Variables).');
}

// ─── 2. MongoDB Atlas Connection (Fallback / Dual-Support) ──────────────────────
let isMongoConnected = false;
let OrderModel, ProductModel, InquiryModel;

if (MONGODB_URI && mongoose) {
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

  OrderModel   = mongoose.models.Order   || mongoose.model('Order',   OrderSchema);
  ProductModel = mongoose.models.Product || mongoose.model('Product', ProductSchema);
  InquiryModel = mongoose.models.Inquiry || mongoose.model('Inquiry', InquirySchema);

  async function connectMongo() {
    try {
      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 5000
      });
      isMongoConnected = true;
      console.log('✅  Connected to MongoDB Atlas!');
    } catch (err) {
      console.warn('⚠️  MongoDB connection skipped / failed:', err.message);
    }
  }
  connectMongo();
}

// ─── REST API ENDPOINTS ────────────────────────────────────────────────────────

// Health check (Vercel & Render verify status)
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'Whip & Whisk Bake Sale',
    supabase: isSupabaseConnected,
    mongoAtlas: isMongoConnected,
    activeDatabase: isSupabaseConnected ? 'Supabase' : (isMongoConnected ? 'MongoDB Atlas' : 'In-Memory Cache'),
    timestamp: new Date().toISOString()
  });
});

// Admin Authentication
app.post('/api/admin/login', (req, res) => {
  const { pin } = req.body;
  if (pin === ADMIN_PIN) {
    return res.json({ success: true, message: 'Authenticated' });
  }
  return res.status(401).json({ success: false, message: 'Incorrect password' });
});

// GET /api/products
app.get('/api/products', async (_req, res) => {
  try {
    // 1. Try Supabase
    if (supabase) {
      const { data, error } = await supabase.from('products').select('*');
      if (!error && data && data.length > 0) {
        const out = {};
        data.forEach(p => { out[p.id] = p; });
        return res.json(out);
      }
    }

    // 2. Try Mongo
    if (isMongoConnected && ProductModel) {
      const rows = await ProductModel.find({}).lean();
      if (rows && rows.length > 0) {
        const out = {};
        rows.forEach(p => { out[p.id] = p; });
        return res.json(out);
      }
    }
  } catch (e) {
    console.error('GET /api/products error:', e.message);
  }

  // 3. In-Memory fallback
  return res.json(memoryProducts);
});

// PUT /api/products/:id
app.put('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const { price, name, desc, category, img } = req.body;

  try {
    // Update memory
    if (memoryProducts[id]) {
      if (price !== undefined) memoryProducts[id].price = Number(price);
      if (name) memoryProducts[id].name = name;
      if (desc) memoryProducts[id].desc = desc;
      if (category) memoryProducts[id].category = category;
      if (img) memoryProducts[id].img = img;
    } else {
      memoryProducts[id] = {
        id,
        name: name || id,
        price: Number(price) || 10,
        desc: desc || '',
        category: category || 'delight',
        img: img || 'assets/images/bento_cake.jpg'
      };
    }

    // Persist to Supabase
    if (supabase) {
      await supabase.from('products').upsert({
        id,
        name: memoryProducts[id].name,
        price: Number(memoryProducts[id].price),
        desc: memoryProducts[id].desc,
        category: memoryProducts[id].category,
        img: memoryProducts[id].img
      });
    }

    // Persist to Mongo
    if (isMongoConnected && ProductModel) {
      await ProductModel.findOneAndUpdate(
        { id },
        {
          id,
          price: Number(memoryProducts[id].price),
          name: memoryProducts[id].name,
          desc: memoryProducts[id].desc,
          category: memoryProducts[id].category,
          img: memoryProducts[id].img
        },
        { upsert: true, new: true }
      );
    }

    return res.json({ success: true, product: memoryProducts[id] });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// DELETE /api/products/:id
app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    delete memoryProducts[id];

    if (supabase) {
      await supabase.from('products').delete().eq('id', id);
    }

    if (isMongoConnected && ProductModel) {
      await ProductModel.deleteOne({ id });
    }

    return res.json({ success: true, id });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// POST /api/orders
app.post('/api/orders', async (req, res) => {
  try {
    const data = req.body;
    if (!data.orderId || !data.customerName || !data.phone) {
      return res.status(400).json({ success: false, message: 'Missing required order fields (orderId, customerName, phone)' });
    }

    data.createdAt = data.createdAt || new Date().toISOString();
    data.status = data.status || 'Pending';

    // Store in-memory
    memoryOrders.unshift(data);

    // Persist to Supabase
    if (supabase) {
      const supabaseRow = {
        order_id: data.orderId,
        customer_name: data.customerName,
        phone: data.phone,
        email: data.email || '',
        address: data.address || '',
        delivery_date: data.deliveryDate || '',
        payment_method: data.paymentMethod || 'COD',
        items: data.items || [],
        subtotal: Number(data.subtotal) || 0,
        delivery_fee: Number(data.deliveryFee) || 0,
        total: Number(data.total) || 0,
        status: data.status || 'Pending',
        cause: data.cause || '',
        notes: data.notes || '',
        created_at: data.createdAt
      };

      const { error } = await supabase.from('orders').insert([supabaseRow]);
      if (error) {
        console.warn('Supabase order insert note:', error.message);
      }
    }

    // Persist to MongoDB
    if (isMongoConnected && OrderModel) {
      try {
        await new OrderModel(data).save();
      } catch (dbErr) {
        if (dbErr.code !== 11000) throw dbErr;
      }
    }

    return res.status(201).json({ success: true, order: data });
  } catch (e) {
    console.error('POST /api/orders error:', e.message);
    return res.status(500).json({ success: false, error: e.message });
  }
});

// GET /api/orders
app.get('/api/orders', async (_req, res) => {
  try {
    // 1. Supabase
    if (supabase) {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const normalized = data.map(r => ({
          orderId: r.order_id || r.orderId,
          customerName: r.customer_name || r.customerName,
          phone: r.phone,
          email: r.email,
          address: r.address,
          deliveryDate: r.delivery_date || r.deliveryDate,
          paymentMethod: r.payment_method || r.paymentMethod,
          items: r.items,
          subtotal: Number(r.subtotal) || 0,
          deliveryFee: Number(r.delivery_fee) || 0,
          total: Number(r.total) || 0,
          status: r.status || 'Pending',
          cause: r.cause || '',
          notes: r.notes || '',
          createdAt: r.created_at || r.createdAt
        }));
        return res.json(normalized);
      }
    }

    // 2. MongoDB
    if (isMongoConnected && OrderModel) {
      const orders = await OrderModel.find({}).sort({ createdAt: -1 }).lean();
      if (orders && orders.length > 0) return res.json(orders);
    }
  } catch (e) {
    console.error('GET /api/orders error:', e.message);
  }

  // 3. Fallback
  return res.json(memoryOrders);
});

// PATCH /api/orders/:orderId/status
app.patch('/api/orders/:orderId/status', async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  try {
    const mem = memoryOrders.find(o => o.orderId === orderId);
    if (mem) mem.status = status;

    if (supabase) {
      await supabase
        .from('orders')
        .update({ status })
        .eq('order_id', orderId);
    }

    if (isMongoConnected && OrderModel) {
      await OrderModel.findOneAndUpdate({ orderId }, { status });
    }

    return res.json({ success: true, orderId, status });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// POST /api/contact
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'name, email and message are required.' });
    }

    const inquiry = {
      name,
      email,
      message,
      created_at: new Date().toISOString()
    };
    memoryInquiries.unshift(inquiry);

    if (supabase) {
      await supabase.from('inquiries').insert([inquiry]);
    }

    if (isMongoConnected && InquiryModel) {
      await new InquiryModel(inquiry).save();
    }

    return res.status(201).json({ success: true, message: 'Inquiry received' });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// GET /api/contact
app.get('/api/contact', async (_req, res) => {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('inquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) return res.json(data);
    }

    if (isMongoConnected && InquiryModel) {
      const rows = await InquiryModel.find({}).sort({ createdAt: -1 }).lean();
      return res.json(rows);
    }
  } catch (e) {
    console.error('GET /api/contact error:', e.message);
  }

  return res.json(memoryInquiries);
});

// Admin shortcut route
app.get('/admin', (_req, res) => res.sendFile(path.join(__dirname, 'admin.html')));

// Catch-all route to index.html (SPA)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Export app for Vercel Serverless Function & testing
module.exports = app;

// Run standalone server if executed directly
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀  Whip & Whisk running at http://0.0.0.0:${PORT}`);
    console.log(`👑  Admin Panel  → http://localhost:${PORT}/admin.html`);
    console.log(`📡  Health Check → http://localhost:${PORT}/api/health`);
  });
}
