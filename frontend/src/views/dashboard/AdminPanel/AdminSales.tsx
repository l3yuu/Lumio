import type { AdminSales } from './types';

interface Props {
  sales: AdminSales | null;
}

export const AdminSalesView = ({ sales }: Props) => {
  if (!sales) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-card border border-line rounded-xl p-5 flex flex-col gap-3">
          <span className="text-xs text-ink-muted uppercase tracking-wider font-semibold">Monthly Recurring Revenue</span>
          <span className="text-3xl font-extrabold tracking-tight text-primary">${sales.mrr.toLocaleString()}</span>
          <span className="text-xs text-ink-muted">Based on subscription plans</span>
        </div>

        <div className="bg-card border border-line rounded-xl p-5 flex flex-col gap-3">
          <span className="text-xs text-ink-muted uppercase tracking-wider font-semibold">Total Revenue Gained</span>
          <span className="text-3xl font-extrabold tracking-tight text-primary">${sales.total_revenue.toLocaleString()}</span>
          <span className="text-xs text-ink-muted">Historical cumulative sales</span>
        </div>

        <div className="bg-card border border-line rounded-xl p-5 flex flex-col gap-3">
          <span className="text-xs text-ink-muted uppercase tracking-wider font-semibold">Premium Subscribers</span>
          <span className="text-3xl font-extrabold tracking-tight text-primary">{sales.premium_count} Users</span>
          <span className="text-xs text-ink-muted">With active premium tiers</span>
        </div>

        <div className="bg-card border border-line rounded-xl p-5 flex flex-col gap-3">
          <span className="text-xs text-ink-muted uppercase tracking-wider font-semibold">User Churn Rate</span>
          <span className="text-3xl font-extrabold tracking-tight text-danger">{sales.churn_rate}%</span>
          <span className="text-xs text-ink-muted">Average cancellations monthly</span>
        </div>
      </div>

      <div className="bg-card border border-line rounded-xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-line bg-input/20">
          <h3 className="text-sm font-bold uppercase tracking-wider">Recent Subscription Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-xs font-semibold text-ink-muted bg-input/20">
                <th className="p-4 pl-6">Transaction ID</th>
                <th className="p-4">Subscriber User</th>
                <th className="p-4">Subscription Plan</th>
                <th className="p-4">Billing Date</th>
                <th className="p-4">Paid Amount</th>
                <th className="p-4 pr-6 text-right">Payment Status</th>
              </tr>
            </thead>
            <tbody>
              {sales.transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-line/60 hover:bg-glass/5 transition-colors">
                  <td className="p-4 pl-6 font-bold text-ink-muted">#TXN{tx.id}</td>
                  <td className="p-4">
                    <span className="font-semibold block text-ink">{tx.user_name}</span>
                    <span className="text-xs text-ink-muted block">{tx.user_email}</span>
                  </td>
                  <td className="p-4 font-medium">{tx.plan}</td>
                  <td className="p-4 text-ink-muted">{tx.date}</td>
                  <td className="p-4 font-bold text-primary">${tx.amount.toFixed(2)}</td>
                  <td className="p-4 pr-6 text-right">
                    <span className={`px-2 py-0.5 rounded text-[0.7rem] font-bold uppercase ${
                      tx.status === 'completed'
                        ? 'bg-success/15 text-success border border-success/20'
                        : 'bg-danger/15 text-danger border border-danger/20'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
