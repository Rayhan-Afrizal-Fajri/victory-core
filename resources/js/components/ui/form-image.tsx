import { ImageIcon, X, Camera } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface FormImageUploadProps {
    label: string;
    error?: string;
    hint?: string;
    preview?: string;
    onChange: (file: File | null) => void;
    accept?: string;
    icon?: string;
    title?: string;
    subtitle?: string;
    required?: boolean;
    onRemove?: () => void;
}

export default function FormImageUpload({
    label,
    error,
    hint,
    preview,
    onChange,
    accept = 'image/*',
    icon,
    title,
    subtitle,
    required,
    onRemove,
}: FormImageUploadProps) {

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (preview) {
            setPreviewUrl(preview);
        }
    }, [preview]);

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {

            const file = e.target.files?.[0] || null;

            onChange(file);

            if (file) {

                const url = URL.createObjectURL(file);

                setPreviewUrl(url);

            }
        },
        [onChange]
    );

    const handleRemove = useCallback(() => {

        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }

        onChange(null);

        // 🔥 trigger parent
        onRemove?.();

        setPreviewUrl(null);

    }, [onChange, previewUrl, onRemove]);

    const currentPreview = previewUrl;

    return (
        <div className="space-y-2">

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>

            {currentPreview ? (

                <div className="relative inline-block">

                    <img
                        src={currentPreview}
                        alt="Preview"
                        className="h-40 w-auto rounded-lg object-cover border border-gray-200 dark:border-gray-600"
                    />

                    <button
                        type="button"
                        onClick={handleRemove}
                        className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                    >
                        <X className="h-4 w-4" />
                    </button>

                </div>

            ) : (

                <label
                    className={cn(
                        'flex h-40 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600',
                        error && 'border-red-500'
                    )}
                >

                    <div className="flex flex-col items-center justify-center pt-5 pb-6">

                        {icon === 'camera' ?
                            <Camera className="mb-1 h-7 w-7 text-gray-400" />
                            :
                            <ImageIcon className="mb-1 h-10 w-10 text-gray-400" />
                        }

                        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                            <span className="font-regular">{title ?? 'Click to upload'}</span>
                        </p>

                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            { subtitle ?? 'PNG, JPG, WEBP (MAX. 2MB)' }
                        </p>

                    </div>

                    <input
                        type="file"
                        className="hidden"
                        accept={accept}
                        onChange={handleChange}
                        required={required}
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