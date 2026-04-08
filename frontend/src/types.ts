// Types for POS System

export interface Product {
  id: number;
  name: string;
  category: string;
  size: string;
  price: number;
  quantity: number;
  barcode: string;
}

export interface CartItem {
  id: number;
  name: string;
  price: number;
  category: string;
  barcode: string;
  quantity: number;
}

export interface Cart {
  cartId: string;
  items: CartItem[];
  itemCount: number;
  totalAmount: number;
}

export interface Bill {
  billId: string;
  items: CartItem[];
  totalAmount: number;
  timestamp: string;
}
