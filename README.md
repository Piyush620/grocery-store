# 📦 Shop POS System - Quick Start Guide

## Overview
A complete **offline POS (Point of Sale) system** built for a clothing shop selling:
- 👚 Female Suits (Salwar)
- 👧👦 Kids Dresses (Boys & Girls)

**Tech Stack:**
- **Backend:** Node.js + Express + SQLite
- **Frontend:** React + TypeScript
- **No internet required** - Runs locally on localhost

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v14+)
- npm

### Step 1: Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 2: Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

---

## ▶️ Running the System

### Terminal 1: Start Backend Server

```bash
cd backend
npm start
# OR manually
node server.js
```

**Expected Output:**
```
🚀 Server running on http://localhost:5000
Connected to SQLite database
```

### Terminal 2: Seed Sample Products

```bash
cd backend
node seed.js
```

**This adds sample products with barcodes:**
- SW001, SW002, SW003, SW004 - Female Suits
- KD001, KD002, KD003 - Kids Dresses

### Terminal 3: Start Frontend

```bash
cd frontend
npm start
```

**React app will open at:** `http://localhost:3000`

---

## 📝 How to Use the POS System

### Scanning a Product
1. **Barcode input** is automatically focused
2. **Type or scan** a barcode (e.g., `SW001`)
3. Product is instantly **added to cart**
4. **Duplicate scans** increase quantity (not duplicate entries)

### Managing Cart
- **View items** in the right panel
- **Remove items** by clicking the ✕ button
- **See total amount** in real-time

### Checkout
1. Click **💳 Checkout** button
2. Stock is automatically reduced in database
3. **Bill is generated** with timestamp
4. Cart clears automatically for next customer

### Start New Cart
- Click **🔄 New Cart** to reset quickly

---

## 🔌 API Endpoints

### Cart Management
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/cart/create` | Create new cart |
| POST | `/cart/add-item` | Add product to cart |
| GET | `/cart/:cartId` | Get cart details |
| POST | `/cart/remove-item` | Remove item from cart |
| POST | `/cart/checkout` | Finalize bill & reduce stock |
| POST | `/cart/clear` | Clear cart |

### Products
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/add-product` | Add new product |
| GET | `/products` | Get all products |
| POST | `/scan` | Scan barcode (returns product) |
| GET | `/search?q=query` | Search products |
| PUT | `/product/:id` | Update product |
| DELETE | `/product/:id` | Delete product |

### Attendance
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/checkin` | Employee check-in |
| POST | `/checkout` | Employee check-out |
| GET | `/attendance` | View attendance |

---

## 📂 Project Structure

```
shop-system/
├── backend/
│   ├── server.js          # Main Express server
│   ├── seed.js            # Sample data seeder
│   ├── db.sqlite          # SQLite database (auto-created)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx        # Main POS screen
│   │   ├── App.css        # Main styling
│   │   ├── CartDisplay.tsx    # Cart component
│   │   ├── CartDisplay.css    # Cart styling
│   │   ├── api.ts         # Backend API calls
│   │   ├── types.ts       # TypeScript types
│   │   └── index.tsx      # React entry point
│   └── package.json
```

---

## ✨ Features Implemented

### ✅ Phase 1: Core POS System
- [x] Barcode scanning
- [x] Shopping cart with duplicate handling
- [x] Real-time total calculation
- [x] Item removal
- [x] Checkout with stock reduction
- [x] Bill generation

### ✅ Phase 2: Beautiful UI
- [x] Professional POS interface
- [x] Responsive layout
- [x] Real-time feedback (success/error messages)
- [x] Clean, modern design

### ✅ Phase 3: Backend APIs
- [x] Cart management system
- [x] Product management
- [x] Stock tracking
- [x] Employee attendance

---

## 🧪 Testing the System

### Test Scenario 1: Single Item Purchase
1. Scan `SW001` once
2. See item in cart with qty: 1
3. Click Checkout
4. Verify stock reduced in database

### Test Scenario 2: Duplicate Scans
1. Scan `SW001`
2. Scan `SW001` again
3. Should show qty: 2 (not two separate entries)
4. Click Checkout
5. Stock should reduce by 2

### Test Scenario 3: Multiple Items
1. Scan `SW001`
2. Scan `KD001`
3. Scan `KD002`
4. See all 3 items in cart
5. Remove one item
6. Checkout with remaining 2

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if port 5000 is in use
# Kill process on port 5000 or change PORT in server.js
```

### Frontend can't connect to backend
```bash
# Ensure backend is running on http://localhost:5000
# Check API_URL in frontend/src/api.ts
# Check CORS is enabled in server.js
```

### Database locked errors
```bash
# Delete backend/db.sqlite and restart server
# Database will be recreated automatically
```

---

## 📋 Next Steps (Future Enhancements)

- [ ] Print receipt functionality
- [ ] Daily sales report
- [ ] Low stock alerts
- [ ] Customer management
- [ ] Discount system
- [ ] Multiple users/terminals
- [ ] Sale history export

---

## 📞 Support

For issues or questions about the POS system, refer to the backend `server.js` and frontend `App.tsx` files - they contain detailed comments explaining the logic.

---

**Happy selling! 🛍️**
