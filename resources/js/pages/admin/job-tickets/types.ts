export type Role =
  | 'Customer'
  | 'CS'
  | 'Designer'
  | 'Owner'
  | 'Finance'
  | 'PPIC'
  | 'Production'
  | 'QC';

export type DesignStatus =
  | 'draft'
  | 'waiting_approval'
  | 'revision_needed'
  | 'approved'
  | 'rejected';

export type SampleStatus =
  | 'draft'
  | 'waiting_payment'
  | 'paid'
  | 'in_delivery'
  | 'delivered'
  | 'approved'
  | 'revision_needed'
  | 'rejected';

export type InvoiceStatus =
  | 'unpaid'
  | 'partially_paid'
  | 'paid'
  | 'cancelled';

export type PaymentStatus =
  | 'pending'
  | 'verified'
  | 'rejected';

export type SampleDeliveryStatus =
  | 'pending'
  | 'shipped'
  | 'delivered'
  | 'failed'
  | 'returned';

export interface DesignRevision {
  id: number;
  pesanan_id?: number;
  designer_id?: number;

  file_path?: string;
  note?: string; // legacy / optional
  revision_note?: string | null; // legacy dari tabel lama

  customer_revision_note?: string | null;
  designer_revision_note?: string | null;

  status?: DesignStatus;
  approved?: boolean; // legacy / optional

  uploaded_at?: string | null;
  approved_at?: string | null;
  approved_by?: number | null;

  created_at?: string | null;
  updated_at?: string | null;
}

export interface SampleMedia {
  id: number;
  sample_id: number;
  file_path: string;
  type: 'image' | 'video';
  caption?: string | null;

  created_at?: string | null;
  updated_at?: string | null;
}

export interface SampleDelivery {
  id: number;
  sample_id: number;

  courier_name?: string | null;
  tracking_number?: string | null;
  tracking_url?: string | null;

  status: SampleDeliveryStatus;

  sent_at?: string | null;
  received_at?: string | null;

  delivery_note?: string | null;

  created_at?: string | null;
  updated_at?: string | null;
}

export interface Payment {
  id: number;

  // field baru sesuai tabel payments
  invoice_id?: number;
  tgl_bayar?: string;
  jumlah_bayar?: number;
  metode_pembayaran?: string;
  bukti_transfer_path?: string | null;
  catatan_finance?: string | null;

  status?: PaymentStatus;
  rejection_note?: string | null;

  verified_by?: number | null;
  verified_at?: string | null;

  created_at?: string | null;
  updated_at?: string | null;
}

export interface Invoice {
  id: number;

  // field baru sesuai tabel invoices
  pesanan_id?: number;
  no_invoice?: string;
  kategori_invoice?: string;
  total_tagihan?: number;
  status_tagihan?: InvoiceStatus;
  tgl_jatuh_tempo?: string;

  payments?: Payment[];

  // field lama agar kode existing tidak langsung error
  title?: string;
  amount?: number;
  status?: string;
  issued_at?: string | null;

  created_at?: string | null;
  updated_at?: string | null;
}

export interface Sample {
  id: number;
  pesanan_id?: number;

  qty: number;
  sample_price?: number;
  invoice_id?: number | null;

  parent_sample_id?: number | null;
  revision_number?: number;
  is_chargeable?: boolean;

  status: SampleStatus | string;

  catatan?: string | null;
  customer_review_note?: string | null;
  internal_note?: string | null;

  created_by?: number | null;
  created_sample_at?: string | null;
  paid_at?: string | null;

  sent_at?: string | null;
  approved_at?: string | null;
  approved_by?: number | null;

  invoice?: Invoice | null;
  media?: SampleMedia[];
  delivery?: SampleDelivery | null;

  created_at?: string | null;
  updated_at?: string | null;
}

export interface MaterialReceiving {
  id: number;
  qty_received: number;
  received_at?: string | null;
  notes?: string | null;
  checked_by?: {
    id?: number;
    name?: string;
  } | null;
}

export interface PurchasingItem {
  id: number;

  item: string;
  supplier?: Supplier | string | null;

  supplier_id?: number | null;

  ordered_qty: number;
  received_qty: number;
  remaining_qty?: number;

  unit?: string | null;

  harga_satuan?: number;
  total_harga?: number;
  tgl_pembelian?: string | null;

  status?: string;

  material_receivings?: MaterialReceiving[];
}

