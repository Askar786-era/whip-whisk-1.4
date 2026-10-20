/**
 * WHIP & WHISK BAKE SALE - CORE CLIENT CONTROLLER & STOREFRONT
 * Provides:
 * - Dynamic product catalog in Indian Rupees (₹)
 * - Split Authentication: Div 1 (Old Login / Sign In) & Div 2 (New Login / Register)
 * - Customer Order Tracking & Profile Modal
 * - Interactive Cart & Checkout calculations in ₹
 * - Direct dedicated link to Bakery Admin Portal (admin.html)
 * - Capacitor Android APK & Render Deployment compatibility
 */

// Default Catalog Data (Prices in INR ₹)
const DEFAULT_PRODUCTS = {
  'cookie-tin': {
    name: 'Yummy Soft Cookie Tin',
    price: 14.00,
    img: 'assets/images/cookie_tin.jpg',
    desc: 'Chocolate chip, oatmeal raisin & golden butter tin favorites',
    category: 'box'
  },
  'bento-cake': {
    name: 'Mini Celebration Bento Cake',
    price: 18.00,
    img: 'assets/images/bento_cake.jpg',
    desc: 'Mini bento chocolate cakes, rainbow sprinkles & white chips',
    category: 'arch'
  },
  'brownie-pops': {
    name: 'Heart Brownie Popsicles (Set of 3)',
    price: 12.00,
    img: 'assets/images/heart_brownie_pops.jpg',
    desc: 'Ribbon-tied brownie popsicles, sprinkles & chocolate skewers',
    category: 'circle'
  },
  'fudge-box': {
    name: 'Box of 4 Glazed Fudge Brownies',
    price: 16.00,
    img: 'assets/images/fudge_brownies_box.jpg',
    desc: 'Dense chocolate fudge brownies with shiny dark cocoa glaze',
    category: 'delight'
  },
  'brownie-skewers': {
    name: 'Dipped Brownie Bites Skewers (Pack)',
    price: 10.00,
    img: 'assets/images/brownie_skewers.jpg',
    desc: 'Bite-sized fudge brownies on bamboo skewers drizzled with white icing',
    category: 'delight'
  }
};

// Active Products Catalog (Loaded from localStorage or defaults)
let PRODUCTS = loadProductsFromStorage();

// Cart State (itemId -> quantity)
const cartState = {};

// Customer Orders Database (Loaded from localStorage)
let ORDERS = loadOrdersFromStorage();

// User Session State
let currentUser = loadSessionFromStorage();

// Registered Users Database (for Old Login vs New Login verification)
let REGISTERED_USERS = loadRegisteredUsersFromStorage();

// DOM Elements
const orderModalBackdrop = document.getElementById('orderModalBackdrop');
const authModalBackdrop = document.getElementById('authModalBackdrop');
const customerModalBackdrop = document.getElementById('customerModalBackdrop');
const cartBadge = document.getElementById('cartBadge');
const orderSubtotalEl = document.getElementById('orderSubtotal');
const orderDeliveryFeeEl = document.getElementById('orderDeliveryFee');
const orderGrandTotalEl = document.getElementById('orderGrandTotal');
const cartTriggerBtn = document.getElementById('cartTriggerBtn');
const accountTriggerBtn = document.getElementById('accountTriggerBtn');
const accountBtnLabel = document.getElementById('accountBtnLabel');
const navAdminLink = document.getElementById('navAdminLink');
const closeOrderModalBtn = document.getElementById('closeOrderModalBtn');
const heroShopOnlineBtn = document.getElementById('heroShopOnlineBtn');
const openOrderFormBtn = document.getElementById('openOrderFormBtn');
const mobileToggleBtn = document.getElementById('mobileToggleBtn');
const navMenu = document.getElementById('navMenu');
const lightboxModal = document.getElementById('lightboxModal');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxCaption = document.getElementById('lightboxCaption');
const deliveryDateInput = document.getElementById('orderDeliveryDate');
const orderItemsList = document.getElementById('orderItemsList');

// ==========================================================================
// INITIALIZATION
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initCartState();
  renderStorefrontProducts();
  setupStickyHeader();
  setupDateDefault();
  setupEventListeners();
  setupLightboxTriggers();
  updateHeaderAuthUI();
  setupStorageSync();
});

