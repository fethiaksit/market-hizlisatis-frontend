import { InvoiceAnalyzeResponse, ParsedInvoiceItem } from '../types/pos';
import { apiFetch, isMockMode } from './apiClient';
import { posService } from './posService';

const STORAGE_INVOICES_KEY = 'zeytin_pos_imported_invoices';

export const invoiceAnalysisService = {
  /**
   * PDF dosyasını backend'e (veya mock servise) gönderip analiz sonucunu alır.
   */
  async analyzePdf(file: File, userRole?: string): Promise<InvoiceAnalyzeResponse> {
    if (userRole !== 'admin') {
      throw new Error('Yetkisiz işlem: Sadece yöneticiler fatura yükleyebilir.');
    }

    if (isMockMode()) {
      // Yapay Zeka analiz sürecini simüle et
      await new Promise(r => setTimeout(r, 2500));

      // Mock Products'dan birkaç tane alıp eşleştirme simülasyonu
      const products = await posService.getAdminProducts('', false, userRole);
      const randomExisting1 = products[0];
      const randomExisting2 = products[1];

      const mockItems: ParsedInvoiceItem[] = [];
      
      if (randomExisting1) {
        mockItems.push({
          id: 'temp-1',
          productName: randomExisting1.name,
          barcode: randomExisting1.barcode,
          quantity: 24,
          unit: 'Adet',
          purchasePrice: randomExisting1.purchasePrice || (randomExisting1.price * 0.7),
          vatRate: 10,
          totalLineAmount: 24 * (randomExisting1.purchasePrice || (randomExisting1.price * 0.7)),
          matchStatus: 'matched',
          productId: randomExisting1.id,
        });
      }

      if (randomExisting2) {
        mockItems.push({
          id: 'temp-2',
          productName: randomExisting2.name + ' (Faturada farklı yazılmış)',
          barcode: randomExisting2.barcode,
          quantity: 12,
          unit: 'Adet',
          purchasePrice: randomExisting2.purchasePrice || (randomExisting2.price * 0.6),
          vatRate: 20,
          totalLineAmount: 12 * (randomExisting2.purchasePrice || (randomExisting2.price * 0.6)),
          matchStatus: 'review_needed',
          productId: randomExisting2.id,
        });
      }

      mockItems.push({
        id: 'temp-3',
        productName: 'Eti Burçak Yulaflı Bisküvi',
        barcode: '8691234567890',
        quantity: 50,
        unit: 'Adet',
        purchasePrice: 12.5,
        vatRate: 10,
        totalLineAmount: 625,
        matchStatus: 'new'
      });

      mockItems.push({
        id: 'temp-4',
        productName: 'Tedarikçi Yeni Kalem - Barkod Okunamadı',
        barcode: '',
        quantity: 5,
        unit: 'Koli',
        purchasePrice: 150,
        vatRate: 20,
        totalLineAmount: 750,
        matchStatus: 'incomplete'
      });

      return {
        supplierName: 'Örnek Gıda ve İhtiyaç Maddeleri A.Ş.',
        invoiceNumber: `INV${Math.floor(Math.random() * 100000)}`,
        invoiceDate: new Date().toISOString().split('T')[0],
        items: mockItems
      };
    }

    // Gerçek API Çağrısı (Multipart Form Data)
    const formData = new FormData();
    formData.append('file', file);
    
    // Normalde apiFetch JSON gönderir, bu yüzden fetch kullanıyoruz
    const token = localStorage.getItem('zeytin_pos_token');
    const baseUrl = localStorage.getItem('zeytin_pos_api_url') || 'http://localhost:8000/api';
    const res = await fetch(`${baseUrl}/admin/invoices/analyze`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: formData
    });

    if (!res.ok) {
      throw new Error('Fatura analizi sırasında hata oluştu.');
    }
    
    return await res.json();
  },

  /**
   * Onaylanmış fatura öğelerini sisteme yazar (Stok güncelleme + Yeni ürün ekleme)
   */
  async importInvoice(
    invoiceData: InvoiceAnalyzeResponse, 
    userRole?: string
  ): Promise<{ success: boolean; message: string }> {
    if (userRole !== 'admin') {
      throw new Error('Yetkisiz işlem.');
    }

    if (isMockMode()) {
      await new Promise(r => setTimeout(r, 1000));
      
      const storedInvoicesRaw = localStorage.getItem(STORAGE_INVOICES_KEY);
      const storedInvoices = storedInvoicesRaw ? JSON.parse(storedInvoicesRaw) : [];
      
      const hash = `${invoiceData.supplierName}-${invoiceData.invoiceNumber}`;
      if (storedInvoices.includes(hash)) {
        throw new Error('Bu fatura numarası ve tedarikçi daha önce sisteme işlenmiş! Çifte kayıt engellendi.');
      }

      const stockEntries: Array<{ productId: string | number, quantity: number, note?: string }> = [];

      for (const item of invoiceData.items) {
        if (item.matchStatus === 'incomplete') continue;
        
        if (item.matchStatus === 'matched' || item.matchStatus === 'review_needed') {
          stockEntries.push({
            productId: item.productId!,
            quantity: item.quantity,
            note: `Fatura Girişi: ${invoiceData.invoiceNumber}`
          });
        } else if (item.matchStatus === 'new') {
          if (!item.salePrice) {
            throw new Error(`${item.productName} ürünü için satış fiyatı girilmemiş!`);
          }
          await posService.createProduct({
            barcode: item.barcode,
            name: item.productName,
            price: item.salePrice,
            purchasePrice: item.purchasePrice,
            stock: item.quantity,
            unit: item.unit || 'Adet',
          }, 'Admin', userRole);
        }
      }

      if (stockEntries.length > 0) {
        await posService.bulkStockEntry(stockEntries, 'Admin', userRole);
      }

      storedInvoices.push(hash);
      localStorage.setItem(STORAGE_INVOICES_KEY, JSON.stringify(storedInvoices));

      return { success: true, message: `${invoiceData.items.length} kalem başarıyla stoğa işlendi.` };
    }

    return await apiFetch<{ success: boolean; message: string }>('/admin/invoices/import', {
      method: 'POST',
      body: JSON.stringify(invoiceData)
    });
  }
};
