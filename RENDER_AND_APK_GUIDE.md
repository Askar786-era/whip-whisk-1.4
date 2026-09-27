# 🍰 Whip & Whisk: Render Deployment, Android APK & Admin Guide

This guide covers everything you need to **push your project to Render**, generate the **Android APK**, and manage the site.

---

## ⚡ What was updated:
1. **Currency Changed to ₹ (Indian Rupee)** across storefront, treats, fundraiser goal tracker, checkout cart, customer profiles, and the admin dashboard.
2. **Split Customer Authentication**:
   - **Div 1: Existing User (Old Login)** – Email/phone, password, remember me, quick demo login.
   - **Div 2: New User (New Login / Register)** – Full name, email, phone, password with confirmation.
3. **Uploaded Section Removed**: The extra delights/uploaded gallery was cleanly removed from the storefront.
4. **Dedicated Admin Page (`admin.html`)**: Complete standalone portal with password protection (`Mega130706`), live orders, rate fixing in ₹, and customer contact inquiries.
5. **Turnkey APK Generation**: Automated with Capacitor 6 and 1-click batch script `build-apk.bat`.

---

## 🚀 Part 1: How to Push & Deploy on Render (render.com)

The project is already pre-configured with `render.yaml` and a Git repository has been initialized with an initial commit.

### Step 1: Create a GitHub Repository
1. Go to [github.com/new](https://github.com/new).
2. Name your repository (e.g. `whip-and-whisk`).
3. Leave it **Public** or **Private**, do **not** initialize with README (we already have all files).
4. Click **Create repository**.

### Step 2: Push Your Code from Terminal
Open your project terminal and run:
```bash
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/whip-and-whisk.git
git push -u origin main
```
*(Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username).*

### Step 3: Deploy on Render
1. Go to [dashboard.render.com](https://dashboard.render.com/).
2. Click **New +** &rarr; Select **Web Service**.
3. Connect your GitHub repository (`whip-and-whisk`).
4. Render automatically reads our `render.yaml` file:
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: `Free`
5. *(Optional)* Add your MongoDB Atlas connection string in **Environment Variables**:
   - `MONGODB_URI` = `mongodb+srv://<username>:<password>@cluster0.mongodb.net/whip_whisk?retryWrites=true&w=majority`
   - `ADMIN_PIN` = `Mega130706`
6. Click **Deploy Web Service**! Render will deploy your live website with free SSL HTTPS.

---

## 📱 Part 2: How to Make the Android APK

The native Android project is already created in the `android/` directory and synced with Capacitor.

### Option A: 1-Click Batch Script (Easiest)
Simply double-click or run:
```cmd
build-apk.bat
```
This script automatically:
- Copies web assets to `www/`
- Runs `capacitor sync android`
- Checks for Java / Android Studio JDK
- Compiles the debug APK or launches Android Studio with 1 click.

### Option B: Build via Android Studio
1. In your project terminal, run:
   ```cmd
   npm run apk:open
   ```
2. Android Studio will open the native project.
3. Wait for Gradle sync to finish.
4. Go to top menu: **Build** &rarr; **Build Bundle(s) / APK(s)** &rarr; **Build APK(s)**.
5. In the bottom-right notification popup, click **locate**.
6. Your `.apk` file is located at:
   ```text
   android\app\build\outputs\apk\debug\app-debug.apk
   ```
7. Send this file to your Android phone via WhatsApp, Drive, or USB and tap to install!

---

## 👑 Part 3: Accessing the Dedicated Admin Page

- **Storefront URL**: [index.html](file:///c:/Users/ELCOT/OneDrive/Desktop/whip%20&%20whisk/index.html)
- **Admin Dashboard URL**: [admin.html](file:///c:/Users/ELCOT/OneDrive/Desktop/whip%20&%20whisk/admin.html)
- **Default Admin Password**: `Mega130706`
