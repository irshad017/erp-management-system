import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import Modal from '../components/common/Modal';
import { Search, Shield, UserX, UserCheck, Trash2, ShieldCheck, Mail, Calendar } from 'lucide-react';
import { formatDate } from '../utils/formatters';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';

const UserManagement = () => {
  const { user: currentUser } = useSelector((state) => state.auth);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (roleFilter) params.append('role', roleFilter);

      const res = await axiosClient.get(`/users?${params.toString()}`);
      setUsers(res.data.data);
    } catch (err) {
      toast.error('Failed to load user list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, roleFilter]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await axiosClient.put(`/users/${userId}`, { role: newRole });
      toast.success(`Role updated to ${newRole}`);
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update user role');
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await axiosClient.put(`/users/${userId}`, { isActive: !currentStatus });
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update user status');
    }
  };

  const handleDeleteUser = async (userId, name) => {
    if (!window.confirm(`Permanently delete user "${name}"?`)) return;
    try {
      await axiosClient.delete(`/users/${userId}`);
      toast.success('User removed');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">User Management & Permissions</h2>
        <p className="text-sm text-slate-500">System administrators only: configure RBAC roles, user statuses, and access control.</p>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-700"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="sales">Sales</option>
          <option value="purchase">Purchase</option>
          <option value="inventory">Inventory</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400">Loading users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Role Assigned</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4">Joined Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const isSelf = currentUser && (u._id === currentUser.id || u._id === currentUser._id);

                  return (
                    <tr key={u._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {u.name} {isSelf && <span className="text-[10px] text-blue-600 font-mono font-bold">(You)</span>}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{u.email}</td>
                      <td className="py-3.5 px-4">
                        <select
                          disabled={isSelf}
                          value={u.role}
                          onChange={(e) => handleRoleChange(u._id, e.target.value)}
                          className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-white capitalize font-medium text-slate-700 disabled:opacity-60"
                        >
                          <option value="admin">Admin</option>
                          <option value="sales">Sales</option>
                          <option value="purchase">Purchase</option>
                          <option value="inventory">Inventory</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          u.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {u.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{formatDate(u.createdAt)}</td>
                      <td className="py-3.5 px-4 text-right space-x-1">
                        {!isSelf && (
                          <>
                            <button
                              onClick={() => handleToggleStatus(u._id, u.isActive)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                u.isActive ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={u.isActive ? 'Suspend User' : 'Activate User'}
                            >
                              {u.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u._id, u.name)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