// Load products from localStorage or defaults
function loadProductsFromStorage() {
  try {
    const saved = localStorage.getItem('whip_whisk_products') || localStorage.getItem('whip_whisk_catalog_rates');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Error loading products from storage:', e);
  }
  return JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
}

function saveProductsToStorage() {
  try {
    localStorage.setItem('whip_whisk_products', JSON.stringify(PRODUCTS));
    localStorage.setItem('whip_whisk_catalog_rates', JSON.stringify(PRODUCTS));
  } catch (e) {
    console.warn('Error saving products to storage:', e);
  }
}

// Load orders from localStorage
function loadOrdersFromStorage() {
  try {
    const saved = localStorage.getItem('whip_whisk_orders');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Error loading orders from storage:', e);
  }
  return [];
}

function saveOrdersToStorage() {
  try {
    localStorage.setItem('whip_whisk_orders', JSON.stringify(ORDERS));
  } catch (e) {
    console.warn('Error saving orders to storage:', e);
  }
}

// User Session Management
function loadSessionFromStorage() {
  try {
    const saved = localStorage.getItem('whip_whisk_session');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Error loading session:', e);
  }
  return null;
}

function saveSessionToStorage(user) {
  currentUser = user;
  if (user) {
    localStorage.setItem('whip_whisk_session', JSON.stringify(user));
  } else {
    localStorage.removeItem('whip_whisk_session');
  }
  updateHeaderAuthUI();
}

// Registered Users Database (for Old Login verification)
function loadRegisteredUsersFromStorage() {
  try {
    const saved = localStorage.getItem('whip_whisk_registered_users');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Error loading registered users:', e);
  }
  // Default demo user pre-configured
  return [
    {
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '(555) 234-5678',
      password: 'password123',
      createdAt: new Date().toISOString()
    }
  ];
}

function saveRegisteredUsersToStorage() {
  try {
    localStorage.setItem('whip_whisk_registered_users', JSON.stringify(REGISTERED_USERS));
  } catch (e) {
    console.warn('Error saving registered users:', e);
  }
}

// Initialize cart quantities for all products
function initCartState() {
  for (const id of Object.keys(PRODUCTS)) {
    if (cartState[id] === undefined) {
      cartState[id] = 0;
    }
  }
}

// Multi-Tab real-time storage synchronization
function setupStorageSync() {
  window.addEventListener('storage', (e) => {
    if (e.key === 'whip_whisk_orders') {
      ORDERS = loadOrdersFromStorage();
    } else if (e.key === 'whip_whisk_products' || e.key === 'whip_whisk_catalog_rates') {
      PRODUCTS = loadProductsFromStorage();
      initCartState();
      renderStorefrontProducts();
    } else if (e.key === 'whip_whisk_registered_users') {
      REGISTERED_USERS = loadRegisteredUsersFromStorage();
    }
  });
}

