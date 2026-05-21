const InfoLine = ({ label, value }: { label: string; value: React.ReactNode }) => {
    return (
        <div className="flex items-center justify-between gap-3">
            <span className="text-slate-500">{label}</span>
            <span className="font-medium text-slate-800">{value}</span>
        </div>
    );
};

export default InfoLine;