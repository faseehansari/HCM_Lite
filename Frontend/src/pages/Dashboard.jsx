import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, CalendarClock, Fingerprint, Wallet } from 'lucide-react';
import { attendanceService, employeeService, leaveService, payrollService } from '../services/endpoints';
import { useAuth } from '../context/AuthContext';
import { PageHeader, PageLoader, StatCard, StatusBadge, EmptyState } from '../components/ui';
import { empName, formatCurrency, formatDate, isToday } from '../utils/format';

const norm = (s) => String(s || '').toLowerCase();

export default function Dashboard() {
  const { user, isPrivileged } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cfg = { silent: true };
      const [emp, leaves, att, pay] = await Promise.allSettled([
        isPrivileged ? employeeService.list(cfg) : Promise.resolve([]),
        leaveService.list(cfg),
        attendanceService.list(cfg),
        payrollService.list(cfg),
      ]);
      if (cancelled) return;
      const val = (r) => (r.status === 'fulfilled' ? r.value : []);
      setData({ employees: val(emp), leaves: val(leaves), attendance: val(att), payroll: val(pay), failed: [emp, leaves, att, pay].filter((r) => r.status === 'rejected').length });
    })();
    return () => { cancelled = true; };
  }, [isPrivileged]);

  if (!data) return <PageLoader />;

  const pending = data.leaves.filter((l) => norm(l.status) === 'pending');
  const todayRecords = data.attendance.filter((a) => isToday(a.date || a.checkIn || a.createdAt));
  const latestPayroll = [...data.payroll].sort((a, b) => new Date(b.createdAt || b.payDate || 0) - new Date(a.createdAt || a.payDate || 0))[0];
  const payrollStatus = latestPayroll ? (latestPayroll.status || 'Processed') : 'No records';

  return (
    <>
      <PageHeader title={`Hello, ${empName(user).split(' ')[0] || 'there'} 👋`} subtitle="Here's what's happening across your organisation today." />

      {data.failed > 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
          Some dashboard data could not be loaded. Figures may be incomplete.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isPrivileged ? (
          <StatCard label="Total Employees" value={data.employees.length} icon={Users} />
        ) : (
          <StatCard label="My Leave Requests" value={data.leaves.length} icon={Users} />
        )}
        <StatCard label="Pending Leaves" value={pending.length} icon={CalendarClock} tone="amber" />
        <StatCard label="Today's Attendance" value={todayRecords.length} icon={Fingerprint} tone="emerald" hint={isPrivileged ? 'check-ins recorded' : undefined} />
        <StatCard label="Payroll Status" value={<span className="capitalize">{payrollStatus}</span>} icon={Wallet} tone="sky" hint={latestPayroll ? formatCurrency(latestPayroll.netSalary ?? latestPayroll.netPay ?? latestPayroll.grossSalary) : undefined} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <h2 className="font-semibold">Pending leave requests</h2>
            <Link to="/leave" className="text-sm text-brand-600 hover:underline">View all</Link>
          </div>
          {pending.length === 0 ? <EmptyState title="No pending requests" /> : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {pending.slice(0, 5).map((l) => (
                <li key={l._id || l.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{empName(l.employee) !== '—' ? empName(l.employee) : (l.leaveType || l.type)}</p>
                    <p className="text-xs text-slate-500">{formatDate(l.startDate)} → {formatDate(l.endDate)}</p>
                  </div>
                  <StatusBadge status={l.status} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <h2 className="font-semibold">Today's attendance</h2>
            <Link to="/attendance" className="text-sm text-brand-600 hover:underline">Open</Link>
          </div>
          {todayRecords.length === 0 ? <EmptyState title="No check-ins yet today" /> : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {todayRecords.slice(0, 5).map((a) => (
                <li key={a._id || a.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <p className="truncate font-medium">{empName(a.employee || a.user) !== '—' ? empName(a.employee || a.user) : 'You'}</p>
                  <StatusBadge status={a.status || 'present'} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