// ==========================================================================
// STOREFRONT & MODAL CATALOG RENDERING (IN ₹ RUPEES)
// ==========================================================================
function renderStorefrontProducts() {
  // 1. Update prices on the 3 main showcase cards
  const cookieTinEl = document.getElementById('price-cookie-tin');
  if (cookieTinEl && PRODUCTS['cookie-tin']) {
    cookieTinEl.textContent = `₹${Number(PRODUCTS['cookie-tin'].price).toFixed(2)} / tin`;
  }
  const bentoCakeEl = document.getElementById('price-bento-cake');
  if (bentoCakeEl && PRODUCTS['bento-cake']) {
    bentoCakeEl.textContent = `₹${Number(PRODUCTS['bento-cake'].price).toFixed(2)} / cake`;
  }
  const browniePopsEl = document.getElementById('price-brownie-pops');
  if (browniePopsEl && PRODUCTS['brownie-pops']) {
    browniePopsEl.textContent = `₹${Number(PRODUCTS['brownie-pops'].price).toFixed(2)} / set`;
  }

  // 2. Render Additional Treats & Cakes if available
  const extraContainer = document.getElementById('extraTreatsContainer');
  const extraGrid = document.getElementById('extraTreatsGrid');
  const heroKeys = ['cookie-tin', 'bento-cake', 'brownie-pops'];
  const extraItems = Object.entries(PRODUCTS).filter(([id]) => !heroKeys.includes(id));

  if (extraContainer && extraGrid) {
    if (extraItems.length > 0) {
      extraGrid.innerHTML = extraItems.map(([id, p]) => `
        <div class="treat-card card-style-arch" data-item="${id}">
          <div class="card-frame frame-arch" tabindex="0" role="button" aria-label="View ${escapeHtml(p.name)}" onclick="openOrderModalWithItem('${id}')">
            <img src="${escapeHtml(p.img || 'assets/images/bento_cake.jpg')}" alt="${escapeHtml(p.name)}" class="treat-img">
            <div class="card-hover-overlay">
              <span class="quick-view-text">Quick Order +</span>
            </div>
          </div>
          <div class="card-info">
            <h3 class="treat-name">${escapeHtml(p.name.toUpperCase())}</h3>
            <p class="treat-desc">${escapeHtml(p.desc || 'Freshly handcrafted artisan cake.')}</p>
            <div class="treat-action-row">
              <span class="treat-price">₹${Number(p.price).toFixed(2)}</span>
              <button class="mini-order-btn" onclick="openOrderModalWithItem('${id}')">Order Now</button>
            </div>
          </div>
        </div>
      `).join('');
      extraContainer.style.display = 'block';
    } else {
      extraContainer.style.display = 'none';
    }
  }

  // 3. Render Order Modal Item Rows
  if (orderItemsList) {
    let itemsHtml = '';
    for (const [id, prod] of Object.entries(PRODUCTS)) {
      const qty = cartState[id] || 0;
      itemsHtml += `
        <div class="order-item-row" data-id="${id}">
          <img src="${escapeHtml(prod.img || 'assets/images/bento_cake.jpg')}" alt="${escapeHtml(prod.name)}" class="order-item-thumb">
          <div class="order-item-details">
            <strong>${escapeHtml(prod.name)}</strong>
            <span class="item-price-tag">₹${Number(prod.price).toFixed(2)}</span>
          </div>
          <div class="qty-counter">
            <button type="button" class="qty-btn" onclick="adjustItemQty('${id}', -1)" aria-label="Decrease quantity">&minus;</button>
            <input type="number" id="qty-${id}" value="${qty}" min="0" max="20" readonly>
            <button type="button" class="qty-btn" onclick="adjustItemQty('${id}', 1)" aria-label="Increase quantity">&#43;</button>
          </div>
        </div>
      `;
    }
    orderItemsList.innerHTML = itemsHtml;
  }

  updateOrderSummary();
}

// Web Audio API Synthesized Bakery Bell Chime
function playOrderChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const tones = [
      { freq: 1318.51, start: 0, duration: 0.8 },
      { freq: 1760.00, start: 0.12, duration: 1.0 }
    ];

    tones.forEach(t => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(t.freq, ctx.currentTime + t.start);

      gain.gain.setValueAtTime(0, ctx.currentTime + t.start);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + t.start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t.start + t.duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + t.start);
      osc.stop(ctx.currentTime + t.start + t.duration);
    });
  } catch (err) {
    // Audio synthesis fallback
  }
}

// ==========================================================================
// AUTHENTICATION SYSTEM (SEPARATE DIVS FOR OLD LOGIN & NEW LOGIN)
// ==========================================================================

function handleAccountBtnClick() {
  if (currentUser) {
    openCustomerModal();
  } else {
    openAuthModal('old');
  }
}

function updateHeaderAuthUI() {
  if (!accountTriggerBtn) return;

  accountTriggerBtn.classList.remove('customer-logged-in');

  if (currentUser && currentUser.name) {
    accountTriggerBtn.classList.add('customer-logged-in');
    const firstName = currentUser.name.split(' ')[0] || 'Account';
    if (accountBtnLabel) accountBtnLabel.textContent = `👤 ${firstName}`;
  } else {
    if (accountBtnLabel) accountBtnLabel.textContent = 'Sign In';
  }
}

