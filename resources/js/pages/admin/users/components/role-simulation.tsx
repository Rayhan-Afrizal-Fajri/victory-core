import { Eye } from "lucide-react";
import type { RoleData } from "../types"

interface Props {
    roles: RoleData[]
    simulatedRole: RoleData | null
    setSimulatedRole: (r: RoleData | null) => void
}

export default function RoleSimulation({
    roles,
    simulatedRole,
    setSimulatedRole
}: Props) {

    const formatRoleName = (name: string) => {
        const words = name.replace(/_/g, ' ').split(' ');
        return words
            .map((w) => {
                if (w.toLowerCase() === 'spv') {
                    return 'SPV';
                }
                return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
            })
            .join(' ');
    };

    return (

        <div className="flex p-3 justify-between items-center rounded-2xl border border-sidebar-border/70 bg-background mb-4">
            <div className="flex items-center gap-2">
                <Eye className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                    Simulasi Role:
                </span>
            </div>
            <div className="flex gap-2 flex-wrap">
                <button
                    type="button"
                    onClick={() => setSimulatedRole(null)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        !simulatedRole
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                >
                    Semua
                </button>
                {roles.map((role) => (
                    <button
                        key={role.id}
                        type="button"
                        onClick={() => setSimulatedRole(role)}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                            simulatedRole?.id === role.id
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                    >
                        {formatRoleName(role.name)}
                    </button>
                ))}
            </div>
        </div>
    )
}