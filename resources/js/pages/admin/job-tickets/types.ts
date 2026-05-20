export type Role = 'Customer' | 'CS' | 'Designer' | 'Owner' | 'Finance' | 'PPIC' | 'Production' | 'QC';

export interface DesignRevision {
  id: number;
  file_path?: string;
  note?: string;
  approved?: boolean;
  approved_at?: string | null;
  created_at?: string | null;
}

export interface Sample {
  id: number;
  qty: number;
  status: string;
  sent_at?: string | null;
  approved_at?: string | null;
}

export interface Payment {
  id: number;
  amount: number;
  method?: string;
  paid_at?: string | null;
}

export interface Invoice {
  id: number;
  title: string;
  amount: number;
  status: string;
  issued_at?: string | null;
  payments?: Payment[];
}

export interface MaterialReceiving {
  id: number;
  qty_received: number;
  received_at?: string | null;
}

export interface PurchasingItem {
  id: number;
  item: string;
  supplier?: string | number;
  ordered_qty: number;
  received_qty: number;
  material_receivings?: MaterialReceiving[];
}

export interface WorkflowHistory {
  id: number;
  actor: string;
  role: Role;
  action: string;
  note?: string;
  created_at: string;
}

export interface Attachment {
  id: number;
  category?: string;
  file_path?: string;
  notes?: string;
}

export interface WorkflowStatus {
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
}

export interface ProductionProgress {
  id?: number | null;
  prioritas?: string;
  acc_sample?: boolean;
  [key: string]: any;
}

export interface JobTicket {
  id: number;
  order_number: string;
  product_name: string;
  customer: { name?: string; company?: string };
  quantity?: number;
  deadline?: string | null;
  priority?: string;
  progressPercent?: number;
  created_at?: string | null;
  status?: string;
  price_per_piece?: number;
  estimated_hpp_per_piece?: number;
  specs?: { material?: string; design?: string; notes?: string };
  designs?: DesignRevision[];
  samples?: Sample[];
  invoices?: Invoice[];
  payments?: Payment[];
  purchasings?: PurchasingItem[];
  qc?: { reject_count: number };
  packing?: { weight?: number; dimensions?: string };
  delivery?: { address?: string; delivered_at?: string | null; tracking_number?: string };
  activity_logs?: WorkflowHistory[];
  productionProgress?: ProductionProgress | null;
  workflowHistories?: WorkflowHistory[];
  attachments?: Attachment[];
  workflow_status?: WorkflowStatus;
}
