const Field = ({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: React.ReactNode;
}) => {
    return (
        <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">{label}</label>
            {children}
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
};

export default Field;