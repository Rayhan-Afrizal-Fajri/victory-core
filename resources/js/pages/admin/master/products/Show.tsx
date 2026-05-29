import { Head, router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import type { ProductDetail, Material, ManufacturingWork } from '@/types';
import ProductMaterialSection from './ProductMaterialSection';
import ProductManufacturingSection from './ProductManufacturingSection';
import products from '@/routes/products';

type Props = {
  product: ProductDetail;
  materials: Material[];
  works: ManufacturingWork[];
};

export default function Show({ product, materials, works }: Props) {
  return (
    <>
      <Head title={`${product.name} - Components`} />
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.get(route('products.index'))}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">{product.name}</h1>
            <p className="text-sm text-slate-500">{product.category}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
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
              <div>
                <label className="text-sm font-medium text-slate-700">Deskripsi</label>
                <p className="text-slate-900 whitespace-pre-wrap">{product.description}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-slate-700">Status</label>
              <Badge variant={product.is_active ? 'default' : 'secondary'}>
                {product.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <ProductMaterialSection
            productId={product.id}
            materials={product.materials}
            availableMaterials={materials}
            type="bahan"
            title="Bahan"
          />
          <ProductMaterialSection
            productId={product.id}
            materials={product.materials}
            availableMaterials={materials}
            type="aksesoris"
            title="Aksesoris"
          />
        </div>

        <ProductManufacturingSection
          productId={product.id}
          manufacturingWorks={product.manufacturing_works}
          availableWorks={works}
        />
      </div>
    </>
  );
}

Show.layout = (page: React.ReactElement<Props>) => {
    const product = page.props?.product;
     
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
                    title: product ? product.name : 'Produk Detail',
                    href: product ? products.show(product.id) : '#',
                }
            ]}
        >
            {page}
        </AppLayout>
    )
};
