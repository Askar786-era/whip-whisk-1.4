/**
 * WHIP & WHISK BAKE SALE - DEDICATED ADMIN DASHBOARD CONTROLLER
 * Features:
 * - Secure PIN Authentication & Session persistence
 * - Real-time MongoDB API Synchronization (with localStorage fallback)
 * - Order Status Updates (Pending -> Preparing -> Dispatched -> Delivered)
 * - Catalog Price & Rate Fixing Controller
 * - Audio Chime Notifications for Customer Orders
 * - CSV Order Export
 */

const ADMIN_PIN_DEFAULT = '2025';

// State Variables
let adminOrders = [];
let adminProducts = {};
let adminInquiries = [];
let soundAlertsEnabled = localStorage.getItem('whip_whisk_admin_sound') !== 'false';
let currentTab = 'orders';

// DOM Elements
const adminAuthModal = document.getElementById('adminAuthModal');
const adminDashboard = document.getElementById('adminDashboard');
const adminPinInput = document.getElementById('adminPinInput');
const authErrorMsg = document.getElementById('authErrorMsg');
const ordersTableBody = document.getElementById('ordersTableBody');
const adminProductsGrid = document.getElementById('adminProductsGrid');
const inquiriesList = document.getElementById('inquiriesList');
const soundIcon = document.getElementById('soundIcon');
const soundStatus = document.getElementById('soundStatus');

// KPI Counter Elements
const kpiRevenue = document.getElementById('kpiRevenue');
const kpiTotalOrders = document.getElementById('kpiTotalOrders');
const kpiPendingOrders = document.getElementById('kpiPendingOrders');
const kpiDeliveredOrders = document.getElementById('kpiDeliveredOrders');

// Audio Chime
const orderAudioChime = document.getElementById('orderAudioChime');

// ==========================================================================
// INITIALIZATION & AUTHENTICATION
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  updateSoundUI();
  checkExistingSession();
});

function checkExistingSession() {
  const isAuth = localStorage.getItem('whip_whisk_admin_authenticated') === 'true';
  if (isAuth) {
    showDashboard();
  } else {
    adminAuthModal.style.display = 'flex';
    adminDashboard.style.display = 'none';
  }
}

async function handleAdminLogin(event) {
  event.preventDefault();
  const inputPin = adminPinInput.value.trim();

  try {
    // Attempt backend login verification
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: inputPin })
    });

    const data = await response.json();
    if (response.ok && data.success) {
      localStorage.setItem('whip_whisk_admin_authenticated', 'true');
      showDashboard();
      return;
    }
  } catch (err) {
    // Fallback to local check if offline
    if (inputPin === ADMIN_PIN_DEFAULT) {
      localStorage.setItem('whip_whisk_admin_authenticated', 'true');
      showDashboard();
      return;
    }
  }

  authErrorMsg.style.display = 'block';
  adminPinInput.value = '';
}

function logoutAdmin() {
  localStorage.removeItem('whip_whisk_admin_authenticated');
  adminAuthModal.style.display = 'flex';
  adminDashboard.style.display = 'none';
  adminPinInput.value = '';
  authErrorMsg.style.display = 'none';
}

function showDashboard() {
  adminAuthModal.style.display = 'none';
  adminDashboard.style.display = 'block';
  refreshAdminData();
  
  // Set auto-refresh timer every 15 seconds
  setInterval(refreshAdminData, 15000);
}

// ==========================================================================
// DATA FETCHING & SYNCHRONIZATION
// ==========================================================================
async function refreshAdminData() {
  await Promise.all([
    fetchOrders(),
    fetchProducts(),
    fetchInquiries()
  ]);

  calculateKPIs();
  renderCurrentTab();
}

async function fetchOrders() {
  try {
    const res = await fetch('/api/orders');
    if (res.ok) {
      const data = await res.json();
      
      // Check for new incoming order to trigger sound chime
      if (adminOrders.length > 0 && data.length > adminOrders.length && soundAlertsEnabled) {
        playOrderAudioChime();
      }

      adminOrders = data;
      localStorage.setItem('whip_whisk_orders_backup', JSON.stringify(adminOrders));
      return;
    }
  } catch (err) {
    console.warn('Backend offline, loading local orders cache:', err);
  }

  // LocalStorage Fallback
  const localData = localStorage.getItem('whip_whisk_orders') || localStorage.getItem('whip_whisk_orders_backup');
  adminOrders = localData ? JSON.parse(localData) : [];
}

