import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Product, KasaId, KasaState, PaymentType, CartItem, SalePayload, Customer } from '../types/pos';
import { posService } from '../api/posService';
import { getTurkishWarning } from '../api/apiClient';
import { PosAudio, formatCurrency } from '../utils/format';
import { useAuth } from './AuthContext';

interface ToastState {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface PosContextType {
  activeKasa: KasaId;
  kasas: Record<KasaId, KasaState>;
  currentKasa: KasaState;
  products: Product[];
  customers: Customer[];
  quickProducts: Product[];
  isLoadingProducts: boolean;
  isSubmittingSale: boolean;
  totalAmount: number;
  changeAmount: number;
  itemsCount: number;
  toast: ToastState | null;
  isProductsModalOpen: boolean;
  isCustomerModalOpen: boolean;
  detailCustomer: Customer | null;
  isLogoutConfirmOpen: boolean;
  isApiSettingsOpen: boolean;
  
  setActiveKasa: (id: KasaId) => void;
  setCustomerForActiveKasa: (customer: Customer | null) => void;
  addToCart: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string | number, quantity: number) => void;
  removeFromCart: (productId: string | number) => void;
  clearCurrentCart: () => void;
  setPaymentType: (type: PaymentType) => void;
  setReceivedAmount: (amount: number) => void;
  quickAddReceivedAmount: (amount: number) => void;
  handleBarcodeScan: (barcodeOrName: string) => Promise<boolean>;
  completeSale: () => Promise<boolean>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  hasAnyOpenBaskets: () => boolean;
  setProductsModalOpen: (open: boolean) => void;
  setCustomerModalOpen: (open: boolean) => void;
  setDetailCustomer: (customer: Customer | null) => void;
  setLogoutConfirmOpen: (open: boolean) => void;
  setApiSettingsOpen: (open: boolean) => void;
  refreshProducts: () => Promise<void>;
  refreshCustomers: () => Promise<void>;
  addNewCustomer: (data: { name: string; phone?: string; note?: string }) => Promise<Customer>;
}

const PosContext = createContext<PosContextType | undefined>(undefined);

const INITIAL_KASAS: Record<KasaId, KasaState> = {
  1: { id: 1, name: 'Kasa 1', items: [], customer: null, paymentType: 'CASH', receivedAmount: 0 },
  2: { id: 2, name: 'Kasa 2', items: [], customer: null, paymentType: 'CASH', receivedAmount: 0 },
  3: { id: 3, name: 'Kasa 3', items: [], customer: null, paymentType: 'CASH', receivedAmount: 0 },
  4: { id: 4, name: 'Kasa 4', items: [], customer: null, paymentType: 'CASH', receivedAmount: 0 },
  5: { id: 5, name: 'Kasa 5', items: [], customer: null, paymentType: 'CASH', receivedAmount: 0 },
};

const STORAGE_KASAS_KEY = 'zeytin_pos_kasas_state';

