import {
    createContext,
    useContext,
    useState,
    ReactNode,
    useCallback,
} from 'react';
import { AlertNotification, AlertType } from '@/components/alert-notification';

type Notification = {
    id: number;
    type: AlertType;
    title: string;
    description?: string;
};

type NotificationContextType = {
    notify: (
        type: AlertType,
        title: string,
        description?: string
    ) => void;
};

const NotificationContext =
    createContext<NotificationContextType | null>(null);

export function NotificationProvider({
    children,
}: {
    children: ReactNode;
}) {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const removeNotification = (id: number) => {
        setNotifications((prev) =>
            prev.filter((item) => item.id !== id)
        );
    };

    const notify = useCallback(
        (
            type: AlertType,
            title: string,
            description?: string
        ) => {
            const id = Date.now();

            setNotifications((prev) => [
                ...prev,
                { id, type, title, description },
            ]);

            setTimeout(() => {
                removeNotification(id);
            }, 3000);
        },
        []
    );

    return (
        <NotificationContext.Provider value={{ notify }}>
            {children}

            <div className="fixed top-4 right-4 z-50 flex w-[95%] max-w-sm flex-col gap-3 sm:w-full">
                {notifications.map((item) => (
                    <AlertNotification
                        key={item.id}
                        {...item}
                        onClose={() =>
                            removeNotification(item.id)
                        }
                    />
                ))}
            </div>
        </NotificationContext.Provider>
    );
}

export function useNotification() {
    const context = useContext(NotificationContext);

    if (!context) {
        throw new Error(
            'useNotification must be used inside NotificationProvider'
        );
    }

    return context;
}