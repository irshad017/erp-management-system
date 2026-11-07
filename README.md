# SkyBrisk ERP - Enterprise Resource Planning System (MERN Stack)

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Node](https://img.shields.io/badge/Node.js-v24+-green.svg)
![React](https://img.shields.io/badge/React-18-61dafb.svg)
![Express](https://img.shields.io/badge/Express-4.21-lightgrey.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-brightgreen.svg)
![Tailwind](https://img.shields.io/badge/TailwindCSS-v3.4-38bdf8.svg)

A full-featured, production-ready **Enterprise Resource Planning (ERP)** web application engineered with modern MERN architecture. Designed for mid-sized manufacturers, distributors, and logistics enterprises to streamline products, customer accounts, vendor relationships, procurement, sales orders, warehouse goods receipt notes (GRN), and corporate billing.

---

## 🌟 Key Features

### 1. 📊 Executive & Operational Dashboard
- **Real-Time KPIs**: Total Revenue, Procurement Costs, Net Operating Margin, and Active Orders.
- **Visual Analytics**: Interactive 6-month cashflow charts (Sales vs. Procurement) using Recharts.
- **Inventory Mix & Low Stock Alerts**: Instant reorder triggers when stock dips below safety thresholds.

### 2. 📦 Product & Inventory Management
- Full catalog CRUD with unique SKU validation, category categorization, selling price, and cost price.
- Live stock counters and automated safety reorder warnings.
- Multi-parameter filtering by search term, category, and stock health (In Stock, Low Stock, Out of Stock).

### 3. 👥 Customer & Supplier Directory
- Complete profile management with contact information, corporate billing addresses, and payment terms (Net 15, Net 30, Net 45).
- Purchase history and account notes.

### 4. 🛒 Sales Order Management & Fulfillment
- Multi-item line builder with auto-pricing, customizable tax calculation, and discounts.
- Order lifecycle tracking: `Confirmed` ➔ `Processing` ➔ `Shipped` ➔ `Delivered`.
- Automated stock decrementing on order placement.
- One-click transition from Sales Order to Corporate Invoice.

### 5. 📋 Purchase Orders & Procurement
- Supplier PO issuance with line-item expected costs and delivery scheduling.
- PO lifecycle tracking: `Draft` ➔ `Issued` ➔ `Partially Received` ➔ `Received`.

### 6. 🚚 Goods Receipt Notes (GRN) Module
- Dock receiving workflow directly linked to Purchase Orders.
- **Automated Inventory Sync**: Submitting a GRN automatically increments warehouse stock in MongoDB.
- PO fulfillment reconciliation: Marks orders as `Received` or `Partially Received` based on physical counts.

### 7. 📄 Invoicing & Corporate PDF Export
- Dynamic billing linked directly to Sales Orders.
- Status tracking (`Paid`, `Unpaid`, `Overdue`).
- **Client-Side PDF Generation**: Exports professional, print-ready corporate invoices via **jsPDF** and **AutoTable**.
- Reconciles payment status back to sales orders upon receipt.

### 8. 🔐 Security & Role-Based Access Control (RBAC)
- Token-based authentication using **JSON Web Tokens (JWT)** and **bcryptjs** password encryption.
- Multi-role authorization guards:
  - **Admin**: Complete system control, user management, and configuration.
  - **Sales**: Orders, Invoices, Customer accounts, and Dashboard.
  - **Purchase**: Procurement, Supplier accounts, PO issuance, and Products.
  - **Inventory**: Stock catalog, Reorder alerts, and Goods Receipt Notes (GRN).

---

## 🏗️ System Architecture

```
SkyBrisk/
├── backend/
│   ├── config/          # Database connection & Swagger UI setup
│   ├── controllers/     # Modular business logic controllers
│   ├── middleware/      # JWT auth, role guard & error handling
│   ├── models/          # Mongoose schemas (User, Product, Order, GRN, etc.)
│   ├── routes/          # Express route definitions
│   ├── seeder/          # Comprehensive demo dataset seeder
│   ├── tests/           # Jest integration & unit test suite
│   ├── server.js        # Express application entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/         # Axios client with JWT interceptors
│   │   ├── components/  # Reusable UI cards, tables, modals & badges
│   │   ├── pages/       # Dashboard, Products, Orders, GRN, Invoices, Admin
│   │   ├── redux/       # Redux Toolkit auth slice & store
│   │   ├── utils/       # jsPDF invoice generator & currency formatters
│   │   ├── App.jsx      # React Router v6 route configuration
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
├── docs/                # Architecture diagrams & API documentation
├── postman/             # Ready-to-import Postman Collection v2.1
├── README.md
└── package.json         # Root scripts for concurrent full-stack development
```

---

## ⚡ Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/)

> **Zero-Config Database**: The backend includes an automated in-memory MongoDB fallback (`mongodb-memory-server`) with pre-seeded demo records. You can run the entire application out-of-the-box without having an external MongoDB instance installed!

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd SkyBrisk
   ```

2. **Install dependencies:**
   ```bash
   # Install root dependencies
   npm install

   # Install backend dependencies
   cd backend && npm install

   # Install frontend dependencies
   cd ../frontend && npm install
   cd ..
   ```

3. **Start Development Servers Concurrently:**
   ```bash
   npm run dev
   ```
   - **Frontend App**: `http://localhost:5173`
   - **Backend API**: `http://localhost:5000`
   - **Interactive Swagger Docs**: `http://localhost:5000/api-docs`

---

## 🔑 Demo Login Credentials

The database comes pre-seeded with realistic enterprise users:

| Role | Email | Password | Access Scope |
|---|---|---|---|
| **System Admin** | `admin@erp.com` | `admin123` | Full access (including User Management) |
| **Sales Manager** | `sales@erp.com` | `sales123` | Dashboard, Customers, Sales Orders, Invoices |
| **Procurement Head** | `purchase@erp.com` | `purchase123` | Dashboard, Suppliers, Purchase Orders, Products |
| **Warehouse Officer** | `inventory@erp.com` | `inventory123` | Dashboard, Products, GRN Form, Stock updates |

*(The login screen also provides one-click quick-fill buttons for each demo role!)*

---

## 🧪 Testing

To execute the backend integration and business logic tests:
```bash
npm test
# or
cd backend && npm test
```

---

## 📮 API Documentation & Postman Collection

- **Swagger UI**: Navigate to `http://localhost:5000/api-docs` when the backend is running.
- **Postman Collection**: Import the file located at:
  ```
  postman/ERP_System_API.postman_collection.json
  ```

---

## 🚢 Deployment Guide

- **Frontend (Vercel / Netlify)**:
  - Root directory: `frontend`
  - Build command: `npm run build`
  - Output directory: `dist`
  - Environment variable: `VITE_API_URL=https://your-backend-api.onrender.com/api`

- **Backend (Render / Railway / Heroku)**:
  - Root directory: `backend`
  - Build command: `npm install`
  - Start command: `node server.js`
  - Environment variables: `MONGODB_URI`, `JWT_SECRET`, `PORT=5000`, `NODE_ENV=production`

---

## 📄 License
This project is licensed under the MIT License.
