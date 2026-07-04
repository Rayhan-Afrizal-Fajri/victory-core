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
  note?: string; 
  revision_note?: string | null;
  customer_revision_note?: string | null;
  designer_revision_note?: string | null;
  status?: DesignStatus;
  approved?: boolean; 
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
  job_ticket_id?: number; // BERUBAH: Naik level ke Job Ticket
  jobTicket?: JobTicket;
  no_invoice?: string;
  kategori_invoice?: string;
  total_tagihan?: number;
  status_tagihan?: InvoiceStatus;
  tgl_jatuh_tempo?: string;
  payments?: Payment[];
  
  // legacy (jika masih dipanggil di frontend)
  title?: string;
  amount?: number;
  status?: string;
  due_date?: string | null;
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
  pesanan_material_spec_id?: number;
  pesanan_id?: number;
  item: string;
  supplier?: Supplier | string | null;
  supplier_id?: number | null;
  qty_bahan: number;
  ordered_qty: number;
  received_qty: number;
  remaining_qty?: number;
  unit?: string | null;
  harga_satuan?: number;
  total_harga?: number;
  tgl_pembelian?: string | null;
  status?: string;
  purchase_scope?: string;
  notes?: string
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
  note?: string; 
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
  key: string;
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
  article_synced?: boolean;
  design_specs_completed?: boolean;
  quotation_created?: boolean;
  quotation_approved?: boolean;
  sample_created?: boolean;
  sample_paid?: boolean;
  sample_delivered?: boolean;
  sample_approved?: boolean;
  production_invoice_created?: boolean;
  production_dp_paid?: boolean;
  materials_purchased?: boolean;
  materials_received?: boolean;
  materials_distributed?: boolean;
  sample_materials_ready?: boolean;
  production_materials_ready?: boolean;
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

export interface SupplierOption {
  value: number;
  label: string;
}

export interface SizeBreakdown {
  id: number;
  color?: string;
  size_label?: string;
  fabric_spec?: string;
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
  material_name_snapshot: string;
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
  cost_per_pcs?: number | null;
}

export interface ManufacturingSpec {
  id: number;
  work_name: string;
  work_name_snapshot: string;
  usage?: number | null;
  unit?: string | null;
  usage_note?: string | null;
  vendor?: Supplier | string | null;
  vendor_id?: number;
  min_estimate?: number | null;
  max_estimate?: number | null;
  cost_per_pcs?: number | null;
}

export interface ProductionRunProcess {
  id: number;
  pesanan_id: number;
  work_name: string;
  sequence: number;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  qc_status?: 'pending' | 'passed' | 'failed' | null;
  quantity: number;
  checked_qty?: number | null;
  passed_qty?: number | null;
  defect_qty?: number | null;
  qc_notes?: string | null;
  corrective_action?: string | null;
  started_at?: string;
  completed_at?: string;
  qc_checked_at?: string;
  qc_checked_by?: string;
}

export interface ProductionRun {
  id?: number;
  type?: string;
  quantity?: number;
  status?: string;
  packing_completed?: boolean;
  packing_notes?: string;
  courier_name?: string;
  tracking_number?: string;
  tracking_url?: string;
  delivery_note?: string;
  delivered_at?: string | null;
  customer_review_note?: string;
  approved_at?: string | null;
  processes?: ProductionRunProcess[];
}

export interface QuotationItem {
  id: number;
  pesanan_id?: number; // Tautkan item ini ke pesanan yang mana
  item_name: string;
  fabric?: string | null;
  print_method?: string | null;
  quantity?: number | null;
  price_per_pcs?: number | null;
  subtotal?: number | null;  
}

export interface Quotation {
  id: number;
  quotation_number: string;
  status: string;
  valid_until?: string | null;
  sample_qty?: number | null;
  payment_terms?: string;
  delivery_terms?: string;
  notes?: string | null;
  price_per_pcs?: number | null;
  quantity?: number | null;
  subtotal?: number | null;
  tax?: number | null;
  delivery_cost?: number | null;
  grand_total?: number | null;
  approved_at?: string | null;
  approved_by_name?: string | null;
  signature_path?: string | null;
  items?: QuotationItem[];
}

/** * NEW: Pesanan (Order) entity
 * Menyimpan data spesifik per produk dalam 1 Job Ticket
 */
export interface Pesanan {
  id: number;
  product_name: string;
  requested_product_name: string;
  quantity: number;
  sample_qty?: number;
  price_per_piece?: number;
  estimated_hpp_per_piece?: number;
  status?: string;

  product?: ProductOption | null;
  size_breakdowns?: SizeBreakdown[];
  workflow_status?: WorkflowStatus;
  
  productionProgress?: ProductionProgress | null;

  specs?: OrderSpecification[];
  designs?: DesignRevision[];
  samples?: Sample[];
  purchasings?: PurchasingItem[];
  material_specs?: MaterialSpec[];
  manufacturing_specs?: ManufacturingSpec[];
  attachments?: Attachment[];
}

export interface CompanyProfile {
  id: number;
  company_name: string;
  company_type: string;
  bank_type: string;
  account_number: string;
  address: string;
  tax_percentage: number;
}

/** * UPDATED: JobTicket root entity 
 */
export interface JobTicket {
  id: number;
  no_job_ticket: string; // Updated dari order_number
  customer: Customer;
  company_profile: CompanyProfile;
  deadline?: string | null;
  sales_name?: string | null;
  customer_notes?: string | null;
  status?: string;
  created_at?: string | null;
  
  // Array Global di Job Ticket
  invoices?: Invoice[];
  quotations?: Quotation[];
  sample_run?: ProductionRun | null;
  production_run?: ProductionRun | null;
  workflow_histories?: WorkflowHistory[] | null;
  
  // Anak dari Job Ticket (Pesanans)
  orders: Pesanan[];
}