export interface WorkflowUser {
  id: number;
  name?: string;
  email?: string;
  role?: Role | string;
}

export interface WorkflowHistory {
  id: number;

  pesanan_id?: number;
  user_id?: number | null;

  step?: string;
  action: string;

  notes?: string | null;
  note?: string; // legacy

  user?: WorkflowUser | null;

  actor?: string;
  role?: Role;

  created_at: string;
  updated_at?: string | null;
}

export interface Attachment {
  id: number;
  category?: string;
  file_path?: string;
  notes?: string;
}

export interface OrderSpecification {
  id: number;
  pesanan_id?: number;
  jenis_spesifikasi: string;
  value: string;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface WorkflowStatus {
  id?: number;
  pesanan_id?: number;

  design_uploaded?: boolean;
  design_approved?: boolean;

  sample_created?: boolean;
  sample_paid?: boolean;
  sample_delivered?: boolean;
  sample_approved?: boolean;

  production_invoice_created?: boolean;
  production_dp_paid?: boolean;

  materials_purchased?: boolean;
  materials_received?: boolean;
  materials_distributed?: boolean;

  production_started?: boolean;
  production_completed?: boolean;
  production_payment_verified?: boolean;

  qc_completed?: boolean;
  packing_completed?: boolean;

  final_payment_paid?: boolean;
  delivered?: boolean;
  completed?: boolean;

  created_at?: string | null;
  updated_at?: string | null;
}

export interface ProductionProgress {
  id?: number | null;
  prioritas?: string;
  acc_sample?: boolean;
  [key: string]: any;
}

export interface Customer {
  id?: number;
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface Supplier {
  id?: number;
  nama?: string;
  nama_perusahaan?: string;
  email?:string;
  kategori?:string;
  kontak?:string;
  alamat:string;
}

export interface SizeBreakdown {
  id: number;
  color?: string;
  size_label?: string;
  qty?: number;
}

export interface ProductOption {
  id: number;
  name: string;
  category?: string | null;
}

export interface MaterialSpec {
  id: number;
  type: string;
  material_name: string;
  color?: string | null;
  usage?: number | null;
  unit?: string | null;
  usage_per_set?: number | null;
  supplier?: Supplier | string | null;
  harga_eceran?: number | null;
  harga_roll?: number | null;
  roll_qty?: number | null;
  price_type?: string | null;
  cost_per_piece?: number | null;
}

export interface ManufacturingSpec {
  id: number;
  work_name: string;
  usage?: number | null;
  unit?: string | null;
  usage_note?: string | null;
  vendor?: Supplier | string | null;
  min_estimate?: number | null;
  max_estimate?: number | null;
  cost_per_pcs?: number | null;
}

export interface JobTicket {
  id: number;

  order_number: string;
  product_name: string;

  customer: Customer;

  quantity?: number;
  deadline?: string | null;
  priority?: string;

  progressPercent?: number;

  created_at?: string | null;
  updated_at?: string | null;

  status?: string;

  price_per_piece?: number;
  estimated_hpp_per_piece?: number;

  // specifications
  specs?: OrderSpecification[]; // legacy kalau masih ada
  specifications?: OrderSpecification[]; // relasi yang kita pakai sekarang

  // design
  designs?: DesignRevision[];

  // sample
  samples?: Sample[];

  // finance
  invoices?: Invoice[];
  payments?: Payment[];

  // purchasing
  purchasings?: PurchasingItem[];

  // production / QC / packing / delivery
  qc?: {
    reject_count: number;
  };

  packing?: {
    weight?: number;
    dimensions?: string;
  };

  delivery?: {
    address?: string;
    delivered_at?: string | null;
    tracking_number?: string;
  };

  // workflow logs
  activity_logs?: WorkflowHistory[]; // legacy
  workflowHistories?: WorkflowHistory[]; // kalau backend pakai camelCase
  workflow_history?: WorkflowHistory[]; // kalau backend return snake_case

  productionProgress?: ProductionProgress | null;
  production_progress?: ProductionProgress | null;

  attachments?: Attachment[];

  workflow_status?: WorkflowStatus;
  workflowStatus?: WorkflowStatus; // optional kalau backend return camelCase

  size_breakdowns?: SizeBreakdown[];

  product?: ProductOption;

  material_specs?: MaterialSpec[];
  manufacturing_specs?: ManufacturingSpec[];
}

