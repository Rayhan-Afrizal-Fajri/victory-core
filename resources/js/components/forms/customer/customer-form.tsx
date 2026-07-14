import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useEffect, useState } from 'react';
import Select from 'react-select';

type Props = {
  form: any;
};

export function CustomerForm({ form }: Props) {
  // State untuk menyimpan daftar opsi asli dari API
  const [provinces, setProvinces] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);

  // State untuk menyimpan ID yang dipilih (digunakan untuk fetch level selanjutnya)
  const [selectedProvId, setSelectedProvId] = useState('');
  const [selectedCityId, setSelectedCityId] = useState('');
  const [selectedDistId, setSelectedDistId] = useState('');

  const normalize = (text: string) =>
    (text ?? '').trim().toLowerCase();

  // ==========================================
  // LOGIKA FETCH API & AUTO-SYNC MODE EDIT
  // ==========================================

  // 1. Fetch Provinsi saat komponen dirender
  useEffect(() => {
    fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
      .then((res) => res.json())
      .then((data) => setProvinces(data));
  }, []);

  // 1.1 (Mode Edit) Cocokkan nama provinsi untuk dapat ID
  useEffect(() => {
    if (provinces.length > 0 && form.data.provinsi && !selectedProvId) {
      const match = provinces.find(
          p => normalize(p.name) === normalize(form.data.provinsi)
      );
      if (match) setSelectedProvId(match.id);
    }
  }, [provinces, form.data.provinsi]);

  // 2. Fetch Kota saat Provinsi (ID) berubah
  useEffect(() => {
    if (!selectedProvId) return;
    fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${selectedProvId}.json`)
      .then((res) => res.json())
      .then((data) => setCities(data));
  }, [selectedProvId]);

  // 2.1 (Mode Edit) Cocokkan nama kota untuk dapat ID
  useEffect(() => {
    if (cities.length > 0 && form.data.kota && !selectedCityId) {
      const match = cities.find(
          p => normalize(p.name) === normalize(form.data.kota)
      );
      if (match) setSelectedCityId(match.id);
    }
  }, [cities, form.data.kota]);

  // 3. Fetch Kecamatan saat Kota (ID) berubah
  useEffect(() => {
    if (!selectedCityId) return;
    fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${selectedCityId}.json`)
      .then((res) => res.json())
      .then((data) => setDistricts(data));
  }, [selectedCityId]);

  // 3.1 (Mode Edit) Cocokkan nama kecamatan untuk dapat ID
  useEffect(() => {
    if (districts.length > 0 && form.data.kecamatan && !selectedDistId) {
      const match = districts.find(
          p => normalize(p.name) === normalize(form.data.kecamatan)
      );
      if (match) setSelectedDistId(match.id);
    }
  }, [districts, form.data.kecamatan]);

  // 4. Fetch Kelurahan saat Kecamatan (ID) berubah
  useEffect(() => {
    if (!selectedDistId) return;
    fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${selectedDistId}.json`)
      .then((res) => res.json())
      .then((data) => setVillages(data));
  }, [selectedDistId]);


  // ==========================================
  // HANDLER PERUBAHAN DROPDOWN (RESET STATE DOWNSTREAM)
  // ==========================================

  const handleProvinceChange = (id: string, name: string) => {
    setSelectedProvId(id);
    form.setData('provinsi', name); 

    // Reset data form di bawahnya
    form.setData('kota', '');
    form.setData('kecamatan', '');
    form.setData('kelurahan', '');
    
    // Reset internal ID & Opsi array
    setSelectedCityId('');
    setSelectedDistId('');
    setCities([]);
    setDistricts([]);
    setVillages([]);
  };

  const handleCityChange = (id: string, name: string) => {
    setSelectedCityId(id);
    form.setData('kota', name);

    form.setData('kecamatan', '');
    form.setData('kelurahan', '');

    setSelectedDistId('');
    setDistricts([]);
    setVillages([]);
  };

  const handleDistrictChange = (id: string, name: string) => {
    setSelectedDistId(id);
    form.setData('kecamatan', name);

    form.setData('kelurahan', '');
    setVillages([]);
  };

  // Convert data API ke format react-select { value, label }
  const provinceOptions = provinces.map((p) => ({ value: p.id, label: p.name }));
  const cityOptions = cities.map((c) => ({ value: c.id, label: c.name }));
  const districtOptions = districts.map((d) => ({ value: d.id, label: d.name }));
  const villageOptions = villages.map((v) => ({ value: v.id, label: v.name }));

  return (
    <div className="grid gap-6 md:grid-cols-2">
      
      {/* ================= KOLOM KIRI: DATA UTAMA ================= */}
      <div className="space-y-4">
        <div className="grid gap-2">
          <label className="text-sm font-medium text-slate-700">Nama PIC</label>
          <Input
            value={form.data.nama}
            onChange={(e) => form.setData('nama', e.target.value)}
            placeholder="Masukkan nama PIC..."
          />
          <InputError message={form.errors.nama} />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-slate-700">Jabatan PIC</label>
          <Input
            value={form.data.jabatan}
            onChange={(e) => form.setData('jabatan', e.target.value)}
            placeholder="Contoh: Purchasing, Manager..."
          />
          <InputError message={form.errors.jabatan} />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-slate-700">Nama Perusahaan</label>
          <Input
            value={form.data.nama_perusahaan}
            onChange={(e) => form.setData('nama_perusahaan', e.target.value)}
            placeholder="Masukkan nama perusahaan..."
          />
          <InputError message={form.errors.nama_perusahaan} />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-slate-700">Kontak (No. HP)</label>
          <Input
            value={form.data.no_hp}
            onChange={(e) => form.setData('no_hp', e.target.value)}
            placeholder="Contoh: 081234567xxx"
          />
          <InputError message={form.errors.no_hp} />
        </div>
      </div>

      {/* ================= KOLOM KANAN: DETAIL ALAMAT WILAYAH ================= */}
      <div className="space-y-4">
      <div className="grid gap-2">
          <label className="text-sm font-medium text-slate-700">Detail Alamat</label>
          <Textarea
            value={form.data.alamat_detail}
            onChange={(e) => form.setData('alamat_detail', e.target.value)}
            placeholder="Nama jalan, nomor rumah, RT/RW, nomor gedung/lantai..."
            rows={2}
            className="resize-none"
          />
          <InputError message={form.errors.alamat_detail} />
        </div>
      <div className="grid gap-2">
          <label className="text-sm font-medium text-slate-700">Kode Pos</label>
          <Input
            value={form.data.kode_pos}
            onChange={(e) => form.setData('kode_pos', e.target.value)}
            placeholder="53164"
          />
          <InputError message={form.errors.kode_pos} />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium text-slate-700">Provinsi</label>
          <Select
            className="text-sm"
            classNamePrefix="select"
            options={provinceOptions}
            value={
                provinceOptions.find(
                    (opt) => normalize(opt.label) === normalize(form.data.provinsi)
                ) || null
            }
            onChange={(selectedOption) => {
              if (selectedOption) handleProvinceChange(selectedOption.value, selectedOption.label);
            }}
            placeholder="Pilih provinsi..."
            isSearchable={true}
          />
          <InputError message={form.errors.provinsi} />
        </div>
        
        <div className="grid gap-2">
          <label className="text-sm font-medium text-slate-700">Kota/Kabupaten</label>
          <Select
            className="text-sm"
            classNamePrefix="select"
            options={cityOptions}
            value={
              cityOptions.find(
                (opt) => normalize(opt.label) === normalize(form.data.kota)
              ) || null
            }
            onChange={(selectedOption) => {
              if (selectedOption) handleCityChange(selectedOption.value, selectedOption.label);
            }}
            placeholder="Pilih kota..."
            isDisabled={!selectedProvId}
            isSearchable={true}
          />
          <InputError message={form.errors.kota} />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-slate-700">Kecamatan</label>
          <Select
            className="text-sm"
            classNamePrefix="select"
            options={districtOptions}
            value={districtOptions.find((opt) => normalize(opt.label) === normalize(form.data.kecamatan)) || null}
            onChange={(selectedOption) => {
              if (selectedOption) handleDistrictChange(selectedOption.value, selectedOption.label);
            }}
            placeholder="Pilih kecamatan..."
            isDisabled={!selectedCityId}
            isSearchable={true}
          />
          <InputError message={form.errors.kecamatan} />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-slate-700">Kelurahan / Desa</label>
          <Select
            className="text-sm"
            classNamePrefix="select"
            options={villageOptions}
            value={villageOptions.find((opt) => normalize(opt.label) === normalize(form.data.kelurahan)) || null}
            onChange={(selectedOption) => {
              if (selectedOption) form.setData('kelurahan', selectedOption.label);
            }}
            placeholder="Pilih kelurahan..."
            isDisabled={!selectedDistId}
            isSearchable={true}
          />
          <InputError message={form.errors.kelurahan} />
        </div>
      </div>

    </div>
  );
}