export const PosProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { cashier } = useAuth();
  const [activeKasa, setActiveKasa] = useState<KasaId>(1);
  const [kasas, setKasas] = useState<Record<KasaId, KasaState>>(() => {
    const saved = localStorage.getItem(STORAGE_KASAS_KEY);
    return saved ? JSON.parse(saved) : INITIAL_KASAS;
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);
  const [isSubmittingSale, setIsSubmittingSale] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const [isProductsModalOpen, setProductsModalOpen] = useState(false);
  const [isCustomerModalOpen, setCustomerModalOpen] = useState(false);
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);
  const [isLogoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [isApiSettingsOpen, setApiSettingsOpen] = useState(false);

  // Persist Kasas
  useEffect(() => {
    localStorage.setItem(STORAGE_KASAS_KEY, JSON.stringify(kasas));
  }, [kasas]);

  // Load Products
  const loadProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    try {
      const data = await posService.getAllProducts();
      setProducts(data);
    } catch {
      showToast('Ürün listesi yüklenemedi!', 'error');
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  // Load Customers
  const loadCustomers = useCallback(async () => {
    try {
      const data = await posService.getCustomers();
      setCustomers(data);
    } catch (error: unknown) {
      showToast(getTurkishWarning(error, 'Cari müşteriler yüklenemedi. Lütfen tekrar deneyin.'), 'error');
    }
  }, []);

  useEffect(() => {
    loadProducts();
    loadCustomers();
  }, [loadProducts, loadCustomers]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const cleanMessage = String(message || '').trim() || 'İşlem hakkında bilgi alınamadı. Lütfen tekrar deneyin.';
    const id = Date.now();
    setToast({ id, message: cleanMessage, type });
    setTimeout(() => {
      setToast(current => (current?.id === id ? null : current));
    }, 3200);
  }, []);

  const currentKasa = useMemo(() => {
    return kasas[activeKasa] || INITIAL_KASAS[activeKasa];
  }, [kasas, activeKasa]);

  const totalAmount = useMemo(() => {
    return currentKasa.items.reduce((acc, it) => acc + it.totalPrice, 0);
  }, [currentKasa.items]);

  const itemsCount = useMemo(() => {
    return currentKasa.items.reduce((acc, it) => acc + it.quantity, 0);
  }, [currentKasa.items]);

  const changeAmount = useMemo(() => {
    if (currentKasa.paymentType !== 'CASH') return 0;
    if (currentKasa.receivedAmount <= 0) return 0;
    return Math.max(0, currentKasa.receivedAmount - totalAmount);
  }, [currentKasa.paymentType, currentKasa.receivedAmount, totalAmount]);

  const quickProducts = useMemo(() => {
    return products
      .filter(p => p.isQuickProduct)
      .sort((a, b) => (a.quickOrder || 99) - (b.quickOrder || 99))
      .slice(0, 10);
  }, [products]);

  const setCustomerForActiveKasa = useCallback((customer: Customer | null) => {
    setKasas(prev => ({
      ...prev,
      [activeKasa]: {
        ...prev[activeKasa],
        customer,
      }
    }));
  }, [activeKasa]);

  const addToCart = useCallback((product: Product, quantity = 1) => {
    PosAudio.playScanBeep();
    setKasas(prev => {
      const current = prev[activeKasa];
      const existingIndex = current.items.findIndex(it => String(it.product.id) === String(product.id));

      let updatedItems: CartItem[];
      if (existingIndex >= 0) {
        updatedItems = [...current.items];
        const existing = updatedItems[existingIndex];
        const newQty = existing.quantity + quantity;
        updatedItems[existingIndex] = {
          ...existing,
          quantity: newQty,
          totalPrice: Math.round(newQty * existing.unitPrice * 100) / 100,
        };
      } else {
        const newItem: CartItem = {
          product,
          quantity,
          unitPrice: product.price,
          totalPrice: Math.round(quantity * product.price * 100) / 100,
        };
        updatedItems = [newItem, ...current.items];
      }

      return {
        ...prev,
        [activeKasa]: {
          ...current,
          items: updatedItems,
        }
      };
    });
  }, [activeKasa]);

  const updateQuantity = useCallback((productId: string | number, quantity: number) => {
    setKasas(prev => {
      const current = prev[activeKasa];
      let updatedItems: CartItem[];

      if (quantity <= 0) {
        updatedItems = current.items.filter(it => String(it.product.id) !== String(productId));
      } else {
        updatedItems = current.items.map(it => {
          if (String(it.product.id) === String(productId)) {
            return {
              ...it,
              quantity,
              totalPrice: Math.round(quantity * it.unitPrice * 100) / 100,
            };
          }
          return it;
        });
      }

      return {
        ...prev,
        [activeKasa]: {
          ...current,
          items: updatedItems,
        }
      };
    });
  }, [activeKasa]);

  const removeFromCart = useCallback((productId: string | number) => {
    setKasas(prev => {
      const current = prev[activeKasa];
      return {
        ...prev,
        [activeKasa]: {
          ...current,
          items: current.items.filter(it => String(it.product.id) !== String(productId)),
        }
      };
    });
  }, [activeKasa]);

  const clearCurrentCart = useCallback(() => {
    setKasas(prev => ({
      ...prev,
      [activeKasa]: {
        ...prev[activeKasa],
        items: [],
        receivedAmount: 0,
        paymentType: 'CASH',
        customer: null,
      }
    }));
  }, [activeKasa]);

  const setPaymentType = useCallback((type: PaymentType) => {
    setKasas(prev => ({
      ...prev,
      [activeKasa]: {
        ...prev[activeKasa],
        paymentType: type,
        receivedAmount: type === 'CASH' ? prev[activeKasa].receivedAmount : 0,
      }
    }));
  }, [activeKasa]);

  const setReceivedAmount = useCallback((amount: number) => {
    setKasas(prev => ({
      ...prev,
      [activeKasa]: {
        ...prev[activeKasa],
        receivedAmount: amount,
      }
    }));
  }, [activeKasa]);

  const quickAddReceivedAmount = useCallback((amount: number) => {
    setKasas(prev => ({
      ...prev,
      [activeKasa]: {
        ...prev[activeKasa],
        receivedAmount: amount,
      }
    }));
  }, [activeKasa]);

  const handleBarcodeScan = useCallback(async (barcodeOrName: string): Promise<boolean> => {
    if (!barcodeOrName || !barcodeOrName.trim()) return false;
    const term = barcodeOrName.trim();

    try {
      const product = await posService.findProductByBarcode(term);
      if (product) {
        addToCart(product, 1);
        return true;
      } else {
        PosAudio.playErrorTone();
        showToast(`Ürün bulunamadı: "${term}"`, 'error');
        return false;
      }
    } catch {
      PosAudio.playErrorTone();
      showToast('Ürün aranırken bir sorun oluştu. Lütfen tekrar deneyin.', 'error');
      return false;
    }
  }, [addToCart, showToast]);

  const addNewCustomer = useCallback(async (data: { name: string; phone?: string; note?: string }): Promise<Customer> => {
    const created = await posService.createCustomer(data);
    await loadCustomers();
    setCustomerForActiveKasa(created);
    showToast(`Cari eklendi ve seçildi: ${created.name}`, 'success');
    return created;
  }, [loadCustomers, setCustomerForActiveKasa, showToast]);

  const completeSale = useCallback(async (): Promise<boolean> => {
    if (isSubmittingSale) return false;
    if (currentKasa.items.length === 0) {
      PosAudio.playErrorTone();
      showToast('Sepette ürün bulunmuyor!', 'error');
      return false;
    }

    // CARİ Ödeme Kontrolü: Müşteri seçili olmalı
    if (currentKasa.paymentType === 'CREDIT' && !currentKasa.customer) {
      PosAudio.playErrorTone();
      showToast('Önce cari müşteri seçin.', 'error');
      setCustomerModalOpen(true);
      return false;
    }

    if (currentKasa.paymentType === 'CASH' && currentKasa.receivedAmount > 0 && currentKasa.receivedAmount < totalAmount) {
      PosAudio.playErrorTone();
      showToast('Alınan nakit tutar toplamdan az olamaz!', 'error');
      return false;
    }

    const finalReceived = currentKasa.paymentType === 'CASH' 
      ? (currentKasa.receivedAmount >= totalAmount ? currentKasa.receivedAmount : totalAmount)
      : totalAmount;

    const finalChange = currentKasa.paymentType === 'CASH' ? Math.max(0, finalReceived - totalAmount) : 0;

    const payload: SalePayload = {
      kasaId: activeKasa,
      cashierId: cashier?.id || '1',
      cashierName: cashier?.name || 'Kasiyer',
      customerId: currentKasa.customer?.id,
      customerName: currentKasa.customer?.name,
      items: currentKasa.items.map(it => ({
        productId: it.product.id,
        barcode: it.product.barcode,
        name: it.product.name,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        totalPrice: it.totalPrice,
      })),
      subtotal: totalAmount,
      totalAmount,
      paymentType: currentKasa.paymentType,
      receivedAmount: finalReceived,
      changeAmount: finalChange,
      idempotencyKey: `POS-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
    };

    setIsSubmittingSale(true);
    try {
      const response = await posService.submitSale(payload);
      if (response.success) {
        PosAudio.playSuccessChime();
        await loadCustomers(); // Refresh customer balances
        
        let msg = `Satış Tamamlandı! (${response.receiptNo})`;
        if (response.customerNewBalance !== undefined && currentKasa.customer) {
          msg += ` • Yeni Bakiye: ${formatCurrency(response.customerNewBalance)} Borç`;
        }

        clearCurrentCart();
        showToast(msg, 'success');
        return true;
      } else {
        PosAudio.playErrorTone();
        showToast(response.message || 'Satış kaydedilemedi!', 'error');
        return false;
      }
    } catch (err: unknown) {
      PosAudio.playErrorTone();
      showToast(getTurkishWarning(err, 'Satış tamamlanamadı. Lütfen tekrar deneyin.'), 'error');
      return false;
    } finally {
      setIsSubmittingSale(false);
    }
  }, [isSubmittingSale, currentKasa, totalAmount, activeKasa, cashier, clearCurrentCart, showToast, loadCustomers]);

  const hasAnyOpenBaskets = useCallback((): boolean => {
    return Object.values(kasas).some(k => k.items && k.items.length > 0);
  }, [kasas]);

  return (
    <PosContext.Provider
      value={{
        activeKasa,
        kasas,
        currentKasa,
        products,
        customers,
        quickProducts,
        isLoadingProducts,
        isSubmittingSale,
        totalAmount,
        changeAmount,
        itemsCount,
        toast,
        isProductsModalOpen,
        isCustomerModalOpen,
        detailCustomer,
        isLogoutConfirmOpen,
        isApiSettingsOpen,
        setActiveKasa,
        setCustomerForActiveKasa,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCurrentCart,
        setPaymentType,
        setReceivedAmount,
        quickAddReceivedAmount,
        handleBarcodeScan,
        completeSale,
        showToast,
        hasAnyOpenBaskets,
        setProductsModalOpen,
        setCustomerModalOpen,
        setDetailCustomer,
        setLogoutConfirmOpen,
        setApiSettingsOpen,
        refreshProducts: loadProducts,
        refreshCustomers: loadCustomers,
        addNewCustomer,
      }}
    >
      {children}
    </PosContext.Provider>
  );
};

export const usePos = (): PosContextType => {
  const context = useContext(PosContext);
  if (!context) {
    throw new Error('usePos must be used within a PosProvider');
  }
  return context;
};
