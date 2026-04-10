import { Product, Bill, Employee, Attendance } from "./types";

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

// ============ EMPLOYEES ============

export async function addEmployee(employee: Omit<Employee, 'id'>): Promise<{ employeeId: number }> {
  const response = await fetch(`${API_URL}/employees`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(employee),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return response.json();
}

export async function getAllEmployees(): Promise<Employee[]> {
  const response = await fetch(`${API_URL}/employees`);
  if (!response.ok) {
    throw new Error("Failed to fetch employees");
  }
  return response.json();
}

export async function getEmployee(id: number): Promise<Employee> {
  const response = await fetch(`${API_URL}/employees/${id}`);
  if (!response.ok) {
    throw new Error("Employee not found");
  }
  return response.json();
}

export async function updateEmployee(id: number, employee: Partial<Employee>): Promise<any> {
  const response = await fetch(`${API_URL}/employees/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(employee),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return response.json();
}

export async function deleteEmployee(id: number): Promise<any> {
  const response = await fetch(`${API_URL}/employees/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return response.json();
}

// ============ ATTENDANCE ============

export async function checkIn(employee_id: number): Promise<any> {
  const response = await fetch(`${API_URL}/attendance/check-in`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ employee_id }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return response.json();
}

export async function checkOut(attendance_id: number): Promise<any> {
  const response = await fetch(`${API_URL}/attendance/check-out`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ attendance_id }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return response.json();
}

export async function getAttendance(employee_id?: number, date?: string): Promise<Attendance[]> {
  let url = `${API_URL}/attendance`;
  const params = new URLSearchParams();
  
  if (employee_id) params.append("employee_id", employee_id.toString());
  if (date) params.append("date", date);
  
  if (params.toString()) url += "?" + params.toString();
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch attendance");
  }
  return response.json();
}

export async function getTodayAttendance(): Promise<Attendance[]> {
  const response = await fetch(`${API_URL}/attendance/today`);
  if (!response.ok) {
    throw new Error("Failed to fetch today's attendance");
  }
  return response.json();
}

export async function getAttendanceReport(employee_id: number, startDate?: string, endDate?: string): Promise<any> {
  let url = `${API_URL}/attendance/report/${employee_id}`;
  const params = new URLSearchParams();
  
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  
  if (params.toString()) url += "?" + params.toString();
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch attendance report");
  }
  return response.json();
}

// ============ BILL GENERATION ============

export async function generateBillPDF(bill: Bill): Promise<Blob> {
  const response = await fetch(`${API_URL}/bill/generate-pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bill),
  });

  if (!response.ok) {
    throw new Error("Failed to generate PDF");
  }

  return response.blob();
}

// ============ STOCK MANAGEMENT ============

export async function getStockReport(): Promise<any> {
  const response = await fetch(`${API_URL}/stock/report`);
  if (!response.ok) {
    throw new Error("Failed to fetch stock report");
  }
  return response.json();
}

export async function getLowStockProducts(threshold: number = 5): Promise<any> {
  const response = await fetch(`${API_URL}/stock/low-stock?threshold=${threshold}`);
  if (!response.ok) {
    throw new Error("Failed to fetch low stock products");
  }
  return response.json();
}

export async function updateStock(id: number, quantity: number): Promise<any> {
  const response = await fetch(`${API_URL}/stock/update/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quantity }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return response.json();
}

export async function bulkUpdateStock(updates: Array<{ id: number; quantity: number }>): Promise<any> {
  const response = await fetch(`${API_URL}/stock/bulk-update`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ updates }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return response.json();
}

// ============ PRODUCT CRUD ============

export async function addProduct(product: Omit<Product, 'id'>): Promise<{ productId: number }> {
  const response = await fetch(`${API_URL}/add-product`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return response.json();
}

export async function deleteProduct(id: number): Promise<any> {
  const response = await fetch(`${API_URL}/product/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return response.json();
}

export async function updateProduct(id: number, product: Partial<Product>): Promise<any> {
  const response = await fetch(`${API_URL}/product/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return response.json();
}

// ============ ATTENDANCE WITH CUSTOM TIME ============

export async function checkInWithTime(employee_id: number, checkInTime?: string): Promise<any> {
  const response = await fetch(`${API_URL}/attendance/check-in`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ employee_id, checkInTime }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return response.json();
}
