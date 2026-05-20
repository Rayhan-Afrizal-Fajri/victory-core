import React from 'react';

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info';

const colors: Record<Variant, string> = {
  default: 'bg-gray-100 text-gray-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
};

export const StatusBadge: React.FC<{ label: string; variant?: Variant }> = ({ label, variant = 'default' }) => {
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-md text-sm font-medium ${colors[variant]}`}>
      {label}
    </span>
  );
};

export default StatusBadge;
