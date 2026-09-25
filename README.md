# The Borgo – Luxury MERN E-Commerce Store

An ultra-premium, full-stack MERN e-commerce application designed for high-end retail, featuring responsive layouts, custom customization flows, advanced analytics, multiple payment gateways, and automated marketing integrations.

> [!NOTE]
> This repository is a monorepo containing a frontend React application powered by Vite, and a backend Node.js API powered by Express and MongoDB.

---

## 🛠️ Technology Stack & Architecture

### Frontend (Client)
*   **Core Framework:** React 19.x (Modern Component architecture, custom Hooks, State Management)
*   **Build Tooling & Server:** Vite 8.x (Fast HMR, optimized production bundling)
*   **Styling:** Tailwind CSS 3.x (Clean utility-first styling with typography support)
*   **Animation & Interactivity:** Framer Motion 12.x & Lenis Smooth Scroll (Ultra-fluid page transitions and micro-interactions)
*   **UI Components & Libraries:** Swiper 12.x (Premium touch-enabled sliders), Recharts 3.x (Admin dashboard analytics graphs)
*   **SEO:** React Helmet Async (Dynamic metadata tags per page for optimized search engine discovery)

### Backend (Server)
*   **Core Runtime:** Node.js & Express 5.x (Modernized, modular router architectures)
*   **Database:** MongoDB via Mongoose 9.x (NoSQL modeling, robust validation, indexes)
*   **Security Headers & Protection:** Helmet (Security headers), Express Rate Limit (DDoS prevention), NoSQL Query Sanitizer
*   **Media Upload Management:** Multer & Cloudinary Storage Integration (High-performance image uploading & hosting)
*   **Artificial Intelligence:** Google Generative AI (Gemini SDK) & OpenAI integration for chat and AI features

### Third-Party Integrations
*   💳 **Payments:** Stripe (Global payment intents/webhooks) & Razorpay (Indian market checkout flow)
*   📧 **Transactional Emails:** Resend API (Order updates, automated cart recovery notifications)
*   🔑 **Authentication:** Custom JWT + Firebase Web/Admin SDK (Federated social logins & token verification)
*   🚚 **Shipping & Fulfillment:** Shiprocket Logistics API & Webhook handler (Real-time order synchronization)
*   💬 **Telephony & OTP:** Meta WhatsApp Business Cloud API (Instant login OTPs via WhatsApp templates)
*   📊 **Conversions Tracking:** Meta Conversions API (CAPI) server-side event dispatcher + browser pixel redundancy

---

## 📋 System Requirements

Ensure you have the following runtime environments installed locally:

| Software | Version Required | Recommendation |
| :--- | :--- | :--- |
| **Node.js** | `>= 18.20.0` or `>= 20.0.0` | Node.js `v20.x` (LTS) |
| **npm** | `>= 10.0.0` | Packaged with Node.js LTS |
| **MongoDB** | `>= 6.0` (Local or Atlas) | MongoDB Atlas Free Cluster |

---

## 🚀 Getting Started (Local Setup)

Follow these step-by-step instructions to get the application running on your local machine:

### 1. Install Dependencies
Install all package dependencies for both the frontend (`client`) and backend (`server`) modules at once using the root workspace helper script:
```bash
npm run install:all
```

### 2. Configure Environment Variables
Copy the environment template files and fill in your custom keys, credentials, and API endpoints.

1.  **Backend Config:** Create `server/.env` based on `server/.env.example` (or copy the corresponding section from the root `.env.example`).
2.  **Frontend Config:** Create `client/.env` based on `client/.env.example` (or copy the corresponding section from the root `.env.example`).

> [!IMPORTANT]
> A comprehensive `.env.example` detailing all keys is located in the project root directory. Do **not** commit actual `.env` files to Git.

### 3. Seed the Database
Initialize your MongoDB database with seed categories, pre-configured luxury canvas/nameplate products, and default admin/user accounts:
```bash
npm run seed
```
*(Seeded admin email defaults to `admin@gpsfdk.com` and password is printed to the console upon successful execution unless `ADMIN_PASSWORD` is configured in `server/.env`)*.

### 4. Run the Development Server
Launch both the frontend client and the backend server concurrently:
```bash
npm run dev
```
*   **Frontend Client:** Runs at [http://localhost:5173](http://localhost:5173) (Vite server)
*   **Backend API Server:** Runs at [http://localhost:5000](http://localhost:5000) (Express server)

---

## 📁 Workspace Structure

```text
├── client/                 # Frontend React application (Vite)
│   ├── src/
│   │   ├── components/     # UI, layouts, common, and page-specific elements
│   │   ├── pages/          # React Router pages (Product, Checkout, Admin, etc.)
│   │   └── content/        # Markdown SEO and blogs (Blogs, terms, etc.)
│   ├── package.json
│   └── vite.config.js
│
├── server/                 # Backend Node/Express API (CommonJS)
│   ├── config/             # DB connector and system settings
│   ├── controllers/        # Business logic for auth, orders, payments, etc.
│   ├── models/             # Mongoose database models (User, Product, Order)
│   ├── routes/             # REST endpoints structure
│   ├── seed.js             # Local MongoDB data seeding utility
│   └── index.js            # Main Express server entry point
│
├── .env.example            # Unified environment variables guide
├── package.json            # Root workspaces run scripts & dev dependencies
└── README.md               # Main project documentation (This file)
```

---

## 🧪 Verification & Commands

Below is a cheat sheet of root npm scripts available:

*   `npm run install:all` – Installs node_modules in both client and server packages.
*   `npm run dev` – Starts Express server and Vite frontend concurrently for active development.
*   `npm run build` – Triggers the production-grade static build bundle for the Vite client.
*   `npm run seed` – Resets your local collections and seeds mock records into MongoDB.
*   `npm start` – Runs production starts concurrently for client and server (local deployment emulation).

---

## ☁️ Hosting the API on Render

Every page load waits on this API, so its hosting decides how fast the site feels.

*   **Use a paid instance.** Render's free tier sleeps after 15 minutes idle, and the next visitor waits 30–60 s for it to wake (product pages show a spinner, previews time out).
*   **Use the Singapore region.** From India, a request to the current region takes about 1 s even for `/api/health`, which does no database work. That delay is network distance, not code, and it's paid on every call. Singapore is the closest Render region to India. Changing region means creating a new service there and switching `VITE_API_URL` (and the `gpsfdkrefresh.onrender.com` references in `client/vercel.json`) to its URL.
*   **Health check / keep-alive.** `GET /api/health` returns `{ status: 'OK' }` without touching the database. Set it as the service's Health Check Path in Render. On a paid instance nothing needs pinging; if the service ever runs on the free tier, an uptime monitor (e.g. UptimeRobot) hitting `https://gpsfdkrefresh.onrender.com/api/health` every 10 minutes keeps it awake.
*   **Caching.** Public catalogue reads (`/api/products`, `/api/products/:slug`, `/api/products/hot-selling`) are cached in memory for 5 minutes and sent with `Cache-Control: public, max-age=300, stale-while-revalidate=3600`. Admin product and category edits clear the in-memory cache immediately. `/api/pricing` depends on the visitor's country, so it's `private`.
