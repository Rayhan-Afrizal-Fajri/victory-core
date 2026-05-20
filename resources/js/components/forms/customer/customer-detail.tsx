import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type Props = {
  customer: any;
  onClose: () => void;
};

export function CustomerDetail({
  customer,
  onClose,
}: Props) {
  return (
    <div className="space-y-6 px-4 pb-10">
      <div className="rounded-2xl border p-6">
        <h2 className="text-2xl font-semibold">
          {customer.name}
        </h2>

        <p>{customer.contact}</p>
        <p>{customer.address}</p>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr>
            <th>Job Ticket</th>
            <th>Item</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {customer.order_history.map((order: any) => (
            <tr key={order.id}>
              <td>{order.job_ticket}</td>
              <td>{order.item_name}</td>
              <td>
                <Badge>{order.status}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Button
        variant="secondary"
        onClick={onClose}
      >
        Tutup
      </Button>
    </div>
  );
}