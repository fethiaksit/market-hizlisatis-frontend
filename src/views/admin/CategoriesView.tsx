import React, { useEffect, useState } from 'react';
import { FolderPlus, Pencil, Save, X } from 'lucide-react';
import { Category } from '../../types/pos';
import { posService } from '../../api/posService';
import { showGlobalWarning } from '../../utils/warningBus';

export const CategoriesView: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setCategories(await posService.getCategories());
    } catch (err) {
      showGlobalWarning(err instanceof Error ? err.message : 'Kategoriler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      showGlobalWarning('Kategori adı boş bırakılamaz.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await posService.createCategory(newName.trim());
      setNewName('');
      await load();
    } catch (err) {
      showGlobalWarning(err instanceof Error ? err.message : 'Kategori eklenemedi.');
      setLoading(false);
    }
  };

  const saveEdit = async (id: string | number) => {
    if (!editingName.trim()) {
      showGlobalWarning('Kategori adı boş bırakılamaz.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await posService.updateCategory(id, editingName.trim());
      setEditingId(null);
      setEditingName('');
      await load();
    } catch (err) {
      showGlobalWarning(err instanceof Error ? err.message : 'Kategori güncellenemedi.');
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-gray-800">Kategoriler</h2>
        <p className="text-sm text-gray-500 mt-1">
          Ürün ve CSV aktarımında kullanılacak kategori adlarını buradan yönetin.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={addCategory} className="bg-white border border-gray-100 rounded-2xl p-4 mb-5 flex gap-3 shadow-xs">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Yeni kategori adı"
          className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-zeytin-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !newName.trim()}
          className="px-5 py-2.5 rounded-xl bg-zeytin-600 hover:bg-zeytin-700 disabled:bg-gray-300 text-white font-bold flex items-center gap-2"
        >
          <FolderPlus className="w-4 h-4" />
          Kategori Ekle
        </button>
      </form>

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-xs">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase">Kategori</th>
              <th className="px-5 py-3 text-center text-xs font-bold text-gray-500 uppercase">Ürün Sayısı</th>
              <th className="px-5 py-3 text-right text-xs font-bold text-gray-500 uppercase">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {categories.map((category) => (
              <tr key={category.id}>
                <td className="px-5 py-3">
                  {editingId === category.id ? (
                    <input
                      autoFocus
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  ) : (
                    <span className="font-bold text-gray-800">{category.name}</span>
                  )}
                </td>
                <td className="px-5 py-3 text-center text-sm text-gray-600">{category.product_count}</td>
                <td className="px-5 py-3 text-right">
                  {editingId === category.id ? (
                    <div className="flex justify-end gap-2">
                      <button onClick={() => saveEdit(category.id)} className="p-2 text-green-700 hover:bg-green-50 rounded-lg" type="button">
                        <Save className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setEditingId(null); setEditingName(''); }} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" type="button">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingId(category.id); setEditingName(category.name); }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      type="button"
                      title="Kategori adını düzenle"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!loading && categories.length === 0 && (
              <tr>
                <td colSpan={3} className="px-5 py-10 text-center text-gray-500">
                  Henüz kategori yok. İlk kategoriyi yukarıdan ekleyin.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
