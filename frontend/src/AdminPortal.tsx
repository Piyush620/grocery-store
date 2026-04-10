import React, { useState, useEffect } from "react";
import { Product } from "./types";
import {
  getAllProducts,
  getStockReport,
  getLowStockProducts,
  updateStock,
  bulkUpdateStock,
  addProduct,
  deleteProduct,
} from "./api";
import "./AdminPortal.css";

interface AdminPortalProps {
  isActive: boolean;
}

function AdminPortal({ isActive }: AdminPortalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [stockReport, setStockReport] = useState<any>(null);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [viewMode, setViewMode] = useState<"all" | "low-stock" | "report" | "add-product">("all");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editQuantity, setEditQuantity] = useState<string>("");
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(5);

  // New Product Form State
  const [newProduct, setNewProduct] = useState<any>({
    name: "",
    category: "",
    size: "",
    price: "",
    quantity: "",
    barcode: "",
  });

  useEffect(() => {
    if (isActive) {
      loadData();
    }
  }, [isActive]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsData, reportData] = await Promise.all([
        getAllProducts(),
        getStockReport(),
      ]);
      setProducts(productsData);
      setStockReport(reportData);
      setViewMode("all");
      setError("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditStock = (product: Product) => {
    setEditingId(product.id);
    setEditQuantity(product.quantity.toString());
  };

  const handleSaveStock = async () => {
    if (!editingId) return;

    const newQuantity = parseInt(editQuantity, 10);
    if (isNaN(newQuantity) || newQuantity < 0) {
      setError("Invalid quantity");
      return;
    }

    try {
      setLoading(true);
      await updateStock(editingId, newQuantity);
      setSuccess("✓ Stock updated");
      setEditingId(null);
      await loadData();
      setTimeout(() => setSuccess(""), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditQuantity("");
  };

  const handleLoadLowStock = async () => {
    try {
      setLoading(true);
      const data = await getLowStockProducts(lowStockThreshold);
      setLowStockProducts(data.products);
      setViewMode("low-stock");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkRefill = async () => {
    if (lowStockProducts.length === 0) return;

    const updates = lowStockProducts.map((p) => ({
      id: p.id,
      quantity: lowStockThreshold * 5, // Refill to 5x threshold
    }));

    try {
      setLoading(true);
      const result = await bulkUpdateStock(updates);
      setSuccess(
        `✓ Updated ${result.updated} products. Failed: ${result.failed}`
      );
      await loadData();
      setTimeout(() => setSuccess(""), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportStock = () => {
    const csv = products
      .map((p) => `${p.id},"${p.name}","${p.category}",${p.quantity},${p.price}`)
      .join("\n");
    
    const header = "ID,Name,Category,Quantity,Price\n";
    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/csv;charset=utf-8," + encodeURIComponent(header + csv)
    );
    element.setAttribute("download", `stock_${new Date().toISOString().split("T")[0]}.csv`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    setSuccess("✓ Stock exported to CSV");
    setTimeout(() => setSuccess(""), 2000);
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.barcode || !newProduct.price) {
      setError("Name, Barcode, and Price are required");
      return;
    }

    try {
      setLoading(true);
      await addProduct({
        name: newProduct.name,
        category: newProduct.category || "Uncategorized",
        size: newProduct.size || "",
        price: parseFloat(newProduct.price),
        quantity: parseInt(newProduct.quantity) || 0,
        barcode: newProduct.barcode,
      });
      setSuccess("✓ Product added successfully");
      setNewProduct({ name: "", category: "", size: "", price: "", quantity: "", barcode: "" });
      setViewMode("all");
      await loadData();
      setTimeout(() => setSuccess(""), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      setLoading(true);
      await deleteProduct(id);
      setSuccess("✓ Product deleted successfully");
      await loadData();
      setTimeout(() => setSuccess(""), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isActive) return null;

  const displayProducts =
    viewMode === "low-stock" ? lowStockProducts : products;

  return (
    <div className="admin-portal">
      <div className="admin-container">
        {/* Control Panel */}
        <div className="admin-panel">
          <h2>⚙️ Stock Management</h2>

          {/* Stats */}
          {stockReport && (
            <div className="stats">
              <div className="stat">
                <span className="label">Total Products</span>
                <span className="value">{stockReport.totalProducts}</span>
              </div>
              <div className="stat">
                <span className="label">Low Stock</span>
                <span className="value warning">{stockReport.lowStockProducts}</span>
              </div>
              <div className="stat">
                <span className="label">Out of Stock</span>
                <span className="value alert">{stockReport.outOfStockProducts}</span>
              </div>
            </div>
          )}

          {/* Messages */}
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          {/* Controls */}
          <div className="controls">
            <button
              className={`btn ${viewMode === "all" ? "active" : ""}`}
              onClick={() => {
                setViewMode("all");
                loadData();
              }}
              disabled={loading}
            >
              📊 All Products
            </button>
            <button
              className={`btn ${viewMode === "low-stock" ? "active" : ""}`}
              onClick={handleLoadLowStock}
              disabled={loading}
            >
              ⚠️ Low Stock
            </button>
            <button
              className={`btn ${viewMode === "add-product" ? "active" : ""}`}
              onClick={() => setViewMode("add-product")}
              disabled={loading}
            >
              ➕ Add Product
            </button>
          </div>

          {/* Low Stock Threshold */}
          {viewMode === "low-stock" && (
            <div className="threshold-control">
              <label>Threshold (qty):</label>
              <input
                type="number"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 5)}
                min="1"
                max="100"
              />
              <button
                className="btn btn-primary"
                onClick={handleLoadLowStock}
                disabled={loading}
              >
                Refresh
              </button>
            </div>
          )}

          {/* Bulk Actions */}
          {viewMode === "low-stock" && lowStockProducts.length > 0 && (
            <div className="bulk-actions">
              <button
                className="btn btn-refill"
                onClick={handleBulkRefill}
                disabled={loading}
              >
                📦 Bulk Refill ({lowStockProducts.length})
              </button>
            </div>
          )}

          {/* Export */}
          <button
            className="btn btn-export"
            onClick={handleExportStock}
            disabled={loading || products.length === 0}
          >
            📥 Export to CSV
          </button>
        </div>

        {/* Products Table or Add Product Form */}
        <div className="products-section">
          {viewMode === "add-product" ? (
            <>
              <h3>➕ Add New Product</h3>
              
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                <div className="form-group">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="e.g., Salwar Suit - Blue"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label>Barcode *</label>
                  <input
                    type="text"
                    value={newProduct.barcode}
                    onChange={(e) => setNewProduct({ ...newProduct, barcode: e.target.value })}
                    placeholder="e.g., SW001"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label>Category</label>
                  <input
                    type="text"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    placeholder="e.g., Female Suits"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label>Size</label>
                  <input
                    type="text"
                    value={newProduct.size}
                    onChange={(e) => setNewProduct({ ...newProduct, size: e.target.value })}
                    placeholder="e.g., M, L, XL"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label>Price (₹) *</label>
                  <input
                    type="number"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    placeholder="e.g., 1500"
                    min="0"
                    step="0.01"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label>Initial Stock Quantity</label>
                  <input
                    type="number"
                    value={newProduct.quantity}
                    onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })}
                    placeholder="e.g., 20"
                    min="0"
                    disabled={loading}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  className="btn btn-primary"
                  onClick={handleAddProduct}
                  disabled={loading}
                  style={{ flex: 1 }}
                >
                  {loading ? "Adding..." : "✓ Add Product"}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setViewMode("all");
                    setNewProduct({ name: "", category: "", size: "", price: "", quantity: "", barcode: "" });
                    setError("");
                  }}
                  disabled={loading}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <h3>
                {viewMode === "low-stock"
                  ? `Low Stock Products (${lowStockProducts.length})`
                  : `All Products (${products.length})`}
              </h3>

              {loading && displayProducts.length === 0 && <p>Loading...</p>}
              {displayProducts.length === 0 && !loading && (
                <p className="no-data">No products found</p>
              )}

              {displayProducts.length > 0 && (
                <div className="products-table-wrapper">
                  <table className="products-table">
                    <thead>
                      <tr>
                        <th>Product Name</th>
                        <th>Category</th>
                        <th>Barcode</th>
                        <th>Price</th>
                        <th>Current Stock</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayProducts.map((product) => (
                        <tr
                          key={product.id}
                          className={
                            product.quantity === 0
                              ? "out-of-stock"
                              : product.quantity < 5
                              ? "low-stock"
                              : ""
                          }
                        >
                          <td className="name">{product.name}</td>
                          <td>{product.category}</td>
                          <td className="barcode">{product.barcode}</td>
                          <td className="price">₹{product.price.toFixed(2)}</td>
                          <td className="stock-cell">
                            {editingId === product.id ? (
                              <input
                                type="number"
                                value={editQuantity}
                                onChange={(e) => setEditQuantity(e.target.value)}
                                min="0"
                                autoFocus
                                className="stock-input"
                              />
                            ) : (
                              <span className="stock-value">{product.quantity}</span>
                            )}
                          </td>
                          <td className="action-cell">
                            {editingId === product.id ? (
                              <div className="action-buttons">
                                <button
                                  className="btn-save"
                                  onClick={handleSaveStock}
                                  disabled={loading}
                                >
                                  ✓
                                </button>
                                <button
                                  className="btn-cancel"
                                  onClick={handleCancelEdit}
                                  disabled={loading}
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <div className="action-buttons">
                                <button
                                  className="btn-edit"
                                  onClick={() => handleEditStock(product)}
                                  disabled={loading}
                                >
                                  Edit
                                </button>
                                <button
                                  className="btn-cancel"
                                  onClick={() => handleDeleteProduct(product.id)}
                                  disabled={loading}
                                  title="Delete product"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPortal;
