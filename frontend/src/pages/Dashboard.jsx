import React, { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  DollarSign,
  ShoppingCart,
  Boxes,
  AlertTriangle,
  TrendingUp,
  PackageCheck,
  Users,
  Truck,
  ArrowRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/dashboard/stats');
      setData(res.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-sm font-medium text-slate-500">Loading ERP metrics & analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800">
        <h3 className="font-bold text-lg">Unable to load dashboard</h3>
        <p className="text-sm mt-1">{error}</p>
        <button
          onClick={fetchDashboardStats}
          className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-medium hover:bg-rose-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { metrics, monthlyData, categoryDistribution, lowStockProducts, recentOrders, recentGRNs } = data || {};

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Operations Dashboard</h2>
          <p className="text-sm text-slate-500 mt-0.5">Real-time enterprise overview, inventory metrics, and financial performance.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/sales-orders"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
          >
            <ShoppingCart className="w-4 h-4 mr-1.5" />
            New Sales Order
          </Link>
          <Link
            to="/grn"
            className="inline-flex items-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
          >
            <PackageCheck className="w-4 h-4 mr-1.5" />
            Receive GRN
          </Link>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(metrics?.totalRevenue || 0)}
          subtitle={`Net Margin: ${formatCurrency(metrics?.netMargin || 0)}`}
          icon={DollarSign}
          color="blue"
          trend="+12.4% vs last quarter"
        />
        <StatCard
          title="Sales Orders"
          value={metrics?.totalSalesOrders || 0}
          subtitle={`Active POs: ${metrics?.totalPurchaseOrders || 0}`}
          icon={ShoppingCart}
          color="emerald"
          trend="Healthy order flow"
        />
        <StatCard
          title="Total Products"
          value={metrics?.totalProducts || 0}
          subtitle={`${metrics?.totalCustomers || 0} Customers | ${metrics?.totalSuppliers || 0} Suppliers`}
          icon={Boxes}
          color="purple"
        />
        <StatCard
          title="Low Stock Alerts"
          value={metrics?.lowStockCount || 0}
          subtitle="Items needing replenishment"
          icon={AlertTriangle}
          color={metrics?.lowStockCount > 0 ? 'amber' : 'emerald'}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales vs Purchases Bar Chart (2 columns on lg) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800">Sales vs. Purchase Costs</h3>
              <p className="text-xs text-slate-400">Monthly financial cashflow comparison</p>
            </div>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">Last 6 Months</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip
                  formatter={(val) => [formatCurrency(val), '']}
                  contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', border: 'none' }}
                />
                <Legend />
                <Bar dataKey="sales" name="Sales Revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="purchases" name="Procurement Cost" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Product Category Distribution (1 column) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col">
          <div className="mb-4">
            <h3 className="font-bold text-slate-800">Category Mix</h3>
            <p className="text-xs text-slate-400">Product inventory distribution</p>
          </div>

          <div className="h-56 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryDistribution || []}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {(categoryDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} items`, name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Category legend pills */}
          <div className="mt-auto grid grid-cols-2 gap-2 pt-2">
            {(categoryDistribution || []).map((cat, idx) => (
              <div key={idx} className="flex items-center text-xs text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                <span className="truncate">{cat.category} ({cat.count})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lower Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-slate-800">Low Stock Reorder Alerts</h3>
            </div>
            <Link to="/products?status=low" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center">
              View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          {(!lowStockProducts || lowStockProducts.length === 0) ? (
            <p className="text-sm text-slate-400 py-6 text-center">All product stocks are at healthy operating levels!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold">
                    <th className="pb-3">Product</th>
                    <th className="pb-3">SKU</th>
                    <th className="pb-3 text-center">Stock</th>
                    <th className="pb-3 text-center">Reorder At</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lowStockProducts.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50/50">
                      <td className="py-3 font-medium text-slate-800">{p.title}</td>
                      <td className="py-3 text-slate-500 font-mono">{p.SKU}</td>
                      <td className="py-3 text-center">
                        <span className="px-2 py-0.5 rounded-md font-bold text-rose-600 bg-rose-50 border border-rose-200">
                          {p.stock}
                        </span>
                      </td>
                      <td className="py-3 text-center text-slate-500">{p.reorderLevel}</td>
                      <td className="py-3 text-right">
                        <Link
                          to="/purchase-orders"
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[11px] font-semibold transition-colors"
                        >
                          Restock
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Sales Orders */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-800">Recent Sales Orders</h3>
            </div>
            <Link to="/sales-orders" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center">
              View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          {(!recentOrders || recentOrders.length === 0) ? (
            <p className="text-sm text-slate-400 py-6 text-center">No recent orders found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold">
                    <th className="pb-3">Order #</th>
                    <th className="pb-3">Customer</th>
                    <th className="pb-3 text-right">Total</th>
                    <th className="pb-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-slate-50/50">
                      <td className="py-3 font-mono font-medium text-blue-600">{order.orderNumber}</td>
                      <td className="py-3 text-slate-700 font-medium">
                        {order.customer?.company || order.customer?.name || 'Customer'}
                      </td>
                      <td className="py-3 text-right font-bold text-slate-800">
                        {formatCurrency(order.totalPrice)}
                      </td>
                      <td className="py-3 text-center">
                        <StatusBadge status={order.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
