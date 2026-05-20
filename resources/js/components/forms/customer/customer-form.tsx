import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import InputError from '@/components/input-error';

type Props = {
  form: any;
};

export function CustomerForm({ form }: Props) {
  return (
    <>
      <div className="grid gap-2">
        <label>Nama Customer</label>
        <Input
          value={form.data.nama}
          onChange={(e) =>
            form.setData('nama', e.target.value)
          }
        />
        <InputError message={form.errors.nama} />
      </div>

      <div className="grid gap-2">
        <label>Nama Perusahaan</label>
        <Input
          value={form.data.nama_perusahaan}
          onChange={(e) =>
            form.setData('nama_perusahaan', e.target.value)
          }
        />
        <InputError message={form.errors.nama_perusahaan} />
      </div>

      <div className="grid gap-2">
        <label>Email</label>
        <Input
          type='email'
          value={form.data.email}
          onChange={(e) =>
            form.setData('email', e.target.value)
          }
        />
        <InputError message={form.errors.email} />
      </div>

      <div className="grid gap-2">
        <label>Kontak</label>
        <Input
          value={form.data.no_hp}
          onChange={(e) =>
            form.setData('no_hp', e.target.value)
          }
        />
        <InputError message={form.errors.no_hp} />
      </div>

      <div className="grid gap-2">
        <label>Alamat</label>
        <Textarea
          rows={3}
          value={form.data.alamat}
          onChange={(e) =>
            form.setData('alamat', e.target.value)
          }
        />
        <InputError message={form.errors.alamat} />
      </div>
    </>
  );
}