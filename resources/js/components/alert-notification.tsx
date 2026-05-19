import {
    CheckCircle2Icon,
    AlertCircleIcon,
    XCircleIcon,
    InfoIcon,
    X,
} from 'lucide-react';

export type AlertType =
    | 'success'
    | 'error'
    | 'warning'
    | 'info';

const alertStyles = {
    success: {
        container:
            'bg-green-50 border-green-200 shadow-lg',
        title: 'text-green-900',
        description: 'text-green-700',
        icon: 'text-green-600',
        Icon: CheckCircle2Icon,
    },
    error: {
        container:
            'bg-red-50 border-red-200 shadow-lg',
        title: 'text-red-900',
        description: 'text-red-700',
        icon: 'text-red-600',
        Icon: XCircleIcon,
    },
    warning: {
        container:
            'bg-yellow-50 border-yellow-200 shadow-lg',
        title: 'text-yellow-900',
        description: 'text-yellow-700',
        icon: 'text-yellow-600',
        Icon: AlertCircleIcon,
    },
    info: {
        container:
            'bg-blue-50 border-blue-200 shadow-lg',
        title: 'text-blue-900',
        description: 'text-blue-700',
        icon: 'text-blue-600',
        Icon: InfoIcon,
    },
};

type Props = {
    type?: AlertType;
    title: string;
    description?: string;
    onClose?: () => void;
};

export function AlertNotification({
    type = 'info',
    title,
    description,
    onClose,
}: Props) {
    const style = alertStyles[type];
    const Icon = style.Icon;

    return (
        <div
            className={`
                animate-in slide-in-from-top-5
                rounded-xl border p-4
                ${style.container}
            `}
        >
            <div className="flex gap-3">
                <Icon
                    className={`h-5 w-5 shrink-0 mt-0.5 ${style.icon}`}
                />

                <div className="flex-1">
                    <h3
                        className={`font-semibold ${style.title}`}
                    >
                        {title}
                    </h3>

                    {description && (
                        <p
                            className={`mt-1 text-sm ${style.description}`}
                        >
                            {description}
                        </p>
                    )}
                </div>

                <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-black"
                >
                    <X size={18} />
                </button>
            </div>
        </div>
    );
}