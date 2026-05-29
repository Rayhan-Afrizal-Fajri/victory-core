import React from 'react';

// Small presentational box used across the Design tab to display a label/value pair.
function InfoBox({ label, value }: { label: string; value: React.ReactNode }) {
    // Container with a subtle border and white background to separate info blocks.
    return (
        <div className="rounded-xl border bg-white p-4">
            {/* Label shown in small uppercase text */}
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {label}
            </p>

            {/* Value shown prominently */}
            <p className="mt-1 font-semibold text-slate-900">{value}</p>
        </div>
    );
}

export default InfoBox;
