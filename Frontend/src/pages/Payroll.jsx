import { useEffect, useMemo, useState } from 'react';
import { Wallet } from 'lucide-react';
import { payrollService } from '../services/endpoints';
import { getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { EmptyState, PageHeader, PageLoader, StatusBadge } from '../components/ui';
import { Button } from '../components/ui';
import { empName, formatCurrency, formatDate, sumValue, toBreakdown } from '../utils/format';

const fig = (p) => {
  const basic = Number(p.basicSalary ?? p.basic ?? 0);
  const allowances = sumValue(p.allowances ?? p.totalAllowances);
  const deductions = sumValue(p.deductions ?? p.totalDeductions);
  const gross = Number(p.grossSalary ?? p.gross ?? basic + allowances);
  const net = Number(p.netSalary ?? p.netPay ?? p.net ?? gross - deductions);
  return { basic, allowances, deductions, gross, net };
};
const when = (p) => p.payDate || p.paidAt || p.month || p.createdAt;

export default function Payroll() {
  const { isPrivileged } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try { setRecords(await payrollService.list({ silent: true })); }
    catch (err) { setError(getErrorMessage(err, 'Could not load payroll data.')); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const sorted = useMemo(() => [...records].sort((a, b) => new Date(when(b) || 0) - new Date(when(a) || 0)), [records]);
  const latest = sorted[0];

  if (loading) return <PageLoader />;
  if (error) return (
    <div className="card p-8 text-center"><p className="mb-3 text-sm text-red-600">{error}</p><Button variant="secondary" onClick={load}>Retry</Button></div>
  );

  const f = latest && fig(latest);
  const rows = latest
    ? [
        { label: 'Basic salary', amount: f.basic },
        ...toBreakdown(latest.allowances).map((r) => ({ ...r, label: `+ ${r.label}`, positive: true })),
      ]
    : [];

  return (
    <>
      <PageHeader title="Payroll" subtitle="Salary structure and payout history." />

      {!latest ? <div className="card"><EmptyState title="No payroll records yet" /></div> : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[['Basic salary', f.basic], ['Allowances', f.allowances], ['Deductions', f.deductions], ['Gross salary', f.gross]].map(([l, v]) => (
              <div key={l} className="card p-5">
                <p className="text-sm text-slate-500">{l}</p>
                <p className={`mt-1 text-2xl font-bold ${l === 'Deductions' ? 'text-red-600' : ''}`}>{l === 'Deductions' ? '−' : ''}{formatCurrency(v)}</p>
              </div>
            ))}
          </div>

          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            <section className="card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-semibold"><Wallet size={18} className="text-brand-600" /> Latest salary breakdown</h2>
                <StatusBadge status={latest.status || 'processed'} />
              </div>
              <dl className="space-y-2 text-sm">
                {rows.map((r, i) => (
                  <div key={i} className="flex justify-between"><dt className="text-slate-500">{r.label}</dt><dd className="font-medium">{formatCurrency(r.amount)}</dd></div>
                ))}
                {toBreakdown(latest.deductions).map((r, i) => (
                  <div key={`d${i}`} className="flex justify-between"><dt className="text-slate-500">− {r.label}</dt><dd className="font-medium text-red-600">{formatCurrency(r.amount)}</dd></div>
                ))}
                <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-bold dark:border-slate-700">
                  <dt>Net pay</dt><dd className="text-emerald-600">{formatCurrency(f.net)}</dd>
                </div>
              </dl>
            </section>

            <section className="card p-6">
              <h2 className="mb-4 font-semibold">Gross vs. net</h2>
              <div className="space-y-4">
                {[['Gross', f.gross, 'bg-brand-500'], ['Deductions', f.deductions, 'bg-red-500'], ['Net', f.net, 'bg-emerald-500']].map(([l, v, c]) => (
                  <div key={l}>
                    <div className="mb-1 flex justify-between text-sm"><span>{l}</span><span className="font-medium">{formatCurrency(v)}</span></div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className={`h-full rounded-full ${c}`} style={{ width: `${f.gross ? Math.min(100, (v / f.gross) * 100) : 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="card overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800"><h2 className="font-semibold">Payout history</h2></div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    {isPrivileged && <th className="th">Employee</th>}
                    {['Period', 'Gross', 'Deductions', 'Net pay', 'Status'].map((h) => <th key={h} className="th">{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {sorted.map((p) => {
                    const x = fig(p);
                    return (
                      <tr key={p._id || p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        {isPrivileged && <td className="td">{empName(p.employee)}</td>}
                        <td className="td">{formatDate(when(p))}</td>
                        <td className="td">{formatCurrency(x.gross)}</td>
                        <td className="td text-red-600">−{formatCurrency(x.deductions)}</td>
                        <td className="td font-semibold">{formatCurrency(x.net)}</td>
                        <td className="td"><StatusBadge status={p.status || 'processed'} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  );
}
