import React, { useMemo, useState, useRef, useEffect } from 'react';
import { FileText, Minus, Plus, Move, X } from 'lucide-react';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type DesignPreviewDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    fileUrl: string | null;
    title?: string;
};

function isPdf(url: string) {
    return url.toLowerCase().split('?')[0].endsWith('.pdf');
}

function isImage(url: string) {
    const cleanUrl = url.toLowerCase().split('?')[0];
    return (
        cleanUrl.endsWith('.jpg') ||
        cleanUrl.endsWith('.jpeg') ||
        cleanUrl.endsWith('.png') ||
        cleanUrl.endsWith('.webp') ||
        cleanUrl.endsWith('.gif')
    );
}

export default function DesignPreviewDialog({
    open,
    onOpenChange,
    fileUrl,
    title = 'Preview Design',
}: DesignPreviewDialogProps) {
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });

    const fileType = useMemo(() => {
        if (!fileUrl) return 'unknown';
        if (isPdf(fileUrl)) return 'pdf';
        if (isImage(fileUrl)) return 'image';
        return 'unknown';
    }, [fileUrl]);

    // Reset posisi dan zoom saat dialog dibuka/ditutup
    useEffect(() => {
        if (open) {
            setZoom(1);
            setPosition({ x: 0, y: 0 });
        }
    }, [open]);

    // Handler untuk memulai drag
    const handleMouseDown = (e: React.MouseEvent) => {
        if (zoom <= 1) return; // Hanya izinkan drag jika sudah di-zoom
        setIsDragging(true);
        dragStart.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        setPosition({
            x: e.clientX - dragStart.current.x,
            y: e.clientY - dragStart.current.y
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent closeButton={false} className="flex h-[90vh] max-w-6xl flex-col overflow-hidden p-0">
                <DialogHeader className="border-b px-5 py-4">
                    <div className="flex items-center justify-between gap-4">
                        <DialogTitle>{title}</DialogTitle>

                        <div className="flex items-center gap-2">
                            {fileType === 'image' && (
                                <>
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="outline"
                                        onClick={() => {
                                            setZoom((v) => Math.max(v - 0.2, 1));
                                            if (zoom <= 1.2) setPosition({ x: 0, y: 0 });
                                        }}
                                    >
                                        <Minus className="size-4" />
                                    </Button>

                                    <span className="w-14 text-center text-xs font-medium text-slate-500">
                                        {Math.round(zoom * 100)}%
                                    </span>

                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="outline"
                                        onClick={() => setZoom((v) => Math.min(v + 0.2, 5))}
                                    >
                                        <Plus className="size-4" />
                                    </Button>
                                </>
                            )}

                            {fileUrl && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => window.open(fileUrl, '_blank')}
                                >
                                    Buka Tab
                                </Button>
                            )}

                            <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => onOpenChange(false)}
                            >
                                <X className="size-4" />
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <div 
                    className={`flex-1 overflow-hidden bg-slate-100 relative ${isDragging ? 'cursor-grabbing' : zoom > 1 ? 'cursor-grab' : 'cursor-default'}`}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    {!fileUrl && (
                        <div className="flex h-full items-center justify-center text-sm text-slate-500">
                            File tidak tersedia.
                        </div>
                    )}

                    {fileUrl && fileType === 'image' && (
                        <div 
                            className="flex h-full w-full items-center justify-center transition-transform duration-75 ease-out"
                            style={{
                                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                                transformOrigin: 'center center',
                            }}
                        >
                            <img
                                src={fileUrl}
                                alt={title}
                                draggable={false} // Penting agar drag bawaan browser tidak bentrok
                                className="max-h-[80%] max-w-[80%] rounded-lg bg-white shadow-lg select-none"
                            />
                        </div>
                    )}

                    {fileUrl && fileType === 'pdf' && (
                        <iframe
                            src={fileUrl}
                            title={title}
                            className="h-full w-full border-none"
                        />
                    )}
                    
                    {/* Indikator Panning */}
                    {zoom > 1 && !isDragging && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-xs flex items-center gap-2 pointer-events-none">
                            <Move className="size-3" /> Geser gambar untuk melihat detail
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}