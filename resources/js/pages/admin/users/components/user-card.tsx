import { KeyRound, Mail, Phone, SquarePen, Trash2, User } from "lucide-react"
import type { UserData } from "../types"
import { useCan } from "@/hooks/use-can"


interface Props {
    user: UserData
    isOwner: boolean
    onEdit: () => void
    onPassword: () => void
    onDelete: () => void
}

export default function UserCard({ user, onEdit, onPassword, onDelete }: Props) {
    const can = useCan();

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

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

    const getInitialColor = (name: string) => {
        const colors = [
            'bg-red-100 text-red-700',
            'bg-blue-100 text-blue-700',
            'bg-purple-100 text-purple-700',
            'bg-pink-100 text-pink-700',
            'bg-yellow-100 text-yellow-700',
            'bg-green-100 text-green-700',
        ];
        const index = name.charCodeAt(0) % colors.length;
        return colors[index];
    };

    const isOwnerUser = user.roles.some(role => role.name === 'owner')

    return (

        <div
            className="rounded-3xl border border-sidebar-border/70 bg-background p-4 shadow-sm dark:border-sidebar-border cursor-pointer flex items-start justify-between gap-4"
        >
            <div className="flex items-start gap-3">
                <div
                    className={`rounded-full w-10 h-10 flex items-center justify-center font-bold ${getInitialColor(
                        user.name
                    )}`}
                >
                    {getInitials(user.name)}
                </div>
                <div className="flex flex-col gap-1">
                    <div className="font-semibold text-sm">
                        {user.name}
                    </div>
                    {user.roles.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                            {user.roles.map((role) => (
                                <span
                                    key={role.id}
                                    className="inline-block px-2 py-1 rounded-full text-[10px] font-semibold bg-primary/20 text-primary"
                                >
                                    {formatRoleName(role.name)}
                                </span>
                            ))}
                        </div>
                    )}
                    <div className="space-y-1 text-xs text-muted-foreground">
                        <div className='flex items-center gap-1'>
                            <Mail className="size-3" />
                            {user.email}
                        </div>
                        <div className='flex items-center gap-1'>
                            <User className="size-3" />
                            {user.username}
                        </div>
                        {user.phone &&
                        <div className='flex items-center gap-1'>
                            <Phone className="size-3" />
                            {user.phone}
                        </div>
                        }
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 justify-end pt-2 border-t border-sidebar-border/50">
                {can('user.update') && (
                    <>
                    <button onClick={onEdit}>
                        <SquarePen className="size-4 text-muted-foreground hover:text-primary transition-colors" />
                    </button>
                    <button onClick={onPassword}>
                        <KeyRound className="size-4 text-muted-foreground hover:text-yellow-600" />
                    </button>
                    </>
                )}
                {!isOwnerUser && can('user.delete') && (
                    <button onClick={onDelete}>
                    <Trash2 className="size-4 text-muted-foreground hover:text-red-600 transition-colors" />
                </button>
                )}
            </div>
        </div>
    )
}