function openAuthModal(defaultTab = 'old') {
  if (authModalBackdrop) {
    switchAuthTab(defaultTab);
    authModalBackdrop.classList.add('active');
    authModalBackdrop.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
}

function closeAuthModal() {
  if (authModalBackdrop) {
    authModalBackdrop.classList.remove('active');
    authModalBackdrop.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
}

// Switch between Div 1 (Old Login) and Div 2 (New Login)
function switchAuthTab(tab) {
  const tabOldBtn = document.getElementById('tabOldLoginBtn');
  const tabNewBtn = document.getElementById('tabNewLoginBtn');
  const panelOld = document.getElementById('panelOldLogin');
  const panelNew = document.getElementById('panelNewLogin');

  if (tab === 'new') {
    tabOldBtn?.classList.remove('active');
    tabNewBtn?.classList.add('active');
    panelOld?.classList.remove('active');
    panelNew?.classList.add('active');
    setTimeout(() => document.getElementById('newLoginName')?.focus(), 100);
  } else {
    tabOldBtn?.classList.add('active');
    tabNewBtn?.classList.remove('active');
    panelOld?.classList.add('active');
    panelNew?.classList.remove('active');
    setTimeout(() => document.getElementById('oldLoginIdentifier')?.focus(), 100);
  }
}

// Password visibility eye toggle
function togglePasswordVisibility(inputId, btnEl) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    btnEl.textContent = '🔒';
    btnEl.title = 'Hide Password';
  } else {
    input.type = 'password';
    btnEl.textContent = '👁️';
    btnEl.title = 'Show Password';
  }
}

// DIV 1: Handle Old Login (Existing User Sign In)
function handleOldLoginSubmit(event) {
  event.preventDefault();
  const identifier = document.getElementById('oldLoginIdentifier').value.trim().toLowerCase();
  const password = document.getElementById('oldLoginPassword').value;

  if (!identifier || !password) {
    showToast('⚠️ Please enter both your email/phone and password.');
    return;
  }

  // Search registered users
  const matchedUser = REGISTERED_USERS.find(u => 
    (u.email && u.email.toLowerCase() === identifier) ||
    (u.phone && u.phone.replace(/\D/g, '') === identifier.replace(/\D/g, ''))
  );

  if (matchedUser) {
    if (matchedUser.password && matchedUser.password !== password) {
      showToast('❌ Incorrect password. Please try again or use Demo Login.');
      return;
    }

    saveSessionToStorage({
      name: matchedUser.name,
      email: matchedUser.email,
      phone: matchedUser.phone
    });

    closeAuthModal();
    showToast(`🍰 Welcome back, ${matchedUser.name}! You are signed in.`);

    // Auto-fill checkout fields if order modal is used
    const nameInput = document.getElementById('orderCustomerName');
    const phoneInput = document.getElementById('orderCustomerPhone');
    if (nameInput) nameInput.value = matchedUser.name;
    if (phoneInput && matchedUser.phone) phoneInput.value = matchedUser.phone;
    return;
  }

  // If user entered demo credentials or generic fallback
  if (identifier === 'jane@example.com' || identifier === 'jane doe' || identifier === 'demo') {
    quickDemoCustomerLogin();
    return;
  }

  showToast('⚠️ No account found with that email/phone. Click "New User (Register)" to create one!');
}

// DIV 2: Handle New Login (New User Registration)
function handleNewLoginSubmit(event) {
  event.preventDefault();
  const name = document.getElementById('newLoginName').value.trim();
  const email = document.getElementById('newLoginEmail').value.trim().toLowerCase();
  const phone = document.getElementById('newLoginPhone').value.trim();
  const password = document.getElementById('newLoginPassword').value;
  const confirmPassword = document.getElementById('newLoginPasswordConfirm').value;

  if (!name || !email || !phone || !password) {
    showToast('⚠️ Please fill in all required fields.');
    return;
  }

  if (password !== confirmPassword) {
    showToast('⚠️ Passwords do not match. Please re-enter.');
    return;
  }

  if (password.length < 4) {
    showToast('⚠️ Password must be at least 4 characters long.');
    return;
  }

  // Check if email already registered
  const exists = REGISTERED_USERS.some(u => u.email && u.email.toLowerCase() === email);
  if (exists) {
    showToast('💡 This email is already registered! Please sign in with Existing User.');
    switchAuthTab('old');
    document.getElementById('oldLoginIdentifier').value = email;
    return;
  }

  // Register new customer
  const newUser = {
    name,
    email,
    phone,
    password,
    createdAt: new Date().toISOString()
  };

  REGISTERED_USERS.push(newUser);
  saveRegisteredUsersToStorage();

  // Automatically sign in
  saveSessionToStorage({
    name,
    email,
    phone
  });

  closeAuthModal();
  showToast(`🎉 Welcome to Whip & Whisk, ${name}! Your account has been registered.`);

  // Auto-fill order checkout details
  const nameInput = document.getElementById('orderCustomerName');
  const phoneInput = document.getElementById('orderCustomerPhone');
  if (nameInput) nameInput.value = name;
  if (phoneInput) phoneInput.value = phone;

  document.getElementById('newLoginForm').reset();
}

