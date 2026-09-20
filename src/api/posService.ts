import { Product, Category, Cashier, Customer, CustomerTransaction, CustomerTransactionType, SalePayload, SaleResponse, EndOfDaySummary, SaleRecord, StockMovement, StockMovementType, PriceHistory, BulkImportPreviewItem } from '../types/pos';
import { INITIAL_PRODUCTS, INITIAL_CASHIERS, INITIAL_SALES, INITIAL_CUSTOMERS, INITIAL_TRANSACTIONS, INITIAL_STOCK_MOVEMENTS, INITIAL_PRICE_HISTORY } from './mockData';
import { apiFetch, isMockMode } from './apiClient';

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
  if (role && role !== 'admin') {
    throw new Error('Bu işlem için yönetici yetkisi gereklidir. (403 Forbidden)');
  }
}

type BackendProduct = {
  id: string | number;
  barcode?: string;
  name: string;
  price: number;
  stock: number;
  category?: string;
  is_bestseller?: boolean;
  bestseller_order?: number;
  created_at?: string;
  updated_at?: string;
};

function mapBackendProduct(product: BackendProduct): Product {
  return {
    id: product.id,
    barcode: product.barcode || '',
    name: product.name,
    price: Number(product.price || 0),
    stock: Number(product.stock || 0),
    unit: 'Adet',
    category: product.category || '',
    isQuickProduct: Boolean(product.is_bestseller),
    quickOrder: product.bestseller_order || undefined,
    isActive: true,
    createdAt: product.created_at,
    updatedAt: product.updated_at,
  };
}

