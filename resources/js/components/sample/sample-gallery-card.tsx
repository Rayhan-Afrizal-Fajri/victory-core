import SectionCard from "@/pages/admin/job-tickets/components/SectionCard";
import { useForm } from "@inertiajs/react";
import { toast } from "sonner";
import EmptyState from "./empty-state";
import { ImageIcon, Upload } from "lucide-react";
import FormImageUpload from "../ui/form-image";
import { Button } from "../ui/button";

const SampleGalleryCard = ({
    media,
    sampleId,
}: {
    media: any[];
    sampleId: number;
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

    return (
        <SectionCard title="Foto Sample">
            {media.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {media.map((item) => (
                        <a
                            key={item.id}
                            href={`/storage/${item.file_path}`}
                            target="_blank"
                            className="group relative overflow-hidden rounded-xl border bg-slate-100"
                        >
                            <img
                                src={`/storage/${item.file_path}`}
                                alt="Sample"
                                className="aspect-square w-full object-cover transition group-hover:scale-105"
                            />
                        </a>
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
                    onChange={(file) => uploadMediaForm.setData('photos', file ? [file] : [])}
                    error={(uploadMediaForm.errors as any).photos}
                />

                <Button type="submit" variant="outline" disabled={uploadMediaForm.processing}>
                    <Upload className="mr-2 size-4" />
                    Tambah Foto
                </Button>
            </form>
        </SectionCard>
    );
};

export default SampleGalleryCard;