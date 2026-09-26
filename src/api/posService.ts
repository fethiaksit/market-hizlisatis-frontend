import { Product, Category, Employee, Customer, CustomerTransaction, CustomerTransactionType, SalePayload, SaleResponse, EndOfDaySummary, SaleRecord, StockMovement, StockMovementType, PriceHistory, BulkImportPreviewItem, BulkImportResult } from '../types/pos';
import { INITIAL_PRODUCTS, INITIAL_SALES, INITIAL_CUSTOMERS, INITIAL_TRANSACTIONS, INITIAL_STOCK_MOVEMENTS, INITIAL_PRICE_HISTORY } from './mockData';
import { apiFetch, isMockMode } from './apiClient';

export function normalizeBarcode(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') {
    return BigInt(Math.round(value)).toString();
  }
  let text = String(value).trim();
  if (text.toUpperCase().includes('E+')) {
    const num = Number(text);
    if (Number.isFinite(num)) {
      text = BigInt(Math.round(num)).toString();
    }
  }
  return text;
}

export function parseMoney(value: unknown): number {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  let text = String(value).trim();
  if (!text) return 0;
  if (text.includes(',') && text.includes('.')) {
    text = text.replace(/\./g, '').replace(',', '.');
  } else {
    text = text.replace(',', '.');
  }
  const result = Number(text);
  return Number.isFinite(result) ? result : 0;
}

export function parseNumber(value: unknown): number {
  return parseMoney(value);
}



const STORAGE_PRODUCTS_KEY = 'zeytin_pos_products';
const STORAGE_SALES_KEY = 'zeytin_pos_sales';
const STORAGE_CUSTOMERS_KEY = 'zeytin_pos_customers';
const STORAGE_TRANSACTIONS_KEY = 'zeytin_pos_transactions';
const STORAGE_EOD_KEY = 'zeytin_pos_eod_state';
const STORAGE_STOCK_MOVEMENTS_KEY = 'zeytin_pos_stock_movements';
const STORAGE_PRICE_HISTORY_KEY = 'zeytin_pos_price_history';

// ==================== STORAGE HELPERS ====================

function getStoredProducts(): Product[] {
  const raw = localStorage.getItem(STORAGE_PRODUCTS_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(INITIAL_PRODUCTS));
    return INITIAL_PRODUCTS;
  }
  return JSON.parse(raw);
}

function saveStoredProducts(products: Product[]) {
  localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(products));
}

function getStoredCustomers(): Customer[] {
  const raw = localStorage.getItem(STORAGE_CUSTOMERS_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_CUSTOMERS_KEY, JSON.stringify(INITIAL_CUSTOMERS));
    return INITIAL_CUSTOMERS;
  }
  return JSON.parse(raw);
}

function saveStoredCustomers(customers: Customer[]) {
  localStorage.setItem(STORAGE_CUSTOMERS_KEY, JSON.stringify(customers));
}

function getStoredSales(): SaleRecord[] {
  const raw = localStorage.getItem(STORAGE_SALES_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_SALES_KEY, JSON.stringify(INITIAL_SALES));
    return INITIAL_SALES;
  }
  return JSON.parse(raw);
}

function saveStoredSales(sales: SaleRecord[]) {
  localStorage.setItem(STORAGE_SALES_KEY, JSON.stringify(sales));
}

function getStoredTransactions(): CustomerTransaction[] {
  const raw = localStorage.getItem(STORAGE_TRANSACTIONS_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_TRANSACTIONS_KEY, JSON.stringify(INITIAL_TRANSACTIONS));
    return INITIAL_TRANSACTIONS;
  }
  return JSON.parse(raw);
}

function saveStoredTransactions(txs: CustomerTransaction[]) {
  localStorage.setItem(STORAGE_TRANSACTIONS_KEY, JSON.stringify(txs));
}

function getStoredStockMovements(): StockMovement[] {
  const raw = localStorage.getItem(STORAGE_STOCK_MOVEMENTS_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_STOCK_MOVEMENTS_KEY, JSON.stringify(INITIAL_STOCK_MOVEMENTS));
    return INITIAL_STOCK_MOVEMENTS;
  }
  return JSON.parse(raw);
}

function saveStoredStockMovements(movements: StockMovement[]) {
  localStorage.setItem(STORAGE_STOCK_MOVEMENTS_KEY, JSON.stringify(movements));
}

function getStoredPriceHistory(): PriceHistory[] {
  const raw = localStorage.getItem(STORAGE_PRICE_HISTORY_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_PRICE_HISTORY_KEY, JSON.stringify(INITIAL_PRICE_HISTORY));
    return INITIAL_PRICE_HISTORY;
  }
  return JSON.parse(raw);
}

function saveStoredPriceHistory(history: PriceHistory[]) {
  localStorage.setItem(STORAGE_PRICE_HISTORY_KEY, JSON.stringify(history));
}

// Role check helper — simulates backend authorization
function assertAdmin(role?: string) {
  if (role && role !== 'admin' && role !== 'warehouse') {
    throw new Error('Bu işlem için yönetici veya depo yetkisi gereklidir. (403 Forbidden)');
  }
}

type BackendProduct = {
  id: string | number;
  barcode?: string;
  name: string;
  price?: number;
  sale_price?: number;
  purchasePrice?: number;
  purchase_price?: number;
  stock?: number;
  category?: string;
  is_favorite?: boolean;
  isFavorite?: boolean;
  is_bestseller?: boolean;
  isQuickProduct?: boolean;
  bestseller_order?: number;
  quickOrder?: number;
  image_url?: string;
  imageUrl?: string;
  image?: string;
  is_active?: boolean;
  isActive?: boolean;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
};

function mapBackendProduct(product: BackendProduct): Product {
  const img = product.image_url || product.imageUrl || product.image || '';
  return {
    id: product.id,
    barcode: product.barcode || '',
    name: product.name || '',
    price: Number(product.price ?? product.sale_price ?? 0),
    purchasePrice: product.purchasePrice !== undefined 
      ? Number(product.purchasePrice) 
      : (product.purchase_price !== undefined ? Number(product.purchase_price) : undefined),
    stock: Number(product.stock ?? 0),
    unit: 'Adet',
    category: product.category || '',
    isQuickProduct: Boolean(product.is_favorite || product.isFavorite || product.is_bestseller || product.isQuickProduct),
    quickOrder: product.bestseller_order ?? product.quickOrder ?? undefined,
    imageUrl: img,
    image: img,
    isActive: product.is_active ?? product.isActive ?? true,
    createdAt: product.created_at || product.createdAt,
    updatedAt: product.updated_at || product.updatedAt,
  };
}

function mapBackendStockMovementToFrontend(m: any): StockMovement {
  const typeMap: Record<string, StockMovementType> = {
    'in': 'STOCK_IN',
    'out': 'SALE',
    'waste': 'STOCK_OUT',
    'correction': 'MANUAL_ADJUSTMENT',
  };
  return {
    id: String(m.id || ''),
    productId: m.product_id || m.productId || 0,
    productName: m.product?.name || m.productName || '',
    barcode: m.product?.barcode || m.barcode || '',
    quantity: typeof m.quantity === 'string' ? parseFloat(m.quantity) : Number(m.quantity || 0),
    movementType: typeMap[m.type] || (m.movementType as StockMovementType) || 'STOCK_IN',
    previousStock: typeof m.previousStock === 'string' ? parseFloat(m.previousStock) : Number(m.previousStock || 0),
    newStock: typeof m.newStock === 'string' ? parseFloat(m.newStock) : Number(m.newStock || 0),
    referenceId: m.referenceId || '',
    note: m.note || '',
    createdAt: m.movement_date || m.created_at || m.createdAt || '',
    createdBy: m.createdBy || 'Sistem',
  };
}

