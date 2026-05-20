import React from 'react';

export const SectionCard: React.FC<React.PropsWithChildren<{ title?: string }>> = ({ title, children }) => {
  return (
    <div className="bg-white shadow-sm rounded-md border border-gray-100 p-4">
      {title && <h3 className="text-sm font-semibold mb-2">{title}</h3>}
      <div className="space-y-2">{children}</div>
    </div>
  );
};

export default SectionCard;
