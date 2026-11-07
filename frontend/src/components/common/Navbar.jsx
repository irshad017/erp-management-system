import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../redux/authSlice';
import { Menu, LogOut, Shield, User as UserIcon } from 'lucide-react';
import { toast } from 'react-toastify';

const Navbar = ({ toggleSidebar }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    toast.info('You have been logged out safely.');
    navigate('/login');
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'sales':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'purchase':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'inventory':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between shadow-xs">
      {/* Left side: Hamburger for mobile + ERP Title */}
      <div className="flex items-center space-x-3">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden transition-colors"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-medium text-slate-500">Live Enterprise Instance</span>
        </div>
      </div>

      {/* Right side: User information + Role badge + Logout */}
      <div className="flex items-center space-x-4">
        {user && (
          <div className="flex items-center space-x-3">
            <span
              className={`hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${getRoleBadge(
                user.role
              )}`}
            >
              <Shield className="w-3 h-3 mr-1" />
              {user.role}
            </span>

            <div className="text-right hidden md:block">
              <p className="text-sm font-semibold text-slate-800 leading-tight">{user.name}</p>
              <p className="text-[11px] text-slate-400">{user.email}</p>
            </div>

            <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs shadow-xs">
              <UserIcon className="w-4 h-4 text-slate-600" />
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all shadow-xs"
          title="Sign Out"
        >
          <LogOut className="w-3.5 h-3.5 mr-1.5" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;

