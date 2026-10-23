import React from 'react';

export const SectionCard: React.FC<React.PropsWithChildren<{ title?: string; icon?: any }>> = ({ title, icon, children }) => {
  return (
    <div className="bg-card text-card-foreground shadow-xs rounded-2xl border border-border/70 p-5 transition-colors">
      <div className="flex items-center gap-2.5 mb-3">
        {icon && (
          <div className="flex aspect-square size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {icon}
          </div>
        )}
        {title && <h3 className="text-sm font-bold text-foreground tracking-tight">{title}</h3>}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
};

export default SectionCard;
