import { useState } from "react";
import { router } from "@inertiajs/react";
import { toast } from "sonner";

type UseCrudOptions<T> = {
    deleteUrl?: (id: number) => string;
    entityName?: string;
    onDeleteSuccess?: () => void;
};

export function useCrud<T extends { id: number; name?: string }>({
    deleteUrl,
    entityName = 'Data',
    onDeleteSuccess,
}: UseCrudOptions<T> = {}) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    
    const [editingItem, setEditingItem] = useState<T | null>(null);
    const [selectedItem, setSelectedItem] = useState<T | null>(null);

    //create
    const openCreate = () => {
        setEditingItem(null);
        setIsFormOpen(true);
    };

    //edit
    const openEdit = (item: T) => {
        setEditingItem(item);
        setIsFormOpen(true);
    };

    //detail
    const openDetail = (item: T) => {
        setSelectedItem(item);
        setIsDetailOpen(true);
    };

    //close all
    const closeForm = () => {
        setIsFormOpen(false);
        setEditingItem(null);
    };

    const closeDetail = () => {
        setIsDetailOpen(false);
        setSelectedItem(null);
    };

    //delete
    const handleDelete = (item: T) => {
        if (!deleteUrl) return;

        const confirmed = confirm(
            `Apakah yakin ingin menghapus ${entityName} "${item.name ?? item.id}"?`
        );

        if (!confirmed) return;

        router.delete(deleteUrl(item.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`${entityName} berhasil dihapus`);
                onDeleteSuccess?.();
            },
        });
    };

    return {
        isFormOpen,
        isDetailOpen,

        editingItem,
        selectedItem,

        openCreate,
        openEdit,
        openDetail,

        closeForm,
        closeDetail,

        setIsFormOpen,
        setIsDetailOpen,
    }
}