export const posService = {
  // ==================== CASHIER / EMPLOYEE / AUTH ====================

  async login(usernameOrPhone: string, password: string): Promise<{ token: string; user: Employee }> {
    const res = await apiFetch<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username: usernameOrPhone,
        phone: usernameOrPhone,
        password,
      }),
    });
    if (res.token) {
      localStorage.setItem('zeytin_pos_token', res.token);
    }
    const emp: Employee = {
      id: res.user.id,
      firstName: res.user.first_name || '',
      lastName: res.user.last_name || '',
      fullName: res.user.full_name || `${res.user.first_name || ''} ${res.user.last_name || ''}`.trim() || res.user.username,
      username: res.user.username,
      phone: res.user.phone || '',
      role: res.user.role,
      isActive: res.user.is_active ?? true,
      lastLoginAt: res.user.last_login_at,
      createdAt: res.user.created_at,
    };
    return { token: res.token, user: emp };
  },

  async getEmployees(): Promise<Employee[]> {
    const res = await apiFetch<any[]>('/admin/employees');
    const list = Array.isArray(res) ? res : [];
    return list.map(u => ({
      id: u.id,
      firstName: u.first_name || '',
      lastName: u.last_name || '',
      fullName: u.full_name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username,
      username: u.username,
      phone: u.phone || '',
      role: u.role,
      isActive: u.is_active ?? true,
      lastLoginAt: u.last_login_at,
      createdAt: u.created_at,
    }));
  },

  async createEmployee(data: {
    first_name: string;
    last_name: string;
    phone: string;
    username: string;
    password: string;
    confirm_password: string;
    role: string;
    is_active: boolean;
  }): Promise<Employee> {
    const res = await apiFetch<any>('/admin/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return {
      id: res.id,
      firstName: res.first_name,
      lastName: res.last_name,
      fullName: res.full_name,
      username: res.username,
      phone: res.phone,
      role: res.role,
      isActive: res.is_active,
      lastLoginAt: res.last_login_at,
      createdAt: res.created_at,
    };
  },

  async updateEmployee(id: number | string, data: {
    first_name: string;
    last_name: string;
    phone: string;
    username: string;
    role: string;
    is_active: boolean;
  }): Promise<Employee> {
    const res = await apiFetch<any>(`/admin/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return {
      id: res.id,
      firstName: res.first_name,
      lastName: res.last_name,
      fullName: res.full_name,
      username: res.username,
      phone: res.phone,
      role: res.role,
      isActive: res.is_active,
      lastLoginAt: res.last_login_at,
      createdAt: res.created_at,
    };
  },

  async updateEmployeeStatus(id: number | string, isActive: boolean): Promise<void> {
    await apiFetch(`/admin/employees/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive }),
    });
  },

  async resetEmployeePassword(id: number | string, password: string, confirmPassword: string): Promise<void> {
    await apiFetch(`/admin/employees/${id}/password`, {
      method: 'PATCH',
      body: JSON.stringify({
        password,
        confirm_password: confirmPassword,
      }),
    });
  },

  async deleteEmployee(id: number | string): Promise<void> {
    await apiFetch(`/admin/employees/${id}`, {
      method: 'DELETE',
    });
  },


  // ==================== CUSTOMERS (CARİLER) ====================

  // ==================== CUSTOMERS (CARİLER) ====================

  async getCustomers(query = '', showInactive = false): Promise<Customer[]> {
    if (isMockMode()) {
      let customers = getStoredCustomers();
      if (!showInactive) {
        customers = customers.filter(c => c.is_active !== false);
      }
      if (!query.trim()) return customers;
      const q = query.toLowerCase().trim();
      return customers.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.phone.replace(/\D/g, '').includes(q.replace(/\D/g, ''))
      );
    }

    const params = new URLSearchParams();
    if (query.trim()) params.append('q', query.trim());
    if (showInactive) params.append('is_active', 'all');

    const list = await apiFetch<any[]>(`/admin/customers?${params.toString()}`);
    const items = Array.isArray(list) ? list : [];
    return items.map(c => ({
      id: c.id,
      name: c.name || '',
      phone: c.phone || '',
      address: c.address || '',
      note: c.note || '',
      is_active: c.is_active ?? true,
      credit_limit: c.credit_limit ? Number(c.credit_limit) : null,
      balance: Number(c.balance || 0),
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }));
  },

  async getCustomerDetails(id: string | number): Promise<Customer> {
    if (isMockMode()) {
      const customers = getStoredCustomers();
      const c = customers.find(item => String(item.id) === String(id));
      if (!c) throw new Error('Cari bulunamadı');
      return c;
    }
    const c = await apiFetch<any>(`/customers/${id}`);
    return {
      id: c.id,
      name: c.name || '',
      phone: c.phone || '',
      address: c.address || '',
      note: c.note || '',
      is_active: c.is_active ?? true,
      credit_limit: c.credit_limit ? Number(c.credit_limit) : null,
      balance: Number(c.balance || 0),
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    };
  },

  async getCustomerTransactions(
    customerId: string | number,
    filters?: { startDate?: string; endDate?: string; type?: CustomerTransactionType | 'ALL' }
  ): Promise<CustomerTransaction[]> {
    if (isMockMode()) {
      const allTxs = getStoredTransactions();
      let customerTxs = allTxs.filter(t => String(t.customerId) === String(customerId));

      if (filters?.startDate) {
        customerTxs = customerTxs.filter(t => t.date >= filters.startDate!);
      }
      if (filters?.endDate) {
        customerTxs = customerTxs.filter(t => t.date <= filters.endDate!);
      }
      if (filters?.type && filters.type !== 'ALL') {
        customerTxs = customerTxs.filter(t => t.type === filters.type);
      }

      return customerTxs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const params = new URLSearchParams();
    if (filters?.startDate) params.append('start_date', filters.startDate);
    if (filters?.endDate) params.append('end_date', filters.endDate);
    if (filters?.type && filters.type !== 'ALL') {
      const typeMap: Record<string, string> = {
        DEBT: 'debt',
        PAYMENT: 'payment',
        SALE: 'sale',
        RETURN: 'return',
      };
      params.append('type', typeMap[filters.type] || filters.type.toLowerCase());
    }

    const list = await apiFetch<any[]>(`/admin/customers/${customerId}/transactions`);
    const items = Array.isArray(list) ? list : [];

    let runningBalance = 0;
    const mappedOldestFirst = [...items].reverse().map(t => {
      const amount = Number(t.amount || 0);
      if (t.type === 'debt') runningBalance += amount;
      if (t.type === 'payment') runningBalance -= amount;

      let mappedType: CustomerTransactionType = 'DEBT';
      if (t.type === 'payment') {
        mappedType = 'PAYMENT';
      } else if (t.type === 'return') {
        mappedType = 'RETURN';
      } else if (t.type === 'debt') {
        if (t.sale_id || t.receipt_no || t.sale_no || (t.note && t.note.toLowerCase().includes('satış'))) {
          mappedType = 'SALE';
        } else {
          mappedType = 'DEBT';
        }
      }

      return {
        id: String(t.id),
        customerId: t.customer_id,
        type: mappedType,
        amount,
        balanceAfter: t.balance_after ? Number(t.balance_after) : runningBalance,
        date: t.transaction_date ? t.transaction_date.split('T')[0] : (t.created_at ? t.created_at.split('T')[0] : ''),
        time: t.created_at ? new Date(t.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '',
        createdAt: t.created_at || new Date().toISOString(),
        saleId: t.sale_id || undefined,
        receiptNo: t.sale_no || t.receipt_no || undefined,
        note: t.note || '',
      } as CustomerTransaction;
    });

    return mappedOldestFirst.reverse();
  },

  async getCustomerBalance(customerId: string | number): Promise<{
    balance: number;
    debt_total: number;
    payment_total: number;
  }> {
    const data = await apiFetch<any>(`/admin/customers/${customerId}/balance`);
    return {
      balance: Number(data?.balance || 0),
      debt_total: Number(data?.debt_total || 0),
      payment_total: Number(data?.payment_total || 0),
    };
  },

  async getSaleDetail(saleIdOrReceiptNo: string | number): Promise<SaleRecord | null> {
    if (isMockMode()) {
      const sales = getStoredSales();
      const s = sales.find(item => String(item.id) === String(saleIdOrReceiptNo) || item.receiptNo === String(saleIdOrReceiptNo));
      return s || null;
    }

    try {
      return await apiFetch<SaleRecord>(`/pos/sales/${saleIdOrReceiptNo}`);
    } catch {
      return null;
    }
  },

  async createCustomer(data: { name: string; phone: string; note?: string; address?: string; is_active?: boolean; credit_limit?: number | null }): Promise<Customer> {
    const cleanPhone = (data.phone || '').trim();
    if (!cleanPhone) {
      throw new Error('Telefon numarası zorunludur.');
    }
    if (isMockMode()) {
      const customers = getStoredCustomers();
      
      if (cleanPhone) {
        const phoneDigits = cleanPhone.replace(/\D/g, '');
        const exists = customers.some(c => c.phone && c.phone.replace(/\D/g, '') === phoneDigits);
        if (exists) {
          throw new Error('Bu telefon numarasıyla kayıtlı bir cari müşteri zaten bulunuyor.');
        }
      }

      const newCustomer: Customer = {
        id: `CUST-${Date.now()}`,
        name: data.name.trim(),
        phone: cleanPhone,
        address: data.address || '',
        balance: 0,
        note: data.note?.trim() || '',
        is_active: data.is_active ?? true,
        credit_limit: data.credit_limit || null,
        createdAt: new Date().toISOString(),
      };

      customers.unshift(newCustomer);
      saveStoredCustomers(customers);
      return newCustomer;
    }

    const c = await apiFetch<any>('/admin/customers', {
      method: 'POST',
      body: JSON.stringify({ ...data, phone: cleanPhone }),
    });
    return {
      id: c.id,
      name: c.name || '',
      phone: c.phone || '',
      address: c.address || '',
      note: c.note || '',
      is_active: c.is_active ?? true,
      credit_limit: c.credit_limit ? Number(c.credit_limit) : null,
      balance: Number(c.balance || 0),
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    };
  },

  async updateCustomer(id: string | number, data: { name: string; phone: string; note?: string; address?: string; is_active?: boolean; credit_limit?: number | null }): Promise<Customer> {
    if (isMockMode()) {
      const customers = getStoredCustomers();
      const customer = customers.find(c => String(c.id) === String(id));
      if (!customer) throw new Error('Cari bulunamadı');
      customer.name = data.name;
      customer.phone = data.phone || '';
      customer.note = data.note || '';
      customer.address = data.address || '';
      if (data.is_active !== undefined) customer.is_active = data.is_active;
      if (data.credit_limit !== undefined) customer.credit_limit = data.credit_limit;
      saveStoredCustomers(customers);
      return customer;
    }

    const cleanPhone = (data.phone || '').trim();
    if (!cleanPhone) {
      throw new Error('Telefon numarası zorunludur.');
    }

    const c = await apiFetch<any>(`/admin/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...data, phone: cleanPhone }),
    });
    return {
      id: c.id,
      name: c.name || '',
      phone: c.phone || '',
      address: c.address || '',
      note: c.note || '',
      is_active: c.is_active ?? true,
      credit_limit: c.credit_limit ? Number(c.credit_limit) : null,
      balance: Number(c.balance || 0),
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    };
  },

  async deleteCustomer(id: string | number): Promise<void> {
    if (isMockMode()) {
      const customers = getStoredCustomers();
      const customer = customers.find(c => String(c.id) === String(id));
      if (customer) {
        customer.is_active = false;
        saveStoredCustomers(customers);
      }
      return;
    }

    await apiFetch(`/admin/customers/${id}`, {
      method: 'DELETE',
    });
  },

  async createCustomerDebt(data: {
    customerId: string | number;
    amount: number;
    note?: string;
  }): Promise<CustomerTransaction> {
    if (isMockMode()) {
      await new Promise(r => setTimeout(r, 200));
      const customers = getStoredCustomers();
      const transactions = getStoredTransactions();

      const cust = customers.find(c => String(c.id) === String(data.customerId));
      if (!cust) throw new Error('Cari müşteri bulunamadı!');

      cust.balance = Math.round((cust.balance + data.amount) * 100) / 100;
      saveStoredCustomers(customers);

      const now = new Date();
      const newTx: CustomerTransaction = {
        id: `TRX-${Date.now()}`,
        customerId: cust.id,
        type: 'DEBT',
        amount: data.amount,
        balanceAfter: cust.balance,
        date: now.toISOString().split('T')[0],
        time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
        createdAt: now.toISOString(),
        note: data.note || 'Manuel Borç Ekleme',
      };

      transactions.unshift(newTx);
      saveStoredTransactions(transactions);
      return newTx;
    }

    return await apiFetch<CustomerTransaction>(`/admin/customers/${data.customerId}/transactions`, {
      method: 'POST',
      body: JSON.stringify({
        customer_id: Number(data.customerId),
        type: 'debt',
        amount: data.amount,
        transaction_date: new Date().toISOString().split('T')[0],
        note: data.note || 'Manuel Borç Ekleme',
      }),
    });
  },

  async addCustomerDebt(data: {
    customerId: string | number;
    amount: number;
    note?: string;
  }): Promise<CustomerTransaction> {
    return this.createCustomerDebt(data);
  },

  async createCustomerPayment(data: {
    customerId: string | number;
    amount: number;
    paymentMethod?: 'CASH' | 'CARD';
    note?: string;
    cashierName?: string;
    kasaId?: number;
  }): Promise<CustomerTransaction> {
    if (isMockMode()) {
      await new Promise(r => setTimeout(r, 200));
      const customers = getStoredCustomers();
      const transactions = getStoredTransactions();

      const cust = customers.find(c => String(c.id) === String(data.customerId));
      if (!cust) {
        throw new Error('Cari müşteri bulunamadı!');
      }

      cust.balance = Math.round((cust.balance - data.amount) * 100) / 100;
      saveStoredCustomers(customers);

      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      const newTx: CustomerTransaction = {
        id: `TRX-${Date.now()}`,
        customerId: cust.id,
        type: 'PAYMENT',
        amount: -data.amount,
        balanceAfter: cust.balance,
        date: dateStr,
        time: timeStr,
        createdAt: now.toISOString(),
        paymentMethod: data.paymentMethod || 'CASH',
        note: data.note || (data.paymentMethod === 'CARD' ? 'Kredi Kartı Cari Tahsilat' : 'Nakit Cari Tahsilat'),
        cashierName: data.cashierName || 'Kasiyer',
        kasaId: (data.kasaId || 1) as 1 | 2 | 3 | 4 | 5,
      };

      transactions.unshift(newTx);
      saveStoredTransactions(transactions);

      return newTx;
    }

    return await apiFetch<CustomerTransaction>(`/admin/customers/${data.customerId}/transactions`, {
      method: 'POST',
      body: JSON.stringify({
        type: 'payment',
        amount: data.amount,
        transaction_date: new Date().toISOString().split('T')[0],
        note: data.note || (data.paymentMethod === 'CARD' ? 'Kredi Kartı Cari Tahsilat' : 'Nakit Cari Tahsilat'),
      }),
    });
  },

  // ==================== PRODUCTS (POS) ====================

  async getAllProducts(): Promise<Product[]> {
    if (isMockMode()) {
      return getStoredProducts().filter(p => p.isActive !== false);
    }

    const products = await apiFetch<BackendProduct[]>('/products');
    const items = Array.isArray(products) ? products : [];
    return items.map(mapBackendProduct);
  },

  async findProductByBarcode(barcode: string): Promise<Product | null> {
    const cleanBarcode = normalizeBarcode(barcode);
    if (!cleanBarcode) return null;

    if (isMockMode()) {
      const products = getStoredProducts().filter(p => p.isActive !== false);
      const lowered = cleanBarcode.toLowerCase();
      return products.find(p =>
        p.barcode.toLowerCase() === lowered ||
        p.name.toLowerCase() === lowered
      ) || null;
    }

    try {
      const product = await apiFetch<BackendProduct>(`/products/barcode/${encodeURIComponent(cleanBarcode)}`);
      return product ? mapBackendProduct(product) : null;
    } catch (error: any) {
      const is404 =
        error?.status === 404 ||
        error?.response?.status === 404 ||
        (error instanceof Error && (
          error.message.includes('404') ||
          error.message.toLowerCase().includes('not found') ||
          error.message.toLowerCase().includes('bulunamadı')
        ));
      if (is404) {
        return null;
      }
      throw error;
    }
  },

  async createInitialStockMovement(
    productId: number | string,
    quantity: number,
    unitPrice: number = 0,
    note: string = 'CSV ile ilk stok girişi'
  ): Promise<void> {
    if (!quantity || quantity <= 0) return;

    if (isMockMode()) {
      const products = getStoredProducts();
      const movements = getStoredStockMovements();
      const prod = products.find(p => String(p.id) === String(productId));
      if (prod) {
        const previousStock = prod.stock;
        prod.stock += quantity;
        prod.updatedAt = new Date().toISOString();
        movements.unshift({
          id: `SM-${Date.now()}-${productId}`,
          productId: prod.id,
          productName: prod.name,
          barcode: prod.barcode,
          quantity,
          movementType: 'STOCK_IN',
          previousStock,
          newStock: prod.stock,
          note,
          createdAt: new Date().toISOString(),
          createdBy: 'Admin',
        });
        saveStoredProducts(products);
        saveStoredStockMovements(movements);
      }
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    await apiFetch('/stock-movements', {
      method: 'POST',
      body: JSON.stringify({
        product_id: Number(productId),
        movement_date: today,
        type: 'in',
        quantity: Number(quantity),
        unit_price: Number(unitPrice || 0),
        note,
      }),
    });
  },

  // ==================== SALES ====================

  async submitSale(payload: SalePayload): Promise<SaleResponse> {
    if (isMockMode()) {
      await new Promise(r => setTimeout(r, 250));
      const sales = getStoredSales();
      const products = getStoredProducts();
      const customers = getStoredCustomers();
      const transactions = getStoredTransactions();
      const stockMovements = getStoredStockMovements();

      // Decrement stock + create stock movements
      payload.items.forEach(item => {
        const prod = products.find(p => String(p.id) === String(item.productId));
        if (prod) {
          const previousStock = prod.stock;
          prod.stock = Math.max(0, prod.stock - item.quantity);
          
          stockMovements.unshift({
            id: `SM-${Date.now()}-${item.productId}`,
            productId: prod.id,
            productName: prod.name,
            barcode: prod.barcode,
            quantity: -item.quantity,
            movementType: 'SALE',
            previousStock,
            newStock: prod.stock,
            referenceId: `SL-${Date.now()}`,
            note: `Satış: ${item.quantity} ${prod.unit}`,
            createdAt: new Date().toISOString(),
            createdBy: payload.cashierName,
          });
        }
      });
      saveStoredProducts(products);
      saveStoredStockMovements(stockMovements);

      const receiptNo = `REC-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${String(sales.length + 1).padStart(3, '0')}`;
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const dateStr = now.toISOString().split('T')[0];

      let customerNewBalance: number | undefined = undefined;

      if (payload.paymentType === 'CREDIT' && payload.customerId) {
        const cust = customers.find(c => String(c.id) === String(payload.customerId));
        if (cust) {
          cust.balance = Math.round((cust.balance + payload.totalAmount) * 100) / 100;
          customerNewBalance = cust.balance;
          saveStoredCustomers(customers);

          const newTx: CustomerTransaction = {
            id: `TRX-${Date.now()}`,
            customerId: cust.id,
            type: 'SALE',
            amount: payload.totalAmount,
            balanceAfter: cust.balance,
            date: dateStr,
            time: timeStr,
            createdAt: now.toISOString(),
            saleId: `SL-${Date.now()}`,
            receiptNo,
            kasaId: payload.kasaId,
            cashierName: payload.cashierName,
            paymentMethod: 'CREDIT',
            note: 'Cari Alışveriş',
            itemsCount: payload.items.reduce((acc, it) => acc + it.quantity, 0),
          };
          transactions.unshift(newTx);
          saveStoredTransactions(transactions);
        }
      }

      const newSale: SaleRecord = {
        id: `SL-${Date.now()}`,
        receiptNo,
        kasaId: payload.kasaId,
        cashierName: payload.cashierName,
        customerId: payload.customerId,
        customerName: payload.customerName,
        date: dateStr,
        time: timeStr,
        itemsCount: payload.items.reduce((acc, it) => acc + it.quantity, 0),
        items: payload.items,
        subtotal: payload.subtotal,
        discountTotal: payload.discountTotal || 0,
        total: payload.totalAmount,
        paymentType: payload.paymentType,
        receivedAmount: payload.receivedAmount,
        changeAmount: payload.changeAmount,
      };

      sales.unshift(newSale);
      saveStoredSales(sales);

      return {
        success: true,
        saleId: newSale.id,
        receiptNo: newSale.receiptNo,
        message: 'Satış başarıyla tamamlandı',
        total: newSale.total,
        itemsCount: newSale.itemsCount,
        customerNewBalance,
      };
    }

    const paymentMethodMap: Record<SalePayload['paymentType'], string> = {
      CASH: 'cash',
      CARD: 'card',
      CREDIT: 'current',
    };

    const sale = await apiFetch<{
      id: string | number;
      sale_no: string;
      total_amount: number;
      customer_new_balance?: number | string | null;
      items?: Array<{ quantity: number }>;
    }>('/sales', {
      method: 'POST',
      body: JSON.stringify({
        payment_method: paymentMethodMap[payload.paymentType],
        customer_id: payload.paymentType === 'CREDIT' ? Number(payload.customerId) : undefined,
        items: payload.items.map(item => ({
          product_id: Number(item.productId),
          barcode: item.barcode,
          quantity: item.quantity,
        })),
      }),
    });

    return {
      success: true,
      saleId: sale.id,
      receiptNo: sale.sale_no,
      message: 'Satış başarıyla tamamlandı',
      total: Number(sale.total_amount || 0),
      itemsCount: (sale.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0),
      customerNewBalance:
        sale.customer_new_balance !== undefined && sale.customer_new_balance !== null
          ? Number(sale.customer_new_balance)
          : undefined,
    };
  },

  // ==================== END OF DAY ====================

  async getEndOfDaySummary(): Promise<EndOfDaySummary> {
    if (isMockMode()) {
      const sales = getStoredSales();
      const today = new Date().toISOString().split('T')[0];
      const todaySales = sales.filter(s => s.date === today);

      const totalRevenue = todaySales.reduce((acc, s) => acc + s.total, 0);
      const totalCash = todaySales.filter(s => s.paymentType === 'CASH').reduce((acc, s) => acc + s.total, 0);
      const totalCard = todaySales.filter(s => s.paymentType === 'CARD').reduce((acc, s) => acc + s.total, 0);
      const totalCredit = todaySales.filter(s => s.paymentType === 'CREDIT').reduce((acc, s) => acc + s.total, 0);

      const isClosed = localStorage.getItem(STORAGE_EOD_KEY) === today;

      return {
        date: today,
        totalRevenue,
        totalCash,
        totalCard,
        totalCredit,
        transactionCount: todaySales.length,
        cancelledCount: 0,
        isClosed,
        sales: todaySales,
      };
    }

    const res = await apiFetch<any>('/dashboard');
    const today = new Date().toISOString().split('T')[0];
    const isClosed = localStorage.getItem(STORAGE_EOD_KEY) === today;

    return {
      date: today,
      totalRevenue: Number(res?.today_revenue || 0),
      totalCash: Number(res?.total_cash || res?.daily_cash_revenue || 0),
      totalCard: Number(res?.total_pos || 0),
      totalCredit: Number(res?.total_employee_debt || 0),
      transactionCount: Array.isArray(res?.recent_transactions) ? res.recent_transactions.length : 0,
      cancelledCount: 0,
      isClosed,
      sales: [],
    };
  },

  async closeEndOfDay(userRole?: string): Promise<{ success: boolean; message: string }> {
    if (isMockMode()) {
      if (userRole !== 'admin') {
        throw new Error('Yalnızca yöneticiler gün sonu alabilir!');
      }
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem(STORAGE_EOD_KEY, today);
      return { success: true, message: 'Gün sonu başarıyla kapatıldı ve rapor arşivlendi.' };
    }

    return await apiFetch<{ success: boolean; message: string }>('/pos/eod-close', {
      method: 'POST'
    });
  },

  // ==================== CATEGORIES ====================

  async getCategories(): Promise<Category[]> {
    if (isMockMode()) {
      const names = Array.from(new Set(getStoredProducts().map(p => p.category).filter(Boolean))) as string[];
      return names.sort((a, b) => a.localeCompare(b, 'tr-TR')).map((name, index) => ({
        id: index + 1,
        name,
        is_active: true,
        product_count: getStoredProducts().filter(p => p.category === name).length,
      }));
    }
    const res = await apiFetch<Category[]>('/categories');
    return Array.isArray(res) ? res : [];
  },

  async createCategory(name: string): Promise<Category> {
    return await apiFetch<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  async updateCategory(id: string | number, name: string): Promise<Category> {
    return await apiFetch<Category>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    });
  },

  // ==================== ADMIN: PRODUCT MANAGEMENT ====================

  async getAdminProducts(query = '', showInactive = false, role?: string): Promise<Product[]> {
    assertAdmin(role);
    if (isMockMode()) {
      let products = getStoredProducts();
      if (!showInactive) {
        products = products.filter(p => p.isActive !== false);
      }
      if (query.trim()) {
        const q = query.toLowerCase().trim();
        products = products.filter(p =>
          p.barcode.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q)
        );
      }
      return products;
    }
    const products = await apiFetch<BackendProduct[]>('/products');
    const items = Array.isArray(products) ? products : [];
    let mapped = items.map(mapBackendProduct);
    if (query.trim()) {
      const q = query.toLocaleLowerCase('tr-TR').trim();
      mapped = mapped.filter(p =>
        p.barcode.toLocaleLowerCase('tr-TR').includes(q) ||
        p.name.toLocaleLowerCase('tr-TR').includes(q)
      );
    }
    return mapped;
  },

  async createProduct(data: {
    barcode: string;
    name: string;
    price: number;
    purchasePrice?: number;
    stock?: number;
    unit?: string;
    category?: string;
    imageUrl?: string;
    isQuickProduct?: boolean;
  }, createdBy: string, role?: string): Promise<Product> {
    assertAdmin(role);
    if (data.isQuickProduct && (!data.imageUrl || !data.imageUrl.trim())) {
      throw new Error('Favori ürün için ürün görseli gereklidir.');
    }

    if (isMockMode()) {
      await new Promise(r => setTimeout(r, 200));
      const products = getStoredProducts();

      // Unique barcode check
      const existingBarcode = products.find(p => p.barcode === data.barcode.trim());
      if (existingBarcode) {
        throw new Error('Bu barkod zaten kayıtlı! Her ürünün barkodu benzersiz olmalıdır.');
      }

      const now = new Date().toISOString();
      const newProduct: Product = {
        id: `PRD-${Date.now()}`,
        barcode: data.barcode.trim(),
        name: data.name.trim(),
        price: data.price,
        purchasePrice: data.purchasePrice,
        stock: data.stock || 0,
        unit: data.unit || 'Adet',
        category: data.category || '',
        imageUrl: data.imageUrl || '',
        image: data.imageUrl || '',
        isQuickProduct: Boolean(data.isQuickProduct),
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };

      products.unshift(newProduct);
      saveStoredProducts(products);

      // Create initial stock movement if stock > 0
      if (newProduct.stock > 0) {
        const movements = getStoredStockMovements();
        movements.unshift({
          id: `SM-${Date.now()}`,
          productId: newProduct.id,
          productName: newProduct.name,
          barcode: newProduct.barcode,
          quantity: newProduct.stock,
          movementType: 'STOCK_IN',
          previousStock: 0,
          newStock: newProduct.stock,
          note: 'Yeni ürün başlangıç stoğu',
          createdAt: now,
          createdBy,
        });
        saveStoredStockMovements(movements);
      }

      return newProduct;
    }

    const product = await apiFetch<BackendProduct>('/products', {
      method: 'POST',
      body: JSON.stringify({
        name: data.name,
        barcode: data.barcode,
        category: data.category || '',
        sale_price: data.price,
        purchase_price: data.purchasePrice ?? 0,
        critical_stock: 0,
        is_active: true,
        brand: '',
        description: '',
        image_url: data.imageUrl || '',
        is_bestseller: Boolean(data.isQuickProduct),
        bestseller_order: 0,
      }),
    });
    return mapBackendProduct(product);
  },

  async updateProduct(productId: string | number, data: {
    barcode?: string;
    name?: string;
    price?: number;
    purchasePrice?: number;
    unit?: string;
    category?: string;
    imageUrl?: string;
    isQuickProduct?: boolean;
  }, updatedBy: string, role?: string): Promise<Product> {
    assertAdmin(role);
    if (data.isQuickProduct && (!data.imageUrl || !data.imageUrl.trim())) {
      throw new Error('Favori ürün için ürün görseli gereklidir.');
    }

    if (isMockMode()) {
      await new Promise(r => setTimeout(r, 150));
      const products = getStoredProducts();
      const product = products.find(p => String(p.id) === String(productId));
      if (!product) {
        throw new Error('Ürün bulunamadı!');
      }

      const priceHistory = getStoredPriceHistory();
      const now = new Date().toISOString();

      // Track price change if price is different
      if (data.price !== undefined && data.price !== product.price) {
        priceHistory.unshift({
          id: `PH-${Date.now()}`,
          productId: product.id,
          productName: product.name,
          barcode: product.barcode,
          oldPrice: product.price,
          newPrice: data.price,
          changedAt: now,
          changedBy: updatedBy,
        });
        saveStoredPriceHistory(priceHistory);
      }

      if (data.name !== undefined) product.name = data.name.trim();
      if (data.price !== undefined) product.price = data.price;
      if (data.purchasePrice !== undefined) product.purchasePrice = data.purchasePrice;
      if (data.unit !== undefined) product.unit = data.unit;
      if (data.category !== undefined) product.category = data.category;
      if (data.imageUrl !== undefined) {
        product.imageUrl = data.imageUrl;
        product.image = data.imageUrl;
      }
      if (data.isQuickProduct !== undefined) product.isQuickProduct = data.isQuickProduct;
      product.updatedAt = now;

      saveStoredProducts(products);
      return product;
    }

    const product = await apiFetch<BackendProduct>(`/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: data.name,
        barcode: data.barcode,
        category: data.category || '',
        sale_price: data.price,
        purchase_price: data.purchasePrice ?? 0,
        critical_stock: 0,
        is_active: true,
        brand: '',
        description: '',
        image_url: data.imageUrl !== undefined ? data.imageUrl : '',
        is_bestseller: data.isQuickProduct !== undefined ? data.isQuickProduct : false,
        bestseller_order: 0,
      }),
    });
    return mapBackendProduct(product);
  },

  async setProductFavorite(productId: string | number, isFavorite: boolean, role?: string): Promise<Product> {
    assertAdmin(role);
    if (isMockMode()) {
      const products = getStoredProducts();
      const product = products.find(p => String(p.id) === String(productId));
      if (!product) throw new Error('Ürün bulunamadı!');

      if (isFavorite && (!product.imageUrl || !product.imageUrl.trim())) {
        throw new Error('Favori ürün için ürün görseli gereklidir.');
      }

      if (isFavorite && !product.isQuickProduct) {
        const favoriteCount = products.filter(p => p.isQuickProduct && p.isActive !== false).length;
        if (favoriteCount >= 10) throw new Error('En fazla 10 favori ürün seçebilirsiniz.');
        const maxOrder = products.reduce((max, p) => Math.max(max, p.quickOrder || 0), 0);
        product.quickOrder = maxOrder + 1;
      } else if (!isFavorite) {
        product.quickOrder = undefined;
      }

      product.isQuickProduct = isFavorite;
      product.updatedAt = new Date().toISOString();
      saveStoredProducts(products);
      return product;
    }

    if (isFavorite) {
      const all = await this.getAdminProducts('', true, role);
      const target = all.find(p => String(p.id) === String(productId));
      if (target && (!target.imageUrl || !target.imageUrl.trim())) {
        throw new Error('Favori ürün için ürün görseli gereklidir.');
      }
    }

    const product = await apiFetch<BackendProduct>(`/products/${productId}/favorite`, {
      method: 'PUT',
      body: JSON.stringify({ isFavorite }),
    });
    return mapBackendProduct(product);
  },

  async toggleProductActive(productId: string | number, updatedBy: string, role?: string): Promise<Product> {
    assertAdmin(role);
    if (isMockMode()) {
      const products = getStoredProducts();
      const product = products.find(p => String(p.id) === String(productId));
      if (!product) {
        throw new Error('Ürün bulunamadı!');
      }

      product.isActive = !product.isActive;
      product.updatedAt = new Date().toISOString();
      saveStoredProducts(products);

      return product;
    }

    return await apiFetch<Product>(`/admin/products/${productId}/toggle-active`, {
      method: 'POST',
      body: JSON.stringify({ updatedBy }),
    });
    // updatedBy used to suppress lint
    void updatedBy;
  },

  // ==================== ADMIN: STOCK MANAGEMENT ====================

  async addStockMovement(
    productId: string | number,
    quantity: number,
    movementType: StockMovementType,
    note: string,
    createdBy: string,
    role?: string
  ): Promise<StockMovement> {
    assertAdmin(role);
    if (isMockMode()) {
      await new Promise(r => setTimeout(r, 150));
      const products = getStoredProducts();
      const movements = getStoredStockMovements();

      const product = products.find(p => String(p.id) === String(productId));
      if (!product) {
        throw new Error('Ürün bulunamadı!');
      }

      const previousStock = product.stock;
      product.stock = Math.max(0, product.stock + quantity);
      product.updatedAt = new Date().toISOString();
      saveStoredProducts(products);

      const movement: StockMovement = {
        id: `SM-${Date.now()}-${productId}`,
        productId: product.id,
        productName: product.name,
        barcode: product.barcode,
        quantity,
        movementType,
        previousStock,
        newStock: product.stock,
        note,
        createdAt: new Date().toISOString(),
        createdBy,
      };

      movements.unshift(movement);
      saveStoredStockMovements(movements);
      return movement;
    }

    const today = new Date().toISOString().split('T')[0];
    const backendTypeMap: Record<string, string> = {
      'STOCK_IN': 'in',
      'STOCK_OUT': 'out',
      'MANUAL_ADJUSTMENT': 'correction',
      'ADJUSTMENT': 'correction',
      'WASTE': 'waste',
      'RETURN': 'in',
    };
    const type = backendTypeMap[movementType] || 'in';
    const body = {
      product_id: Number(productId),
      movement_date: today,
      type,
      quantity: Number(quantity),
      unit_price: 0,
      note: note || '',
    };

    const res = await apiFetch<any>('/stock-movements', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return mapBackendStockMovementToFrontend(res);
  },

  async getStockMovements(productId?: string | number, role?: string): Promise<StockMovement[]> {
    assertAdmin(role);
    if (isMockMode()) {
      const movements = getStoredStockMovements();
      if (productId) {
        return movements.filter(m => String(m.productId) === String(productId));
      }
      return movements;
    }

    const params = productId ? `?product_id=${productId}` : '';
    const res = await apiFetch<any[]>(`/stock-movements${params}`);
    return Array.isArray(res) ? res.map(mapBackendStockMovementToFrontend) : [];
  },

  async bulkStockEntry(entries: Array<{
    productId: string | number;
    quantity: number;
    note?: string;
  }>, createdBy: string, role?: string): Promise<StockMovement[]> {
    assertAdmin(role);
    if (isMockMode()) {
      await new Promise(r => setTimeout(r, 300));
      const products = getStoredProducts();
      const movements = getStoredStockMovements();
      const results: StockMovement[] = [];
      const now = new Date().toISOString();

      for (const entry of entries) {
        const product = products.find(p => String(p.id) === String(entry.productId));
        if (!product) continue;

        const previousStock = product.stock;
        product.stock = Math.max(0, product.stock + entry.quantity);
        product.updatedAt = now;

        const movement: StockMovement = {
          id: `SM-${Date.now()}-${entry.productId}`,
          productId: product.id,
          productName: product.name,
          barcode: product.barcode,
          quantity: entry.quantity,
          movementType: 'STOCK_IN',
          previousStock,
          newStock: product.stock,
          note: entry.note || 'Toplu stok girişi',
          createdAt: now,
          createdBy,
        };
        movements.unshift(movement);
        results.push(movement);
      }

      saveStoredProducts(products);
      saveStoredStockMovements(movements);
      return results;
    }

    const today = new Date().toISOString().split('T')[0];
    const formattedEntries = entries.map(e => ({
      product_id: Number(e.productId),
      movement_date: today,
      type: 'in',
      quantity: Number(e.quantity),
      unit_price: 0,
      note: e.note || 'Toplu stok girişi',
    }));

    try {
      const res = await apiFetch<any[]>('/stock-movements/bulk', {
        method: 'POST',
        body: JSON.stringify({ entries: formattedEntries }),
      });
      return Array.isArray(res) ? res.map(mapBackendStockMovementToFrontend) : [];
    } catch (bulkErr) {
      console.warn('/stock-movements/bulk failed, falling back to sequential addStockMovement:', bulkErr);
      const results: StockMovement[] = [];
      for (const entry of entries) {
        const movement = await this.addStockMovement(
          entry.productId,
          entry.quantity,
          'STOCK_IN',
          entry.note || 'Toplu stok girişi',
          createdBy,
          role
        );
        results.push(movement);
      }
      return results;
    }
  },

  // ==================== ADMIN: PRICE MANAGEMENT ====================

  async updateProductPrice(
    productId: string | number,
    newPrice: number,
    changedBy: string,
    role?: string
  ): Promise<{ product: Product; priceHistory: PriceHistory }> {
    assertAdmin(role);
    if (isMockMode()) {
      await new Promise(r => setTimeout(r, 150));
      const products = getStoredProducts();
      const history = getStoredPriceHistory();

      const product = products.find(p => String(p.id) === String(productId));
      if (!product) {
        throw new Error('Ürün bulunamadı!');
      }

      const now = new Date().toISOString();
      const priceEntry: PriceHistory = {
        id: `PH-${Date.now()}`,
        productId: product.id,
        productName: product.name,
        barcode: product.barcode,
        oldPrice: product.price,
        newPrice,
        changedAt: now,
        changedBy,
      };

      product.price = newPrice;
      product.updatedAt = now;

      history.unshift(priceEntry);
      saveStoredProducts(products);
      saveStoredPriceHistory(history);

      return { product, priceHistory: priceEntry };
    }

    return await apiFetch<{ product: Product; priceHistory: PriceHistory }>(`/admin/products/${productId}/price`, {
      method: 'PUT',
      body: JSON.stringify({ newPrice, changedBy }),
    });
  },

  async getPriceHistory(productId?: string | number, role?: string): Promise<PriceHistory[]> {
    assertAdmin(role);
    if (isMockMode()) {
      const history = getStoredPriceHistory();
      if (productId) {
        return history.filter(h => String(h.productId) === String(productId));
      }
      return history;
    }

    const params = productId ? `?productId=${productId}` : '';
    return await apiFetch<PriceHistory[]>(`/admin/price-history${params}`);
  },

  async bulkPriceChange(changes: Array<{
    barcode: string;
    newPrice: number;
  }>, changedBy: string, role?: string): Promise<{ updated: PriceHistory[]; errors: Array<{ barcode: string; message: string }> }> {
    assertAdmin(role);
    if (isMockMode()) {
      await new Promise(r => setTimeout(r, 300));
      const products = getStoredProducts();
      const history = getStoredPriceHistory();
      const updated: PriceHistory[] = [];
      const errors: Array<{ barcode: string; message: string }> = [];
      const now = new Date().toISOString();

      for (const change of changes) {
        const product = products.find(p => p.barcode === change.barcode.trim());
        if (!product) {
          errors.push({ barcode: change.barcode, message: 'Ürün bulunamadı' });
          continue;
        }

        const priceEntry: PriceHistory = {
          id: `PH-${Date.now()}-${product.id}`,
          productId: product.id,
          productName: product.name,
          barcode: product.barcode,
          oldPrice: product.price,
          newPrice: change.newPrice,
          changedAt: now,
          changedBy,
        };

        product.price = change.newPrice;
        product.updatedAt = now;

        history.unshift(priceEntry);
        updated.push(priceEntry);
      }

      saveStoredProducts(products);
      saveStoredPriceHistory(history);
      return { updated, errors };
    }

    return await apiFetch<{ updated: PriceHistory[]; errors: Array<{ barcode: string; message: string }> }>('/admin/price-history/bulk', {
      method: 'POST',
      body: JSON.stringify({ changes, changedBy }),
    });
  },

  // ==================== ADMIN: BULK IMPORT ====================

  previewBulkImport(csvText: string, categories: Category[] = [], products: Product[] = []): BulkImportPreviewItem[] {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) return [];

    const results: BulkImportPreviewItem[] = [];

    const normalizeHeader = (value: string) =>
      value
        .replace(/^\uFEFF/, '')
        .trim()
        .toLocaleLowerCase('tr-TR')
        .replace(/\s+/g, '_');

    const headers = lines[0].split(';').map(normalizeHeader);
    const indexOfAny = (...names: string[]) =>
      headers.findIndex(h => names.map(normalizeHeader).includes(h));

    const barcodeIndex = indexOfAny('barkod', 'barcode');
    const nameIndex = indexOfAny('ürün_adı', 'urun_adi', 'ürün adı', 'urun adi', 'name');
    const priceIndex = indexOfAny('satış_fiyatı', 'satis_fiyati', 'satış fiyatı', 'satis fiyati', 'price');
    const purchasePriceVatIndex = indexOfAny(
      'alış_fiyatı_kdv_dahil',
      'alis_fiyati_kdv_dahil',
      'alış fiyatı kdv dahil',
      'alis fiyati kdv dahil'
    );
    const purchasePriceIndex = indexOfAny('alış_fiyatı', 'alis_fiyati', 'alış fiyatı', 'alis fiyati', 'purchase_price');
    const stockIndex = indexOfAny('stok', 'stock');
    const categoryIndex = indexOfAny('kategori', 'category');
    const unitIndex = indexOfAny('birim', 'unit');

    if (barcodeIndex < 0 || nameIndex < 0 || priceIndex < 0) {
      return [];
    }

    const normalizeCategory = (value: string) =>
      value
        .trim()
        .replace(/^["']|["']$/g, '')
        .replace(/\u00a0/g, ' ')
        .toLocaleLowerCase('tr-TR')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/ı/g, 'i')
        .replace(/ç/g, 'c')
        .replace(/ğ/g, 'g')
        .replace(/ö/g, 'o')
        .replace(/ş/g, 's')
        .replace(/ü/g, 'u')
        .replace(/\s+/g, ' ');

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = line.split(';').map(col => col.trim());
      const read = (index: number) => index >= 0 ? (cols[index] || '') : '';

      const rawBarcode = read(barcodeIndex);
      const barcode = normalizeBarcode(rawBarcode);
      const name = read(nameIndex);
      const priceStr = read(priceIndex);
      const purchasePriceStr = read(purchasePriceVatIndex) || read(purchasePriceIndex);
      const stockStr = read(stockIndex);
      const rawCategory = read(categoryIndex);
      const matchedCategory = categories.find(
        category => normalizeCategory(category.name) === normalizeCategory(rawCategory)
      );
      const category = matchedCategory?.name || rawCategory;
      const unit = read(unitIndex) || 'Adet';

      const item: BulkImportPreviewItem = {
        lineNumber: i + 1,
        barcode,
        name,
        price: 0,
        purchasePrice: undefined,
        stock: undefined,
        category,
        unit,
        status: 'NEW',
      };

      if (!barcode) {
        item.status = 'ERROR';
        item.errorMessage = 'Barkod boş olamaz';
        results.push(item);
        continue;
      }
      if (!name) {
        item.status = 'ERROR';
        item.errorMessage = 'Ürün adı boş olamaz';
        results.push(item);
        continue;
      }
      if (rawCategory && !matchedCategory) {
        item.status = 'ERROR';
        item.errorMessage = `Kategori eşleşmedi: ${rawCategory}`;
        results.push(item);
        continue;
      }

      const price = parseMoney(priceStr);
      if (price <= 0) {
        item.status = 'ERROR';
        item.errorMessage = 'Geçersiz satış fiyatı';
        results.push(item);
        continue;
      }
      item.price = price;

      if (purchasePriceStr) {
        const purchasePrice = parseMoney(purchasePriceStr);
        if (purchasePrice > 0) {
          item.purchasePrice = purchasePrice;
        }
      }

      if (stockStr) {
        const stock = parseMoney(stockStr);
        if (stock >= 0) {
          item.stock = stock;
        }
      }

      const existing = products.find(product => normalizeBarcode(product.barcode) === barcode);
      if (existing) {
        item.status = 'EXISTS';
        item.existingProduct = existing;
      }

      results.push(item);
    }

    return results;
  },

  async executeBulkImport(
    items: BulkImportPreviewItem[],
    existingAction: 'SKIP' | 'UPDATE_INFO' | 'ADD_STOCK_ONLY',
    createdBy: string,
    role?: string
  ): Promise<BulkImportResult> {
    assertAdmin(role);

    const result: BulkImportResult = {
      created: 0,
      updated: 0,
      stockAdded: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    };

    if (isMockMode()) {
      await new Promise(r => setTimeout(r, 300));
      const products = getStoredProducts();
      const movements = getStoredStockMovements();
      const priceHistoryList = getStoredPriceHistory();
      const now = new Date().toISOString();

      for (const item of items) {
        if (item.status === 'ERROR') {
          result.failed++;
          result.errors.push({
            row: item.lineNumber,
            barcode: item.barcode,
            name: item.name,
            error: item.errorMessage || 'Önizleme hatası',
          });
          continue;
        }

        const barcode = normalizeBarcode(item.barcode);
        const existing = products.find(p => normalizeBarcode(p.barcode) === barcode);

        if (!existing) {
          const newProduct: Product = {
            id: `PRD-${Date.now()}-${item.lineNumber}`,
            barcode,
            name: item.name,
            price: item.price,
            purchasePrice: item.purchasePrice,
            stock: item.stock || 0,
            unit: item.unit || 'Adet',
            category: item.category || '',
            isActive: true,
            createdAt: now,
            updatedAt: now,
          };
          products.unshift(newProduct);

          if (newProduct.stock > 0) {
            movements.unshift({
              id: `SM-${Date.now()}-${item.lineNumber}`,
              productId: newProduct.id,
              productName: newProduct.name,
              barcode: newProduct.barcode,
              quantity: newProduct.stock,
              movementType: 'STOCK_IN',
              previousStock: 0,
              newStock: newProduct.stock,
              note: 'Toplu import — başlangıç stoğu',
              createdAt: now,
              createdBy,
            });
            result.stockAdded++;
          }
          result.created++;
        } else {
          if (existingAction === 'SKIP') {
            result.skipped++;
          } else if (existingAction === 'UPDATE_INFO') {
            if (item.price !== existing.price) {
              priceHistoryList.unshift({
                id: `PH-${Date.now()}-${item.lineNumber}`,
                productId: existing.id,
                productName: existing.name,
                barcode: existing.barcode,
                oldPrice: existing.price,
                newPrice: item.price,
                changedAt: now,
                changedBy: createdBy,
              });
            }
            existing.name = item.name;
            existing.price = item.price;
            if (item.purchasePrice !== undefined) existing.purchasePrice = item.purchasePrice;
            if (item.category) existing.category = item.category;
            if (item.unit) existing.unit = item.unit;
            existing.updatedAt = now;

            if (item.stock && item.stock > 0) {
              const prev = existing.stock;
              existing.stock += item.stock;
              movements.unshift({
                id: `SM-${Date.now()}-upd-${item.lineNumber}`,
                productId: existing.id,
                productName: existing.name,
                barcode: existing.barcode,
                quantity: item.stock,
                movementType: 'STOCK_IN',
                previousStock: prev,
                newStock: existing.stock,
                note: 'Toplu import — bilgi güncelleme + stok ekleme',
                createdAt: now,
                createdBy,
              });
              result.stockAdded++;
            }
            result.updated++;
          } else if (existingAction === 'ADD_STOCK_ONLY') {
            if (item.stock && item.stock > 0) {
              const prev = existing.stock;
              existing.stock += item.stock;
              existing.updatedAt = now;
              movements.unshift({
                id: `SM-${Date.now()}-stk-${item.lineNumber}`,
                productId: existing.id,
                productName: existing.name,
                barcode: existing.barcode,
                quantity: item.stock,
                movementType: 'STOCK_IN',
                previousStock: prev,
                newStock: existing.stock,
                note: 'Toplu import — sadece stok ekleme',
                createdAt: now,
                createdBy,
              });
              result.stockAdded++;
            } else {
              result.skipped++;
            }
          }
        }
      }

      saveStoredProducts(products);
      saveStoredStockMovements(movements);
      saveStoredPriceHistory(priceHistoryList);
      return result;
    }

    // Non-mock mode: Process item-by-item over REST API
    for (const item of items) {
      if (item.status === 'ERROR') {
        result.failed++;
        result.errors.push({
          row: item.lineNumber,
          barcode: item.barcode,
          name: item.name,
          error: item.errorMessage || 'Önizleme hatası',
        });
        continue;
      }

      try {
        const cleanBarcode = normalizeBarcode(item.barcode);
        if (!cleanBarcode) {
          result.failed++;
          result.errors.push({
            row: item.lineNumber,
            barcode: item.barcode,
            name: item.name,
            error: 'Barkod boş olamaz',
          });
          continue;
        }

        // 1. Barkod ile mevcut ürünü ara (404 durumunda null döner)
        const existingProduct = await posService.findProductByBarcode(cleanBarcode);

        if (existingProduct) {
          // 2. Ürün bulunursa: Duplicate ürün oluşturma, güncelle
          if (existingAction === 'SKIP') {
            result.skipped++;
          } else if (existingAction === 'UPDATE_INFO') {
            await posService.updateProduct(
              existingProduct.id,
              {
                name: item.name,
                barcode: cleanBarcode,
                price: item.price,
                purchasePrice: item.purchasePrice,
                unit: item.unit,
                category: item.category,
              },
              createdBy,
              role
            );

            if (item.stock && item.stock > 0) {
              await posService.createInitialStockMovement(
                existingProduct.id,
                item.stock,
                item.purchasePrice || 0,
                'Toplu import — bilgi güncelleme + stok ekleme'
              );
              result.stockAdded++;
            }
            result.updated++;
          } else if (existingAction === 'ADD_STOCK_ONLY') {
            if (item.stock && item.stock > 0) {
              await posService.createInitialStockMovement(
                existingProduct.id,
                item.stock,
                item.purchasePrice || 0,
                'Toplu import — sadece stok ekleme'
              );
              result.stockAdded++;
            } else {
              result.skipped++;
            }
          }
        } else {
          // 3. Barkod sorgusu 404 dönerse: Yeni ürün oluştur
          const createdProduct = await posService.createProduct(
            {
              barcode: cleanBarcode,
              name: item.name,
              price: item.price,
              purchasePrice: item.purchasePrice,
              stock: 0,
              unit: item.unit || 'Adet',
              category: item.category,
            },
            createdBy,
            role
          );

          if (!createdProduct || !createdProduct.id) {
            throw new Error('Yeni ürün oluşturuldu fakat product ID alınamadı.');
          }

          if (item.stock && item.stock > 0) {
            await posService.createInitialStockMovement(
              createdProduct.id,
              item.stock,
              item.purchasePrice || 0,
              'CSV ile ilk stok girişi'
            );
            result.stockAdded++;
          }

          result.created++;
        }
      } catch (error: any) {
        // Oturum veya yetki hatalarında tüm aktarımı durdur
        if (error?.status === 401 || error?.status === 403) {
          throw error;
        }

        result.failed++;
        const errorMessage =
          error?.response?.data?.error ||
          error?.message ||
          'Bilinmeyen hata';

        result.errors.push({
          row: item.lineNumber,
          barcode: item.barcode,
          name: item.name,
          error: errorMessage,
        });
      }
    }

    return result;
  },
};
