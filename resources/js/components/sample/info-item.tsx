const InfoItem = ({ label, value }: { label: string; value: React.ReactNode }) => {
    return (
        <div className="rounded-xl border bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {label}
            </p>
            <p className="mt-1 font-semibold text-slate-900">{value}</p>
        </div>
    );
};

export default InfoItem;