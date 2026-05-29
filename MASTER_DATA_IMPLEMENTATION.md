# Master Data CRUD - Garment Production Management

Implementasi lengkap sistem CRUD untuk master data garment production management, mencakup Product/Article, Material, Manufacturing Work, dan BOM (Bill of Materials).

## Overview

Sistem ini memungkinkan pengguna untuk:
- Mengelola template produk/artikel garment
- Mengelola master data material (bahan dan aksesoris)
- Mengelola manufacturing works (pekerjaan manufaktur)
- Membuat dan mengelola BOM (komponen produk) yang terdiri dari:
  - Material (bahan dan aksesoris) dengan usage per article
  - Manufacturing works dengan usage notes dan estimates

## File Structure

### Backend

#### FormRequests (Validation)
- `app/Http/Requests/StoreProductRequest.php` - Create Product validation
- `app/Http/Requests/UpdateProductRequest.php` - Update Product validation
- `app/Http/Requests/StoreMaterialRequest.php` - Create Material validation
- `app/Http/Requests/UpdateMaterialRequest.php` - Update Material validation
- `app/Http/Requests/StoreManufacturingWorkRequest.php` - Create ManufacturingWork validation
- `app/Http/Requests/UpdateManufacturingWorkRequest.php` - Update ManufacturingWork validation
- `app/Http/Requests/StoreProductMaterialRequest.php` - Add Material to Product validation
- `app/Http/Requests/UpdateProductMaterialRequest.php` - Update Product Material validation
- `app/Http/Requests/StoreProductManufacturingWorkRequest.php` - Add Work to Product validation
- `app/Http/Requests/UpdateProductManufacturingWorkRequest.php` - Update Product Work validation

#### Controllers
- `app/Http/Controllers/ProductController.php` - Product CRUD operations
- `app/Http/Controllers/MaterialController.php` - Material CRUD operations
- `app/Http/Controllers/ManufacturingWorkController.php` - ManufacturingWork CRUD operations
- `app/Http/Controllers/ProductMaterialController.php` - ProductMaterial (BOM) operations
- `app/Http/Controllers/ProductManufacturingWorkController.php` - ProductManufacturingWork (BOM) operations

#### Routes
Updated routes in `routes/web.php`:
```php
// Product/Article Master
Route::resource('products', ProductController::class);
Route::patch('/products/{product}/toggle-active', [ProductController::class, 'toggleActive'])->name('products.toggle-active');

// Material Master
Route::resource('materials', MaterialController::class);
Route::patch('/materials/{material}/toggle-active', [MaterialController::class, 'toggleActive'])->name('materials.toggle-active');

// Manufacturing Work Master
Route::resource('manufacturing-works', ManufacturingWorkController::class);
Route::patch('/manufacturing-works/{manufacturingWork}/toggle-active', [ManufacturingWorkController::class, 'toggleActive'])->name('manufacturing-works.toggle-active');

// Product Materials (BOM)
Route::resource('product-materials', ProductMaterialController::class)->only(['store', 'update', 'destroy']);

// Product Manufacturing Works (BOM)
Route::resource('product-manufacturing-works', ProductManufacturingWorkController::class)->only(['store', 'update', 'destroy']);
```

#### Models
Models sudah ada dengan relasi:
- `Product` - HasMany productMaterials, productManufacturingWorks
- `Material` - BelongsTo Supplier, HasMany productMaterials, pesananMaterialSpecs
- `ManufacturingWork` - BelongsTo Supplier, HasMany productManufacturingWorks, pesananManufacturingSpecs
- `ProductMaterial` - Pivot antara Product dan Material
- `ProductManufacturingWork` - Pivot antara Product dan ManufacturingWork

#### Seeders
- `database/seeders/MaterialSeeder.php` - Seeder untuk 10 materials (5 bahan + 5 aksesoris)
- `database/seeders/ManufacturingWorkSeeder.php` - Seeder untuk 7 manufacturing works
- `database/seeders/ProductSeeder.php` - Seeder untuk 3 products dengan BOM lengkap

### Frontend

