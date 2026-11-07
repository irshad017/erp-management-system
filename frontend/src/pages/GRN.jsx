import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import { formatDate } from '../utils/formatters';
import { Search, Plus, Eye, PackageCheck, FileCheck2, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';

const GRN = () => {
  const [searchParams] = useSearchParams();
  const preselectedPoId = searchParams.get('poId');
  const { user } = useSelector((state) => state.auth);
  const canModify = ['admin', 'inventory', 'purchase'].includes(user?.role);

  const [grns, setGrns] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedGRN, setSelectedGRN] = useState(null);

  // Form State
  const [selectedPoId, setSelectedPoId] = useState(preselectedPoId || '');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [receivedItems, setReceivedItems] = useState([]);
  const [notes, setNotes] = useState('');

  const fetchGRNs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', currentPage);
      params.append('limit', 10);
      if (searchTerm) params.append('search', searchTerm);

      const res = await axiosClient.get(`/grn?${params.toString()}`);
      setGrns(res.data.data);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      toast.error('Failed to load Goods Receipt Notes');
    } finally {
      setLoading(false);
    }
  };

  const fetchActivePOs = async () => {
    try {
      const res = await axiosClient.get('/purchase-orders?limit=100');
      // Filter orders that are not fully received or cancelled
      const active = res.data.data.filter((po) => po.status !== 'Received' && po.status !== 'Cancelled');
      setPurchaseOrders(active);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchGRNs();
  }, [currentPage]);

  useEffect(() => {
    fetchActivePOs();
  }, []);

  // When PO is selected, populate items
  useEffect(() => {
    if (preselectedPoId) {
      setSelectedPoId(preselectedPoId);
      setIsCreateOpen(true);
    }
  }, [preselectedPoId]);

  useEffect(() => {
    if (!selectedPoId) {
      setReceivedItems([]);
      return;
    }

    const loadPODetails = async () => {
      try {
        const res = await axiosClient.get(`/purchase-orders/${selectedPoId}`);
        const po = res.data.data;
        const items = (po.items || []).map((it) => ({
          product: it.product?._id || it.product,
          title: it.title,
          SKU: it.SKU,
          orderedQuantity: it.quantity,
          receivedQuantity: it.quantity, // Default to receiving full quantity
          unitCost: it.unitCost,
          remarks: 'Passed quality check',
        }));
        setReceivedItems(items);
      } catch (err) {
        toast.error('Could not load PO items');
      }
    };

    loadPODetails();
  }, [selectedPoId]);

  const handleQtyChange = (idx, qty) => {
    const updated = [...receivedItems];
    updated[idx].receivedQuantity = Math.max(0, parseInt(qty, 10) || 0);
    setReceivedItems(updated);
  };

  const handleRemarkChange = (idx, remarks) => {
    const updated = [...receivedItems];
    updated[idx].remarks = remarks;
    setReceivedItems(updated);
  };

  const handleCreateGRN = async (e) => {
    e.preventDefault();
    if (!selectedPoId) {
      toast.warning('Please select a purchase order');
      return;
    }

    if (receivedItems.length === 0) {
      toast.warning('No items found to receive');
      return;
    }

    try {
      const res = await axiosClient.post('/grn', {
        purchaseOrderId: selectedPoId,
        deliveryNoteNumber: deliveryNote,
        receivedItems,
        notes,
      });

      toast.success(res.data.message || 'GRN created and stock updated!');
      setIsCreateOpen(false);
      setSelectedPoId('');
      setDeliveryNote('');
      setReceivedItems([]);
      setNotes('');
      fetchGRNs();
      fetchActivePOs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create GRN');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Goods Receipt Notes (GRN)</h2>
          <p className="text-sm text-slate-500">Log physical dock arrivals against Purchase Orders and auto-increment inventory stock.</p>
        </div>
        {canModify && (
          <button
            onClick={() => {
              fetchActivePOs();
              setIsCreateOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Receive Goods (New GRN)
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Search by GRN # or delivery note..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
        </div>
      </div>

      {/* GRN Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400">Loading GRN log...</div>
        ) : grns.length === 0 ? (
          <div className="py-16 text-center">
            <FileCheck2 className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h4 className="text-slate-700 font-semibold text-sm">No Goods Receipt Notes recorded</h4>
            <p className="text-xs text-slate-400 mt-1">Receive arriving goods against open purchase orders.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-3.5 px-4">GRN #</th>
                  <th className="py-3.5 px-4">Linked PO</th>
                  <th className="py-3.5 px-4">Supplier</th>
                  <th className="py-3.5 px-4">Delivery Note #</th>
                  <th className="py-3.5 px-4">Received Date</th>
                  <th className="py-3.5 px-4">Received By</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {grns.map((g) => (
                  <tr key={g._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600">{g.grnNumber}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">{g.purchaseOrder?.poNumber || '-'}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{g.supplier?.company || g.supplier?.name}</td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono">{g.deliveryNoteNumber || 'N/A'}</td>
                    <td className="py-3.5 px-4 text-slate-500">{formatDate(g.receivedDate || g.createdAt)}</td>
                    <td className="py-3.5 px-4 text-slate-600">{g.receivedBy?.name || 'Warehouse Staff'}</td>
                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={g.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedGRN(g)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View GRN Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
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

      {/* Create GRN Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Goods Receipt Note (GRN) & Update Inventory"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleCreateGRN} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Purchase Order *</label>
              <select
                required
                value={selectedPoId}
                onChange={(e) => setSelectedPoId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
              >
                <option value="">-- Choose Open PO --</option>
                {purchaseOrders.map((po) => (
                  <option key={po._id} value={po._id}>
                    {po.poNumber} ({po.supplier?.company || po.supplier?.name}) - Status: {po.status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Vendor Delivery Note #</label>
              <input
                type="text"
                value={deliveryNote}
                onChange={(e) => setDeliveryNote(e.target.value)}
                placeholder="e.g. DN-SUP-9921"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          {/* Received Items table */}
          {receivedItems.length > 0 && (
            <div className="border-t border-slate-100 pt-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Verify Received Items</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Item Description</th>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3 text-center">Ordered</th>
                      <th className="py-2.5 px-3 text-center">Received Qty</th>
                      <th className="py-2.5 px-3">Inspection Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {receivedItems.map((item, idx) => (
                      <tr key={idx} className="bg-white">
                        <td className="py-2.5 px-3 font-medium text-slate-800">{item.title}</td>
                        <td className="py-2.5 px-3 text-slate-500 font-mono">{item.SKU}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-700">{item.orderedQuantity}</td>
                        <td className="py-2.5 px-3 text-center w-28">
                          <input
                            type="number"
                            min="0"
                            max={item.orderedQuantity * 2}
                            value={item.receivedQuantity}
                            onChange={(e) => handleQtyChange(idx, e.target.value)}
                            className="w-20 px-2 py-1 text-center font-bold text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={item.remarks}
                            onChange={(e) => handleRemarkChange(idx, e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-emerald-600 font-medium mt-2 flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Submitting this GRN will automatically increment warehouse product stock levels.
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Dock Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Package conditions, carrier name, unloading dock..."
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
              disabled={receivedItems.length === 0}
              className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm disabled:opacity-40"
            >
              Confirm Goods Receipt & Increment Stock
            </button>
          </div>
        </form>
      </Modal>

      {/* View GRN Details Modal */}
      <Modal
        isOpen={!!selectedGRN}
        onClose={() => setSelectedGRN(null)}
        title={`Goods Receipt Note: ${selectedGRN?.grnNumber}`}
        maxWidth="max-w-2xl"
      >
        {selectedGRN && (
          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-start bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div>
                <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Supplier</p>
                <h4 className="font-bold text-slate-900 text-sm mt-0.5">{selectedGRN.supplier?.company || selectedGRN.supplier?.name}</h4>
                <p className="text-slate-500">PO Ref: {selectedGRN.purchaseOrder?.poNumber}</p>
                <p className="text-slate-500">Delivery Note: {selectedGRN.deliveryNoteNumber || 'N/A'}</p>
              </div>
              <div className="text-right">
                <StatusBadge status={selectedGRN.status} />
                <p className="text-slate-400 mt-2 text-[11px]">Received: {formatDate(selectedGRN.receivedDate || selectedGRN.createdAt)}</p>
                <p className="text-slate-400 text-[11px]">By: {selectedGRN.receivedBy?.name || 'Warehouse Staff'}</p>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">Verified Received Items</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-2 px-3">Item</th>
                      <th className="py-2 px-3">SKU</th>
                      <th className="py-2 px-3 text-center">Ordered</th>
                      <th className="py-2 px-3 text-center">Received</th>
                      <th className="py-2 px-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedGRN.receivedItems?.map((it, i) => (
                      <tr key={i}>
                        <td className="py-2 px-3 font-medium text-slate-800">{it.title}</td>
                        <td className="py-2 px-3 text-slate-500 font-mono">{it.SKU}</td>
                        <td className="py-2 px-3 text-center text-slate-500">{it.orderedQuantity}</td>
                        <td className="py-2 px-3 text-center font-bold text-emerald-600">{it.receivedQuantity}</td>
                        <td className="py-2 px-3 text-slate-600">{it.remarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedGRN.notes && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-600">
                <span className="font-semibold">Notes:</span> {selectedGRN.notes}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default GRN;

