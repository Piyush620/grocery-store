import React from "react";
import { CartItem } from "./types";
import "./CartDisplay.css";

interface CartDisplayProps {
  items: CartItem[];
  totalAmount: number;
  onRemoveItem: (productId: number) => void;
}

const CartDisplay: React.FC<CartDisplayProps> = ({
  items,
  totalAmount,
  onRemoveItem,
}) => {
  return (
    <div className="cart-container">
      <h2>Shopping Cart</h2>

      {items.length === 0 ? (
        <p className="empty-cart">Cart is empty. Scan a barcode to start.</p>
      ) : (
        <>
          <div className="cart-items">
            {items.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="item-details">
                  <div className="item-name">{item.name}</div>
                  <div className="item-meta">
                    {item.category} • {item.size}
                  </div>
                </div>

                <div className="item-quantity">
                  <span className="qty">{item.quantity}x</span>
                </div>

                <div className="item-price">
                  <div className="unit-price">₹{item.price.toFixed(2)}</div>
                  <div className="line-total">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>

                <button
                  className="btn-remove"
                  onClick={() => onRemoveItem(item.id)}
                  title="Remove item"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div className="summary-row">
              <span>Items:</span>
              <span>
                {items.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            </div>
            <div className="summary-row total">
              <span>Total:</span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CartDisplay;