#### TypeScript Types
- `resources/js/types/master-data.ts` - Interfaces untuk Product, Material, ManufacturingWork, ProductMaterial, ProductManufacturingWork, Supplier

#### Pages
- `resources/js/pages/admin/master/products/Index.tsx` - Product list dengan CRUD dialog
- `resources/js/pages/admin/master/products/Show.tsx` - Product detail dengan BOM management
- `resources/js/pages/admin/master/materials/Index.tsx` - Material list dengan CRUD dialog
- `resources/js/pages/admin/master/manufacturing-works/Index.tsx` - ManufacturingWork list dengan CRUD dialog

#### Components
- `resources/js/pages/admin/master/products/ProductMaterialSection.tsx` - Section untuk manage material bahan/aksesoris
- `resources/js/pages/admin/master/products/ProductManufacturingSection.tsx` - Section untuk manage manufacturing works

## Database Schema

### Products Table
```
- id
- name (string, required)
- category (string, nullable)
- description (text, nullable)
- is_active (boolean, default: true)
- timestamps
```

### Materials Table
```
- id
- name (string, required)
- category (enum: 'bahan' | 'aksesoris', required)
- unit (string, nullable)
- default_supplier_id (foreignId, nullable)
- harga_ecer (decimal, default: 0)
- harga_roll (decimal, default: 0)
- roll_qty (decimal, nullable)
- roll_unit (string, nullable)
- is_active (boolean, default: true)
- timestamps
```

### Manufacturing Works Table
```
- id
- name (string, required)
- default_unit (string, nullable)
- default_vendor_id (foreignId to suppliers, nullable)
- default_min_estimate (decimal, default: 0)
- default_max_estimate (decimal, default: 0)
- is_active (boolean, default: true)
- timestamps
```

### Product Materials Table (Pivot)
```
- id
- product_id (foreignId, cascadeOnDelete)
- material_id (foreignId, restrictOnDelete)
- type (enum: 'bahan' | 'aksesoris', required)
- default_usage (decimal, default: 0)
- default_unit (string, nullable)
- sort_order (integer, default: 0)
- is_required (boolean, default: true)
- timestamps
```

### Product Manufacturing Works Table (Pivot)
```
- id
- product_id (foreignId, cascadeOnDelete)
- manufacturing_work_id (foreignId, restrictOnDelete)
- default_usage (decimal, default: 1)
- default_unit (string, nullable)
- usage_note (string, nullable)
- sort_order (integer, default: 0)
- is_required (boolean, default: true)
- timestamps
```

## Usage

### 1. Running Seeders
Untuk mengisi database dengan data awal:
```bash
php artisan db:seed
# atau spesifik seeder
php artisan db:seed --class=MaterialSeeder
php artisan db:seed --class=ManufacturingWorkSeeder
php artisan db:seed --class=ProductSeeder
```

### 2. Master Material Management
**URL**: `/materials`

**Fitur**:
- View list materials dengan kategori badge, harga, supplier
- Create material baru dengan form dialog
- Edit material existing
- Delete material
- Filter by active/inactive

**Form Fields**:
- Nama Material (required)
- Kategori: Bahan / Aksesoris (required)
- Unit (optional)
- Default Supplier (optional, select from suppliers)
- Harga Ecer (numeric)
- Harga Roll (numeric)
- Roll Qty (numeric, optional)
- Roll Unit (string, optional)
- Active checkbox

### 3. Master Manufacturing Work Management
**URL**: `/manufacturing-works`

**Fitur**:
- View list manufacturing works
- Create work baru dengan form dialog
- Edit work existing
- Delete work
- Default min/max estimate display

**Form Fields**:
- Nama Work (required) - Cutting, Jahit, QC, Sablon, etc
- Default Unit (optional) - pcs, set, etc
- Default Vendor (optional, select from suppliers)
- Min Estimate (numeric)
- Max Estimate (numeric)
- Active checkbox

### 4. Master Product Management
**URL**: `/products`

**Fitur**:
- View list products dengan material/aksesoris/manufacturing counts
- Create product baru
- Edit product
- Delete product
- Navigate ke product detail untuk manage BOM

**Form Fields**:
- Nama Produk (required)
- Kategori (optional)
- Deskripsi (optional)
- Active checkbox

