import { OrderData } from "../types";

export default function OrderSummary({ orders }: { orders: OrderData[] }) {
  const totalQtyAcrossOrders = orders.reduce((acc, curr) => acc + Number(curr.q || 0), 0);

  return (
    <aside className="space-y-6">
      <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs transition-colors">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground mb-5">
          Ringkasan Purchase Order
        </p>

        <div className="space-y-3">
          <div className="rounded-xl bg-muted/40 px-4 py-3 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Total Pesanan (Items)</p>
            <p className="text-lg font-bold text-foreground">{orders.length} <span className="text-sm font-normal text-muted-foreground">Model Produk</span></p>
          </div>

          <div className="rounded-xl bg-emerald-500/10 px-4 py-3 border border-emerald-500/20">
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1 font-medium">Total Quantity Keseluruhan</p>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{totalQtyAcrossOrders} <span className="text-sm font-normal">Pcs</span></p>
          </div>

          <div className="mt-4 pt-4 border-t border-border/60">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Daftar Produk:</p>
            <ul className="space-y-2">
              {orders.map((o, idx) => (
                <li key={idx} className="text-sm text-foreground/80 flex justify-between">
                  <span className="truncate pr-4">• {o.requested_product_name || `Produk #${idx+1}`}</span>
                  <span className="font-semibold whitespace-nowrap text-foreground">{o.q || 0} pcs</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </aside>
  );
}