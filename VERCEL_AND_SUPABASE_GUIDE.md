# 🥐 Whip & Whisk — Vercel & Supabase Deployment Guide

This guide walks you through deploying **Whip & Whisk Bake Sale** to **Vercel** with a **Supabase PostgreSQL** database.

---

## ⚡ Quick Architecture Overview

- **Frontend:** Responsive storefront (`index.html`) & Light-Themed Admin Portal (`admin.html`).
- **Backend / API:** Serverless Node.js functions on Vercel (`api/index.js` + `server.js`).
- **Database:** Supabase PostgreSQL with real-time order tracking and catalog rate management.
- **Offline Fallback:** Automatic in-memory & `localStorage` caching ensures the app always loads gracefully even during network downtime.

---

## 🗄️ Step 1: Set Up Your Supabase Database

1. Go to [https://supabase.com](https://supabase.com) and sign in or create a free account.
2. Click **New Project** and name it `whip-and-whisk` (choose any secure database password and a region close to your users).
3. Once your project is created, open the **SQL Editor** from the left sidebar.
4. Click **New Query**, copy the entire contents of `supabase_schema.sql` from this repository, paste it in, and click **Run**.
   - This automatically creates the `orders`, `products`, and `inquiries` tables.
   - Sets up Row Level Security (RLS) policies.
   - Populates initial menu items with pricing in Indian Rupees (₹).
5. Go to **Project Settings** (gear icon) → **API**:
   - Copy your **Project URL** (e.g., `https://xyzproject.supabase.co`).
   - Copy your **anon public** key (or `service_role` key).

---

## 🚀 Step 2: Deploy to Vercel

### Method A: One-Click GitHub Import (Recommended)

1. Go to [https://vercel.com](https://vercel.com) and log in with your GitHub account.
2. Click **Add New...** → **Project**.
3. Select your GitHub repository: `Askar786-era/whip-whisk_1.3`.
4. In the **Configure Project** screen:
   - **Framework Preset:** Leave as *Other*.
   - **Root Directory:** `./`
   - Expand the **Environment Variables** section and add:
     - `SUPABASE_URL` = *Your Supabase Project URL*
     - `SUPABASE_KEY` = *Your Supabase anon key*
     - `ADMIN_PIN` = `Mega130706`
5. Click **Deploy**.
6. Within ~30 seconds, Vercel will give you a live HTTPS URL (e.g., `https://whip-whisk-1-3.vercel.app`)!

---

## 👑 Step 3: Admin Portal Access

- **URL:** Open `https://your-vercel-domain.vercel.app/admin.html` (or `/admin`).
- **Default Password:** `Mega130706`
- **Features in Light Theme:**
  - 💰 Live Bake Sale Revenue & Order KPI metrics
  - 📋 Real-time Orders Management Table with status updating (Pending, Preparing, Dispatched, Delivered)
  - 🏷️ Catalog & Dynamic Rate Fixing (update INR prices on the fly)
  - 💌 Customer messages & contact inquiries feed
  - 📥 Instant CSV export for recordkeeping
  - 🔔 Sound alert notifications for incoming bake sale orders

---

## 🧪 Local Testing

To test locally with Supabase:
1. Create a `.env` file in the project root:
   ```env
   PORT=3000
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-supabase-anon-key
   ADMIN_PIN=Mega130706
   ```
2. Run:
   ```bash
   npm start
   ```
3. Open `http://localhost:3000` for Storefront or `http://localhost:3000/admin.html` for Admin.