async function fetchProducts() {
  try {
    const res = await fetch('/api/products');
    if (res.ok) {
      adminProducts = await res.json();
      localStorage.setItem('whip_whisk_catalog_rates', JSON.stringify(adminProducts));
      return;
    }
  } catch (err) {
    console.warn('Backend offline, loading local products:', err);
  }

  const localCatalog = localStorage.getItem('whip_whisk_catalog_rates');
  if (localCatalog) {
    adminProducts = JSON.parse(localCatalog);
  } else {
    adminProducts = {
      'cookie-tin': { name: 'Yummy Soft Cookie Tin', price: 14.00, img: 'assets/images/cookie_tin.jpg', desc: 'Chocolate chip, oatmeal raisin & golden butter tin favorites' },
      'bento-cake': { name: 'Mini Celebration Bento Cake', price: 18.00, img: 'assets/images/bento_cake.jpg', desc: 'Mini bento chocolate cakes, rainbow sprinkles & white chips' },
      'brownie-pops': { name: 'Heart Brownie Popsicles (Set of 3)', price: 12.00, img: 'assets/images/heart_brownie_pops.jpg', desc: 'Ribbon-tied brownie popsicles, sprinkles & chocolate skewers' },
      'fudge-box': { name: 'Box of 4 Glazed Fudge Brownies', price: 16.00, img: 'assets/images/fudge_brownies_box.jpg', desc: 'Dense chocolate fudge brownies with shiny dark cocoa glaze' },
      'brownie-skewers': { name: 'Dipped Brownie Bites Skewers (Pack)', price: 10.00, img: 'assets/images/brownie_skewers.jpg', desc: 'Bite-sized fudge brownies on bamboo skewers drizzled with white icing' }
    };
  }
}

async function fetchInquiries() {
  try {
    const res = await fetch('/api/contact');
    if (res.ok) {
      adminInquiries = await res.json();
      return;
    }
  } catch (err) {
    console.warn('Backend offline, using local inquiries cache:', err);
  }
  adminInquiries = [];
}

// ==========================================================================
// KPI & STATS CALCULATION
// ==========================================================================
function calculateKPIs() {
  let totalRev = 0;
  let pendingCount = 0;
  let deliveredCount = 0;

  adminOrders.forEach(o => {
    if (o.status !== 'Cancelled') {
      totalRev += (Number(o.total) || 0);
    }
    if (o.status === 'Pending' || o.status === 'Preparing') {
      pendingCount++;
    } else if (o.status === 'Delivered') {
      deliveredCount++;
    }
  });

  kpiRevenue.textContent = `₹${totalRev.toFixed(2)}`;
  kpiTotalOrders.textContent = adminOrders.length;
  kpiPendingOrders.textContent = pendingCount;
  kpiDeliveredOrders.textContent = deliveredCount;

  document.getElementById('tabOrderCount').textContent = adminOrders.length;
  document.getElementById('tabInquiryCount').textContent = adminInquiries.length;
}

// ==========================================================================
// RENDERERS & TAB MANAGEMENT
// ==========================================================================
function switchAdminTab(tabName) {
  currentTab = tabName;
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');

  if (tabName === 'orders') {
    document.getElementById('tabOrdersBtn').classList.add('active');
    document.getElementById('tabOrders').style.display = 'block';
    renderOrdersTable();
  } else if (tabName === 'rates') {
    document.getElementById('tabRatesBtn').classList.add('active');
    document.getElementById('tabRates').style.display = 'block';
    renderProductsRateGrid();
  } else if (tabName === 'inquiries') {
    document.getElementById('tabInquiriesBtn').classList.add('active');
    document.getElementById('tabInquiries').style.display = 'block';
    renderInquiriesList();
  }
}

function renderCurrentTab() {
  switchAdminTab(currentTab);
}

