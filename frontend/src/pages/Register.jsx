import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser, clearError } from '../redux/authSlice';
import { PackagePlus, Lock, Mail, User, Shield, ArrowRight } from 'lucide-react';
import { toast } from 'react-toastify';

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('sales');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
    return () => {
      dispatch(clearError());
    };
  }, [isAuthenticated, navigate, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.warning('Please fill in all required fields');
      return;
    }

    if (password.length < 6) {
      toast.warning('Password must be at least 6 characters');
      return;
    }

    const res = await dispatch(registerUser({ name, email, password, role }));
    if (registerUser.fulfilled.match(res)) {
      toast.success('Registration successful! Welcome to SkyBrisk ERP.');
      navigate('/dashboard');
    } else {
      toast.error(res.payload || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/30 mb-3">
          <PackagePlus className="w-7 h-7" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Create ERP Account</h2>
        <p className="mt-1 text-sm text-slate-400">Join your organization's resource platform</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-slate-900 border border-slate-800 py-8 px-6 sm:px-10 shadow-2xl rounded-3xl">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sarah Connor"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-slate-200 placeholder-slate-500 text-xs focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                />
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Corporate Email Address *</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@erp.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-slate-200 placeholder-slate-500 text-xs focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Department Role *</label>
              <div className="relative">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-slate-200 text-xs focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                >
                  <option value="sales">Sales (Orders, Invoices, Customers)</option>
                  <option value="purchase">Purchase (Suppliers, POs, Products)</option>
                  <option value="inventory">Inventory (Stock Management, GRN)</option>
                  <option value="admin">Administrator (Complete System Access)</option>
                </select>
                <Shield className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Secure Password *</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-slate-200 placeholder-slate-500 text-xs focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-md shadow-blue-600/30 disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Complete Registration'}
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-400">
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-blue-400 hover:text-blue-300">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
