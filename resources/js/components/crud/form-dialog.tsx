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
}: FormDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button variant="default" className="inline-flex items-center gap-2">
                  <Plus className="size-4" /> Tambah Customer
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-xl">
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