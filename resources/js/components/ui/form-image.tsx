import { ImageIcon, X, Camera, Plus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface FormImageUploadProps {
    label: string;
    error?: string;
    hint?: string;
    preview?: string | string[]; // Mendukung single / multiple string url
    onChange: (file: File | File[] | null) => void; // Bisa me-return array
    multiple?: boolean; // Prop baru untuk mode multiple
    accept?: string;
    icon?: string;
    title?: string;
    subtitle?: string;
    required?: boolean;
    disabled?: boolean;
    onRemove?: () => void;
}

export default function FormImageUpload({
    label,
    error,
    hint,
    preview,
    onChange,
    multiple = false,
    accept = 'image/*',
    icon,
    title,
    subtitle,
    required,
    onRemove,
    disabled
}: FormImageUploadProps) {
    const [previews, setPreviews] = useState<
        {
            url: string;
            type: 'image' | 'pdf';
        }[]
    >([]);

    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

    // Inisialisasi preview dari props
    useEffect(() => {
        if (!preview) {
            setPreviews([]);
            return;
        }

        const urls = Array.isArray(preview) ? preview : [preview];

        setPreviews(
            urls.map((url) => ({
                url,
                type: url.toLowerCase().split('?')[0].endsWith('.pdf')
                    ? 'pdf'
                    : 'image',
            }))
        );
    }, [preview]);

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = Array.from(e.target.files || []);
            if (files.length === 0) return;

            if (multiple) {
                // Tambahkan file baru ke array yang sudah ada
                const newFiles = [...selectedFiles, ...files];
                setSelectedFiles(newFiles);
                onChange(newFiles); // Return array of Files

                const newPreviews = files.map(file => ({
                    url: URL.createObjectURL(file),
                    type: file.type === 'application/pdf'
                        ? 'pdf'
                        : 'image'
                }));

                setPreviews(prev => [...prev, ...newPreviews]);
            } else {
                // Mode single (replace file lama)
                const file = files[0];
                setSelectedFiles([file]);
                onChange(file); // Return 1 File
                setPreviews([
                    {
                        url: URL.createObjectURL(file),
                        type:
                            file.type === 'application/pdf'
                                ? 'pdf'
                                : 'image',
                    },
                ]);
            }
        },
        [multiple, onChange, selectedFiles]
    );

    const handleRemove = useCallback(
        (index: number) => {
            const previewToRemove = previews[index];
            const urlToRemove = previewToRemove?.url;
            // Bersihkan URL object dari memory browser jika bukan dari internet
            if (urlToRemove && !urlToRemove.startsWith('http') && !urlToRemove.startsWith('/')) {
                URL.revokeObjectURL(urlToRemove);
            }

            if (multiple) {
                const newPreviews = previews.filter((_, i) => i !== index);
                const newFiles = selectedFiles.filter((_, i) => i !== index);

                setPreviews(newPreviews);
                setSelectedFiles(newFiles);
                onChange(newFiles.length > 0 ? newFiles : null);
            } else {
                setPreviews([]);
                setSelectedFiles([]);
                onChange(null);
            }

            // Trigger parent event
            onRemove?.();
        },
        [multiple, onChange, onRemove, previews, selectedFiles]
    );

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>

            {previews.length > 0 ? (
                <div className="flex flex-wrap gap-4">
                    {/* Render Semua Gambar */}
                    {previews.map((preview, index) => (
                        <div key={index} className="relative inline-block">
                            {preview.type === 'image' ? (
                                <img
                                    src={preview.url}
                                    alt={`Preview ${index}`}
                                    className="h-40 w-auto rounded-lg border object-cover"
                                />
                            ) : (
                                <iframe
                                    src={`${preview.url}#toolbar=0&navpanes=0&scrollbar=0`}
                                    className="h-40 w-32 rounded-lg border bg-white"
                                    title={`PDF ${index}`}
                                />
                            )}

                            <button
                                type="button"
                                onClick={() => handleRemove(index)}
                                className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white shadow-sm hover:bg-red-600"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ))}

                    {/* Tombol Add More untuk Multiple */}
                    {multiple && (
                        <label className={cn(
                            "flex h-40 w-40 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600",
                            disabled && "opacity-50 cursor-not-allowed"
                        )}>
                            <Plus className="mb-1 h-6 w-6 text-gray-400" />
                            <span className="text-xs text-gray-500">Tambah Foto</span>
                            <input
                                type="file"
                                className="hidden"
                                accept={accept}
                                multiple={true}
                                disabled={disabled}
                                onChange={handleChange}
                            />
                        </label>
                    )}
                </div>
            ) : (
                // Dropzone Default jika Kosong
                <label
                    className={cn(
                        'flex h-40 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600',
                        error && 'border-red-500',
                        disabled && 'opacity-50 cursor-not-allowed'
                    )}
                >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {icon === 'camera' ? (
                            <Camera className="mb-1 h-7 w-7 text-gray-400" />
                        ) : (
                            <ImageIcon className="mb-1 h-10 w-10 text-gray-400" />
                        )}

                        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                            <span className="font-regular">{title ?? 'Click to upload'}</span>
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {subtitle ?? 'PNG, JPG, WEBP (MAX. 4MB)'}
                        </p>
                    </div>

                    <input
                        type="file"
                        className="hidden"
                        accept={accept}
                        multiple={multiple}
                        onChange={handleChange}
                        required={required}
                        disabled={disabled}
                    />
                </label>
            )}

            {hint && !error && (
                <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p>
            )}

            {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
        </div>
    );
}