// ==========================
// IMPORTS
// ==========================
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const PDFDocument = require("pdfkit");
const path = require("path");

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
// PDF BILL GENERATION
// ==========================
function generateBillPDF(bill) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 30 });
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Header
      doc.fontSize(16).font("Helvetica-Bold").text("SHOP BILL", { align: "center" });
      doc.fontSize(10).font("Helvetica").text("Point of Sale System", { align: "center" });
      doc.moveTo(30, 80).lineTo(550, 80).stroke();

      // Bill Details
      doc.fontSize(9);
      doc.text(`Bill ID: ${bill.billId}`, 30, 90);
      doc.text(`Date: ${new Date(bill.timestamp).toLocaleString()}`, 30, 108);
      doc.moveTo(30, 125).lineTo(550, 125).stroke();

      // Table Header
      doc.fontSize(10).font("Helvetica-Bold");
      doc.text("Item", 30, 135, { width: 250 });
      doc.text("Qty", 280, 135, { width: 50, align: "center" });
      doc.text("Price", 330, 135, { width: 80, align: "right" });
      doc.text("Amount", 410, 135, { width: 100, align: "right" });

      doc.moveTo(30, 150).lineTo(550, 150).stroke();

      // Items
      doc.font("Helvetica").fontSize(9);
      let y = 160;

      bill.items.forEach((item) => {
        const amount = (item.price * item.quantity).toFixed(2);
        doc.text(item.name, 30, y, { width: 250 });
        doc.text(item.quantity.toString(), 280, y, { width: 50, align: "center" });
        doc.text(`₹${item.price.toFixed(2)}`, 330, y, { width: 80, align: "right" });
        doc.text(`₹${amount}`, 410, y, { width: 100, align: "right" });
        y += 20;
      });

      doc.moveTo(30, y).lineTo(550, y).stroke();
      y += 10;

      // Total
      doc.font("Helvetica-Bold").fontSize(11);
      doc.text("TOTAL", 30, y);
      doc.text(`₹${bill.totalAmount.toFixed(2)}`, 410, y, { width: 100, align: "right" });

      doc.moveTo(30, y + 20).lineTo(550, y + 20).stroke();
      y += 40;

      // Footer
      doc.fontSize(8).font("Helvetica").text("Thank you for your purchase!", { align: "center" });
      doc.text("Please visit again", { align: "center" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}


const db = new sqlite3.Database("./db.sqlite", (err) => {
  if (err) {
    console.error("Database error:", err.message);
  } else {
    console.log("Connected to SQLite database");
  }
});

// ==========================
// CREATE TABLES & MIGRATION
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

  // EMPLOYEES TABLE
  db.run(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      phone TEXT,
      email TEXT,
      position TEXT,
      salary REAL DEFAULT 0,
      hire_date TEXT,
      status TEXT DEFAULT 'active'
    )
  `);

  // ATTENDANCE TABLE - DROP & RECREATE TO FIX SCHEMA
  db.run(`DROP TABLE IF EXISTS attendance`, (err) => {
    if (!err) {
      db.run(`
        CREATE TABLE IF NOT EXISTS attendance (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          employee_id INTEGER NOT NULL,
          employee_name TEXT NOT NULL,
          check_in TEXT NOT NULL,
          check_out TEXT,
          duration_minutes INTEGER,
          date TEXT NOT NULL,
          FOREIGN KEY(employee_id) REFERENCES employees(id)
        )
      `);
    }
  });
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
// ATTENDANCE - CHECK-IN
// ==========================
app.post("/attendance/check-in", (req, res) => {
  const { employee_id, checkInTime } = req.body;

  if (!employee_id) {
    return res.status(400).json({ error: "Employee ID required" });
  }

  // Get employee name
  db.get("SELECT * FROM employees WHERE id = ?", [employee_id], (err, employee) => {
    if (err || !employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const now = new Date();
    // Use provided checkInTime or default to current time
    const finalCheckInTime = checkInTime ? new Date(checkInTime).toISOString() : now.toISOString();
    const date = now.toISOString().split('T')[0];

    // Check if employee already checked in today
    db.get(
      "SELECT * FROM attendance WHERE employee_id = ? AND date = ? AND check_out IS NULL",
      [employee_id, date],
      (err, existing) => {
        if (existing) {
          return res.status(400).json({ 
            error: "Employee already checked in today",
            checkInTime: existing.check_in
          });
        }

        db.run(
          "INSERT INTO attendance (employee_id, employee_name, check_in, date) VALUES (?, ?, ?, ?)",
          [employee_id, employee.name, finalCheckInTime, date],
          function (err) {
            if (err) {
              return res.status(500).json({ error: err.message });
            }

            res.json({
              message: `✓ ${employee.name} checked in`,
              id: this.lastID,
              checkInTime: finalCheckInTime,
            });
          }
        );
      }
    );
  });
});

// ==========================
// ATTENDANCE - CHECK-OUT
// ==========================
app.post("/attendance/check-out", (req, res) => {
  const { attendance_id } = req.body;

  if (!attendance_id) {
    return res.status(400).json({ error: "Attendance ID required" });
  }

  const now = new Date();
  const checkOutTime = now.toISOString();

  // Get the check-in record
  db.get(
    "SELECT * FROM attendance WHERE id = ?",
    [attendance_id],
    (err, record) => {
      if (err || !record) {
        return res.status(404).json({ error: "Attendance record not found" });
      }

      if (record.check_out) {
        return res.status(400).json({ error: "Already checked out" });
      }

      // Calculate duration in minutes
      const checkInTime = new Date(record.check_in);
      const checkOutTimeObj = new Date(checkOutTime);
      const durationMinutes = Math.floor((checkOutTimeObj - checkInTime) / (1000 * 60));

      db.run(
        "UPDATE attendance SET check_out = ?, duration_minutes = ? WHERE id = ?",
        [checkOutTime, durationMinutes, attendance_id],
        function (err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          res.json({
            message: `✓ ${record.employee_name} checked out`,
            checkOutTime: checkOutTime,
            durationMinutes: durationMinutes,
            durationHours: (durationMinutes / 60).toFixed(2),
          });
        }
      );
    }
  );
});

// ==========================
// ATTENDANCE - GET ALL ATTENDANCE
// ==========================
app.get("/attendance", (req, res) => {
  const { employee_id, date } = req.query;

  let query = "SELECT * FROM attendance WHERE 1=1";
  let params = [];

  if (employee_id) {
    query += " AND employee_id = ?";
    params.push(employee_id);
  }

  if (date) {
    query += " AND date = ?";
    params.push(date);
  }

  query += " ORDER BY date DESC, check_in DESC";

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(rows);
  });
});

// ==========================
// ATTENDANCE - GET TODAY'S ATTENDANCE
// ==========================
app.get("/attendance/today", (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  db.all(
    "SELECT * FROM attendance WHERE date = ? ORDER BY check_in ASC",
    [today],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json(rows);
    }
  );
});

// ==========================
// ATTENDANCE - GET EMPLOYEE ATTENDANCE REPORT
// ==========================
app.get("/attendance/report/:employee_id", (req, res) => {
  const { employee_id } = req.params;
  const { startDate, endDate } = req.query;

  let query = "SELECT * FROM attendance WHERE employee_id = ?";
  let params = [employee_id];

  if (startDate) {
    query += " AND date >= ?";
    params.push(startDate);
  }

  if (endDate) {
    query += " AND date <= ?";
    params.push(endDate);
  }

  query += " ORDER BY date DESC";

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const totalDuration = rows.reduce((sum, record) => sum + (record.duration_minutes || 0), 0);
    const presentDays = rows.filter(r => r.check_out).length;

    res.json({
      employee_id,
      records: rows,
      presentDays,
      totalMinutes: totalDuration,
      totalHours: (totalDuration / 60).toFixed(2),
    });
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
// EMPLOYEE MANAGEMENT - ADD EMPLOYEE
// ==========================
app.post("/employees", (req, res) => {
  const { name, phone, email, position, salary, hire_date } = req.body;

  if (!name || !position) {
    return res.status(400).json({
      error: "Name and position are required",
    });
  }

  const query = `
    INSERT INTO employees (name, phone, email, position, salary, hire_date, status)
    VALUES (?, ?, ?, ?, ?, ?, 'active')
  `;

  db.run(
    query,
    [name, phone || null, email || null, position, salary || 0, hire_date || new Date().toISOString().split('T')[0]],
    function (err) {
      if (err) {
        if (err.message.includes("UNIQUE")) {
          return res.status(400).json({ error: "Employee name already exists" });
        }
        return res.status(500).json({ error: err.message });
      }

      res.json({
        message: "Employee added successfully",
        employeeId: this.lastID,
      });
    }
  );
});

// ==========================
// EMPLOYEE MANAGEMENT - GET ALL EMPLOYEES
// ==========================
app.get("/employees", (req, res) => {
  db.all("SELECT * FROM employees WHERE status = 'active' ORDER BY name", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(rows);
  });
});

// ==========================
// EMPLOYEE MANAGEMENT - GET SINGLE EMPLOYEE
// ==========================
app.get("/employees/:id", (req, res) => {
  const { id } = req.params;

  db.get("SELECT * FROM employees WHERE id = ?", [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!row) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.json(row);
  });
});

// ==========================
// EMPLOYEE MANAGEMENT - UPDATE EMPLOYEE
// ==========================
app.put("/employees/:id", (req, res) => {
  const { id } = req.params;
  const { name, phone, email, position, salary } = req.body;

  if (!name || !position) {
    return res.status(400).json({
      error: "Name and position are required",
    });
  }

  const query = `
    UPDATE employees 
    SET name = ?, phone = ?, email = ?, position = ?, salary = ?
    WHERE id = ?
  `;

  db.run(
    query,
    [name, phone || null, email || null, position, salary || 0, id],
    function (err) {
      if (err) {
        if (err.message.includes("UNIQUE")) {
          return res.status(400).json({ error: "Employee name already exists" });
        }
        return res.status(500).json({ error: err.message });
      }

      res.json({
        message: "Employee updated successfully",
        changes: this.changes,
      });
    }
  );
});

// ==========================
// EMPLOYEE MANAGEMENT - DELETE EMPLOYEE
// ==========================
app.delete("/employees/:id", (req, res) => {
  const { id } = req.params;

  const query = `
    UPDATE employees SET status = 'inactive' WHERE id = ?
  `;

  db.run(query, [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json({
      message: "Employee removed",
      changes: this.changes,
    });
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
      size: product.size,
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
// BILL: GENERATE PDF
// ==========================
app.post("/bill/generate-pdf", async (req, res) => {
  try {
    const { billId, items, totalAmount, timestamp } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "Invalid bill data" });
    }

    const bill = {
      billId: billId || "BILL_" + Date.now(),
      items,
      totalAmount,
      timestamp: timestamp || new Date().toISOString(),
    };

    const pdfBuffer = await generateBillPDF(bill);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Bill_${bill.billId}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ error: "Failed to generate PDF: " + err.message });
  }
});

// ==========================
// STOCK MANAGEMENT - UPDATE STOCK
// ==========================
app.put("/stock/update/:id", (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  if (quantity === undefined || quantity === null) {
    return res.status(400).json({ error: "Quantity is required" });
  }

  db.run(
    "UPDATE products SET quantity = ? WHERE id = ?",
    [quantity, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({
        message: "Stock updated successfully",
        changes: this.changes,
      });
    }
  );
});

// ==========================
// STOCK MANAGEMENT - BULK UPDATE STOCK
// ==========================
app.post("/stock/bulk-update", (req, res) => {
  const { updates } = req.body;

  if (!Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({ error: "Invalid updates format" });
  }

  let completed = 0;
  let failed = 0;

  updates.forEach((update) => {
    db.run(
      "UPDATE products SET quantity = ? WHERE id = ?",
      [update.quantity, update.id],
      (err) => {
        if (err) {
          failed++;
          console.error("Failed to update stock for ID", update.id, err);
        } else {
          completed++;
        }

        if (completed + failed === updates.length) {
          res.json({
            message: `Stock updated`,
            updated: completed,
            failed: failed,
          });
        }
      }
    );
  });
});

// ==========================
// STOCK MANAGEMENT - GET STOCK REPORT
// ==========================
app.get("/stock/report", (req, res) => {
  db.all(
    "SELECT id, name, category, barcode, quantity, price FROM products ORDER BY category, name",
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const report = {
        totalProducts: rows.length,
        lowStockProducts: rows.filter((p) => p.quantity < 5).length,
        outOfStockProducts: rows.filter((p) => p.quantity === 0).length,
        products: rows,
      };

      res.json(report);
    }
  );
});

// ==========================
// STOCK MANAGEMENT - LOW STOCK ALERT
// ==========================
app.get("/stock/low-stock", (req, res) => {
  const threshold = req.query.threshold || 5;

  db.all(
    "SELECT id, name, category, barcode, quantity, price FROM products WHERE quantity <= ? ORDER BY quantity ASC",
    [threshold],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({
        threshold,
        count: rows.length,
        products: rows,
      });
    }
  );
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