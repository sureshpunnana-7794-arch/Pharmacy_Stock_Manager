# PharmaStock Pro — Modern Pharmacy Stock & Inventory Management System

[![Live Demo](https://img.shields.io/badge/Demo-Live%20on%20GitHub%20Pages-success?style=for-the-badge&logo=github)](https://sureshpunnana-7794-arch.github.io/Pharmacy_Stock_Manager/)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-purple.svg)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-4.19-lightgrey.svg)](https://expressjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

🔗 **Live Demo URL:** [https://sureshpunnana-7794-arch.github.io/Pharmacy_Stock_Manager/](https://sureshpunnana-7794-arch.github.io/Pharmacy_Stock_Manager/)

> **PharmaStock Pro** is a comprehensive, full-stack pharmacy stock management and dispensing application designed to track inventory levels, monitor stock movements in real time, manage sales and supplier purchases, and proactively avoid stockouts and expired medicine dispensation.

---

## 🌟 Highlights & Capabilities

### 1. 📦 Inventory & Drug Catalog Management
- **Detailed Medicine Directory**: Track medications by Brand Name, Generic / Chemical Formula, Dosage Form (Tablets, Syrups, Injections, Ointments, Inhalers), Strength, SKU, Batch Number, Storage Rack/Shelf location, and Schedule H / Rx prescription flag.
- **Dynamic Stock Level Monitoring**: Real-time visibility of current units on hand against minimum reorder thresholds.
- **Safety Valuation**: Automatically calculates both Purchase Cost Value and Retail Selling (MRP) Value, surfacing total store margin.
- **Stock Reconciliation & Audits**: Dedicated reconciliation modal for manual count adjustments, broken vial deductions, and physical audit verifications with complete audit logging.

### 2. 🛡️ Stockout Prevention & Expiry Protection (Avoid Running Out of Items)
- **Zero-Stock Out-of-Stock Watchlist**: Immediately alerts pharmacists to medicines at 0 units with a 1-click "Create Restock PO" action.
- **Automated Reorder Requisition Plan**: Dynamically calculates recommended restock quantities based on lead times and safety stock margins:
  $$\text{Suggested Order Qty} = \lceil \text{MinReorderLevel} \times 2.5 \rceil - \text{CurrentStock}$$
- **Patient Safety Expiry Guard**:
  - Automatically identifies expired batches and **blocks** them from being dispensed in the Point of Sale.
  - Warns on upcoming expirations within 30 and 60 days to enable First-Expiry-First-Out (FEFO) dispensing.
  - 1-Click "Write-off Disposal" to decommission expired stock safely per biomedical guidelines.
- **Export Restock Order Sheet**: 1-click CSV export ready to send directly to distributors.

### 3. 🧾 Point of Sale (POS) Billing & Dispensing
- **Fast Dispensing Terminal**: Search catalog items by brand, generic name, or barcode.
- **Real-Time Stock Verification**: Prevents overselling beyond available batch quantity.
- **Prescription & Patient Tracking**: Record customer/patient name, contact number, and prescribing physician.
- **Taxes & Discounts**: Configurable GST/VAT and discount percentages.
- **Printable Tax Invoices**: Formatted, print-ready sales receipt adhering to pharmacy regulations (`@media print` support with pharmacy license details, itemized batch numbers, and pharmacist signature block).

### 4. 🚚 Stock Inward Entry & Supplier Management
- **Purchase Orders (Inward Goods)**: Log delivery challans from pharmaceutical distributors, auto-updating existing stock counts and batch numbers.
- **Distributor Directory**: Manage distributor contacts, drug license / GSTIN numbers, and payment terms (Net 30, Net 45, etc.).

### 5. 📜 Immutable Stock Movements Audit Trail
- **Complete Timeline of Every Unit Change**:
  - `STOCK_IN`: Inward distributor shipments and initial stock.
  - `STOCK_OUT`: Customer sales and dispensed prescriptions.
  - `ADJUSTMENT`: Inventory audit corrections and return reconciliations.
  - `DISPOSAL`: Expired or damaged stock write-offs.
- Logs exact timestamps, quantity deltas, balances before and after, invoice/PO reference numbers, and pharmacist names.

### 6. 📊 Visual Dashboard & Analytics
- **Live KPI Metrics**: Total medicines, inventory valuation, today's sales revenue, and critical alert counts.
- **Interactive Visualizations**: 7-day sales and dispensing trend chart, and therapeutic category breakdown using Recharts.
- **Top Moving Drugs**: Ranks top dispensed medicines by volume and revenue.

---

## 🏗️ Architecture & Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite | Ultra-fast single-page application with modern responsive UI |
| **Data Visualization** | Recharts | Interactive revenue trends and category distribution charts |
| **Icons & Design** | Custom SVG Glyphs & CSS Variables | Responsive layout, modern color palette, printable stylesheets |
| **Backend API** | Node.js, Express | Modular REST API with CORS, rate safety, and error handling |
| **Database** | Embedded JSON Store | Zero-configuration ACID-style atomic file-backed persistence |
| **Orchestrator** | Concurrently | Single-command developer experience running frontend & backend |

---

## 📂 Project Structure

```text
Pharmacy_Stock_Manager/
├── package.json                 # Root scripts (install:all, dev, build, start)
├── README.md                    # Project documentation
├── .gitignore                   # Git exclusion rules
├── server/
│   ├── package.json             # Server dependencies & scripts
│   ├── server.js                # Express app entry & static build serving
│   ├── test_logic.js            # Automated verification test suite
│   ├── .env.example             # Server environment variables template
│   ├── data/
│   │   └── pharmacy_store.json  # Persistent JSON database (auto-seeded)
│   └── src/
│       ├── config/
│       │   └── db.js            # Atomic persistence manager & seed loader
│       ├── middleware/
│       │   └── errorHandler.js  # Global error & 404 handlers
│       ├── routes/
│       │   ├── dashboard.js     # KPIs, sales trends, category stats, alerts
│       │   ├── medicines.js     # Medicine CRUD, stock adjustment, filters
│       │   ├── sales.js         # POS checkout, stock deduction, invoices
│       │   ├── purchases.js     # Inward PO entry, stock replenishment
│       │   ├── movements.js     # Stock movement audit logging
│       │   └── suppliers.js     # Distributor management
│       └── utils/
│           └── seedData.js      # Rich initial pharmaceutical catalog & logs
└── client/
    ├── package.json             # Frontend dependencies
    ├── vite.config.js           # Vite config with API proxy
    ├── index.html               # Web root with fonts and favicon
    └── src/
        ├── main.jsx             # React DOM root
        ├── App.jsx              # Main layout & modal controller
        ├── index.css            # Design system, styling & print rules
        ├── components/
        │   ├── Icons.jsx        # Healthcare & ERP SVG glyphs
        │   ├── Navbar.jsx       # Header with live clock & quick action buttons
        │   ├── Sidebar.jsx      # Navigation links with live badge counts
        │   ├── StatCard.jsx     # KPI metric card
        │   ├── Modal.jsx        # Accessible backdrop modal
        │   ├── ReceiptModal.jsx # Printable tax invoice modal
        │   ├── MedicineModal.jsx# Add/Edit medicine form
        │   ├── PurchaseModal.jsx# Inward goods PO modal
        │   ├── SupplierModal.jsx# Distributor registration modal
        │   └── StockAdjustmentModal.jsx # Stock audit reconciliation
        ├── pages/
        │   ├── Dashboard.jsx    # Analytics dashboard
        │   ├── Inventory.jsx    # Filterable stock table with CSV export
        │   ├── POSBilling.jsx   # Point of Sale & receipt archive
        │   ├── StockMovements.jsx # Audit trail
        │   ├── Purchases.jsx    # Purchase orders history
        │   ├── Suppliers.jsx    # Distributors directory
        │   └── AlertsReplenishment.jsx # Stockout prevention center
        ├── services/
        │   └── api.js           # API HTTP client
        └── utils/
            ├── formatters.js    # Currency, date, and badge helpers
            └── exportToCsv.js   # Client-side CSV generator
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/sureshpunnana-7794-arch/Pharmacy_Stock_Manager.git
   cd Pharmacy_Stock_Manager
   ```

2. **Install all dependencies**:
   ```bash
   npm run install:all
   ```
   *(Or individually inside `client/` and `server/` with `npm install`)*

---

## 💻 Running the Application

### Option A: Development Mode (Hot-Reloading)
Run both backend API (`:5000`) and frontend Vite dev server (`:5173`) concurrently:
```bash
npm run dev
```
Open your browser at **`http://localhost:5173`**.

### Option B: Production Build & Run
Build the frontend and serve directly via Express on port 5000:
```bash
npm run build
npm start
```
Open your browser at **`http://localhost:5000`**.

---

## 🧪 Running Automated Tests

Run the core business logic test suite:
```bash
cd server
npm test
```
Verifies initial seeding, stockout detection, expiry guards, stock adjustment reconciliations, audit trail consistency, and sales calculations.

---

## 📡 REST API Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/dashboard/stats` | High-level KPIs, inventory valuation, today's sales |
| `GET` | `/api/dashboard/sales-trend` | 7-day revenue and order counts for charts |
| `GET` | `/api/dashboard/category-stats`| Stock distribution by therapeutic category |
| `GET` | `/api/dashboard/top-selling` | Top 5 moving medicines by volume |
| `GET` | `/api/dashboard/alerts` | Urgent out-of-stock, low-stock, and expired lists |
| `GET` | `/api/medicines` | Filter medicines by search, category, stock status |
| `POST` | `/api/medicines` | Add new drug to catalog and log initial stock |
| `PUT` | `/api/medicines/:id` | Update medicine specifications |
| `DELETE`| `/api/medicines/:id` | Remove medicine from catalog |
| `POST` | `/api/medicines/:id/adjust-stock` | Reconcile stock count with audit reason |
| `GET` | `/api/sales` | List past sales receipts |
| `POST` | `/api/sales` | Process prescription bill, deduct stock, generate invoice |
| `GET` | `/api/purchases` | List inward purchase orders |
| `POST` | `/api/purchases` | Record inward goods delivery and restock batches |
| `GET` | `/api/movements` | Query full inventory audit trail |
| `GET` | `/api/suppliers` | List pharmaceutical distributors |
| `POST` | `/api/suppliers` | Register new distributor |
| `POST` | `/api/admin/reset` | Reset demo data to default sample state |

---

## 📄 License

This project is open-source and distributed under the **MIT License**.

**Author:** [PUNNANA SURESH](https://github.com/sureshpunnana-7794-arch)