// Quick 1-Click Demo Customer
function quickDemoCustomerLogin() {
  const demoEmail = 'jane@example.com';
  const demoPhone = '(555) 234-5678';
  const demoName = 'Jane Doe';

  // Ensure demo user exists in registered list
  if (!REGISTERED_USERS.some(u => u.email === demoEmail)) {
    REGISTERED_USERS.push({
      name: demoName,
      email: demoEmail,
      phone: demoPhone,
      password: 'password123',
      createdAt: new Date().toISOString()
    });
    saveRegisteredUsersToStorage();
  }

  document.getElementById('oldLoginIdentifier').value = demoEmail;
  document.getElementById('oldLoginPassword').value = 'password123';

  saveSessionToStorage({
    name: demoName,
    email: demoEmail,
    phone: demoPhone
  });

  closeAuthModal();
  showToast('🍰 Signed in as Jane Doe (Demo Sweet Lover)!');
}

function handleForgotPassword() {
  const id = document.getElementById('oldLoginIdentifier')?.value.trim();
  if (id) {
    showToast(`📧 Password reset link simulated for ${id}! Check your inbox.`);
  } else {
    showToast('💡 Enter your registered email and click "Forgot password?" again.');
  }
}

// Logout
function handleLogout() {
  saveSessionToStorage(null);
  closeCustomerModal();
  showToast('👋 You have been logged out.');
}

// Customer Profile Modal
function openCustomerModal() {
  if (!customerModalBackdrop) return;

  const greetingName = document.getElementById('customerGreetingName');
  const greetingEmail = document.getElementById('customerGreetingEmail');
  const ordersCountEl = document.getElementById('custStatOrdersCount');
  const totalDonatedEl = document.getElementById('custStatTotalDonated');
  const ordersListEl = document.getElementById('customerOrdersList');

  if (currentUser) {
    if (greetingName) greetingName.textContent = currentUser.name;
    if (greetingEmail) greetingEmail.textContent = currentUser.email || 'Sweet Supporter';

    // Filter orders matching customer
    const myOrders = ORDERS.filter(o => 
      (currentUser.email && o.customerEmail === currentUser.email) ||
      (o.customerName && o.customerName.toLowerCase() === currentUser.name.toLowerCase())
    );

    let totalDonated = 0;
    myOrders.forEach(o => totalDonated += Number(o.grandTotal || o.total || 0));

    if (ordersCountEl) ordersCountEl.textContent = myOrders.length;
    if (totalDonatedEl) totalDonatedEl.textContent = `₹${totalDonated.toFixed(2)}`;

    if (ordersListEl) {
      if (myOrders.length === 0) {
        ordersListEl.innerHTML = `
          <div style="text-align:center; padding: 24px; color:var(--text-secondary);">
            <p>You haven't placed any bake sale orders yet.</p>
          </div>
        `;
      } else {
        ordersListEl.innerHTML = myOrders.map(o => `
          <div class="cust-order-card">
            <div class="cust-order-top">
              <strong style="font-family:monospace;">#${escapeHtml(o.id || o.orderId)}</strong>
              <span class="cust-order-status-pill ${o.status === 'Pending' ? 'status-pending' : ''}">
                ${escapeHtml(o.status || 'Pending')}
              </span>
            </div>
            <div style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:4px;">
              Date: ${escapeHtml(o.deliveryDate || 'N/A')} &bull; Total: <strong>₹${Number(o.grandTotal || o.total || 0).toFixed(2)}</strong>
            </div>
            <div style="font-size:0.8rem; color:var(--text-muted);">
              ${Array.isArray(o.items) ? o.items.map(it => `${it.qty}x ${escapeHtml(it.name)}`).join(', ') : 'Delight Treats'}
            </div>
          </div>
        `).join('');
      }
    }
  }

  customerModalBackdrop.classList.add('active');
  customerModalBackdrop.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeCustomerModal() {
  if (customerModalBackdrop) {
    customerModalBackdrop.classList.remove('active');
    customerModalBackdrop.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
}

function openOrderModalFromCustomer() {
  closeCustomerModal();
  openOrderModal();
}

// ==========================================================================
// CART, CHECKOUT & NOTIFICATIONS (IN ₹ RUPEES)
// ==========================================================================

// Setup default date to tomorrow
function setupDateDefault() {
  if (deliveryDateInput) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    deliveryDateInput.min = `${yyyy}-${mm}-${dd}`;
    deliveryDateInput.value = `${yyyy}-${mm}-${dd}`;
  }
}

// Sticky Header scroll styling
function setupStickyHeader() {
  const header = document.getElementById('siteHeader');
  if (!header) return;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

// Attach Event Listeners
function setupEventListeners() {
  if (heroShopOnlineBtn) {
    heroShopOnlineBtn.addEventListener('click', () => openOrderModal());
  }
  if (openOrderFormBtn) {
    openOrderFormBtn.addEventListener('click', () => openOrderModal());
  }
  if (cartTriggerBtn) {
    cartTriggerBtn.addEventListener('click', () => openOrderModal());
  }
  if (closeOrderModalBtn) {
    closeOrderModalBtn.addEventListener('click', closeOrderModal);
  }

  // Close when clicking outside modal backdrop
  [orderModalBackdrop, authModalBackdrop, customerModalBackdrop].forEach(backdrop => {
    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          closeOrderModal();
          closeAuthModal();
          closeCustomerModal();
        }
      });
    }
  });

  // Mobile menu toggle
  if (mobileToggleBtn && navMenu) {
    mobileToggleBtn.addEventListener('click', () => {
      navMenu.classList.toggle('mobile-active');
    });

    navMenu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('mobile-active');
      });
    });
  }

  // ESC key closes modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeOrderModal();
      closeAuthModal();
      closeCustomerModal();
      closeLightbox();
    }
  });
}