### 5. Product BOM Management
**URL**: `/products/{id}`

Menampilkan detail product dengan 3 section:
1. **Bahan Section** - Manage material bahan
2. **Aksesoris Section** - Manage material aksesoris
3. **Manufacturing Works Section** - Manage manufacturing works

**Setiap Section memiliki**:
- List items dengan nama, usage, unit, required badge
- Button "Tambah" untuk add item baru
- Button edit/delete per item

**Add Material Flow**:
1. Click "Tambah" pada section Bahan/Aksesoris
2. Select material dari dropdown (auto-filtered by category)
3. Input default_usage
4. Input/select default_unit
5. Check "Required" jika wajib
6. Submit

**Add Manufacturing Work Flow**:
1. Click "Tambah Work"
2. Select work dari dropdown
3. Input default_usage (default: 1)
4. Input/select default_unit (default: pcs)
5. Input usage_note (optional)
6. Check "Required" jika wajib
7. Submit

## API Endpoints

### Products
- `GET /products` - List products (paginated)
- `POST /products` - Create product
- `GET /products/{id}` - Show product with BOM details
- `PUT /products/{id}` - Update product
- `DELETE /products/{id}` - Delete product
- `PATCH /products/{id}/toggle-active` - Toggle active status

### Materials
- `GET /materials` - List materials (paginated)
- `POST /materials` - Create material
- `PUT /materials/{id}` - Update material
- `DELETE /materials/{id}` - Delete material
- `PATCH /materials/{id}/toggle-active` - Toggle active status

### Manufacturing Works
- `GET /manufacturing-works` - List manufacturing works (paginated)
- `POST /manufacturing-works` - Create manufacturing work
- `PUT /manufacturing-works/{id}` - Update manufacturing work
- `DELETE /manufacturing-works/{id}` - Delete manufacturing work
- `PATCH /manufacturing-works/{id}/toggle-active` - Toggle active status

### Product Materials (BOM)
- `POST /product-materials` - Add material to product
- `PUT /product-materials/{id}` - Update product material
- `DELETE /product-materials/{id}` - Delete product material

### Product Manufacturing Works (BOM)
- `POST /product-manufacturing-works` - Add work to product
- `PUT /product-manufacturing-works/{id}` - Update product work
- `DELETE /product-manufacturing-works/{id}` - Delete product work

## Validation Rules

### Product
- name: required|string|max:255
- category: nullable|string|max:255
- description: nullable|string
- is_active: boolean

### Material
- name: required|string|max:255
- category: required|in:bahan,aksesoris
- unit: nullable|string|max:255
- default_supplier_id: nullable|integer|exists:suppliers,id
- harga_ecer: numeric|min:0
- harga_roll: numeric|min:0
- roll_qty: nullable|numeric|min:0
- roll_unit: nullable|string|max:255
- is_active: boolean

### ManufacturingWork
- name: required|string|max:255
- default_unit: nullable|string|max:255
- default_vendor_id: nullable|integer|exists:suppliers,id
- default_min_estimate: numeric|min:0
- default_max_estimate: numeric|min:0
- is_active: boolean

### ProductMaterial
- product_id: required|integer|exists:products,id
- material_id: required|integer|exists:materials,id
- type: required|in:bahan,aksesoris
- default_usage: required|numeric|min:0
- default_unit: nullable|string|max:255
- sort_order: nullable|integer
- is_required: boolean

### ProductManufacturingWork
- product_id: required|integer|exists:products,id
- manufacturing_work_id: required|integer|exists:manufacturing_works,id
- default_usage: required|numeric|min:0
- default_unit: nullable|string|max:255
- usage_note: nullable|string
- sort_order: nullable|integer
- is_required: boolean

## Data Validation & Constraints

1. **Duplicate Prevention**:
   - Tidak bisa menambahkan material yang sama 2x ke 1 product
   - Tidak bisa menambahkan manufacturing work yang sama 2x ke 1 product
   - Validation error ditampilkan di UI

