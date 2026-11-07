import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Search, Plus, Eye, PackageCheck, ClipboardList, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const PurchaseOrders = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const canModify = ['admin', 'purchase'].includes(user?.role);

  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);

  // Form state
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [poLines, setPoLines] = useState([
    { product: '', quantity: 1, unitCost: 0 }
  ]);
  const [expectedDate, setExpectedDate] = useState('');
  const [poNotes, setPoNotes] = useState('');

  const fetchPOs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', currentPage);
      params.append('limit', 10);
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);

      const res = await axiosClient.get(`/purchase-orders?${params.toString()}`);
      setOrders(res.data.data);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      toast.error('Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const loadReferenceData = async () => {
    try {
      const [supRes, prodRes] = await Promise.all([
        axiosClient.get('/suppliers?limit=100'),
        axiosClient.get('/products?limit=100'),
      ]);
      setSuppliers(supRes.data.data);
      setProducts(prodRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPOs();
  }, [currentPage, statusFilter]);

  useEffect(() => {
    loadReferenceData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPOs();
  };

  const handleLineProductChange = (index, productId) => {
    const prod = products.find((p) => p._id === productId);
    const updated = [...poLines];
    updated[index].product = productId;
    updated[index].unitCost = prod ? (prod.costPrice || prod.price * 0.7) : 0;
    setPoLines(updated);
  };

  const handleLineQtyChange = (index, qty) => {
    const updated = [...poLines];
    updated[index].quantity = Math.max(1, parseInt(qty, 10) || 1);
    setPoLines(updated);
  };

  const handleLineCostChange = (index, cost) => {
    const updated = [...poLines];
    updated[index].unitCost = Math.max(0, parseFloat(cost) || 0);
    setPoLines(updated);
  };

  const addLine = () => {
    setPoLines([...poLines, { product: '', quantity: 1, unitCost: 0 }]);
  };

  const removeLine = (index) => {
    if (poLines.length === 1) return;
    setPoLines(poLines.filter((_, idx) => idx !== index));
  };

  const totalCost = poLines.reduce((acc, line) => acc + (line.quantity * line.unitCost), 0);

  const handleCreatePO = async (e) => {
    e.preventDefault();
    if (!selectedSupplierId) {
      toast.warning('Please select a supplier');
      return;
    }

    const validLines = poLines.filter((l) => l.product);
    if (validLines.length === 0) {
      toast.warning('Please select at least one valid product');
      return;
    }

    try {
      await axiosClient.post('/purchase-orders', {
        supplier: selectedSupplierId,
        items: validLines,
        expectedDate,
        notes: poNotes,
      });

      toast.success('Purchase Order created successfully!');
      setIsCreateOpen(false);
      setSelectedSupplierId('');
      setPoLines([{ product: '', quantity: 1, unitCost: 0 }]);
      setPoNotes('');
      fetchPOs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create purchase order');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Purchase Orders</h2>
          <p className="text-sm text-slate-500">Procure materials, issue supplier POs, and verify delivery fulfillment.</p>
        </div>
        {canModify && (
          <button
            onClick={() => {
              loadReferenceData();
              setIsCreateOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Issue Purchase Order
          </button>
        )}
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search by PO number (e.g. PO-)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
        </form>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="Issued">Issued</option>
            <option value="Partially Received">Partially Received</option>
            <option value="Received">Received</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* PO Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400">Loading purchase orders...</div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center">
            <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h4 className="text-slate-700 font-semibold text-sm">No purchase orders found</h4>
            <p className="text-xs text-slate-400 mt-1">Issue a new purchase order to restock parts and inventory.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-3.5 px-4">PO #</th>
                  <th className="py-3.5 px-4">Supplier</th>
                  <th className="py-3.5 px-4">Date Issued</th>
                  <th className="py-3.5 px-4">Expected Date</th>
                  <th className="py-3.5 px-4 text-center">Items</th>
                  <th className="py-3.5 px-4 text-right">Total Cost</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((po) => (
                  <tr key={po._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{po.poNumber}</td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800">{po.supplier?.company || po.supplier?.name}</p>
                      <p className="text-[11px] text-slate-400">{po.supplier?.email}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{formatDate(po.orderDate || po.createdAt)}</td>
                    <td className="py-3.5 px-4 text-slate-500">{formatDate(po.expectedDate)}</td>
                    <td className="py-3.5 px-4 text-center font-medium text-slate-600">{po.items?.length || 0}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-800">{formatCurrency(po.totalCost)}</td>
                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={po.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        onClick={() => setSelectedPO(po)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View PO Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {po.status !== 'Received' && po.status !== 'Cancelled' && (
                        <button
                          onClick={() => navigate(`/grn?poId=${po._id}`)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Generate Goods Receipt Note (GRN)"
                        >
                          <PackageCheck className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs text-slate-500">
              Page <span className="font-semibold text-slate-700">{currentPage}</span> of{' '}
              <span className="font-semibold text-slate-700">{totalPages}</span>
            </span>
            <div className="flex items-center space-x-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className="p-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-white disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                className="p-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-white disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create PO Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Issue New Purchase Order"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleCreatePO} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Supplier *</label>
              <select
                required
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
              >
                <option value="">-- Choose Vendor --</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.company ? `${s.company} (${s.name})` : s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Expected Delivery Date</label>
              <input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Purchase Items</h4>
              <button
                type="button"
                onClick={addLine}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Item
              </button>
            </div>

            <div className="space-y-2.5">
              {poLines.map((line, idx) => (
                <div key={idx} className="flex items-center space-x-2 bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/60">
                  <div className="flex-1">
                    <select
                      required
                      value={line.product}
                      onChange={(e) => handleLineProductChange(idx, e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="">-- Select Product to Order --</option>
                      {products.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.title} ({p.SKU}) - Current Stock: {p.stock}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-20">
                    <input
                      type="number"
                      min="1"
                      required
                      value={line.quantity}
                      onChange={(e) => handleLineQtyChange(idx, e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg text-center"
                      placeholder="Qty"
                    />
                  </div>

                  <div className="w-24">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={line.unitCost}
                      onChange={(e) => handleLineCostChange(idx, e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg text-right"
                      placeholder="Unit Cost"
                    />
                  </div>

                  <div className="w-28 text-right font-mono font-medium text-xs text-slate-700">
                    {formatCurrency(line.quantity * line.unitCost)}
                  </div>

                  {poLines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLine(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-md"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-600">Total Purchase Commitment:</span>
            <span className="text-base font-bold text-slate-900">{formatCurrency(totalCost)}</span>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm"
            >
              Issue Purchase Order
            </button>
          </div>
        </form>
      </Modal>

      {/* View PO Modal */}
      <Modal
        isOpen={!!selectedPO}
        onClose={() => setSelectedPO(null)}
        title={`Purchase Order: ${selectedPO?.poNumber}`}
        maxWidth="max-w-2xl"
      >
        {selectedPO && (
          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-start bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div>
                <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Supplier</p>
                <h4 className="font-bold text-slate-900 text-sm mt-0.5">{selectedPO.supplier?.company || selectedPO.supplier?.name}</h4>
                <p className="text-slate-500">{selectedPO.supplier?.email}</p>
                <p className="text-slate-500">{selectedPO.supplier?.phone}</p>
              </div>
              <div className="text-right">
                <StatusBadge status={selectedPO.status} />
                <p className="text-slate-400 mt-2 text-[11px]">Issued: {formatDate(selectedPO.createdAt)}</p>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">Ordered Items</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-2 px-3">Item</th>
                      <th className="py-2 px-3">SKU</th>
                      <th className="py-2 px-3 text-center">Qty</th>
                      <th className="py-2 px-3 text-right">Unit Cost</th>
                      <th className="py-2 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedPO.items?.map((it, i) => (
                      <tr key={i}>
                        <td className="py-2 px-3 font-medium text-slate-800">{it.title}</td>
                        <td className="py-2 px-3 text-slate-500 font-mono">{it.SKU}</td>
                        <td className="py-2 px-3 text-center">{it.quantity}</td>
                        <td className="py-2 px-3 text-right">{formatCurrency(it.unitCost)}</td>
                        <td className="py-2 px-3 text-right font-semibold">{formatCurrency(it.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-slate-100 pt-3">
              <span className="text-slate-500">Total PO Value:</span>
              <span className="text-base font-bold text-slate-900">{formatCurrency(selectedPO.totalCost)}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PurchaseOrders;
