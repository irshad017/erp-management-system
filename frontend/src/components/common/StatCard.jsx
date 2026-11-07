import React from 'react';

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue', trend }) => {
  const colorMap = {
    blue: 'bg-blue-500 text-white',
    emerald: 'bg-emerald-500 text-white',
    amber: 'bg-amber-500 text-white',
    purple: 'bg-purple-500 text-white',
    rose: 'bg-rose-500 text-white',
  };

  const badgeBg = colorMap[color] || colorMap.blue;

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{title}</p>
          <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center mt-2 text-xs font-medium text-emerald-600">
              <span>{trend}</span>
            </div>
          )}
        </div>
        <div className={`p-3.5 rounded-xl ${badgeBg} shadow-sm`}>
          {Icon && <Icon className="w-6 h-6" />}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
