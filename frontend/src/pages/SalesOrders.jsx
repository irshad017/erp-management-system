import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Search, Plus, Eye, FileText, CheckCircle2, ShoppingCart, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const SalesOrders = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const canModify = ['admin', 'sales'].includes(user?.role);

  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Create Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [orderLines, setOrderLines] = useState([
    { product: '', quantity: 1, unitPrice: 0 }
  ]);
  const [taxRate, setTaxRate] = useState(8);
  const [discount, setDiscount] = useState(0);
  const [orderNotes, setOrderNotes] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', currentPage);
      params.append('limit', 10);
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);

      const res = await axiosClient.get(`/sales-orders?${params.toString()}`);
      setOrders(res.data.data);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      toast.error('Failed to load sales orders');
    } finally {
      setLoading(false);
    }
  };

  const loadReferenceData = async () => {
    try {
      const [custRes, prodRes] = await Promise.all([
        axiosClient.get('/customers?limit=100'),
        axiosClient.get('/products?limit=100'),
      ]);
      setCustomers(custRes.data.data);
      setProducts(prodRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentPage, statusFilter]);

  useEffect(() => {
    loadReferenceData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchOrders();
  };

  // Line item handlers
  const handleLineProductChange = (index, productId) => {
    const prod = products.find((p) => p._id === productId);
    const updated = [...orderLines];
    updated[index].product = productId;
    updated[index].unitPrice = prod ? prod.price : 0;
    setOrderLines(updated);
  };

  const handleLineQtyChange = (index, qty) => {
    const updated = [...orderLines];
    updated[index].quantity = Math.max(1, parseInt(qty, 10) || 1);
    setOrderLines(updated);
  };

  const addLine = () => {
    setOrderLines([...orderLines, { product: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeLine = (index) => {
    if (orderLines.length === 1) return;
    setOrderLines(orderLines.filter((_, idx) => idx !== index));
  };

  // Subtotal calculations
  const subtotal = orderLines.reduce((acc, line) => acc + (line.quantity * line.unitPrice), 0);
  const taxAmount = (subtotal * (Number(taxRate) / 100));
  const finalTotal = Math.max(0, subtotal + taxAmount - Number(discount));

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      toast.warning('Please select a customer');
      return;
    }

    const validLines = orderLines.filter((l) => l.product);
    if (validLines.length === 0) {
      toast.warning('Please select at least one valid product');
      return;
    }

    try {
      await axiosClient.post('/sales-orders', {
        customer: selectedCustomerId,
        items: validLines,
        taxRate: Number(taxRate),
        discount: Number(discount),
        notes: orderNotes,
      });

      toast.success('Sales Order created successfully!');
      setIsCreateOpen(false);
      setSelectedCustomerId('');
      setOrderLines([{ product: '', quantity: 1, unitPrice: 0 }]);
      setOrderNotes('');
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create sales order');
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await axiosClient.put(`/sales-orders/${orderId}`, { status: newStatus });
      toast.success(`Order marked as ${newStatus}`);
      fetchOrders();
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleGenerateInvoice = async (orderId) => {
    try {
      const res = await axiosClient.post('/invoices', { salesOrderId: orderId });
      toast.success(`Invoice ${res.data.data.invoiceNumber} generated!`);
      navigate('/invoices');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate invoice');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Sales Orders</h2>
          <p className="text-sm text-slate-500">Manage client purchase agreements, fulfillment tracking, and invoice transitions.</p>
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
            Create Sales Order
          </button>
        )}
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search by order number (e.g. SO-)..."
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
            <option value="Confirmed">Confirmed</option>
            <option value="Processing">Processing</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400">Loading sales orders...</div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center">
            <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h4 className="text-slate-700 font-semibold text-sm">No sales orders found</h4>
            <p className="text-xs text-slate-400 mt-1">Create your first sales order to start processing shipments.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Order #</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-center">Items</th>
                  <th className="py-3.5 px-4 text-right">Total Amount</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Invoiced</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <tr key={o._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600">{o.orderNumber}</td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800">{o.customer?.company || o.customer?.name}</p>
                      <p className="text-[11px] text-slate-400">{o.customer?.email}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{formatDate(o.orderDate || o.createdAt)}</td>
                    <td className="py-3.5 px-4 text-center font-medium text-slate-600">{o.items?.length || 0}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-800">{formatCurrency(o.totalPrice)}</td>
                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {o.isInvoiced ? (
                        <span className="text-emerald-600 font-semibold text-[11px]">Yes</span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">No</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Order Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {!o.isInvoiced && (
                        <button
                          onClick={() => handleGenerateInvoice(o._id)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Generate Invoice"
                        >
                          <FileText className="w-4 h-4" />
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

      {/* Create Order Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Sales Order"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleCreateOrder} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Customer *</label>
            <select
              required
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">-- Choose Corporate Customer --</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.company ? `${c.company} (${c.name})` : c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Line Items */}
          <div className="border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Order Line Items</h4>
              <button
                type="button"
                onClick={addLine}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Item
              </button>
            </div>

            <div className="space-y-2.5">
              {orderLines.map((line, idx) => (
                <div key={idx} className="flex items-center space-x-2 bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/60">
                  <div className="flex-1">
                    <select
                      required
                      value={line.product}
                      onChange={(e) => handleLineProductChange(idx, e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="">-- Select Product --</option>
                      {products.map((p) => (
                        <option key={p._id} value={p._id} disabled={p.stock <= 0}>
                          {p.title} (Stock: {p.stock}) - {formatCurrency(p.price)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-24">
                    <input
                      type="number"
                      min="1"
                      required
                      value={line.quantity}
                      onChange={(e) => handleLineQtyChange(idx, e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg text-center"
                      placeholder="Qty"
                    />
                  </div>

                  <div className="w-28 text-right font-mono font-medium text-xs text-slate-700">
                    {formatCurrency(line.quantity * line.unitPrice)}
                  </div>

                  {orderLines.length > 1 && (
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

          {/* Pricing Summary */}
          <div className="border-t border-slate-100 pt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Order Notes</label>
              <textarea
                rows={2}
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Shipping instructions or terms..."
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Tax Rate (%):</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className="w-16 px-1.5 py-0.5 border border-slate-200 rounded text-right"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Discount ($):</span>
                <input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-20 px-1.5 py-0.5 border border-slate-200 rounded text-right"
                />
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900 text-sm">
                <span>Total Amount:</span>
                <span className="text-blue-600">{formatCurrency(finalTotal)}</span>
              </div>
            </div>
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
              Confirm & Create Order
            </button>
          </div>
        </form>
      </Modal>

      {/* View Order Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Sales Order Details: ${selectedOrder?.orderNumber}`}
        maxWidth="max-w-2xl"
      >
        {selectedOrder && (
          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-start bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div>
                <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Customer</p>
                <h4 className="font-bold text-slate-900 text-sm mt-0.5">{selectedOrder.customer?.company || selectedOrder.customer?.name}</h4>
                <p className="text-slate-500">{selectedOrder.customer?.email}</p>
                <p className="text-slate-500">{selectedOrder.customer?.phone}</p>
              </div>
              <div className="text-right">
                <StatusBadge status={selectedOrder.status} />
                <p className="text-slate-400 mt-2 text-[11px]">Ordered on {formatDate(selectedOrder.createdAt)}</p>
              </div>
            </div>

            {/* Line items list */}
            <div>
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">Purchased Items</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-2 px-3">Item</th>
                      <th className="py-2 px-3">SKU</th>
                      <th className="py-2 px-3 text-center">Qty</th>
                      <th className="py-2 px-3 text-right">Price</th>
                      <th className="py-2 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedOrder.items?.map((it, i) => (
                      <tr key={i}>
                        <td className="py-2 px-3 font-medium text-slate-800">{it.title}</td>
                        <td className="py-2 px-3 text-slate-500 font-mono">{it.SKU}</td>
                        <td className="py-2 px-3 text-center">{it.quantity}</td>
                        <td className="py-2 px-3 text-right">{formatCurrency(it.unitPrice)}</td>
                        <td className="py-2 px-3 text-right font-semibold">{formatCurrency(it.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Order status changer */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-700">Update Status:</span>
                <select
                  value={selectedOrder.status}
                  onChange={(e) => handleStatusUpdate(selectedOrder._id, e.target.value)}
                  className="px-2.5 py-1 border border-slate-200 rounded-lg text-xs bg-white"
                >
                  <option value="Confirmed">Confirmed</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="text-right">
                <p className="text-slate-500">Order Total</p>
                <p className="text-base font-bold text-blue-600">{formatCurrency(selectedOrder.totalPrice)}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SalesOrders;

