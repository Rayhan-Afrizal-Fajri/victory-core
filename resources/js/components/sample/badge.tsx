const Badge = ({
    children,
    className = 'border-slate-200 bg-slate-100 text-slate-700',
}: {
    children: React.ReactNode;
    className?: string;
}) => {
    return (
        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}>
            {children}
        </span>
    );
};

export default Badge;