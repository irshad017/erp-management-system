import React from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  LayoutDashboard,
  Boxes,
  Users2,
  Truck,
  ShoppingCart,
  FileCheck2,
  FileText,
  ShieldCheck,
  PackagePlus,
  ClipboardList,
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user } = useSelector((state) => state.auth);
  const userRole = user?.role || 'sales';

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Products & Stock', path: '/products', icon: Boxes },
    { name: 'Customers', path: '/customers', icon: Users2 },
    { name: 'Suppliers', path: '/suppliers', icon: Truck },
    { name: 'Sales Orders', path: '/sales-orders', icon: ShoppingCart },
    { name: 'Purchase Orders', path: '/purchase-orders', icon: ClipboardList },
    { name: 'GRN (Goods Receipt)', path: '/grn', icon: FileCheck2 },
    { name: 'Invoices & Billing', path: '/invoices', icon: FileText },
  ];

  // Admin exclusive navigation
  if (userRole === 'admin') {
    navItems.push({
      name: 'User Management',
      path: '/admin/users',
      icon: ShieldCheck,
      adminOnly: true,
    });
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 lg:hidden backdrop-blur-xs"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col border-r border-slate-800`}
      >
        {/* Brand Header */}
        <div className="flex items-center h-16 px-6 bg-slate-950 border-b border-slate-800/80">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <PackagePlus className="w-5 h-5" />
          </div>
          <div className="ml-3">
            <h1 className="text-base font-bold tracking-tight text-white flex items-center">
              SkyBrisk <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono">ERP</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">Enterprise Suite</p>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Core Modules
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 mr-3 transition-transform group-hover:scale-110" />
                <span>{item.name}</span>
                {item.adminOnly && (
                  <span className="ml-auto text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono font-medium">
                    ADMIN
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* User Card at Bottom */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/50">
          <div className="flex items-center p-2 rounded-xl bg-slate-900 border border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs uppercase">
              {user?.name ? user.name.slice(0, 2) : 'US'}
            </div>
            <div className="ml-2.5 overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] text-slate-400 capitalize font-mono">Role: {userRole}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
