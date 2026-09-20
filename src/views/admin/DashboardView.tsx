import React, { useEffect, useState } from 'react';
import { posService } from '../../api/posService';
import { useAuth } from '../../context/AuthContext';
import { 
  TrendingUp, 
  ShoppingCart, 
  AlertTriangle, 
  Package, 
  Users, 
  CheckCircle, 
  XCircle,
  LayoutDashboard
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { cashier } = useAuth();
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
    todayRevenue: 0,
    todaySales: 0,
    criticalStock: 0,
    totalProducts: 0,
    totalReceivables: 0,
    isEodClosed: false,
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [eodSummary, products, customers] = await Promise.all([
        posService.getEndOfDaySummary(),
        posService.getAdminProducts('', false, cashier?.role),
        posService.getCustomers('')
      ]);

      setStats({
        todayRevenue: eodSummary.totalRevenue,
        todaySales: eodSummary.transactionCount,
        criticalStock: products.filter(p => p.stock < 10).length,
        totalProducts: products.length,
        totalReceivables: customers.reduce((sum, c) => sum + (c.balance > 0 ? c.balance : 0), 0),
        isEodClosed: eodSummary.isClosed
      });
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 flex justify-center items-center h-full text-gray-500">Yükleniyor...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 shrink-0">
        <h2 className="text-2xl font-black text-gray-800 flex items-center space-x-2">
          <LayoutDashboard className="w-6 h-6 text-zeytin-600" />
          <span>Özet Dashboard</span>
        </h2>
        <p className="text-sm text-gray-500 mt-1">Sistem durumunu tek ekrandan takip edin.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Bugünkü Ciro */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-xl">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500">Bugünkü Ciro</p>
            <h3 className="text-2xl font-black text-gray-900">{stats.todayRevenue.toFixed(2)} ₺</h3>
          </div>
        </div>

        {/* Bugünkü Satış */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
            <ShoppingCart className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500">Bugünkü Satış İşlemi</p>
            <h3 className="text-2xl font-black text-gray-900">{stats.todaySales} Adet</h3>
          </div>
        </div>

        {/* Kritik Stok */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-xl">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500">Kritik Stok (&lt;10)</p>
            <h3 className="text-2xl font-black text-gray-900">{stats.criticalStock} Ürün</h3>
          </div>
        </div>

        {/* Toplam Ürün */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
            <Package className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500">Toplam Ürün Çeşidi</p>
            <h3 className="text-2xl font-black text-gray-900">{stats.totalProducts} Adet</h3>
          </div>
        </div>

        {/* Cari Alacak */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500">Toplam Cari Alacak</p>
            <h3 className="text-2xl font-black text-gray-900">{stats.totalReceivables.toFixed(2)} ₺</h3>
          </div>
        </div>

        {/* Gün Sonu Durumu */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs flex items-center space-x-4">
          <div className={`p-3 rounded-xl ${stats.isEodClosed ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'}`}>
            {stats.isEodClosed ? <CheckCircle className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500">Gün Sonu Durumu</p>
            <h3 className="text-xl font-black text-gray-900">
              {stats.isEodClosed ? 'KAPATILDI' : 'AÇIK'}
            </h3>
          </div>
        </div>

      </div>
    </div>
  );
};