// Open Order Modal
function openOrderModal() {
  if (orderModalBackdrop) {
    if (currentUser) {
      const nameInput = document.getElementById('orderCustomerName');
      const phoneInput = document.getElementById('orderCustomerPhone');
      if (nameInput && !nameInput.value) nameInput.value = currentUser.name || '';
      if (phoneInput && !phoneInput.value) phoneInput.value = currentUser.phone || '';
    }

    orderModalBackdrop.classList.add('active');
    orderModalBackdrop.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    updateOrderSummary();
  }
}

// Open modal and pre-increment an item
function openOrderModalWithItem(itemId) {
  if (PRODUCTS[itemId]) {
    if (!cartState[itemId] || cartState[itemId] === 0) {
      cartState[itemId] = 1;
      const inputEl = document.getElementById(`qty-${itemId}`);
      if (inputEl) inputEl.value = 1;
    }
    openOrderModal();
    updateOrderSummary();
    showToast(`Added ${PRODUCTS[itemId].name} to your order! 🍰`);
  }
}

// Close Order Modal
function closeOrderModal() {
  if (orderModalBackdrop) {
    orderModalBackdrop.classList.remove('active');
    orderModalBackdrop.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
}

// Adjust quantity for items
function adjustItemQty(itemId, change) {
  if (PRODUCTS[itemId]) {
    const currentQty = cartState[itemId] || 0;
    const newQty = Math.max(0, Math.min(20, currentQty + change));
    cartState[itemId] = newQty;

    const inputEl = document.getElementById(`qty-${itemId}`);
    if (inputEl) {
      inputEl.value = newQty;
    }

    updateOrderSummary();
  }
}

// Update Cart Badge and Subtotal Calculations in ₹
function updateOrderSummary() {
  let subtotal = 0;
  let totalItems = 0;

  for (const [id, qty] of Object.entries(cartState)) {
    if (qty > 0 && PRODUCTS[id]) {
      subtotal += PRODUCTS[id].price * qty;
      totalItems += qty;
    }
  }

  // Delivery: Free if subtotal >= ₹35, otherwise ₹4.50
  let deliveryFee = 0;
  if (totalItems > 0) {
    deliveryFee = subtotal >= 35 ? 0.00 : 4.50;
  }

  const grandTotal = subtotal + deliveryFee;

  // Update DOM in ₹
  if (cartBadge) cartBadge.textContent = totalItems;
  if (orderSubtotalEl) orderSubtotalEl.textContent = `₹${subtotal.toFixed(2)}`;
  if (orderDeliveryFeeEl) {
    orderDeliveryFeeEl.textContent = totalItems === 0 
      ? '₹0.00' 
      : (deliveryFee === 0 ? 'FREE (Orders over ₹35.00)' : `₹${deliveryFee.toFixed(2)}`);
  }
  if (orderGrandTotalEl) orderGrandTotalEl.textContent = `₹${grandTotal.toFixed(2)}`;
}

// Handle Order Submission & Live Database Synchronization
function handlePlaceOrder(event) {
  event.preventDefault();

  let totalItems = 0;
  const orderedItems = [];
  let subtotal = 0;

  for (const [id, qty] of Object.entries(cartState)) {
    if (qty > 0 && PRODUCTS[id]) {
      totalItems += qty;
      subtotal += PRODUCTS[id].price * qty;
      orderedItems.push({
        id: id,
        name: PRODUCTS[id].name,
        price: PRODUCTS[id].price,
        qty: qty
      });
    }
  }

  if (totalItems === 0) {
    showToast('⚠️ Please select at least one delicious treat before checking out!');
    return;
  }

  const name = document.getElementById('orderCustomerName').value.trim();
  const phone = document.getElementById('orderCustomerPhone').value.trim();
  const address = document.getElementById('orderCustomerAddress').value.trim();
  const date = document.getElementById('orderDeliveryDate').value;
  const causeSelect = document.getElementById('orderCauseChoice');
  const causeName = causeSelect && causeSelect.options[causeSelect.selectedIndex] ? causeSelect.options[causeSelect.selectedIndex].text : 'Fresh Bake Sale';
  const notes = document.getElementById('orderNotes')?.value.trim() || '';

  const deliveryFee = subtotal >= 35 ? 0.00 : 4.50;
  const grandTotal = subtotal + deliveryFee;

  // Create new order record
  const newOrder = {
    id: 'WB-' + Math.floor(1000 + Math.random() * 9000),
    timestamp: new Date().toISOString(),
    customerName: name,
    customerPhone: phone,
    customerEmail: (currentUser && currentUser.email) ? currentUser.email : '',
    customerAddress: address,
    deliveryDate: date,
    cause: causeName,
    notes: notes,
    items: orderedItems,
    subtotal: subtotal,
    deliveryFee: deliveryFee,
    grandTotal: grandTotal,
    status: 'Pending',
    unread: true
  };

  // 1. Save to local storage cache
  ORDERS.unshift(newOrder);
  saveOrdersToStorage();

  // 2. Send to Backend API (MongoDB / In-Memory on Render)
  fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: newOrder.id,
      customerName: newOrder.customerName,
      phone: newOrder.customerPhone,
      email: newOrder.customerEmail || '',
      address: newOrder.customerAddress,
      deliveryDate: newOrder.deliveryDate,
      items: newOrder.items,
      subtotal: newOrder.subtotal,
      deliveryFee: newOrder.deliveryFee,
      total: newOrder.grandTotal,
      status: 'Pending'
    })
  }).catch(err => console.log('API sync notice (offline fallback active):', err));

  // 3. Play Chime
  playOrderChime();

  // 4. Feedback to Customer
  closeOrderModal();
  showToast(`🎉 Thank you, ${name}! Order #${newOrder.id} for ₹${grandTotal.toFixed(2)} confirmed! ❤️`);

  // Reset form & cart
  for (const id of Object.keys(cartState)) {
    cartState[id] = 0;
    const inputEl = document.getElementById(`qty-${id}`);
    if (inputEl) inputEl.value = 0;
  }
  document.getElementById('bakeSaleOrderForm').reset();
  setupDateDefault();
  updateOrderSummary();
}

