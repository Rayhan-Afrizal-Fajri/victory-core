import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import type { ProductDetail, Material, ManufacturingWork, Supplier, DefaultSizeBreakdown } from '@/types';
import ProductMaterialSection from './ProductMaterialSection';
import ProductManufacturingSection from './ProductManufacturingSection';
import products from '@/routes/products';
import suppliers from '@/routes/suppliers';

interface MaterialOption {
  group_id: string;
  name: string;
  category: string;
  variants: any[];
}

interface ManufacturingOption {
  group_id: string;
  name: string;
  category: string;
  variants: any[];
}

type Props = {
  product: ProductDetail;
  materials: Material[];
  materialOptions: MaterialOption[];
  workOptions: ManufacturingOption[];
  works: ManufacturingWork[];
  suppliers: Supplier[];
  units: DefaultSizeBreakdown[];
};

export default function Show({ product, materials, materialOptions, workOptions, works, suppliers, units }: Props) {
  // Fungsi format mata uang
  const formatIDR = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
  };

  // Kalkulasi Total Estimasi
  const totalMaterialCost = product.materials
    .filter(m => m.type === 'bahan')
    .reduce((acc, curr) => acc + (curr.default_usage * (curr.harga_ecer || 0)), 0);

  const totalAccessoryCost = product.materials
    .filter(m => m.type === 'aksesoris')
    .reduce((acc, curr) => acc + (curr.default_usage * (curr.harga_ecer || 0)), 0);

  const totalManufacturingCost = product.manufacturing_works
    .reduce((acc, curr) => acc + (curr.default_usage * (curr.max_estimate || 0)), 0);

  const grandTotal = totalMaterialCost + totalAccessoryCost + totalManufacturingCost;

  return (
    <>
      <Head title={`${product.name} - Components`} />
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.get(products.index().url)}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">{product.name}</h1>
            <p className="text-sm text-slate-500">{product.category}</p>
          </div>
        </div>

        {/* SUMMARY CARD HPP */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Nama Produk</label>
                <p className="text-slate-900">{product.name}</p>
              </div>
              {product.category && (
                <div>
                  <label className="text-sm font-medium text-slate-700">Kategori</label>
                  <p className="text-slate-900">{product.category}</p>
                </div>
              )}
              {product.description && (
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Deskripsi</label>
                  <p className="text-slate-900 whitespace-pre-wrap">{product.description}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-slate-700">Status</label>
                <div className="mt-1">
                  <Badge variant={product.is_active ? 'default' : 'secondary'}>
                    {product.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* TOTAL ESTIMATION CARD */}
          <Card className="bg-slate-50 text-black">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="size-5" /> Estimasi Modal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1 border-b border-slate-700 pb-3">
                <div className="flex justify-between text-sm text-slate-700">
                  <span>Bahan</span>
                  <span>{formatIDR(totalMaterialCost)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-700">
                  <span>Aksesoris</span>
                  <span>{formatIDR(totalAccessoryCost)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-700">
                  <span>Manufaktur</span>
                  <span>{formatIDR(totalManufacturingCost)}</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-700">Total HPP per Pcs</p>
                <p className="text-2xl font-bold text-emerald-400">{formatIDR(grandTotal)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <ProductMaterialSection
            productId={product.id}
            materials={product.materials}
            suppliers={suppliers}
            units={units}
            availableMaterials={materials}
            materialOptions={materialOptions}
            type="bahan"
            title="Bahan"
          />
          <ProductMaterialSection
            productId={product.id}
            materials={product.materials}
            suppliers={suppliers}
            units={units}
            availableMaterials={materials}
            materialOptions={materialOptions}
            type="aksesoris"
            title="Aksesoris"
          />
        </div>

        <ProductManufacturingSection
          productId={product.id}
          units={units}
          suppliers={suppliers}
          manufacturingWorks={product.manufacturing_works}
          workOptions={workOptions}
          availableWorks={works}
        />
      </div>
    </>
  );
}

Show.layout = (page: React.ReactElement<Props>) => {
    const product = page.props?.product;

    // 1. Buat fungsi helper untuk truncate text di luar komponen atau di file terpisah
    const truncateText = (text: string, maxLength: number) => {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };
     
    return (
        <AppLayout
            title=""
            description=""
            information=""    
            breadcrumbs={[
                {
                    title: 'Master Products',
                    href: products.index(),
                },
                {
                    // 2. Gunakan fungsi truncateText di sini (misal dibatasi 20 karakter)
                    title: product ? truncateText(product.name, 25) : 'Produk Detail',
                    href: product ? products.show(product.id) : '#',
                }
            ]}
        >
            {page}
        </AppLayout>
    )
};