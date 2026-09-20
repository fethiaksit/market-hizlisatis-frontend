import React, { useState, useEffect } from 'react';
import { Employee, UserRole } from '../../types/pos';
import { posService } from '../../api/posService';
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit3, 
  KeyRound, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  ShieldCheck, 
  UserCheck, 
  Warehouse, 
  User, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Phone,
  Lock
} from 'lucide-react';

export const EmployeesManagementView: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Form Fields - Create
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newConfirmPassword, setNewConfirmPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('cashier');
  const [customRole, setCustomRole] = useState('');
  const [newIsActive, setNewIsActive] = useState<boolean>(true);

  // Form Fields - Edit
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('cashier');
  const [editCustomRole, setEditCustomRole] = useState('');
  const [editIsActive, setEditIsActive] = useState<boolean>(true);

  // Form Fields - Password Reset
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const list = await posService.getEmployees();
      setEmployees(list);
    } catch (err: any) {
      showToast(err.message || 'Personel listesi yüklenemedi.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const resetAddForm = () => {
    setNewFirstName('');
    setNewLastName('');
    setNewPhone('');
    setNewUsername('');
    setNewPassword('');
    setNewConfirmPassword('');
    setNewRole('cashier');
    setCustomRole('');
    setNewIsActive(true);
    setFormError('');
  };

  const handleOpenAddModal = () => {
    resetAddForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (emp: Employee) => {
    setSelectedEmployee(emp);
    setEditFirstName(emp.firstName);
    setEditLastName(emp.lastName);
    setEditPhone(emp.phone);
    setEditUsername(emp.username);
    setEditIsActive(emp.isActive);
    if (['admin', 'cashier', 'warehouse'].includes(emp.role)) {
      setEditRole(emp.role);
      setEditCustomRole('');
    } else {
      setEditRole('custom');
      setEditCustomRole(emp.role);
    }
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleOpenPasswordModal = (emp: Employee) => {
    setSelectedEmployee(emp);
    setResetPassword('');
    setResetConfirmPassword('');
    setFormError('');
    setIsPasswordModalOpen(true);
  };

  const handleOpenDeleteModal = (emp: Employee) => {
    setSelectedEmployee(emp);
    setIsDeleteModalOpen(true);
  };

  // Submit Handlers
  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const finalRole = newRole === 'custom' ? customRole.trim() : newRole;

    if (!newFirstName.trim() || !newLastName.trim() || !newUsername.trim() || !newPhone.trim()) {
      setFormError('Lütfen ad, soyad, telefon ve kullanıcı adını doldurunuz.');
      return;
    }

    if (!newPassword || !newConfirmPassword) {
      setFormError('Lütfen şifre alanlarını doldurunuz.');
      return;
    }

    if (newPassword !== newConfirmPassword) {
      setFormError('Şifre ve şifre tekrarı uyuşmuyor.');
      return;
    }

    if (newPassword.length < 6) {
      setFormError('Şifre en az 6 karakter olmalıdır.');
      return;
    }

    if (!finalRole) {
      setFormError('Lütfen geçerli bir rol seçiniz.');
      return;
    }

    setSubmitting(true);
    try {
      await posService.createEmployee({
        first_name: newFirstName.trim(),
        last_name: newLastName.trim(),
        phone: newPhone.trim(),
        username: newUsername.trim(),
        password: newPassword,
        confirm_password: newConfirmPassword,
        role: finalRole,
        is_active: newIsActive,
      });

      showToast('Yeni personel başarıyla eklendi.', 'success');
      setIsAddModalOpen(false);
      resetAddForm();
      fetchEmployees();
    } catch (err: any) {
      setFormError(err.message || 'Personel eklenirken hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    setFormError('');

    const finalRole = editRole === 'custom' ? editCustomRole.trim() : editRole;

    if (!editFirstName.trim() || !editLastName.trim() || !editUsername.trim() || !editPhone.trim()) {
      setFormError('Lütfen ad, soyad, telefon ve kullanıcı adını doldurunuz.');
      return;
    }

    if (!finalRole) {
      setFormError('Lütfen geçerli bir rol seçiniz.');
      return;
    }

    setSubmitting(true);
    try {
      await posService.updateEmployee(selectedEmployee.id, {
        first_name: editFirstName.trim(),
        last_name: editLastName.trim(),
        phone: editPhone.trim(),
        username: editUsername.trim(),
        role: finalRole,
        is_active: editIsActive,
      });

      showToast('Personel bilgileri güncellendi.', 'success');
      setIsEditModalOpen(false);
      fetchEmployees();
    } catch (err: any) {
      setFormError(err.message || 'Personel güncellenirken hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (emp: Employee) => {
    try {
      const newStatus = !emp.isActive;
      await posService.updateEmployeeStatus(emp.id, newStatus);
      showToast(
        `Personel ${newStatus ? 'aktif' : 'pasif'} duruma getirildi.`,
        'success'
      );
      fetchEmployees();
    } catch (err: any) {
      showToast(err.message || 'Personel durumu değiştirilemedi.', 'error');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    setFormError('');

    if (!resetPassword || !resetConfirmPassword) {
      setFormError('Lütfen yeni şifre alanlarını doldurunuz.');
      return;
    }

    if (resetPassword !== resetConfirmPassword) {
      setFormError('Girdiğiniz şifreler uyuşmuyor.');
      return;
    }

    if (resetPassword.length < 6) {
      setFormError('Şifre en az 6 karakter olmalıdır.');
      return;
    }

    setSubmitting(true);
    try {
      await posService.resetEmployeePassword(selectedEmployee.id, resetPassword, resetConfirmPassword);
      showToast('Personel şifresi başarıyla sıfırlandı.', 'success');
      setIsPasswordModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Şifre sıfırlanırken hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!selectedEmployee) return;
    setSubmitting(true);
    try {
      await posService.deleteEmployee(selectedEmployee.id);
      showToast('Personel başarıyla silindi (soft delete).', 'success');
      setIsDeleteModalOpen(false);
      fetchEmployees();
    } catch (err: any) {
      showToast(err.message || 'Personel silinemedi.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered List
  const filteredEmployees = employees.filter((emp) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      emp.fullName.toLowerCase().includes(q) ||
      emp.username.toLowerCase().includes(q) ||
      emp.phone.toLowerCase().includes(q) ||
      emp.role.toLowerCase().includes(q)
    );
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-purple-600" />
            Yönetici (Admin)
          </span>
        );
      case 'cashier':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <UserCheck className="w-3.5 h-3.5 mr-1 text-blue-600" />
            Kasiyer
          </span>
        );
      case 'warehouse':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <Warehouse className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            Depo Görevlisi
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <User className="w-3.5 h-3.5 mr-1 text-amber-600" />
            {role}
          </span>
        );
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Henüz Giriş Yapılmadı';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center space-x-3 px-4 py-3 rounded-2xl shadow-xl border text-sm font-bold transition-all animate-bounce ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500'
              : 'bg-red-600 text-white border-red-500'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-white shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="bg-zeytin-800 text-white p-3 rounded-xl shadow-md">
            <Users className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900">Personel Yönetimi</h1>
            <p className="text-xs text-gray-500 font-medium">
              Sistemdeki aktif ve pasif çalışan hesaplarını yönetin, yetkilendirin ve şifrelerini sıfırlayın.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center space-x-2 bg-zeytin-700 hover:bg-zeytin-800 text-white font-bold px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer text-sm border border-zeytin-600"
        >
          <UserPlus className="w-4 h-4" />
          <span>Yeni Eleman Ekle</span>
        </button>
      </div>

      {/* Search Bar & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ad Soyad, Kullanıcı Adı, Telefon veya Rol ara..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-zeytin-500 shadow-sm"
          />
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500">Toplam Personel</span>
          <span className="text-lg font-black text-gray-900">{employees.length}</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-600">Aktif Personel</span>
          <span className="text-lg font-black text-emerald-700">
            {employees.filter((e) => e.isActive).length}
          </span>
        </div>
      </div>

      {/* Main Employee Table / List */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 space-y-2">
            <div className="animate-spin w-8 h-8 border-4 border-zeytin-600 border-t-transparent rounded-full mx-auto" />
            <p className="text-xs font-bold">Personeller yükleniyor...</p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-12 text-center text-gray-400 space-y-3">
            <Users className="w-12 h-12 mx-auto text-gray-300" />
            <p className="text-sm font-bold text-gray-600">Personel bulunamadı.</p>
            <p className="text-xs">
              Arama kriterinize uygun personel kaydı yok veya henüz sistemde ekli eleman bulunmuyor.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-black uppercase tracking-wider text-gray-500">
                  <th className="py-3.5 px-4">Ad Soyad</th>
                  <th className="py-3.5 px-4">Rol</th>
                  <th className="py-3.5 px-4">Telefon / Kullanıcı Adı</th>
                  <th className="py-3.5 px-4">Durum</th>
                  <th className="py-3.5 px-4">Son Giriş</th>
                  <th className="py-3.5 px-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50/60 transition-colors">
                    {/* Full Name */}
                    <td className="py-3.5 px-4 font-bold text-gray-900">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 bg-zeytin-100 text-zeytin-800 rounded-full flex items-center justify-center font-black text-xs shrink-0">
                          {emp.firstName.charAt(0)}
                          {emp.lastName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-black text-gray-900">{emp.fullName}</div>
                          <div className="text-[11px] text-gray-400 font-normal">
                            Kullanıcı: @{emp.username}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4">{getRoleBadge(emp.role)}</td>

                    {/* Phone / Username */}
                    <td className="py-3.5 px-4 text-gray-700">
                      <div className="flex flex-col text-xs font-medium">
                        <span className="flex items-center text-gray-800 font-bold">
                          <Phone className="w-3 h-3 mr-1 text-gray-400" />
                          {emp.phone || '-'}
                        </span>
                        <span className="text-gray-400">@{emp.username}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {emp.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5" />
                          Pasif
                        </span>
                      )}
                    </td>

                    {/* Last Login */}
                    <td className="py-3.5 px-4 text-xs text-gray-500 font-medium">
                      <div className="flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1 text-gray-400" />
                        <span>{formatDate(emp.lastLoginAt)}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right space-x-1">
                      {/* Active/Passive Toggle */}
                      <button
                        onClick={() => handleToggleStatus(emp)}
                        title={emp.isActive ? 'Pasif Yap' : 'Aktif Yap'}
                        className={`p-2 rounded-xl transition-colors cursor-pointer ${
                          emp.isActive
                            ? 'text-emerald-600 hover:bg-emerald-50'
                            : 'text-gray-400 hover:bg-gray-100'
                        }`}
                      >
                        {emp.isActive ? (
                          <ToggleRight className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-gray-400" />
                        )}
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => handleOpenEditModal(emp)}
                        title="Düzenle"
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {/* Password Reset */}
                      <button
                        onClick={() => handleOpenPasswordModal(emp)}
                        title="Şifre Sıfırla"
                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl transition-colors cursor-pointer"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>

                      {/* Soft Delete */}
                      <button
                        onClick={() => handleOpenDeleteModal(emp)}
                        title="Personeli Sil"
                        className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ==================== ADD EMPLOYEE MODAL ==================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-zeytin-700" />
                <h2 className="text-lg font-black text-gray-900">Yeni Eleman Ekle</h2>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateEmployee} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Ad *</label>
                  <input
                    type="text"
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    placeholder="Ahmet"
                    required
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-zeytin-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Soyad *</label>
                  <input
                    type="text"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    placeholder="Yılmaz"
                    required
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-zeytin-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Telefon *</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="05321112233"
                    required
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-zeytin-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Kullanıcı Adı *</label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="ahmetyilmaz"
                    required
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-zeytin-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Şifre *</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="En az 6 karakter"
                    required
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-zeytin-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Şifre Tekrar *</label>
                  <input
                    type="password"
                    value={newConfirmPassword}
                    onChange={(e) => setNewConfirmPassword(e.target.value)}
                    placeholder="Şifreyi doğrula"
                    required
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-zeytin-500"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Rol *</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-zeytin-500"
                >
                  <option value="cashier">Kasiyer (cashier)</option>
                  <option value="admin">Yönetici (admin)</option>
                  <option value="warehouse">Depo Görevlisi (warehouse)</option>
                  <option value="custom">+ Yeni Rol Tanımla...</option>
                </select>
              </div>

              {newRole === 'custom' && (
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Özel Rol Adı</label>
                  <input
                    type="text"
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    placeholder="Örn: supervisor, accountant..."
                    required
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-zeytin-500"
                  />
                </div>
              )}

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-xs font-bold text-gray-700">Hesap Durumu</span>
                <button
                  type="button"
                  onClick={() => setNewIsActive(!newIsActive)}
                  className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    newIsActive ? 'bg-emerald-600 text-white' : 'bg-gray-300 text-gray-700'
                  }`}
                >
                  {newIsActive ? 'Aktif' : 'Pasif'}
                </button>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-zeytin-700 hover:bg-zeytin-800 text-white font-bold rounded-xl text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Kaydediliyor...' : 'Eleman Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== EDIT EMPLOYEE MODAL ==================== */}
      {isEditModalOpen && selectedEmployee && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-black text-gray-900">Personel Bilgilerini Düzenle</h2>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateEmployee} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Ad *</label>
                  <input
                    type="text"
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-zeytin-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Soyad *</label>
                  <input
                    type="text"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-zeytin-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Telefon *</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-zeytin-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Kullanıcı Adı *</label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-zeytin-500"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Rol *</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-zeytin-500"
                >
                  <option value="cashier">Kasiyer (cashier)</option>
                  <option value="admin">Yönetici (admin)</option>
                  <option value="warehouse">Depo Görevlisi (warehouse)</option>
                  <option value="custom">+ Özel Rol...</option>
                </select>
              </div>

              {editRole === 'custom' && (
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Özel Rol Adı</label>
                  <input
                    type="text"
                    value={editCustomRole}
                    onChange={(e) => setEditCustomRole(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-zeytin-500"
                  />
                </div>
              )}

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-xs font-bold text-gray-700">Hesap Durumu</span>
                <button
                  type="button"
                  onClick={() => setEditIsActive(!editIsActive)}
                  className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    editIsActive ? 'bg-emerald-600 text-white' : 'bg-gray-300 text-gray-700'
                  }`}
                >
                  {editIsActive ? 'Aktif' : 'Pasif'}
                </button>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Güncelleniyor...' : 'Güncelle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== RESET PASSWORD MODAL ==================== */}
      {isPasswordModalOpen && selectedEmployee && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <KeyRound className="w-5 h-5 text-amber-600" />
                <h2 className="text-lg font-black text-gray-900">Şifre Sıfırla</h2>
              </div>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-gray-600 bg-amber-50 p-3 rounded-xl border border-amber-200">
              <span className="font-bold text-amber-900">{selectedEmployee.fullName}</span> isimli personel için yeni bir şifre belirliyorsunuz.
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Yeni Şifre *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    placeholder="En az 6 karakter"
                    required
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Yeni Şifre Tekrar *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={resetConfirmPassword}
                    onChange={(e) => setResetConfirmPassword(e.target.value)}
                    placeholder="Şifreyi doğrula"
                    required
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Sıfırlanıyor...' : 'Şifreyi Güncelle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== DELETE CONFIRMATION MODAL ==================== */}
      {isDeleteModalOpen && selectedEmployee && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 text-center">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-black text-gray-900">Personeli Sil</h3>
              <p className="text-xs text-gray-500 mt-1">
                <strong className="text-gray-800">{selectedEmployee.fullName}</strong> isimli personeli silmek istediğinizden emin misiniz?
              </p>
              <p className="text-[11px] text-red-600 font-bold mt-2 bg-red-50 p-2 rounded-xl border border-red-100">
                Bu işlem soft delete (yumuşak silme) olarak gerçekleştirilecek ve personel erişimi kapatılacaktır.
              </p>
            </div>

            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleDeleteEmployee}
                disabled={submitting}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Siliniyor...' : 'Evet, Sil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