// Render Orders Table
function renderOrdersTable() {
  const searchTerm = (document.getElementById('orderSearchInput')?.value || '').toLowerCase();
  const statusFilter = document.getElementById('statusFilterSelect')?.value || 'ALL';

  const filtered = adminOrders.filter(order => {
    const matchesSearch = 
      (order.orderId && order.orderId.toLowerCase().includes(searchTerm)) ||
      (order.customerName && order.customerName.toLowerCase().includes(searchTerm)) ||
      (order.phone && order.phone.includes(searchTerm));

    const matchesStatus = (statusFilter === 'ALL' || order.status === statusFilter);

    return matchesSearch && matchesStatus;
  });

  if (filtered.length === 0) {
    ordersTableBody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state">No matching orders found in database.</td>
      </tr>
    `;
    return;
  }

  ordersTableBody.innerHTML = filtered.map(order => {
    const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent';
    const itemsSummary = Array.isArray(order.items) ? order.items.map(i => `${i.name} (x${i.qty})`).join(', ') : 'Treats Box';

    return `
      <tr>
        <td><strong>${order.orderId}</strong></td>
        <td>${dateStr}</td>
        <td>
          <strong>${escapeHtml(order.customerName)}</strong><br>
          <small style="color: var(--color-text-muted);">${escapeHtml(order.phone)}</small>
        </td>
        <td>${order.deliveryDate || 'N/A'}</td>
        <td style="max-width: 260px; font-size: 0.85rem;" title="${escapeHtml(itemsSummary)}">${escapeHtml(itemsSummary)}</td>
        <td><strong style="color: var(--color-gold);">₹${(Number(order.total) || 0).toFixed(2)}</strong></td>
        <td>
          <select class="status-select status-${(order.status || 'Pending').toLowerCase()}" onchange="updateOrderStatus('${order.orderId}', this.value)">
            <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>⏳ Pending</option>
            <option value="Preparing" ${order.status === 'Preparing' ? 'selected' : ''}>👩‍🍳 Preparing</option>
            <option value="Dispatched" ${order.status === 'Dispatched' ? 'selected' : ''}>🚗 Dispatched</option>
            <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>✅ Delivered</option>
            <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>❌ Cancelled</option>
          </select>
        </td>
        <td>
          <button class="btn-action-view" onclick="openOrderDetailModal('${order.orderId}')">🔍 View</button>
        </td>
      </tr>
    `;
  }).join('');
}

function filterOrdersTable() {
  renderOrdersTable();
}

// Update Order Status API
async function updateOrderStatus(orderId, newStatus) {
  try {
    // Update local state immediately
    const order = adminOrders.find(o => o.orderId === orderId);
    if (order) order.status = newStatus;

    // Send API update
    await fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });

    // Save local backup
    localStorage.setItem('whip_whisk_orders', JSON.stringify(adminOrders));
    calculateKPIs();
    renderOrdersTable();
  } catch (err) {
    console.warn('API update status error:', err);
  }
}

// Render Products & Rate Fixing
function renderProductsRateGrid() {
  const keys = Object.keys(adminProducts);

  adminProductsGrid.innerHTML = keys.map(key => {
    const p = adminProducts[key];
    const itemPrice = Number(p.price) || 0;

    return `
      <div class="rate-card">
        <img src="${p.img || 'assets/images/cookie_tin.jpg'}" alt="${escapeHtml(p.name)}" class="rate-img">
        <h3 class="rate-title">${escapeHtml(p.name)}</h3>
        <p class="rate-desc">${escapeHtml(p.desc || '')}</p>
        <div class="rate-edit-row">
          <span style="font-weight: 700; color: var(--color-gold);">₹</span>
          <input type="number" step="0.50" min="0" value="${itemPrice.toFixed(2)}" id="priceInput_${key}" class="rate-input">
          <button class="btn-save-rate" onclick="saveProductRate('${key}')">Save Rate</button>
        </div>
      </div>
    `;
  }).join('');
}

async function saveProductRate(itemId) {
  const inputEl = document.getElementById(`priceInput_${itemId}`);
  if (!inputEl) return;

  const newPrice = parseFloat(inputEl.value);
  if (isNaN(newPrice) || newPrice < 0) return alert('Please enter a valid rate');

  if (adminProducts[itemId]) {
    adminProducts[itemId].price = newPrice;
  }

  try {
    await fetch(`/api/products/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price: newPrice, name: adminProducts[itemId]?.name })
    });
  } catch (err) {
    console.warn('API rate save warning:', err);
  }

  // Update local storage so storefront picks up new pricing immediately
  localStorage.setItem('whip_whisk_catalog_rates', JSON.stringify(adminProducts));
  alert(`✅ Rate updated for ${adminProducts[itemId]?.name || itemId} to ₹${newPrice.toFixed(2)}`);
  renderProductsRateGrid();
}

