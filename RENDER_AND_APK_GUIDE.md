# 📖 Whip & Whisk: MongoDB Compass, Render Deployment & Android APK Guide

This complete guide details step-by-step instructions to connect your **MongoDB Database via Compass**, deploy your live website to **Render.com**, and compile the project into a native **Android `.apk` file**.

---

## 🍃 Part 1: Setting up MongoDB Database & MongoDB Compass

### 1. Create a Free MongoDB Database (MongoDB Atlas)
1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and sign up for a free account.
2. Click **Create a Deployment** and select the **M0 Free Tier**.
3. Under **Database Access**, create a database user (e.g. Username: `whip_admin`, Password: `YourPassword123`).
4. Under **Network Access**, add IP Address `0.0.0.0/0` (Allows connection from everywhere including Render).
5. Click **Connect** &rarr; Choose **Compass**.
6. Copy your MongoDB Connection URI string:
   ```text
   mongodb+srv://whip_admin:YourPassword123@cluster0.mongodb.net/whip_whisk?retryWrites=true&w=majority
   ```

### 2. View Database in MongoDB Compass (Desktop App)
1. Download & Install [MongoDB Compass GUI](https://www.mongodb.com/try/download/compass).
2. Open MongoDB Compass.
3. Paste your connection URI string into the connection box.
4. Click **Connect**.
5. You will now see the `whip_whisk` database with collections:
   - `orders`: All customer bake sale orders placed on the site.
   - `products`: Catalog treats and live prices.
   - `inquiries`: Customer contact messages.

---

## 🚀 Part 2: Step-by-Step Deployment on Render (render.com)

Render allows you to host full-stack Node.js web applications with SSL certificates for free.

### Step 1: Push Code to GitHub
1. Create a new repository on GitHub named `whip-and-whisk`.
2. Open your terminal in this project folder and run:
   ```bash
   git init
   git add .
   git commit -m "Initial Whip & Whisk fullstack deployment with Admin portal"
   git branch -M main
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/whip-and-whisk.git
   git push -u origin main
   ```

### Step 2: Create Web Service on Render
1. Log in to [dashboard.render.com](https://dashboard.render.com/).
2. Click **New +** &rarr; Select **Web Service**.
3. Select your GitHub repository (`whip-and-whisk`).
4. Fill in the deployment details:
   - **Name**: `whip-and-whisk`
   - **Region**: Choose closest to your target audience (e.g. Singapore / Frankfurt / Oregon).
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: `Free`

### Step 3: Configure Environment Variables on Render
Scroll down to the **Environment Variables** section on Render and add:

| Key | Value |
| :--- | :--- |
| `PORT` | `3000` |
| `MONGODB_URI` | `mongodb+srv://whip_admin:YourPassword123@cluster0.mongodb.net/whip_whisk?retryWrites=true&w=majority` |
| `ADMIN_PIN` | `2025` *(or your custom secret PIN)* |

### Step 4: Deploy & Access Live Website
1. Click **Create Web Service**.
2. Render will build and launch your application.
3. Once finished, Render provides your live URL (e.g. `https://whip-and-whisk.onrender.com`).
4. Access your Admin Dashboard at: `https://whip-and-whisk.onrender.com/admin.html` (PIN: `2025`).

---

## 📱 Part 3: Compiling Website into an Android APK File

You can package the Whip & Whisk web app into a native Android `.apk` file using **Capacitor**.

### Step 1: Install Dependencies
Open your project terminal and run:
```bash
npm install
npm install @capacitor/core @capacitor/cli @capacitor/android
```

### Step 2: Initialize & Add Android Platform
Run the following commands:
```bash
# Initialize Capacitor (configured via capacitor.config.json)
npx cap init "Whip & Whisk" "com.whipandwhisk.bakesale" --web-dir "."

# Add the Android native folder
npx cap add android

# Sync web code into the native Android folder
npx cap sync
```

### Step 3: Build APK File
You have **2 methods** to generate the APK:

#### Method A: Using Command Line Gradle (Fastest)
1. Navigate into the generated `android` folder:
   ```bash
   cd android
   ```
2. Build the debug APK:
   - **Windows PowerShell**:
     ```powershell
     .\gradlew assembleDebug
     ```
   - **Linux/Mac**:
     ```bash
     ./gradlew assembleDebug
     ```
3. Your generated `.apk` file will be located at:
   ```text
   android/app/build/outputs/apk/debug/app-debug.apk
   ```

#### Method B: Using Android Studio
1. Run:
   ```bash
   npx cap open android
   ```
2. Android Studio will open your project automatically.
3. In Android Studio top menu, click **Build** &rarr; **Build Bundle(s) / APK(s)** &rarr; **Build APK(s)**.
4. Once completed, click **locate** in the popup to view your `app-debug.apk` file.

### Step 4: Install APK on Android Phone
1. Transfer `app-debug.apk` to your Android phone via USB, email, or WhatsApp.
2. Tap the APK file on your phone.
3. Allow **"Install from unknown sources"** when prompted.
4. Open the **Whip & Whisk** native app on your phone! 🍰

---

## 👑 Quick Admin Access Reference

- **Storefront URL**: [index.html](file:///c:/Users/ELCOT/OneDrive/Desktop/whip%20&%20whisk/index.html)
- **Admin Dashboard URL**: [admin.html](file:///c:/Users/ELCOT/OneDrive/Desktop/whip%20&%20whisk/admin.html)
- **Default Admin PIN**: `2025`