2. **Material-Type Matching**:
   - Saat add product material dengan type 'bahan', hanya material dengan category 'bahan' yang muncul di dropdown
   - Saat add product material dengan type 'aksesoris', hanya material dengan category 'aksesoris' yang muncul

3. **Cascade Delete**:
   - Saat product dihapus, semua product_materials dan product_manufacturing_works ikut terhapus
   - Material dan ManufacturingWork tidak bisa dihapus jika ada referensi dari active product

## UI Components Used

- **DataTable** - Untuk list display
- **Button** (shadcn/ui) - Primary, outline, destructive variants
- **Dialog** - Untuk create/edit forms
- **Input** - Text, number inputs
- **Textarea** - Untuk description fields
- **Select** - Untuk dropdown selections
- **Badge** - Untuk status dan category indicators
- **Card** - Container untuk sections
- **Toast** (sonner) - Untuk success/error notifications
- **InputError** - Untuk error message display

## Frontend Integration with Inertia

Semua pages menggunakan:
- `useForm` hook dari @inertiajs/react untuk form state management
- `router` untuk delete/navigation
- `route()` helper dari wayfinder plugin untuk URL generation
- `preserveScroll: true` untuk preserve scroll position setelah submit
- Layout wrapper `AppLayout` untuk consistent styling

## Code Architecture

### CRUD Pattern
Setiap resource (Product, Material, ManufacturingWork) mengikuti Laravel RESTful pattern:
- `index()` - List dengan Inertia render
- `create()` - Not used (form di dialog)
- `store()` - Create via FormRequest
- `show()` - Detail view (Product only)
- `edit()` - Not used (form di dialog)
- `update()` - Update via FormRequest
- `destroy()` - Delete
- `toggleActive()` - Custom action untuk toggle status

### Component Organization
- **Index pages** - List view dengan CRUD dialog
- **Show page** (Product) - Detail dengan component sections
- **Section components** - Reusable sections untuk manage related data

### Validation Approach
- FormRequest classes untuk centralized validation
- Inline errors ditampilkan di form fields
- Toast notifications untuk success/error feedback

## Sample Data

Seeders mengisi database dengan:

### Materials (10 items)
- Combed Cotton 20s, Rib Cotton, Twill Cotton, Jersey Polyester
- Label Woven, Polybag, Kancing Plastik, Benang Jahit, Karet Jahit, Tag Karton

### Manufacturing Works (7 items)
- Cutting, Jahit, QC, Sablon, Bordir, Finishing, Packing

### Products (3 items) dengan BOM:
1. **T-Shirt Oversize**
   - Bahan: Combed Cotton 20s (0.85m), Rib Cotton (0.15m)
   - Aksesoris: Label Woven (1pcs), Polybag (1pcs)
   - Works: Cutting, Jahit, Sablon (optional), QC, Packing

2. **Hoodie**
   - Bahan: Jersey Polyester (1.2m), Rib Cotton (0.25m)
   - Aksesoris: Label Woven (1pcs), Kancing Plastik (6pcs)
   - Works: Cutting, Jahit, Finishing, QC, Packing

3. **Polo Shirt**
   - Bahan: Combed Cotton 20s (0.9m)
   - Aksesoris: Label Woven (1pcs), Kancing Plastik (3pcs)
   - Works: Cutting, Jahit, QC, Packing

## Next Steps / Future Enhancements

1. **Bulk Import** - Import materials dan products dari CSV
2. **Bulk Edit** - Edit multiple items sekaligus
3. **Product Clone** - Clone product existing dengan BOM-nya
4. **Material Usage Analytics** - Lihat material usage across all products
5. **BOM History** - Track perubahan BOM over time
6. **Cost Calculation** - Auto-calculate estimated cost per product based on material prices
7. **Advanced Search** - Search dan filter lebih advanced
8. **Export BOM** - Export product BOM ke PDF atau Excel

## Notes

- Semua listing menggunakan pagination (15 per page)
- Timestamps (created_at, updated_at) dikelola otomatis oleh Eloquent
- Active/inactive status bisa di-toggle via PATCH endpoint
- Toast notifications digunakan untuk user feedback
- Error handling via InputError component untuk field-specific errors
- Validasi duplikat di controller level untuk user experience

