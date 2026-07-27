export interface Product {
  id: number;
  name: string;
  product_category_id: number;
  category?: string;
  description?: string;
  is_active: boolean;
  is_pattern_available: boolean;
  materials_count: number;
  accessories_count: number;
  manufacturing_count: number;
  materials: ProductMaterial[];
  manufacturing_works: ProductManufacturingWork[];
}

export interface CompanyProfile {
  id: number;
  company_name: string;
  company_type: 'pkp' | 'non_pkp';
  bank_type: string;
  tax_percentage: number;
  account_number: string;
  account_name: string;
  address: string;
  swift_code?: string;
}

export interface ProductDetail extends Product {
  materials: ProductMaterial[];
  manufacturing_works: ProductManufacturingWork[];
}

export interface Material {
  id: number;
  name: string;
  category: 'bahan' | 'aksesoris' | 'Bahan Baku' | 'Aksesoris'; 
  unit?: string;
  default_color?: string;
  default_vendor_name?: string;
  default_vendor_id?: number;
  default_harga_ecer?: number;
  default_harga_roll?: number;
  default_price_type?: string; 
  default_usage?: number;
  roll_qty?: number;
  roll_unit?: string;
  is_active: boolean;
  description?: string;
}


export interface ManufacturingWork {
  id: number;
  name: string;
  default_unit?: string;
  behavior?: string;
  process_behavior?: string;
  vendor_id?: number;
  vendor_name?: string;
  default_min_estimate: number;
  default_max_estimate: number;
  is_active: boolean;
}

export interface ProductMaterial {
  id: number;
  material_id: number;
  material_name: string;
  material_category: string;
  type: 'bahan' | 'aksesoris';
  default_usage: number;
  default_unit?: string;
  defaultSupplier?: Supplier;
  default_supplier_id?: number;
  harga_ecer?: number;
  harga_roll?: number;
  sort_order: number;
  is_required: boolean;
  notes?: string;
}

export interface ProductManufacturingWork {
  id: number;
  manufacturing_work_id: number;
  work_name: string;
  default_usage: number;
  default_unit?: string;
  process_behavior?: string;
  max_estimate?: number;
  usage_note?: string;
  sort_order: number;
  is_required: boolean;
}

export interface Supplier {
  id: number;
  nama?: string;
  nama_perusahaan?: string;
  email?: string;
  kategori?: 'Bahan Baku' | 'Aksesoris' | 'CMT / Makloon' | '';
}

export interface DefaultSizeBreakdown {
  id: number;
  type: 'color' | 'fabric' | 'size' | 'unit';
  label: string;
  sequence: number;
};
