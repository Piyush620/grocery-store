import { Product, Bill } from "./types";

const API_URL = "http://localhost:5000";

// ============ CART MANAGEMENT ============

export async function createCart(): Promise<{ cartId: string }> {
  const response = await fetch(`${API_URL}/cart/create`, {
    method: "POST",
  });
  return response.json();
}

export async function scanBarcode(barcode: string): Promise<Product> {
  const response = await fetch(`${API_URL}/scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ barcode }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  const data = await response.json();
  return data.product;
}

export async function addItemToCart(
  cartId: string,
  product: Product
): Promise<any> {
  const response = await fetch(`${API_URL}/cart/add-item`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cartId, product }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return response.json();
}

export async function getCart(cartId: string): Promise<any> {
  const response = await fetch(`${API_URL}/cart/${cartId}`);
  return response.json();
}

export async function removeItemFromCart(
  cartId: string,
  productId: number
): Promise<any> {
  const response = await fetch(`${API_URL}/cart/remove-item`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cartId, productId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return response.json();
}

export async function checkout(cartId: string): Promise<Bill> {
  const response = await fetch(`${API_URL}/cart/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cartId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  const data = await response.json();
  return data.bill;
}

export async function clearCart(cartId: string): Promise<void> {
  await fetch(`${API_URL}/cart/clear`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cartId }),
  });
}

// ============ PRODUCTS ============

export async function getAllProducts(): Promise<Product[]> {
  const response = await fetch(`${API_URL}/products`);
  return response.json();
}

export async function searchProducts(query: string): Promise<Product[]> {
  const response = await fetch(`${API_URL}/search?q=${query}`);
  return response.json();
}

// ============ ATTENDANCE ============

export async function checkIn(name: string): Promise<any> {
  const response = await fetch(`${API_URL}/checkin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return response.json();
}

export async function checkOut(id: number): Promise<any> {
  const response = await fetch(`${API_URL}/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return response.json();
}

export async function getAttendance(): Promise<any[]> {
  const response = await fetch(`${API_URL}/attendance`);
  return response.json();
}
