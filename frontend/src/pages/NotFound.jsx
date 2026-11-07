import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileQuestion } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
        <FileQuestion className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">404 - Page Not Found</h1>
      <p className="text-sm text-slate-500 mt-2 max-w-sm">
        The ERP resource or view you are trying to access does not exist or has been moved.
      </p>
      <Link
        to="/dashboard"
        className="mt-6 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" />
        Return to Dashboard
      </Link>
    </div>
  );
};

export default NotFound;
