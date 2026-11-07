import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import Modal from '../components/common/Modal';
import { Search, Plus, Edit2, Trash2, Users, Building, Mail, Phone, MapPin } from 'lucide-react';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';

const Customers = () => {
  const { user } = useSelector((state) => state.auth);
  const canModify = ['admin', 'sales'].includes(user?.role);

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'USA',
    notes: '',
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get(`/customers?search=${encodeURIComponent(searchTerm)}`);
      setCustomers(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [searchTerm]);

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      company: '',
      email: '',
      phone: '',
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'USA',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cust) => {
    setEditingCustomer(cust);
    setFormData({
      name: cust.name,
      company: cust.company || '',
      email: cust.email,
      phone: cust.phone,
      street: cust.address?.street || '',
      city: cust.address?.city || '',
      state: cust.address?.state || '',
      postalCode: cust.address?.postalCode || '',
      country: cust.address?.country || 'USA',
      notes: cust.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      company: formData.company,
      email: formData.email,
      phone: formData.phone,
      address: {
        street: formData.street,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode,
        country: formData.country,
      },
      notes: formData.notes,
    };

    try {
      if (editingCustomer) {
        await axiosClient.put(`/customers/${editingCustomer._id}`, payload);
        toast.success('Customer details updated');
      } else {
        await axiosClient.post('/customers', payload);
        toast.success('Customer added successfully');
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save customer');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete customer "${name}"?`)) return;
    try {
      await axiosClient.delete(`/customers/${id}`);
      toast.success('Customer deleted');
      fetchCustomers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete customer');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Customer Directory</h2>
          <p className="text-sm text-slate-500">Corporate accounts, procurement contacts, and billing profiles.</p>
        </div>
        {canModify && (
          <button
            onClick={openAddModal}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add New Customer
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Search customers by company, name, email or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
        </div>
      </div>

      {/* Customers Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">Loading customers...</div>
      ) : customers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-16 text-center shadow-xs">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <h4 className="text-slate-700 font-semibold text-sm">No customers found</h4>
          <p className="text-xs text-slate-400 mt-1">Start by adding your first enterprise client.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {customers.map((c) => (
            <div
              key={c._id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                    {c.company ? c.company.slice(0, 2).toUpperCase() : c.name.slice(0, 2).toUpperCase()}
                  </div>
                  {canModify && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => openEditModal(c)}
                        className="p-1 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(c._id, c.name)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <h3 className="font-bold text-slate-900 mt-3 text-sm">{c.name}</h3>
                {c.company && (
                  <p className="text-xs font-semibold text-blue-600 flex items-center mt-0.5">
                    <Building className="w-3 h-3 mr-1" />
                    {c.company}
                  </p>
                )}

                <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                  <div className="flex items-center">
                    <Mail className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                    <span className="truncate">{c.email}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                    <span>{c.phone}</span>
                  </div>
                  {c.address?.city && (
                    <div className="flex items-center">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                      <span className="truncate">{c.address.city}, {c.address.state || c.address.country}</span>
                    </div>
                  )}
                </div>
              </div>

              {c.notes && (
                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 italic">
                  "{c.notes}"
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? 'Edit Customer Information' : 'Register New Customer'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. David Sterling"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Organization</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="e.g. Sterling Aerospace Corp"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="billing@customer.com"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Address</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Street Address"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
              <input
                type="text"
                placeholder="City"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
              <input
                type="text"
                placeholder="State / Province"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
              <input
                type="text"
                placeholder="Postal Code"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Preferences</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Credit terms, shipping delivery instructions..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-colors"
            >
              {editingCustomer ? 'Update Customer' : 'Save Customer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Customers;
