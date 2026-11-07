import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/common/ProtectedRoute';
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';

// Pages
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import SalesOrders from './pages/SalesOrders';
import PurchaseOrders from './pages/PurchaseOrders';
import GRN from './pages/GRN';
import Invoices from './pages/Invoices';
import UserManagement from './pages/UserManagement';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen transition-all">
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected ERP Modules */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Navigate to="/dashboard" replace />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <Layout>
              <Products />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/customers"
        element={
          <ProtectedRoute>
            <Layout>
              <Customers />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/suppliers"
        element={
          <ProtectedRoute>
            <Layout>
              <Suppliers />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/sales-orders"
        element={
          <ProtectedRoute>
            <Layout>
              <SalesOrders />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/purchase-orders"
        element={
          <ProtectedRoute>
            <Layout>
              <PurchaseOrders />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/grn"
        element={
          <ProtectedRoute>
            <Layout>
              <GRN />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/invoices"
        element={
          <ProtectedRoute>
            <Layout>
              <Invoices />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Admin Protected Module */}
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout>
              <UserManagement />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Fallback 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;
