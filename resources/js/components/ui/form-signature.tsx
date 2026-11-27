import { Check, Eraser, Expand, Loader2, ScanLine, Undo2, Upload, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    extractSignatureFromCanvas,
    fitSignatureToBoxDataUrl,
    loadAndDownscaleSignatureImage,
    type SignatureInkMode,
    trimCanvasToPng,
} from '@/lib/signature-scanner';

interface Props {
    label: string;
    value?: string | null;
    onChange: (value: string | null) => void;
}

export default function FormSignature({ label, value, onChange }: Props) {
    const inlineSigRef = useRef<SignatureCanvas>(null);
    const inlineWrapperRef = useRef<HTMLDivElement>(null);
    const fullscreenSigRef = useRef<SignatureCanvas>(null);
    const fullscreenWrapperRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isExpanded, setIsExpanded] = useState(false);
    const [fullscreenKey, setFullscreenKey] = useState(0);
    const [fullscreenHasStrokes, setFullscreenHasStrokes] = useState(false);

    // Scan upload modal state
    const [scanOpen, setScanOpen] = useState(false);
    const [scanLoading, setScanLoading] = useState(false);
    const [scanError, setScanError] = useState<string | null>(null);
    const [sourceCanvas, setSourceCanvas] = useState<HTMLCanvasElement | null>(null);
    const [scannedPreview, setScannedPreview] = useState<string | null>(null);
    const [thresholdOffset, setThresholdOffset] = useState(0);
    const [inkMode, setInkMode] = useState<SignatureInkMode>('black');

    const drawDataUrlIntoCanvas = useCallback(
        async (
            sigRef: React.RefObject<SignatureCanvas | null>,
            wrapperRef: React.RefObject<HTMLDivElement | null>,
            dataUrl: string,
        ) => {
            if (!sigRef.current || !wrapperRef.current) return;

            const width = wrapperRef.current.clientWidth || 320;
            const height = wrapperRef.current.clientHeight || 160;
            const fitted = await fitSignatureToBoxDataUrl(dataUrl, width, height);

            sigRef.current.clear();
            sigRef.current.fromDataURL(fitted, {
                width,
                height,
                ratio: Math.max(window.devicePixelRatio || 1, 1),
            });
        },
        [],
    );

    const syncInlineFromValue = useCallback(
        async (dataUrl: string) => {
            await drawDataUrlIntoCanvas(inlineSigRef, inlineWrapperRef, dataUrl);
        },
        [drawDataUrlIntoCanvas],
    );

    const handleInlineEnd = () => {
        if (!inlineSigRef.current) return;
        const trimmed = trimCanvasToPng(inlineSigRef.current.getCanvas());
        onChange(trimmed);
    };

    const handleClear = () => {
        inlineSigRef.current?.clear();
        onChange(null);
    };

    // Sync inline canvas pixel dimensions once mounted so drawing matches cursor/finger 1:1
    useEffect(() => {
        const wrapper = inlineWrapperRef.current;
        const sig = inlineSigRef.current;
        if (!wrapper || !sig) return;

        const resizeInline = () => {
            const canvas = sig.getCanvas();
            const w = wrapper.clientWidth;
            const h = wrapper.clientHeight;
            if (!w || !h) return;

            const ratio = Math.max(window.devicePixelRatio || 1, 1);
            const targetW = Math.round(w * ratio);
            const targetH = Math.round(h * ratio);

            if (canvas.width === targetW && canvas.height === targetH) return;

            const existingStrokes = sig.toData();
            const snapshot =
                existingStrokes.length === 0 && !sig.isEmpty()
                    ? trimCanvasToPng(canvas)
                    : null;

            canvas.width = targetW;
            canvas.height = targetH;
            canvas.getContext('2d')?.scale(ratio, ratio);
            sig.clear();

            if (existingStrokes.length > 0) {
                sig.fromData(existingStrokes);
            } else if (snapshot) {
                void drawDataUrlIntoCanvas(inlineSigRef, inlineWrapperRef, snapshot);
            }
        };

        resizeInline();
        const observer = new ResizeObserver(resizeInline);
        observer.observe(wrapper);

        return () => observer.disconnect();
    }, [drawDataUrlIntoCanvas]);

    // Lock body scroll and manage responsive fullscreen canvas resizing (including mobile rotation)
    useEffect(() => {
        if (!isExpanded) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const wrapper = fullscreenWrapperRef.current;
        const sig = fullscreenSigRef.current;

        const resizeFullscreen = () => {
            if (!wrapper || !sig) return;
            const canvas = sig.getCanvas();
            const w = wrapper.clientWidth;
            const h = wrapper.clientHeight;
            if (!w || !h) return;

            const ratio = Math.max(window.devicePixelRatio || 1, 1);
            const targetW = Math.round(w * ratio);
            const targetH = Math.round(h * ratio);

            if (canvas.width === targetW && canvas.height === targetH) return;

            const existingStrokes = sig.toData();
            const snapshot =
                existingStrokes.length === 0 && !sig.isEmpty()
                    ? trimCanvasToPng(canvas)
                    : null;

            canvas.width = targetW;
            canvas.height = targetH;
            canvas.getContext('2d')?.scale(ratio, ratio);
            sig.clear();

            if (existingStrokes.length > 0) {
                sig.fromData(existingStrokes);
            } else if (snapshot) {
                void drawDataUrlIntoCanvas(fullscreenSigRef, fullscreenWrapperRef, snapshot);
            }
        };

        // Run after portal layout settles, then seed existing inline/saved signature if present
        const frameId = requestAnimationFrame(() => {
            resizeFullscreen();
            if (inlineSigRef.current && !inlineSigRef.current.isEmpty()) {
                const current = trimCanvasToPng(inlineSigRef.current.getCanvas());
                if (current) {
                    setFullscreenHasStrokes(true);
                    void drawDataUrlIntoCanvas(fullscreenSigRef, fullscreenWrapperRef, current);
                    return;
                }
            }
            if (value && value.startsWith('data:image/')) {
                setFullscreenHasStrokes(true);
                void drawDataUrlIntoCanvas(fullscreenSigRef, fullscreenWrapperRef, value);
            }
        });

        let observer: ResizeObserver | null = null;
        if (wrapper) {
            observer = new ResizeObserver(resizeFullscreen);
            observer.observe(wrapper);
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsExpanded(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            cancelAnimationFrame(frameId);
            observer?.disconnect();
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    }, [isExpanded, fullscreenKey, drawDataUrlIntoCanvas, value]);

    // Recompute scanned signature preview whenever slider or ink mode changes
    useEffect(() => {
        if (!sourceCanvas) return;

        const extracted = extractSignatureFromCanvas(sourceCanvas, {
            thresholdOffset,
            inkMode,
        });

        setScannedPreview(extracted);
        if (!extracted) {
            setScanError(
                'Tanda tangan belum terdeteksi. Coba naikkan sensitivitas scan agar goresan lebih terbaca.',
            );
        } else {
            setScanError(null);
        }
    }, [sourceCanvas, thresholdOffset, inkMode]);

    const openExpandedModal = () => {
        setFullscreenHasStrokes(
            Boolean((inlineSigRef.current && !inlineSigRef.current.isEmpty()) || value),
        );
        setFullscreenKey((prev) => prev + 1);
        setIsExpanded(true);
    };

    const handleFullscreenUndo = () => {
        const sig = fullscreenSigRef.current;
        if (!sig) return;

        const strokes = sig.toData();
        if (strokes.length > 0) {
            strokes.pop();
            sig.clear();
            if (strokes.length > 0) {
                sig.fromData(strokes);
            }
            setFullscreenHasStrokes(!sig.isEmpty());
        } else {
            sig.clear();
            setFullscreenHasStrokes(false);
        }
    };

    const handleFullscreenClear = () => {
        fullscreenSigRef.current?.clear();
        setFullscreenHasStrokes(false);
    };

    const handleFullscreenApply = async () => {
        const sig = fullscreenSigRef.current;
        if (!sig) return;

        const trimmed = trimCanvasToPng(sig.getCanvas());
        if (!trimmed) {
            handleClear();
            setIsExpanded(false);
            return;
        }

        onChange(trimmed);
        await syncInlineFromValue(trimmed);
        setIsExpanded(false);
    };

    const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;

        setScanOpen(true);
        setScanLoading(true);
        setScanError(null);
        setSourceCanvas(null);
        setScannedPreview(null);
        setThresholdOffset(0);
        setInkMode('black');

        try {
            const downscaled = await loadAndDownscaleSignatureImage(file);
            setSourceCanvas(downscaled);
        } catch (err) {
            setScanError(
                err instanceof Error
                    ? err.message
                    : 'Gagal memproses gambar tanda tangan.',
            );
        } finally {
            setScanLoading(false);
        }
    };

    const handleApplyScanned = async () => {
        if (!scannedPreview) return;

        onChange(scannedPreview);
        await syncInlineFromValue(scannedPreview);
        setScanOpen(false);
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                    {label}
                </span>

                <div className="flex flex-wrap items-center gap-1.5">
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={openExpandedModal}
                        className="h-7 gap-1.5 px-2.5 text-xs"
                    >
                        <Expand className="size-3.5" />
                        Perbesar
                    </Button>

                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-7 gap-1.5 px-2.5 text-xs"
                    >
                        <ScanLine className="size-3.5" />
                        Scan Gambar
                    </Button>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelected}
                        className="hidden"
                    />
                </div>
            </div>

            <div
                ref={inlineWrapperRef}
                className="relative h-40 w-full overflow-hidden rounded-lg border bg-white sm:h-44"
            >
                <SignatureCanvas
                    ref={inlineSigRef}
                    clearOnResize={false}
                    penColor="#111827"
                    onEnd={handleInlineEnd}
                    canvasProps={{
                        className: 'h-full w-full touch-none',
                    }}
                    minWidth={1}
                    maxWidth={2.5}
                    velocityFilterWeight={0.7}
                />

                <div className="pointer-events-none absolute right-6 bottom-5 left-6 border-b border-dashed border-gray-200" />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleClear}
                >
                    <Eraser className="mr-1.5 size-3.5" />
                    Clear
                </Button>

                <span className="text-[11px] text-muted-foreground">
                    Tips: gunakan <b>Perbesar</b> di HP atau <b>Scan Gambar</b> dari foto TTD.
                </span>
            </div>

            {value && (
                <div className="rounded-lg border bg-muted/30 p-2.5">
                    <p className="mb-1 text-xs text-muted-foreground">
                        Preview Tanda Tangan
                    </p>
                    <div className="flex h-20 items-center justify-center rounded border border-dashed bg-white p-2">
                        <img
                            src={value}
                            alt="Preview tanda tangan"
                            className="max-h-16 object-contain"
                        />
                    </div>
                </div>
            )}

            {/* Fullscreen Responsive Canvas Portal */}
            {isExpanded &&
                createPortal(
                    <div
                        key={fullscreenKey}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Kanvas tanda tangan layar penuh"
                        className="fixed inset-0 z-50 flex h-[100dvh] w-screen flex-col overflow-hidden bg-background"
                    >
                        <div className="flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-6">
                            <div>
                                <h2 className="text-sm font-semibold sm:text-base">
                                    Tanda Tangan Layar Penuh
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    <span className="sm:hidden">
                                        Putar HP ke posisi mendatar (landscape) agar ruang lebih luas.
                                    </span>
                                    <span className="hidden sm:inline">
                                        Gambar tanda tangan pada area putih di bawah, lalu klik Terapkan TTD.
                                    </span>
                                </p>
                            </div>

                            <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => setIsExpanded(false)}
                                aria-label="Tutup layar penuh"
                            >
                                <X className="size-5" />
                            </Button>
                        </div>

                        <div className="flex min-h-0 flex-1 flex-col p-3 sm:p-6">
                            <div
                                ref={fullscreenWrapperRef}
                                className="relative min-h-0 w-full flex-1 overflow-hidden rounded-xl border-2 border-dashed border-muted-foreground/30 bg-white shadow-inner"
                            >
                                <SignatureCanvas
                                    ref={fullscreenSigRef}
                                    clearOnResize={false}
                                    penColor="#111827"
                                    onEnd={() =>
                                        setFullscreenHasStrokes(
                                            !(fullscreenSigRef.current?.isEmpty() ?? true),
                                        )
                                    }
                                    canvasProps={{
                                        className: 'h-full w-full touch-none select-none',
                                    }}
                                    minWidth={1.4}
                                    maxWidth={3.4}
                                    velocityFilterWeight={0.7}
                                />

                                <div className="pointer-events-none absolute right-8 bottom-10 left-8 border-b border-dashed border-gray-200 sm:right-16 sm:bottom-14 sm:left-16" />

                                {!fullscreenHasStrokes && (
                                    <span className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-xs text-gray-400 sm:bottom-6">
                                        Goreskan tanda tangan Anda di sini
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-muted/30 px-4 py-3 sm:px-6">
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleFullscreenUndo}
                                    disabled={!fullscreenHasStrokes}
                                >
                                    <Undo2 className="mr-1.5 size-4" />
                                    Undo
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleFullscreenClear}
                                >
                                    <Eraser className="mr-1.5 size-4" />
                                    Clear
                                </Button>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsExpanded(false)}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={handleFullscreenApply}
                                    className="bg-blue-600 text-white hover:bg-blue-700"
                                >
                                    <Check className="mr-1.5 size-4" />
                                    Terapkan TTD
                                </Button>
                            </div>
                        </div>
                    </div>,
                    document.body,
                )}

            {/* Scan Uploaded Signature Image Modal */}
            <Dialog open={scanOpen} onOpenChange={setScanOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Scan Gambar Tanda Tangan</DialogTitle>
                        <DialogDescription>
                            Background kertas otomatis dibersihkan menjadi transparan. Sesuaikan sensitivitas bila perlu.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="flex min-h-40 items-center justify-center overflow-hidden rounded-lg border bg-[repeating-conic-gradient(#f3f4f6_0%_25%,#ffffff_0%_50%)] bg-[length:16px_16px] p-4">
                            {scanLoading ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="size-4 animate-spin" />
                                    Memindai gambar...
                                </div>
                            ) : scannedPreview ? (
                                <img
                                    src={scannedPreview}
                                    alt="Hasil scan tanda tangan"
                                    className="max-h-40 w-auto object-contain"
                                />
                            ) : (
                                <p className="text-center text-xs text-muted-foreground">
                                    {scanError ?? 'Tidak ada preview.'}
                                </p>
                            )}
                        </div>

                        {scanError && scannedPreview && (
                            <p className="text-xs text-amber-600">{scanError}</p>
                        )}

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="signature-scan-threshold" className="text-xs">
                                    Sensitivitas Scan
                                </Label>
                                <span className="text-xs font-medium text-muted-foreground">
                                    {thresholdOffset > 0 ? `+${thresholdOffset}` : thresholdOffset}
                                </span>
                            </div>
                            <input
                                id="signature-scan-threshold"
                                type="range"
                                min={-50}
                                max={50}
                                step={2}
                                value={thresholdOffset}
                                onChange={(e) => setThresholdOffset(Number(e.target.value))}
                                disabled={!sourceCanvas || scanLoading}
                                className="w-full accent-blue-600"
                            />
                            <div className="flex justify-between text-[11px] text-muted-foreground">
                                <span>Lebih bersih (anti-bayangan)</span>
                                <span>Lebih tebal (tinta tipis)</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-medium">Warna Tinta</span>
                            <div className="flex gap-1.5">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={inkMode === 'black' ? 'default' : 'outline'}
                                    onClick={() => setInkMode('black')}
                                    className="h-7 px-2.5 text-xs"
                                >
                                    Tinta Hitam
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={inkMode === 'original' ? 'default' : 'outline'}
                                    onClick={() => setInkMode('original')}
                                    className="h-7 px-2.5 text-xs"
                                >
                                    Warna Asli
                                </Button>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="flex-row justify-between gap-2 sm:justify-between">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="mr-1.5 size-3.5" />
                            Pilih Ulang
                        </Button>

                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setScanOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                onClick={handleApplyScanned}
                                disabled={!scannedPreview || scanLoading}
                                className="bg-blue-600 text-white hover:bg-blue-700"
                            >
                                <Check className="mr-1.5 size-3.5" />
                                Masukkan ke Canvas
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
