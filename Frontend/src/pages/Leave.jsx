import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Send, X } from 'lucide-react';
import { leaveService } from '../services/endpoints';
import { getErrorMessage } from '../services/api';
import { toast } from '../services/toast';
import { useAuth } from '../context/AuthContext';
import { Button, EmptyState, Field, FormError, PageHeader, PageLoader, StatusBadge } from '../components/ui';
import { empName, formatDate } from '../utils/format';

const LEAVE_TYPES = [
  { value: 'casual', label: 'Casual' },
  { value: 'sick', label: 'Sick' },
  { value: 'annual', label: 'Annual' },
  { value: 'unpaid', label: 'Unpaid' },
];
const empty = { leaveType: 'casual', startDate: '', endDate: '', reason: '' };
const FILTERS = ['all', 'pending', 'approved', 'rejected'];

export default function Leave() {
  const { isPrivileged } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [acting, setActing] = useState(''); // "<id>:<status>"

  const load = useCallback(async () => {
    try { setLeaves(await leaveService.list({ silent: true })); }
    catch (err) { toast.error(getErrorMessage(err, 'Could not load leave requests.')); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const today = new Date().toISOString().slice(0, 10);

  const validate = () => {
    const e = {};
    if (!form.startDate) e.startDate = 'Start date is required';
    if (!form.endDate) e.endDate = 'End date is required';
    if (form.startDate && form.endDate && form.endDate < form.startDate) e.endDate = 'End date cannot be before start date';
    if (form.reason.trim().length < 5) e.reason = 'Please provide a reason (min 5 characters)';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setServerError('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      await leaveService.create({ ...form, type: form.leaveType, reason: form.reason.trim() });
      toast.success('Leave request submitted.');
      setForm(empty);
      setErrors({});
      load();
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const decide = async (leave, status) => {
    const id = leave._id || leave.id;
    setActing(`${id}:${status}`);
    try {
      await leaveService.updateStatus(id, status);
      setLeaves((list) => list.map((l) => ((l._id || l.id) === id ? { ...l, status } : l)));
    } catch { /* toast via interceptor */ }
    finally { setActing(''); }
  };

  const shown = useMemo(() => leaves.filter((l) => filter === 'all' || String(l.status).toLowerCase() === filter), [leaves, filter]);
  const counts = useMemo(() => leaves.reduce((a, l) => { const k = String(l.status).toLowerCase(); a[k] = (a[k] || 0) + 1; return a; }, {}), [leaves]);

  return (
    <>
      <PageHeader title="Leave Management" subtitle="Request time off and track the status of your requests." />

      <div className="grid gap-6 xl:grid-cols-[22rem_1fr]">
        <form onSubmit={submit} noValidate className="card h-fit space-y-4 p-6">
          <h2 className="font-semibold">New leave request</h2>
          <FormError message={serverError} />
          <Field label="Leave type">
            <select name="leaveType" value={form.leaveType} onChange={set} className="input">
              {LEAVE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start date" error={errors.startDate}><input type="date" name="startDate" min={today} value={form.startDate} onChange={set} className={`input ${errors.startDate ? 'input-error' : ''}`} /></Field>
            <Field label="End date" error={errors.endDate}><input type="date" name="endDate" min={form.startDate || today} value={form.endDate} onChange={set} className={`input ${errors.endDate ? 'input-error' : ''}`} /></Field>
          </div>
          <Field label="Reason" error={errors.reason}>
            <textarea name="reason" rows={4} value={form.reason} onChange={set} className={`input resize-none ${errors.reason ? 'input-error' : ''}`} placeholder="Briefly describe the reason…" />
          </Field>
          <Button type="submit" loading={submitting} icon={Send} className="w-full">{submitting ? 'Submitting…' : 'Submit request'}</Button>
        </form>

        <section className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <h2 className="font-semibold">{isPrivileged ? 'All requests' : 'My requests'}</h2>
            <div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
              {FILTERS.map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition ${filter === f ? 'bg-white shadow-sm dark:bg-slate-700' : 'text-slate-500'}`}>
                  {f}{f !== 'all' && counts[f] ? ` (${counts[f]})` : ''}
                </button>
              ))}
            </div>
          </div>
          {loading ? <PageLoader /> : shown.length === 0 ? <EmptyState title="No leave requests" /> : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {shown.map((l) => {
                const id = l._id || l.id;
                const pending = String(l.status).toLowerCase() === 'pending';
                return (
                  <li key={id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium capitalize">{l.leaveType || l.type} leave</p>
                        <StatusBadge status={l.status} />
                      </div>
                      {isPrivileged && l.employee && <p className="text-xs text-slate-500">{empName(l.employee)}</p>}
                      <p className="mt-1 text-sm text-slate-500">{formatDate(l.startDate)} → {formatDate(l.endDate)}</p>
                      {l.reason && <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{l.reason}</p>}
                    </div>
                    {isPrivileged && pending && (
                      <div className="flex gap-2">
                        <Button variant="success" icon={Check} className="!px-3 !py-1.5" loading={acting === `${id}:approved`} disabled={!!acting} onClick={() => decide(l, 'approved')}>Approve</Button>
                        <Button variant="danger" icon={X} className="!px-3 !py-1.5" loading={acting === `${id}:rejected`} disabled={!!acting} onClick={() => decide(l, 'rejected')}>Reject</Button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
