import SectionCard from "@/pages/admin/job-tickets/components/SectionCard";
import { useForm, router } from "@inertiajs/react";
import { toast } from "sonner";
import EmptyState from "./empty-state";
import { ImageIcon, Trash2, Upload } from "lucide-react";
import FormImageUpload from "../ui/form-image";
import { Button } from "../ui/button";

const SampleGalleryCard = ({
    media,
    sampleId,
    canDeleteMedia = false,
    onDeleteMedia
}: {
    media: any[];
    sampleId: number;
    canDeleteMedia?: boolean;
    onDeleteMedia?: (mediaId: number) => void;
}) => {
    const uploadMediaForm = useForm({
        photos: [] as File[],
    });

    const submitUploadMedia = (e: React.FormEvent) => {
        e.preventDefault();

        uploadMediaForm.post(`/samples/${sampleId}/media`, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                toast.success('Foto sample berhasil ditambahkan.');
                uploadMediaForm.reset();
            },
        });
    };

    const handleDelete = (mediaId: number) => {
        // Prioritaskan function dari parent (jika ada), jika tidak gunakan router Inertia langsung
        if (onDeleteMedia) {
            onDeleteMedia(mediaId);
        } else {
            if (confirm('Yakin ingin menghapus foto ini?')) {
                router.delete(`/samples/${mediaId}/media`, {
                    preserveScroll: true,
                    onSuccess: () => toast.success('Foto sample berhasil dihapus.'),
                });
            }
        }
    };

    return (
        <SectionCard title="Foto Sample">
            {media.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {media.map((item) => (
                        <div
                            key={item.id}
                            className="group relative overflow-hidden rounded-xl border bg-slate-100"
                        >
                            <a
                                href={`/storage/${item.file_path}`}
                                target="_blank"
                                rel="noreferrer"
                            >
                                <img
                                    src={`/storage/${item.file_path}`}
                                    alt="Sample Media"
                                    className="h-32 w-full object-cover transition duration-300 group-hover:scale-105"
                                />
                            </a>
                            
                            {/* Tombol Hapus (Hanya muncul saat hover) */}
                            {canDeleteMedia && (
                                <button
                                    type="button"
                                    onClick={() => handleDelete(item.id)}
                                    className="absolute right-2 top-2 inline-flex size-8 items-center justify-center rounded-full bg-white/90 text-red-600 shadow-sm opacity-0 transition hover:bg-red-50 group-hover:opacity-100"
                                >
                                    <Trash2 className="size-4" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState
                    icon={<ImageIcon className="size-5" />}
                    title="Belum ada foto sample"
                    description="Upload foto sample agar customer bisa melakukan review."
                />
            )}

            <form onSubmit={submitUploadMedia} className="mt-4 space-y-3 rounded-xl border bg-slate-50 p-4">
                <FormImageUpload
                    label="Tambah Foto Sample"
                    hint="Tambahkan foto detail sample jika diperlukan."
                    multiple={true} // Menggunakan mode multiple yang baru
                    onChange={(files) => uploadMediaForm.setData('photos', (files as File[]) || [])}
                    error={(uploadMediaForm.errors as any).photos}
                />

                <Button 
                    type="submit" 
                    variant="outline" 
                    disabled={uploadMediaForm.processing || uploadMediaForm.data.photos.length === 0}
                >
                    <Upload className="mr-2 size-4" />
                    Upload Foto
                </Button>
            </form>
        </SectionCard>
    );
};

export default SampleGalleryCard;