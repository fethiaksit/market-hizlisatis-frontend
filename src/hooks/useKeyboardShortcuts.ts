import { useEffect } from 'react';
import { usePos } from '../context/PosContext';
import { KasaId } from '../types/pos';

export const useKeyboardShortcuts = (barcodeInputRef?: React.RefObject<HTMLInputElement>) => {
  const {
    setActiveKasa,
    setPaymentType,
    completeSale,
    setProductsModalOpen,
    isProductsModalOpen,
    setCustomerModalOpen,
    isCustomerModalOpen,
    isLogoutConfirmOpen,
    setLogoutConfirmOpen,
  } = usePos();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in a modal or non-pos input
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      // F1 - F5: Kasa Switching
      if (e.key === 'F1') {
        e.preventDefault();
        setActiveKasa(1 as KasaId);
        barcodeInputRef?.current?.focus();
      } else if (e.key === 'F2') {
        e.preventDefault();
        setActiveKasa(2 as KasaId);
        barcodeInputRef?.current?.focus();
      } else if (e.key === 'F3') {
        e.preventDefault();
        setActiveKasa(3 as KasaId);
        barcodeInputRef?.current?.focus();
      } else if (e.key === 'F4') {
        e.preventDefault();
        setActiveKasa(4 as KasaId);
        barcodeInputRef?.current?.focus();
      } else if (e.key === 'F5') {
        e.preventDefault();
        setActiveKasa(5 as KasaId);
        barcodeInputRef?.current?.focus();
      }

      // F7: Cari Ödeme
      if (e.key === 'F7') {
        e.preventDefault();
        setPaymentType('CREDIT');
      }

      // F8: Nakit Ödeme
      if (e.key === 'F8') {
        e.preventDefault();
        setPaymentType('CASH');
      }

      // F9: Kart Ödeme
      if (e.key === 'F9') {
        e.preventDefault();
        setPaymentType('CARD');
      }

      // F10: Ürünler Modalı
      if (e.key === 'F10') {
        e.preventDefault();
        setProductsModalOpen(!isProductsModalOpen);
      }

      // F12: Satışı Tamamla
      if (e.key === 'F12') {
        e.preventDefault();
        completeSale();
      }

      // Escape: Modalları Kapat
      if (e.key === 'Escape') {
        if (isProductsModalOpen) setProductsModalOpen(false);
        if (isCustomerModalOpen) setCustomerModalOpen(false);
        if (isLogoutConfirmOpen) setLogoutConfirmOpen(false);
        barcodeInputRef?.current?.focus();
      }

      // If user presses '/' outside of input, focus barcode
      if (e.key === '/' && !isInput) {
        e.preventDefault();
        barcodeInputRef?.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    setActiveKasa,
    setPaymentType,
    completeSale,
    setProductsModalOpen,
    isProductsModalOpen,
    setCustomerModalOpen,
    isCustomerModalOpen,
    isLogoutConfirmOpen,
    setLogoutConfirmOpen,
    barcodeInputRef,
  ]);
};
