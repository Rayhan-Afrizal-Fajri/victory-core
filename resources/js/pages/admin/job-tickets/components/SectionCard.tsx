import AppLogoIcon from '@/components/app-logo-icon';
import React from 'react';

export const SectionCard: React.FC<React.PropsWithChildren<{ title?: string; icon?: any }>> = ({ title, icon, children }) => {
  return (
    <div className="bg-white shadow-sm rounded-md border border-gray-100 p-4 dark:bg-slate-950 dark:border-slate-700">
      <div className="flex items-center gap-2 mb-2">
        {icon && (
          <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-primary text-sidebar-primary-foreground ">
              {icon}
          </div>
        )}
        {title && <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
};

export default SectionCard;
