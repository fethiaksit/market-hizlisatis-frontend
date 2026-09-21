import React, { useState, useEffect, useMemo } from 'react';
import { posService } from '../../api/posService';
import { Customer } from '../../types/pos';
import { formatCurrency } from '../../utils/format';
import { usePos } from '../../context/PosContext';
import { CustomerDetailModal } from '../../components/CustomerDetailModal';
import { showGlobalWarning } from '../../utils/warningBus';
import { 
  Users, 
  UserPlus, 
  Search, 
  Phone, 
  FileText, 
  CreditCard, 
  Check, 
  X, 
  Edit2, 
  History, 
  AlertCircle, 
  TrendingUp, 
  UserCheck, 
  Power
} from 'lucide-react';

export const CustomersManagementView: React.FC = () => {
  const { showToast } = usePos();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [address, setAddress] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [creditLimit, setCreditLimit] = useState<string>('');
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await posService.getCustomers('', true);
      setCustomers(data);
    } catch (err) {
      console.error('Failed to load customers:', err);
      showToast('Cari müşteriler yüklenemedi', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      // Status filter
      if (filterStatus === 'ACTIVE' && c.is_active === false) return false;
      if (filterStatus === 'INACTIVE' && c.is_active !== false) return false;

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.replace(/\D/g, '').includes(q.replace(/\D/g, '')))
      );
    });
  }, [customers, searchQuery, filterStatus]);

  const stats = useMemo(() => {
    const totalCount = customers.length;
    const activeCount = customers.filter(c => c.is_active !== false).length;
    const totalReceivables = customers.reduce((sum, c) => sum + (c.balance > 0 ? c.balance : 0), 0);
    return { totalCount, activeCount, totalReceivables };
  }, [customers]);

  const handleOpenCreateModal = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setNote('');
    setAddress('');
    setIsActive(true);
    setCreditLimit('');
    setFormError('');
    setIsFormOpen(true);
  };

  const handleOpenEditModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setName(cust.name);
    setPhone(cust.phone || '');
    setNote(cust.note || '');
    setAddress(cust.address || '');
    setIsActive(cust.is_active !== false);
    setCreditLimit(cust.credit_limit !== undefined && cust.credit_limit !== null ? String(cust.credit_limit) : '');
    setFormError('');
    setIsFormOpen(true);
  };

  const handleToggleStatus = async (cust: Customer) => {
    const newStatus = !cust.is_active;
    const actionText = newStatus ? 'aktif hale getirmek' : 'pasife almak';
    if (!window.confirm(`"${cust.name}" carisini ${actionText} istediğinize emin misiniz?`)) {
      return;
    }

    try {
      if (newStatus) {
        await posService.updateCustomer(cust.id, {
          name: cust.name,
          phone: cust.phone,
          note: cust.note,
          address: cust.address,
          is_active: true,
          credit_limit: cust.credit_limit,
        });
      } else {
        await posService.deleteCustomer(cust.id);
      }
      showToast(`Cari durumu güncellendi: ${cust.name}`, 'success');
      loadCustomers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Durum değiştirilemedi!';
      showGlobalWarning(msg);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showGlobalWarning('Lütfen Ad Soyad / Cari Adı alanını doldurun.');
      return;
    }

    if (!phone.trim()) {
      showGlobalWarning('Telefon numarası zorunludur.');
      return;
    }

    let parsedLimit: number | null = null;
    if (creditLimit.trim()) {
      const val = parseFloat(creditLimit.replace(',', '.'));
      if (isNaN(val) || val < 0) {
        showGlobalWarning('Lütfen geçerli bir cari limit girin.');
        return;
      }
      parsedLimit = val;
    }

    setIsSaving(true);
    setFormError('');

    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        note: note.trim(),
        address: address.trim(),
        is_active: isActive,
        credit_limit: parsedLimit,
      };

      if (editingCustomer) {
        await posService.updateCustomer(editingCustomer.id, payload);
        showToast('Cari müşteri başarıyla güncellendi.', 'success');
      } else {
        await posService.createCustomer(payload);
        showToast('Yeni cari müşteri eklendi.', 'success');
      }

      setIsFormOpen(false);
      loadCustomers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Kayıt işlemi başarısız!';
      showGlobalWarning(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800 flex items-center space-x-2">
            <Users className="w-7 h-7 text-zeytin-600" />
            <span>Cari Müşteri Yönetimi</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Yalnızca yöneticiler yeni cari hesap oluşturabilir ve düzenleyebilir.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="bg-zeytin-700 hover:bg-zeytin-800 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-md shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Yeni Cari Müşteri Ekle</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex items-center space-x-3">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500">Toplam Cari Müşteri</p>
            <h3 className="text-xl font-black text-gray-900">{stats.totalCount} Kayıt</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex items-center space-x-3">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500">Aktif Müşteriler</p>
            <h3 className="text-xl font-black text-gray-900">{stats.activeCount} Aktif</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex items-center space-x-3">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500">Toplam Cari Alacak</p>
            <h3 className="text-xl font-black text-red-700">{formatCurrency(stats.totalReceivables)}</h3>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="İsim veya telefon numarası ile ara..."
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 focus:border-zeytin-600 focus:bg-white rounded-xl text-xs font-bold text-gray-900 focus:outline-none"
          />
        </div>

        {/* Status filter tab */}
        <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-xl w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
              filterStatus === 'ALL' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Tümü ({customers.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('ACTIVE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
              filterStatus === 'ACTIVE' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Aktif
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('INACTIVE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
              filterStatus === 'INACTIVE' ? 'bg-red-600 text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Pasif
          </button>
        </div>
      </div>

      {/* Customer List Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-8 text-center text-gray-500 font-bold text-xs">Cari verileri yükleniyor...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-xs">
            <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="font-bold text-gray-600">Aramanıza uygun cari müşteri bulunamadı</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Cari Adı / Firma</th>
                  <th className="px-4 py-3">Telefon</th>
                  <th className="px-4 py-3">Durum</th>
                  <th className="px-4 py-3 text-right">Borç Bakiyesi</th>
                  <th className="px-4 py-3 text-right">Cari Limit</th>
                  <th className="px-4 py-3 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-gray-50/80 font-medium">
                    <td className="px-4 py-3 font-extrabold text-gray-900">
                      <div>{cust.name}</div>
                      {cust.note && <div className="text-[10px] text-gray-400 font-normal">{cust.note}</div>}
                    </td>

                    <td className="px-4 py-3 font-mono text-gray-600">
                      {cust.phone ? (
                        <span className="flex items-center space-x-1">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span>{cust.phone}</span>
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                        cust.is_active !== false 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {cust.is_active !== false ? 'AKTİF' : 'PASİF'}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right font-black text-sm">
                      <span className={cust.balance > 0 ? 'text-red-700' : 'text-emerald-700'}>
                        {formatCurrency(cust.balance)}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right font-mono text-gray-600">
                      {cust.credit_limit ? formatCurrency(cust.credit_limit) : <span className="text-gray-400">Sınırsız</span>}
                    </td>

                    <td className="px-4 py-3 text-right space-x-1">
                      <button
                        type="button"
                        onClick={() => setDetailCustomer(cust)}
                        className="p-1.5 bg-gray-100 hover:bg-zeytin-100 hover:text-zeytin-900 text-gray-700 rounded-lg font-bold transition-colors cursor-pointer inline-flex items-center space-x-1"
                        title="Ekstre & Hareketler"
                      >
                        <History className="w-3.5 h-3.5" />
                        <span>Ekstre</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(cust)}
                        className="p-1.5 bg-gray-100 hover:bg-blue-100 hover:text-blue-900 text-gray-700 rounded-lg font-bold transition-colors cursor-pointer inline-flex items-center space-x-1"
                        title="Düzenle"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Düzenle</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleStatus(cust)}
                        className={`p-1.5 rounded-lg font-bold transition-colors cursor-pointer inline-flex items-center space-x-1 ${
                          cust.is_active !== false 
                            ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        }`}
                        title={cust.is_active !== false ? 'Pasife Al' : 'Aktif Et'}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{cust.is_active !== false ? 'Pasife Al' : 'Aktif Et'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Customer Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 animate-in fade-in duration-150">
            <div className="bg-zeytin-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-zeytin-300" />
                <h3 className="text-base font-black tracking-wide">
                  {editingCustomer ? 'CARİ MÜŞTERİ DÜZENLE' : 'YENİ CARİ MÜŞTERİ EKLE'}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-lg bg-zeytin-800 hover:bg-zeytin-700 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-4 space-y-3.5">
              {formError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Ad Soyad / Cari Adı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setFormError('');
                  }}
                  placeholder="Örn: Ahmet Yılmaz Ticaret"
                  autoFocus
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 focus:border-zeytin-600 focus:bg-white rounded-xl text-xs sm:text-sm font-bold text-gray-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Telefon Numarası <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setFormError('');
                    }}
                    placeholder="Örn: 0532 123 45 67"
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 focus:border-zeytin-600 focus:bg-white rounded-xl text-xs sm:text-sm font-mono text-gray-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  İsteğe Bağlı Cari Limit (₺)
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value)}
                    placeholder="Sınırsız için boş bırakın"
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 focus:border-zeytin-600 focus:bg-white rounded-xl text-xs sm:text-sm font-mono text-gray-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Açıklama / Not
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Örn: Mahalle esnafı"
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 focus:border-zeytin-600 focus:bg-white rounded-xl text-xs text-gray-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-zeytin-600 border-gray-300 rounded focus:ring-zeytin-500 cursor-pointer"
                />
                <label htmlFor="isActiveCheck" className="text-xs font-bold text-gray-800 cursor-pointer">
                  Cari Hesap Aktif (Kasada Görünsün)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Vazgeç
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-zeytin-700 hover:bg-zeytin-800 disabled:bg-gray-300 text-white font-black rounded-xl text-xs cursor-pointer shadow-sm flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSaving ? 'Kaydediliyor...' : 'Kaydet'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Detail & Statement Modal */}
      {detailCustomer && (
        <CustomerDetailModal
          customer={detailCustomer}
          onClose={() => setDetailCustomer(null)}
        />
      )}
    </div>
  );
};