// Render Inquiries Feed
function renderInquiriesList() {
  if (!adminInquiries || adminInquiries.length === 0) {
    inquiriesList.innerHTML = `<div class="empty-state">No customer inquiries recorded yet.</div>`;
    return;
  }

  inquiriesList.innerHTML = adminInquiries.map(inq => `
    <div class="inquiry-card">
      <div class="inquiry-header">
        <div>
          <span class="inquiry-author">${escapeHtml(inq.name)}</span>
          <span class="inquiry-email"> (${escapeHtml(inq.email)})</span>
        </div>
        <span class="inquiry-date">${inq.createdAt ? new Date(inq.createdAt).toLocaleDateString() : 'Recent'}</span>
      </div>
      <div class="inquiry-body">${escapeHtml(inq.message)}</div>
    </div>
  `).join('');
}

// Modal View Details
function openOrderDetailModal(orderId) {
  const order = adminOrders.find(o => o.orderId === orderId);
  if (!order) return;

  document.getElementById('modalOrderTitle').textContent = `Order Breakdown: ${order.orderId}`;
  
  const itemsHtml = Array.isArray(order.items) ? order.items.map(i => `
    <div style="display:flex; justify-content:space-between; margin-bottom: 6px; font-size: 0.9rem;">
      <span>${escapeHtml(i.name)} x ${i.qty}</span>
      <strong>₹${(Number(i.price) * Number(i.qty)).toFixed(2)}</strong>
    </div>
  `).join('') : 'None';

  document.getElementById('modalOrderBody').innerHTML = `
    <div class="detail-group">
      <span class="detail-label">Customer Name</span>
      <span class="detail-val">${escapeHtml(order.customerName)}</span>
    </div>
    <div class="detail-group">
      <span class="detail-label">Phone Contact</span>
      <span class="detail-val">${escapeHtml(order.phone)}</span>
    </div>
    <div class="detail-group">
      <span class="detail-label">Delivery Address</span>
      <span class="detail-val">${escapeHtml(order.address)}</span>
    </div>
    <div class="detail-group">
      <span class="detail-label">Requested Delivery Date</span>
      <span class="detail-val">${order.deliveryDate || 'N/A'}</span>
    </div>
    <hr style="border-color: rgba(255,255,255,0.1); margin: 16px 0;">
    <h4 style="margin-bottom: 12px; font-family: var(--font-serif); font-size: 1.2rem;">Items List</h4>
    ${itemsHtml}
    <hr style="border-color: rgba(255,255,255,0.1); margin: 16px 0;">
    <div style="display:flex; justify-content:space-between; font-size: 1.1rem; color: var(--color-gold);">
      <strong>Grand Total</strong>
      <strong>₹${(Number(order.total) || 0).toFixed(2)}</strong>
    </div>
  `;

  document.getElementById('orderDetailModal').style.display = 'flex';
}

function closeOrderDetailModal() {
  document.getElementById('orderDetailModal').style.display = 'none';
}

// Sound Alerts
function toggleSoundNotifications() {
  soundAlertsEnabled = !soundAlertsEnabled;
  localStorage.setItem('whip_whisk_admin_sound', soundAlertsEnabled ? 'true' : 'false');
  updateSoundUI();
}

function updateSoundUI() {
  if (soundIcon && soundStatus) {
    soundIcon.textContent = soundAlertsEnabled ? '🔔' : '🔕';
    soundStatus.textContent = soundAlertsEnabled ? 'ON' : 'MUTED';
  }
}

function playOrderAudioChime() {
  if (orderAudioChime) {
    orderAudioChime.play().catch(() => {});
  }
}

// Export CSV
function exportOrdersToCSV() {
  if (adminOrders.length === 0) return alert('No orders to export.');

  const headers = ['Order ID', 'Date', 'Customer Name', 'Phone', 'Delivery Date', 'Total Amount', 'Status'];
  const rows = adminOrders.map(o => [
    `"${o.orderId || ''}"`,
    `"${o.createdAt ? new Date(o.createdAt).toISOString() : ''}"`,
    `"${(o.customerName || '').replace(/"/g, '""')}"`,
    `"${o.phone || ''}"`,
    `"${o.deliveryDate || ''}"`,
    `"${(Number(o.total) || 0).toFixed(2)}"`,
    `"${o.status || 'Pending'}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `whip_whisk_orders_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Utility HTML escaper
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
