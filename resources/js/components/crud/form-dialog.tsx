import { Plus } from "lucide-react";
import type { ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from "../ui/button";

type FormDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    submitLabel?: string;
    cancelLabel?: string;
    loading?: boolean;
    onSubmit: () => void;
    children: ReactNode;
    isButtonAdd: boolean;
};

export function FormDialog({
    open,
    onOpenChange,
    title,
    description,
    submitLabel = 'Simpan',
    cancelLabel = 'Batal',
    loading,
    onSubmit,
    children,
    isButtonAdd = true,
}: FormDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {isButtonAdd === true && (
                <DialogTrigger asChild>
                    <Button variant="default" className="inline-flex items-center gap-2">
                    <Plus className="size-4" /> Tambah Customer
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="md:max-w-4xl max-w-xl overflow-y-auto max-h-screen">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description && (
                        <DialogDescription>{description}</DialogDescription>
                    )}
                </DialogHeader>

                <div className="grid gap-4">{children}</div>

                <DialogFooter>
                    <Button
                        variant="secondary"
                        onClick={() => onOpenChange(false)}
                    >
                        {cancelLabel}
                    </Button>

                    <Button disabled={loading} onClick={onSubmit}>
                        {submitLabel}
                    </Button>
                </DialogFooter>

            </DialogContent>
        </Dialog>
    )
}