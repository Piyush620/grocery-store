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
  size: string;
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

export interface Employee {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  position: string;
  salary: number;
  hire_date: string;
  status: string;
}

export interface Attendance {
  id: number;
  employee_id: number;
  employee_name: string;
  check_in: string;
  check_out?: string;
  duration_minutes?: number;
  date: string;
}
