const Field = ({
    label,
    error,
    children,
    description = null,
}: {
    label: string;
    error?: string;
    children: React.ReactNode;
    description?: string | null;
}) => {
    return (
        <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">{label}</label>
            {children}
            {error && <p className="text-xs text-red-500">{error}</p>}
            {description && (
                <span className="text-xs font-normal text-slate-500">{description}</span>
            )}
        </div>
    );
};

export default Field;