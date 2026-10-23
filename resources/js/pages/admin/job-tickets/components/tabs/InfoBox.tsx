import React from 'react';

// Small presentational box used across the Design tab to display a label/value pair.
function InfoBox({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-border/70 bg-card p-4 text-card-foreground shadow-xs transition-colors">
            {/* Label shown in small uppercase text */}
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {label}
            </p>

            {/* Value shown prominently */}
            <p className="mt-1 font-bold text-foreground">{value}</p>
        </div>
    );
}

export default InfoBox;
