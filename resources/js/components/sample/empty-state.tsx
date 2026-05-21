const EmptyState = ({
    icon,
    title,
    description,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
}) => {
    return (
        <div className="rounded-xl border border-dashed bg-slate-50 p-6 text-center">
            <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-white text-slate-500">
                {icon}
            </div>
            <p className="text-sm font-semibold text-slate-800">{title}</p>
            <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>
    );
};

export default EmptyState;