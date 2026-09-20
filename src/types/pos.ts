export interface Category {
  id: string | number;
  name: string;
  is_active: boolean;
  product_count: number;
}

export interface Product {
  id: string | number;
  barcode: string;
  name: string;
  price: number;
  purchasePrice?: number;
  vatRate?: number;
  stock: number;
  unit: string;
  category?: string;
  isQuickProduct?: boolean;
  quickOrder?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Customer {
  id: string | number;
  name: string;
  phone: string;
  address?: string;
  customer_type?: string;
  balance: number; // Pozitif bakiye = müşterinin borcu
  note?: string;
  is_active?: boolean;
  credit_limit?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export type CustomerTransactionType = 'SALE' | 'PAYMENT' | 'RETURN';

export interface CustomerTransaction {
  id: string;
  customerId: string | number;
  type: CustomerTransactionType;
  amount: number; // Pozitif = Borç Artışı (Alışveriş), Negatif = Borç Düşüşü (Tahsilat/İade)
  balanceAfter: number; // İşlem sonrasındaki bakiye
  date: string;
  time: string;
  createdAt: string;
  saleId?: string | number;
  receiptNo?: string;
  kasaId?: KasaId;
  cashierName?: string;
  paymentMethod?: 'CASH' | 'CARD' | 'CREDIT';
  note?: string;
  itemsCount?: number;
}

export type KasaId = 1 | 2 | 3 | 4 | 5;

export type PaymentType = 'CASH' | 'CARD' | 'CREDIT'; // CREDIT = CARİ

export interface KasaState {
  id: KasaId;
  name: string;
  items: CartItem[];
  customer?: Customer | null;
  paymentType: PaymentType;
  receivedAmount: number; // For cash
  note?: string;
}

export type UserRole = 'admin' | 'cashier' | 'warehouse' | string;

export interface Employee {
  id: number | string;
  firstName: string;
  lastName: string;
  fullName: string;
  username: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
}

export interface Cashier {
  id: string | number;
  name: string;
  username?: string;
  code?: string;
  phone?: string;
  role: UserRole;
}


export interface SaleItemRecord {
  productId: string | number;
  barcode: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discount?: number;
}

export interface SalePayload {
  kasaId: KasaId;
  cashierId: string | number;
  cashierName: string;
  customerId?: string | number;
  customerName?: string;
  items: SaleItemRecord[];
  subtotal: number;
  discountTotal?: number;
  totalAmount: number;
  paymentType: PaymentType;
  receivedAmount: number;
  changeAmount: number;
  idempotencyKey: string;
  timestamp: string;
}

export interface SaleResponse {
  success: boolean;
  saleId: string | number;
  receiptNo: string;
  message: string;
  total: number;
  itemsCount: number;
  customerNewBalance?: number;
}

export interface EndOfDaySummary {
  date: string;
  totalRevenue: number;
  totalCash: number;
  totalCard: number;
  totalCredit: number; // Cari satış toplamı
  transactionCount: number;
  cancelledCount: number;
  isClosed: boolean;
  closedAt?: string;
  closedBy?: string;
  sales: SaleRecord[];
}

export interface SaleRecord {
  id: string | number;
  receiptNo: string;
  kasaId: KasaId;
  cashierName: string;
  customerId?: string | number;
  customerName?: string;
  date: string;
  time: string;
  itemsCount: number;
  items: SaleItemRecord[];
  subtotal: number;
  discountTotal?: number;
  total: number;
  paymentType: PaymentType;
  receivedAmount: number;
  changeAmount: number;
}

// ==================== ADMIN PANEL TYPES ====================

export type StockMovementType = 'STOCK_IN' | 'STOCK_OUT' | 'SALE' | 'RETURN' | 'MANUAL_ADJUSTMENT' | 'WASTE';

export interface StockMovement {
  id: string;
  productId: string | number;
  productName: string;
  barcode: string;
  quantity: number;
  movementType: StockMovementType;
  previousStock: number;
  newStock: number;
  referenceId?: string;
  note?: string;
  createdAt: string;
  createdBy: string;
}

export interface PriceHistory {
  id: string;
  productId: string | number;
  productName: string;
  barcode: string;
  oldPrice: number;
  newPrice: number;
  changedAt: string;
  changedBy: string;
}

export interface BulkImportPreviewItem {
  lineNumber: number;
  barcode: string;
  name: string;
  price: number;
  purchasePrice?: number;
  stock?: number;
  category?: string;
  unit?: string;
  status: 'NEW' | 'EXISTS' | 'ERROR';
  errorMessage?: string;
  existingProduct?: Product;
}

export type BulkImportAction = 'SKIP' | 'UPDATE_INFO' | 'ADD_STOCK_ONLY';

export type AdminPage = 'DASHBOARD' | 'CATEGORIES' | 'PRODUCTS' | 'ADD_PRODUCT' | 'STOCK_ENTRY' | 'BULK_IMPORT' | 'PDF_IMPORT' | 'PRICE_MANAGEMENT' | 'EMPLOYEES' | 'CUSTOMERS';


// ==================== INVOICE & PDF IMPORT TYPES ====================
export type InvoiceMatchStatus = 'matched' | 'new' | 'review_needed' | 'incomplete';

export interface ParsedInvoiceItem {
  id: string; // UI için geçici ID
  productName: string;
  barcode: string;
  productCode?: string;
  quantity: number;
  unit: string;
  purchasePrice: number;
  vatRate: number;
  totalLineAmount: number;
  matchStatus: InvoiceMatchStatus;
  productId?: string | number; // Eğer eşleştiyse DB'deki ID
  salePrice?: number; // Yeni ürünler için yönetici girmelidir
}

export interface InvoiceAnalyzeResponse {
  supplierName: string;
  invoiceNumber: string;
  invoiceDate: string;
  items: ParsedInvoiceItem[];
}
