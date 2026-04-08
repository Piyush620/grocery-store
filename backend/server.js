// ==========================
// IMPORTS
// ==========================
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");

// ==========================
// APP SETUP
// ==========================
const app = express();
app.use(cors());
app.use(express.json());

// ==========================
// CART MANAGEMENT (IN-MEMORY)
// ==========================
const carts = {}; // { cartId: { items: [], total: 0 } }

function generateCartId() {
  return "cart_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
}

// ==========================
// DATABASE CONNECTION
// ==========================
const db = new sqlite3.Database("./db.sqlite", (err) => {
  if (err) {
    console.error("Database error:", err.message);
  } else {
    console.log("Connected to SQLite database");
  }
});

// ==========================
// CREATE TABLES
// ==========================
db.serialize(() => {
  // PRODUCTS TABLE
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT,
      size TEXT,
      price REAL NOT NULL,
      quantity INTEGER DEFAULT 0,
      barcode TEXT UNIQUE NOT NULL
    )
  `);

  // ATTENDANCE TABLE
  db.run(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_name TEXT NOT NULL,
      check_in TEXT,
      check_out TEXT
    )
  `);
});

// ==========================
// ROOT ROUTE (TEST)
// ==========================
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

// ==========================
// ADD PRODUCT
// ==========================
app.post("/add-product", (req, res) => {
  const { name, category, size, price, quantity, barcode } = req.body;

  // Basic validation
  if (!name || !price || !barcode) {
    return res.status(400).json({
      error: "Name, price, and barcode are required",
    });
  }

  const query = `
    INSERT INTO products (name, category, size, price, quantity, barcode)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.run(
    query,
    [name, category, size, price, quantity || 0, barcode],
    function (err) {
      if (err) {
        return res.status(500).json({
          error: err.message,
        });
      }

      res.json({
        message: "Product added successfully",
        productId: this.lastID,
      });
    }
  );
});

// ==========================
// GET ALL PRODUCTS
// ==========================
app.get("/products", (req, res) => {
  db.all("SELECT * FROM products", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(rows);
  });
});

// ==========================
// SCAN BARCODE (FIXED - NO STOCK REDUCTION)
// ==========================
app.post("/scan", (req, res) => {
  const { barcode, cartId } = req.body;

  if (!barcode) {
    return res.status(400).json({ error: "Barcode is required" });
  }

  db.get(
    "SELECT * FROM products WHERE barcode = ?",
    [barcode],
    (err, product) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      if (product.quantity <= 0) {
        return res.status(400).json({ error: "Out of stock" });
      }

      // ✅ FIX: Do NOT reduce stock here
      // Just return product info for cart
      res.json({
        message: "Product scanned",
        product: product,
      });
    }
  );
});

// ==========================
// DELETE PRODUCT (OPTIONAL)
// ==========================
app.delete("/product/:id", (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM products WHERE id = ?", [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json({
      message: "Product deleted",
      changes: this.changes,
    });
  });
});

// ==========================
// EMPLOYEE CHECK-IN
// ==========================
app.post("/checkin", (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Employee name required" });
  }

  const time = new Date().toISOString();

  db.run(
    "INSERT INTO attendance (employee_name, check_in) VALUES (?, ?)",
    [name, time],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({
        message: "Checked in",
        id: this.lastID,
      });
    }
  );
});

// ==========================
// EMPLOYEE CHECK-OUT
// ==========================
app.post("/checkout", (req, res) => {
  const { id } = req.body;

  const time = new Date().toISOString();

  db.run(
    "UPDATE attendance SET check_out = ? WHERE id = ?",
    [time, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({
        message: "Checked out",
      });
    }
  );
});

// ==========================
// GET ATTENDANCE
// ==========================
app.get("/attendance", (req, res) => {
  db.all("SELECT * FROM attendance", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(rows);
  });
});

// ==========================
// UPDATE PRODUCT
// ==========================
app.put("/product/:id", (req, res) => {
  const { id } = req.params;
  const { name, category, size, price, quantity, barcode } = req.body;

  const query = `
    UPDATE products 
    SET name = ?, category = ?, size = ?, price = ?, quantity = ?, barcode = ?
    WHERE id = ?
  `;

  db.run(
    query,
    [name, category, size, price, quantity, barcode, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({
        message: "Product updated successfully",
        changes: this.changes,
      });
    }
  );
});

// ==========================
// GET SINGLE PRODUCT
// ==========================
app.get("/product/:id", (req, res) => {
  const { id } = req.params;

  db.get("SELECT * FROM products WHERE id = ?", [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!row) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(row);
  });
});

// ==========================
// SEARCH PRODUCTS
// ==========================
app.get("/search", (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: "Search query required" });
  }

  const query = `
    SELECT * FROM products 
    WHERE name LIKE ? OR category LIKE ? OR barcode LIKE ?
  `;

  db.all(query, [`%${q}%`, `%${q}%`, `%${q}%`], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(rows);
  });
});

// ==========================
// CART: CREATE NEW CART
// ==========================
app.post("/cart/create", (req, res) => {
  const cartId = generateCartId();
  carts[cartId] = {
    items: [],
    createdAt: new Date().toISOString(),
  };

  res.json({
    cartId: cartId,
    message: "Cart created",
  });
});

// ==========================
// CART: ADD ITEM TO CART
// ==========================
app.post("/cart/add-item", (req, res) => {
  const { cartId, product } = req.body;

  if (!cartId || !product) {
    return res.status(400).json({ error: "CartId and product required" });
  }

  if (!carts[cartId]) {
    return res.status(404).json({ error: "Cart not found" });
  }

  // Check if product already exists in cart
  const existingItem = carts[cartId].items.find(
    (item) => item.id === product.id
  );

  if (existingItem) {
    // ✅ Duplicate scan: increase quantity instead of duplicate entry
    existingItem.quantity += 1;
  } else {
    // New product: add to cart
    carts[cartId].items.push({
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.category,
      barcode: product.barcode,
      quantity: 1,
    });
  }

  res.json({
    message: "Item added to cart",
    cart: carts[cartId],
  });
});

// ==========================
// CART: GET CART DETAILS
// ==========================
app.get("/cart/:cartId", (req, res) => {
  const { cartId } = req.params;

  if (!carts[cartId]) {
    return res.status(404).json({ error: "Cart not found" });
  }

  const cartItems = carts[cartId].items;
  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  res.json({
    cartId: cartId,
    items: cartItems,
    itemCount: cartItems.length,
    totalAmount: parseFloat(total.toFixed(2)),
  });
});

// ==========================
// CART: REMOVE ITEM FROM CART
// ==========================
app.post("/cart/remove-item", (req, res) => {
  const { cartId, productId } = req.body;

  if (!carts[cartId]) {
    return res.status(404).json({ error: "Cart not found" });
  }

  carts[cartId].items = carts[cartId].items.filter(
    (item) => item.id !== productId
  );

  res.json({
    message: "Item removed from cart",
    cart: carts[cartId],
  });
});

// ==========================
// CART: CHECKOUT (FINALIZE BILL & REDUCE STOCK)
// ==========================
app.post("/cart/checkout", (req, res) => {
  const { cartId } = req.body;

  if (!cartId || !carts[cartId]) {
    return res.status(400).json({ error: "Invalid cart" });
  }

  const cartItems = carts[cartId].items;

  if (cartItems.length === 0) {
    return res.status(400).json({ error: "Cart is empty" });
  }

  // Process each item: reduce stock
  let failedUpdates = 0;

  cartItems.forEach((item) => {
    db.run(
      "UPDATE products SET quantity = quantity - ? WHERE id = ?",
      [item.quantity, item.id],
      (err) => {
        if (err) {
          failedUpdates++;
          console.error("Failed to update stock:", err);
        }
      }
    );
  });

  // Calculate total
  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Generate bill
  const bill = {
    billId: "BILL_" + Date.now(),
    items: cartItems,
    totalAmount: parseFloat(total.toFixed(2)),
    timestamp: new Date().toISOString(),
  };

  // Clear cart
  delete carts[cartId];

  res.json({
    message: "Checkout successful",
    bill: bill,
  });
});

// ==========================
// CART: CLEAR CART
// ==========================
app.post("/cart/clear", (req, res) => {
  const { cartId } = req.body;

  if (!carts[cartId]) {
    return res.status(404).json({ error: "Cart not found" });
  }

  delete carts[cartId];

  res.json({
    message: "Cart cleared",
  });
});

// ==========================
// START SERVER
// ==========================
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});