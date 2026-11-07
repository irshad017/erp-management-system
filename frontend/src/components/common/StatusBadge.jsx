import React from 'react';

const StatusBadge = ({ status }) => {
  if (!status) return null;

  const normalized = status.toLowerCase();

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-300';

  if (['delivered', 'received', 'completed', 'paid', 'in stock', 'active'].includes(normalized)) {
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (['confirmed', 'processing', 'issued', 'partially received'].includes(normalized)) {
    colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
  } else if (['unpaid', 'draft', 'low stock'].includes(normalized)) {
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (['cancelled', 'out of stock', 'overdue', 'inactive'].includes(normalized)) {
    colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClasses}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
      {status}
    </span>
  );
};

export default StatusBadge;
