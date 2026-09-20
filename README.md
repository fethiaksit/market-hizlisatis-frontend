# Zeytin Market - Hızlı Satış POS Frontend

ZeytinERP ekosistemi için market kasalarında (dokunmatik kiosk, All-in-One POS veya masaüstü PC) kullanılmak üzere geliştirilmiş, **hız, sadelik, stabilite ve sıfır hata** odaklı modern Hızlı Satış POS frontend uygulaması.

---

## 🌟 Öne Çıkan Özellikler

- **Hızlı ve Hatasız Satış Akışı**: Barkod okut → ürün sepete gelsin → ödeme türünü seç → satışı tamamla.
- **5 Kasa Sistemi (F1 - F5)**: Aynı anda 5 farklı geçici sepet yönetimi. Kasalar arası geçişlerde sepetler ve seçili cariler asla kaybolmaz.
- **Cari Müşteri & Veresiye Satış**:
  - Barkod yanında sade **"Cari Seç"** butonu ve arama modalı (İsim / Telefon).
  - Hızlı **"Yeni Cari Ekle"** formu ve mükerrer telefon koruması.
  - Seçili cariye ait güncel borç bakiyesi gösterimi (örn: *2.450,00 ₺ Borç*).
  - **CARİ (F7)** ödeme yöntemi: Müşteri seçimi zorunlu, satış tutarı cari borç bakiyesine otomatik işlenir.
  - **Doğru Muhasebe Kuralı**: Cari satış ciroya dahildir ancak kasa/banka nakit akışına dahil edilmez.
- **10 Hızlı Ürün Alanı**: Ekmek, Su, Çay, Süt, Zeytin gibi en çok satılan 10 ürüne tek dokunuşla ekleme.
- **Kategori Kalabalığı Olmayan Tasarım**: Ana ekranı karmaşıklaştırmayan, tek bir **"ÜRÜNLER (F10)"** butonuyla açılan hızlı arama kataloğu.
- **USB Barkod Okuyucu Uyumu**: Barkod okutulduğunda anında sepete ekleme / adet artırma, otomatik input temizleme ve kesintisiz odak.
- **Nakit & Kart Ödeme**:
  - Nakit modunda hızlı para butonları (Tam Tutar, 50₺, 100₺, 200₺, 500₺) ve anlık Para Üstü hesabı.
  - Kart modunda gereksiz alanları gizleyen temiz POS ekranı.
- **Çift Tıklama & Mükerrer Satış Koruması**: Satış gönderilirken buton otomatik kilitlenir ve idempotency anahtarı ile backend transaction güvenliği sağlanır.
- **Kasiyer Çıkış Koruması**: Açıkta bekleyen sepet varsa kasiyeri uyarır.
- **Gün Sonu & Z-Raporu**: Kasiyer ekranından izole, sadece açılış ekranından Yönetici PIN doğrulaması ile girilen **Toplam Ciro, Nakit, Kart, Cari Satış ve İşlem Sayısı** özet raporu.
- **1366×768 / 1600×900 / 1920×1080 Zero-Scroll Tasarımı**: Satışı Tamamla butonu ve tüm POS elemanları her zaman tek ekranda görünür.

---

## ⌨️ Klavye Kısayolları

| Kısayol | İşlev |
|---|---|
| **F1 - F5** | Kasa 1 .. Kasa 5 arasında anında geçiş |
| **F7** | Cari Ödeme (Veresiye) seçimi |
| **F8** | Nakit Ödeme seçimi |
| **F9** | Kart Ödeme seçimi |
| **F10** | Tüm Ürünler Kataloğunu Aç (ÜRÜNLER) |
| **F12 / Enter** | Satışı Tamamla |
| **Esc** | Açık modalları kapat |
| **/** | Barkod alanına hızlı odaklan |

---

## 🚀 Başlangıç ve Çalıştırma

### 1. Geliştirme Sunucusu (Dev Server)
```bash
npm run dev
```
Uygulama `http://localhost:3000` adresinde çalışacaktır.

### 2. Üretim Derlemesi (Production Build)
```bash
npm run build
```
Derlenen dosyalar `dist/` klasörüne oluşturulur.

---

## 🔐 Varsayılan Giriş Bilgileri

- **Kasiyer PIN**: `1234` (Ahmet Demir) veya `2345` (Ayşe Yılmaz)
- **Yönetici PIN**: `9999` (Gün Sonu / Z-Raporu Erişimi)
