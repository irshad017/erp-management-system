import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import { formatCurrency, formatDate } from '../utils/formatters';
import { generateInvoicePDF } from '../utils/generateInvoicePDF';
import {
  Search,
  Plus,
  Eye,
  Download,
  CreditCard,
  FileText,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';

const Invoices = () => {
  const { user } = useSelector((state) => state.auth);
  const canModify = ['admin', 'sales'].includes(user?.role);

  const [invoices, setInvoices] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Form State
  const [selectedSalesOrderId, setSelectedSalesOrderId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('Payment is due within 14 days. Thank you for your business!');

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', currentPage);
      params.append('limit', 10);
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);

      const res = await axiosClient.get(`/invoices?${params.toString()}`);
      setInvoices(res.data.data);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const fetchUninvoicedOrders = async () => {
    try {
      const res = await axiosClient.get('/sales-orders?limit=100');
      const uninvoiced = res.data.data.filter((so) => !so.isInvoiced);
      setSalesOrders(uninvoiced);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [currentPage, statusFilter]);

  useEffect(() => {
    fetchUninvoicedOrders();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchInvoices();
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!selectedSalesOrderId) {
      toast.warning('Please select a sales order to invoice');
      return;
    }

    try {
      const res = await axiosClient.post('/invoices', {
        salesOrderId: selectedSalesOrderId,
        dueDate: dueDate || undefined,
        notes,
      });

      toast.success(`Invoice ${res.data.data.invoiceNumber} generated!`);
      setIsCreateOpen(false);
      setSelectedSalesOrderId('');
      fetchInvoices();
      fetchUninvoicedOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate invoice');
    }
  };

  const handleMarkAsPaid = async (invoiceId) => {
    try {
      await axiosClient.put(`/invoices/${invoiceId}/status`, {
        status: 'Paid',
        paymentMethod: 'Bank Transfer',
      });
      toast.success('Invoice marked as Paid! Sales Order synchronized.');
      fetchInvoices();
      if (selectedInvoice && selectedInvoice._id === invoiceId) {
        setSelectedInvoice({ ...selectedInvoice, status: 'Paid' });
      }
    } catch (err) {
      toast.error('Failed to update invoice status');
    }
  };

  const handleExportPDF = (invoice) => {
    try {
      generateInvoicePDF(invoice);
      toast.success(`PDF downloaded: ${invoice.invoiceNumber}.pdf`);
    } catch (err) {
      toast.error('Error generating PDF invoice');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Invoices & Billing</h2>
          <p className="text-sm text-slate-500">Corporate invoice generation, payment reconciliations, and PDF exports.</p>
        </div>
        {canModify && (
          <button
            onClick={() => {
              fetchUninvoicedOrders();
              setIsCreateOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Generate New Invoice
          </button>
        )}
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search by invoice number (e.g. INV-)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
            <option value="">All Payment Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400">Loading invoices...</div>
        ) : invoices.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h4 className="text-slate-700 font-semibold text-sm">No invoices found</h4>
            <p className="text-xs text-slate-400 mt-1">Generate an invoice from any completed or confirmed sales order.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Order Ref</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Issue Date</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600">{inv.invoiceNumber}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{inv.salesOrder?.orderNumber || '-'}</td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800">{inv.customer?.company || inv.customer?.name}</p>
                      <p className="text-[11px] text-slate-400">{inv.customer?.email}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{formatDate(inv.issuedDate || inv.createdAt)}</td>
                    <td className="py-3.5 px-4 text-slate-500">{formatDate(inv.dueDate)}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-800">{formatCurrency(inv.totalAmount)}</td>
                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Invoice"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleExportPDF(inv)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Export to PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      {inv.status !== 'Paid' && canModify && (
                        <button
                          onClick={() => handleMarkAsPaid(inv._id)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Mark as Paid"
                        >
                          <CreditCard className="w-4 h-4" />
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
                className="p-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-white disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                className="p-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-white disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Invoice Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Generate Invoice from Sales Order"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateInvoice} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Sales Order *</label>
            <select
              required
              value={selectedSalesOrderId}
              onChange={(e) => setSelectedSalesOrderId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
            >
              <option value="">-- Choose Uninvoiced Order --</option>
              {salesOrders.map((so) => (
                <option key={so._id} value={so._id}>
                  {so.orderNumber} - {so.customer?.company || so.customer?.name} ({formatCurrency(so.totalPrice)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Notes / Payment Instructions</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
            />
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
              disabled={salesOrders.length === 0}
              className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm disabled:opacity-40"
            >
              Issue Invoice
            </button>
          </div>
        </form>
      </Modal>

      {/* View Invoice Modal */}
      <Modal
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        title={`Invoice: ${selectedInvoice?.invoiceNumber}`}
        maxWidth="max-w-2xl"
      >
        {selectedInvoice && (
          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-start bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div>
                <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Billed To</p>
                <h4 className="font-bold text-slate-900 text-sm mt-0.5">{selectedInvoice.customer?.company || selectedInvoice.customer?.name}</h4>
                <p className="text-slate-500">{selectedInvoice.customer?.email}</p>
                <p className="text-slate-500">{selectedInvoice.customer?.phone}</p>
              </div>
              <div className="text-right">
                <StatusBadge status={selectedInvoice.status} />
                <p className="text-slate-400 mt-2 text-[11px]">Issued: {formatDate(selectedInvoice.issuedDate)}</p>
                <p className="text-slate-400 text-[11px]">Due: {formatDate(selectedInvoice.dueDate)}</p>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">Line Items</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-2 px-3">Item</th>
                      <th className="py-2 px-3">SKU</th>
                      <th className="py-2 px-3 text-center">Qty</th>
                      <th className="py-2 px-3 text-right">Price</th>
                      <th className="py-2 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedInvoice.items?.map((it, i) => (
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

            <div className="flex justify-between items-center border-t border-slate-100 pt-3">
              <button
                onClick={() => handleExportPDF(selectedInvoice)}
                className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Download PDF
              </button>

              <div className="text-right">
                <span className="text-slate-500 mr-3">Total Due:</span>
                <span className="text-base font-bold text-blue-600">{formatCurrency(selectedInvoice.totalAmount)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Invoices;