// Handle Contact Form Submit
function handleContactSubmit(event) {
  event.preventDefault();
  const name = document.getElementById('contactName').value;
  const email = document.getElementById('contactEmail')?.value || '';
  const message = document.getElementById('contactMessage')?.value || '';

  fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, message })
  }).catch(err => console.log('Inquiry local fallback:', err));

  showToast(`💌 Sweet message received! Thank you, ${name}. We'll reply shortly!`);
  document.getElementById('contactForm').reset();
}

// Toast Notifications Helper
function showToast(message) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.4s ease';
    setTimeout(() => {
      toast.remove();
    }, 400);
  }, 4500);
}

// Lightbox for full-res view of products
function setupLightboxTriggers() {
  const treatFrames = document.querySelectorAll('.card-frame');
  treatFrames.forEach(frame => {
    frame.addEventListener('click', (e) => {
      if (e.target.classList.contains('quick-view-text') || e.target.classList.contains('mini-order-btn')) {
        return;
      }
      const img = frame.tagName === 'IMG' ? frame : frame.querySelector('img');
      if (img) {
        openLightbox(img.src, img.alt);
      }
    });
  });
}

function openLightbox(src, caption) {
  if (lightboxModal && lightboxImage && lightboxCaption) {
    lightboxImage.src = src;
    lightboxCaption.textContent = caption || 'Artisan Treat';
    lightboxModal.classList.add('active');
  }
}