export const posService = {
  // ==================== CASHIER / AUTH ====================

  async loginWithPin(pin: string): Promise<Cashier | null> {
    if (isMockMode()) {
      await new Promise(r => setTimeout(r, 150));
      const cashier = INITIAL_CASHIERS.find(c => c.pin === pin);
      return cashier || null;
    }

    try {
      const res = await apiFetch<{
        token: string;
        user: { id: string | number; username: string; role: 'cashier' | 'admin' };
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: 'posadmin', password: pin }),
      });

      localStorage.setItem('zeytin_pos_token', res.token);

      return {
        id: res.user.id,
        name: res.user.username,
        code: res.user.username,
        pin: '',
        role: res.user.role,
      };
    } catch {
      return null;
    }
  },

  async getCashiers(): Promise<Cashier[]> {
    if (isMockMode()) {
      return INITIAL_CASHIERS.filter(c => c.role === 'cashier');
    }
    return [];
  },

  // ==================== CUSTOMERS (CARİLER) ====================

  async getCustomers(query = ''): Promise<Customer[]> {
    if (isMockMode()) {
      const customers = getStoredCustomers();
      if (!query.trim()) return customers;
      const q = query.toLowerCase().trim();
      return customers.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.phone.replace(/\D/g, '').includes(q.replace(/\D/g, ''))
      );
    }

    // Cari backend entegrasyonu henüz bu serviste bulunmuyor.
    // Production ortamında demo müşteri göstermeyelim.
    return [];
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
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.type && filters.type !== 'ALL') params.append('type', filters.type);

    return await apiFetch<CustomerTransaction[]>(`/pos/customers/${customerId}/transactions?${params.toString()}`);
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

  async createCustomer(data: { name: string; phone?: string; note?: string }): Promise<Customer> {
    const cleanPhone = (data.phone || '').trim();
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
        balance: 0,
        note: data.note?.trim() || '',
        createdAt: new Date().toISOString(),
      };

      customers.unshift(newCustomer);
      saveStoredCustomers(customers);
      return newCustomer;
    }

    return await apiFetch<Customer>('/pos/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async createCustomerPayment(data: {
    customerId: string | number;
    amount: number;
    paymentMethod: 'CASH' | 'CARD';
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
        paymentMethod: data.paymentMethod,
        note: data.note || (data.paymentMethod === 'CASH' ? 'Nakit Cari Tahsilat' : 'Kredi Kartı Cari Tahsilat'),
        cashierName: data.cashierName || 'Kasiyer',
        kasaId: (data.kasaId || 1) as 1 | 2 | 3 | 4 | 5,
      };

      transactions.unshift(newTx);
      saveStoredTransactions(transactions);

      return newTx;
    }

    return await apiFetch<CustomerTransaction>(`/pos/customers/${data.customerId}/payments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // ==================== PRODUCTS (POS) ====================

  async getAllProducts(): Promise<Product[]> {
    if (isMockMode()) {
      return getStoredProducts().filter(p => p.isActive !== false);
    }

    const products = await apiFetch<BackendProduct[]>('/products');
    return products.map(mapBackendProduct);
  },

  async findProductByBarcode(barcode: string): Promise<Product | null> {
    const cleanBarcode = barcode.trim();
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
      return mapBackendProduct(product);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
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
      items?: Array<{ quantity: number }>;
    }>('/sales', {
      method: 'POST',
      body: JSON.stringify({
        payment_method: paymentMethodMap[payload.paymentType],
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

    return await apiFetch<EndOfDaySummary>('/pos/eod-summary');
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
    return await apiFetch<Category[]>('/categories');
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
    let mapped = products.map(mapBackendProduct);
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
  }, createdBy: string, role?: string): Promise<Product> {
    assertAdmin(role);
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
        price: data.price,
        stock: data.stock || 0,
        category: data.category || '',
        brand: '',
        description: '',
        image_url: '',
        is_bestseller: false,
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
  }, updatedBy: string, role?: string): Promise<Product> {
    assertAdmin(role);
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
      product.updatedAt = now;

      saveStoredProducts(products);
      return product;
    }

    const product = await apiFetch<BackendProduct>(`/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: data.name,
        barcode: data.barcode,
        price: data.price,
        stock: 0,
        category: data.category || '',
        brand: '',
        description: '',
        image_url: '',
        is_bestseller: false,
        bestseller_order: 0,
      }),
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

    return await apiFetch<StockMovement>('/admin/stock-movements', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity, movementType, note, createdBy }),
    });
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

    const params = productId ? `?productId=${productId}` : '';
    return await apiFetch<StockMovement[]>(`/admin/stock-movements${params}`);
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

    return await apiFetch<StockMovement[]>('/admin/stock-movements/bulk', {
      method: 'POST',
      body: JSON.stringify({ entries, createdBy }),
    });
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

  previewBulkImport(csvText: string, categories: Category[] = []): BulkImportPreviewItem[] {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const products = getStoredProducts();
    const results: BulkImportPreviewItem[] = [];

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = line.split(';').map(c => c.trim());
      // Expected: barkod;ürün_adı;satış_fiyatı;alış_fiyatı;stok;kategori;birim
      const barcode = cols[0] || '';
      const name = cols[1] || '';
      const priceStr = cols[2] || '';
      const purchasePriceStr = cols[3] || '';
      const stockStr = cols[4] || '';
      const rawCategory = cols[5] || '';
      const normalizeCategory = (value: string) =>
        value.trim().toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ');
      const matchedCategory = categories.find(
        c => normalizeCategory(c.name) === normalizeCategory(rawCategory)
      );
      const category = matchedCategory?.name || rawCategory;
      const unit = cols[6] || 'Adet';

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

      // Validation
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

      const price = parseFloat(priceStr.replace(',', '.'));
      if (isNaN(price) || price <= 0) {
        item.status = 'ERROR';
        item.errorMessage = 'Geçersiz satış fiyatı';
        results.push(item);
        continue;
      }
      item.price = price;

      if (purchasePriceStr) {
        const pp = parseFloat(purchasePriceStr.replace(',', '.'));
        if (!isNaN(pp) && pp > 0) item.purchasePrice = pp;
      }

      if (stockStr) {
        const st = parseInt(stockStr, 10);
        if (!isNaN(st) && st >= 0) item.stock = st;
      }

      // Check if barcode already exists
      const existing = products.find(p => p.barcode === barcode);
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
  ): Promise<{ created: number; updated: number; skipped: number; stockAdded: number }> {
    assertAdmin(role);
    if (isMockMode()) {
      await new Promise(r => setTimeout(r, 400));
      const products = getStoredProducts();
      const movements = getStoredStockMovements();
      const priceHistoryList = getStoredPriceHistory();
      const now = new Date().toISOString();
      let created = 0, updated = 0, skipped = 0, stockAdded = 0;

      for (const item of items) {
        if (item.status === 'ERROR') continue;

        if (item.status === 'NEW') {
          const newProduct: Product = {
            id: `PRD-${Date.now()}-${item.lineNumber}`,
            barcode: item.barcode,
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
          }
          created++;
        } else if (item.status === 'EXISTS' && item.existingProduct) {
          const existing = products.find(p => p.barcode === item.barcode);
          if (!existing) continue;

          if (existingAction === 'SKIP') {
            skipped++;
          } else if (existingAction === 'UPDATE_INFO') {
            // Track price change
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
            }
            updated++;
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
              stockAdded++;
            } else {
              skipped++;
            }
          }
        }
      }

      saveStoredProducts(products);
      saveStoredStockMovements(movements);
      saveStoredPriceHistory(priceHistoryList);
      return { created, updated, skipped, stockAdded };
    }

    return await apiFetch<{ created: number; updated: number; skipped: number; stockAdded: number }>('/products/bulk-import', {
      method: 'POST',
      body: JSON.stringify({ items, existingAction, createdBy }),
    });
  },
};
