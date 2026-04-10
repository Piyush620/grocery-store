import React, { useState, useEffect, useRef } from "react";
import CartDisplay from "./CartDisplay";
import EmployeeManagement from "./EmployeeManagement";
import AttendanceManagement from "./AttendanceManagement";
import AdminPortal from "./AdminPortal";
import {
  createCart,
  scanBarcode,
  addItemToCart,
  getCart,
  removeItemFromCart,
  checkout,
  generateBillPDF,
} from "./api";
import { CartItem, Bill } from "./types";
import "./App.css";

type TabType = "pos" | "employees" | "attendance" | "admin";

function App() {
  // Tab State
  const [activeTab, setActiveTab] = useState<TabType>("pos");

  // Cart State
  const [cartId, setCartId] = useState<string>("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);

  // UI State
  const [barcodeInput, setBarcodeInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [lastBill, setLastBill] = useState<Bill | null>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Initialize cart on mount
  useEffect(() => {
    initializeCart();
  }, []);

  // Auto-focus barcode input when POS tab is active
  useEffect(() => {
    if (activeTab === "pos" && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [activeTab]);

  // Initialize new cart
  const initializeCart = async () => {
    try {
      const { cartId: newCartId } = await createCart();
      setCartId(newCartId);
      setCartItems([]);
      setTotalAmount(0);
      setError("");
    } catch (err: any) {
      setError("Failed to create cart: " + err.message);
    }
  };

  // Scan barcode handler
  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!barcodeInput.trim()) {
      setError("Please enter a barcode");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Step 1: Scan barcode to get product
      const product = await scanBarcode(barcodeInput);

      // Step 2: Add product to cart
      await addItemToCart(cartId, product);

      // Step 3: Refresh cart display
      const updatedCart = await getCart(cartId);
      setCartItems(updatedCart.items);
      setTotalAmount(updatedCart.totalAmount);
      setSuccess(`✓ Added: ${product.name}`);

      // Clear barcode input
      setBarcodeInput("");

      // Auto-clear success message
      setTimeout(() => setSuccess(""), 2000);
    } catch (err: any) {
      setError("❌ " + err.message);
    } finally {
      setLoading(false);
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    }
  };

  // Remove item from cart
  const handleRemoveItem = async (productId: number) => {
    try {
      await removeItemFromCart(cartId, productId);
      const updatedCart = await getCart(cartId);
      setCartItems(updatedCart.items);
      setTotalAmount(updatedCart.totalAmount);
      setSuccess("Item removed");
      setTimeout(() => setSuccess(""), 1500);
    } catch (err: any) {
      setError("Failed to remove item: " + err.message);
    }
  };

  // Checkout handler
  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      setError("Cart is empty");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const bill = await checkout(cartId);
      setLastBill(bill);
      setSuccess("✓ Checkout successful!");

      // Generate and print PDF bill
      try {
        const pdfBlob = await generateBillPDF(bill);
        const pdfUrl = URL.createObjectURL(pdfBlob);
        
        // Open PDF in new window and print
        const printWindow = window.open(pdfUrl, "_blank");
        if (printWindow) {
          printWindow.onload = () => {
            printWindow.print();
          };
        }

        // Log bill to console as backup
        printBill(bill);
      } catch (pdfErr) {
        console.error("Failed to generate PDF:", pdfErr);
        printBill(bill); // Fallback to console print
      }

      // Start new cart after 2 seconds
      setTimeout(() => {
        initializeCart();
        setSuccess("");
        setLastBill(null);
      }, 2000);
    } catch (err: any) {
      setError("Checkout failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Print bill to console (for testing)
  const printBill = (bill: Bill) => {
    console.log("=== BILL ===");
    console.log(`Bill ID: ${bill.billId}`);
    console.log(`Time: ${new Date(bill.timestamp).toLocaleString()}`);
    console.log("---");
    bill.items.forEach((item) => {
      console.log(
        `${item.name} x${item.quantity} @ ₹${item.price} = ₹${(
          item.price * item.quantity
        ).toFixed(2)}`
      );
    });
    console.log("---");
    console.log(`Total: ₹${bill.totalAmount.toFixed(2)}`);
    console.log("===========");
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🏪 Shop Management System</h1>
        <nav className="tab-navigation">
          <button
            className={`tab-button ${activeTab === "pos" ? "active" : ""}`}
            onClick={() => setActiveTab("pos")}
          >
            📦 POS
          </button>
          <button
            className={`tab-button ${activeTab === "employees" ? "active" : ""}`}
            onClick={() => setActiveTab("employees")}
          >
            👥 Employees
          </button>
          <button
            className={`tab-button ${activeTab === "attendance" ? "active" : ""}`}
            onClick={() => setActiveTab("attendance")}
          >
            📅 Attendance
          </button>
          <button
            className={`tab-button ${activeTab === "admin" ? "active" : ""}`}
            onClick={() => setActiveTab("admin")}
          >
            ⚙️ Admin
          </button>
        </nav>
      </header>

      {/* POS Tab */}
      {activeTab === "pos" && (
        <div className="main-layout">
          {/* Left: Barcode Scanner */}
          <div className="scanner-section">
            <form onSubmit={handleScan} className="scan-form">
              <div className="form-group">
                <label htmlFor="barcode">Enter Barcode:</label>
                <input
                  ref={barcodeInputRef}
                  id="barcode"
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="Scan or type barcode..."
                  className="barcode-input"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                className="btn-scan"
                disabled={loading || !barcodeInput.trim()}
              >
                {loading ? "Scanning..." : "Scan"}
              </button>
            </form>

            {/* Messages */}
            {error && <div className="message error">{error}</div>}
            {success && <div className="message success">{success}</div>}

            {/* Checkout Button */}
            <div className="checkout-section">
              <button
                className="btn-checkout"
                onClick={handleCheckout}
                disabled={loading || cartItems.length === 0}
              >
                {loading ? "Processing..." : "💳 Checkout"}
              </button>

              <button
                className="btn-new-cart"
                onClick={initializeCart}
                disabled={loading}
              >
                🔄 New Cart
              </button>
            </div>

            {/* Last Bill Display */}
            {lastBill && (
              <div className="last-bill">
                <h3>✓ Bill Created</h3>
                <p>ID: {lastBill.billId}</p>
                <p>Total: ₹{lastBill.totalAmount.toFixed(2)}</p>
              </div>
            )}
          </div>

          {/* Right: Cart Display */}
          <div className="cart-section">
            <CartDisplay
              items={cartItems}
              totalAmount={totalAmount}
              onRemoveItem={handleRemoveItem}
            />
          </div>
        </div>
      )}

      {/* Employee Management Tab */}
      <EmployeeManagement isActive={activeTab === "employees"} />

      {/* Attendance Management Tab */}
      <AttendanceManagement isActive={activeTab === "attendance"} />

      {/* Admin Portal Tab */}
      <AdminPortal isActive={activeTab === "admin"} />
    </div>
  );
}

export default App;