function closeLightbox() {
  if (lightboxModal) {
    lightboxModal.classList.remove('active');
  }
}

// Escape helper to prevent XSS
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ==========================================================================
// PWA INSTALLATION SYSTEM (MOBILE & DESKTOP 1-TAP INSTALL)
// ==========================================================================

let deferredPwaPrompt = null;
const isIos = () => /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
const isInStandaloneMode = () => ('standalone' in window.navigator) && window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('✅ PWA Service Worker registered:', reg.scope))
      .catch(err => console.warn('PWA Service Worker note:', err));
  });
}

// Capture BeforeInstallPrompt (Chrome, Android, Edge, Samsung Internet)
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPwaPrompt = e;

  // Show Header & Nav install buttons
  const installBtn = document.getElementById('installPwaBtn');
  const navInstall = document.getElementById('navInstallLink');
  const banner = document.getElementById('pwaInstallBanner');

  if (installBtn) installBtn.style.display = 'inline-flex';
  if (navInstall) navInstall.style.display = 'block';

  // Check if user dismissed banner previously in this session
  const dismissed = sessionStorage.getItem('whip_whisk_pwa_dismissed');
  if (!dismissed && banner && !isInStandaloneMode()) {
    setTimeout(() => {
      banner.style.display = 'flex';
    }, 2500);
  }
});

// Detect when successfully installed
window.addEventListener('appinstalled', () => {
  deferredPwaPrompt = null;
  const banner = document.getElementById('pwaInstallBanner');
  const installBtn = document.getElementById('installPwaBtn');
  const navInstall = document.getElementById('navInstallLink');

  if (banner) banner.style.display = 'none';
  if (installBtn) installBtn.style.display = 'none';
  if (navInstall) navInstall.style.display = 'none';

  showToast('🎉 Whip & Whisk App installed successfully! Enjoy 1-tap orders!');
});

// Trigger PWA Install
function triggerPwaInstall() {
  if (deferredPwaPrompt) {
    deferredPwaPrompt.prompt();
    deferredPwaPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted PWA install');
      }
      deferredPwaPrompt = null;
      const banner = document.getElementById('pwaInstallBanner');
      if (banner) banner.style.display = 'none';
    });
  } else if (isIos() && !isInStandaloneMode()) {
    // Show iOS Safari Instructions
    const iosModal = document.getElementById('iosInstallModal');
    if (iosModal) iosModal.style.display = 'flex';
  } else {
    // If browser doesn't support prompt or already installed
    showToast('📲 To install: tap your browser menu (⋮ or Share ⎋) and select "Install app" or "Add to Home screen"!');
  }
}

function dismissPwaBanner() {
  const banner = document.getElementById('pwaInstallBanner');
  if (banner) banner.style.display = 'none';
  sessionStorage.setItem('whip_whisk_pwa_dismissed', 'true');
}

function closeIosInstallModal() {
  const iosModal = document.getElementById('iosInstallModal');
  if (iosModal) iosModal.style.display = 'none';
}

// Show install button for iOS if not installed
document.addEventListener('DOMContentLoaded', () => {
  if (isIos() && !isInStandaloneMode()) {
    const installBtn = document.getElementById('installPwaBtn');
    const navInstall = document.getElementById('navInstallLink');
    if (installBtn) installBtn.style.display = 'inline-flex';
    if (navInstall) navInstall.style.display = 'block';

    const dismissed = sessionStorage.getItem('whip_whisk_pwa_dismissed');
    const banner = document.getElementById('pwaInstallBanner');
    if (!dismissed && banner) {
      setTimeout(() => { banner.style.display = 'flex'; }, 3000);
    }
  }
});
