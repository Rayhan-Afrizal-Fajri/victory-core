import { OrderData } from "../types";

export default function OrderSummary({ orders }: { orders: OrderData[] }) {
  const totalQtyAcrossOrders = orders.reduce((acc, curr) => acc + Number(curr.q || 0), 0);

  return (
    <aside className="space-y-6">
      <div className="rounded-sm border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 mb-5">
          Ringkasan Purchase Order
        </p>

        <div className="space-y-3">
          <div className="rounded-lg bg-slate-50 px-4 py-3 border border-slate-100">
            <p className="text-xs text-slate-500 mb-1">Total Pesanan (Items)</p>
            <p className="text-lg font-bold text-slate-900">{orders.length} <span className="text-sm font-normal text-slate-600">Model Produk</span></p>
          </div>

          <div className="rounded-lg bg-emerald-50 px-4 py-3 border border-emerald-100">
            <p className="text-xs text-emerald-600 mb-1">Total Quantity Keseluruhan</p>
            <p className="text-lg font-bold text-emerald-900">{totalQtyAcrossOrders} <span className="text-sm font-normal">Pcs</span></p>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 mb-2">Daftar Produk:</p>
            <ul className="space-y-2">
              {orders.map((o, idx) => (
                <li key={idx} className="text-sm text-slate-700 flex justify-between">
                  <span className="truncate pr-4">• {o.requested_product_name || `Produk #${idx+1}`}</span>
                  <span className="font-medium whitespace-nowrap">{o.q || 0} pcs</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </aside>
  );
}