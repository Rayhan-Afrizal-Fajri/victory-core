export type Customer = { id: number; name: string; };
export type CompanyProfile = { id: number; name: string; type: string; };
export type OrderData = {
  id?: number | null;
  requested_product_name: string;
  q: number;
  size_breakdowns: Array<{ color: string; size_label: string; fabric_spec: string; qty: number }>;
};
export type EditingJobTicket = {
  id: number;
  no_job_ticket: string;
  customer_id: number | null;
  company_profile_id: number | null;
  sales_name: string | null;
  deadline: string;
  customer_notes: string;
  orders: OrderData[];
};

export type Props = {
  nextJobTicket: string | null;
  customers: Customer[];
  companyProfiles: CompanyProfile[];
  editingJobTicket?: EditingJobTicket | null;
  customer: Customer | null;
  defaultSizeBreakdowns?: {
    color: string[];
    fabric: string[];
    size: string[];
  };
};

export const emptySizeRow = { color: '', size_label: '', fabric_spec: '', qty: 1 };
export const emptyOrderRow: OrderData = {
  id: null,
  requested_product_name: '',
  q: 0,
  size_breakdowns: [{ ...emptySizeRow }],
};