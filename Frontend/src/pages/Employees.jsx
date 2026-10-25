import { useEffect, useMemo, useState } from 'react';
import { Download, Plus, Search } from 'lucide-react';
import { employeeService } from '../services/endpoints';
import { getErrorMessage } from '../services/api';
import { toast } from '../services/toast';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { Button, EmptyState, Field, FormError, PageHeader, PageLoader, StatusBadge } from '../components/ui';
import { empName, formatDate } from '../utils/format';

const emptyForm = { name: '', email: '', employeeCode: '', department: '', designation: '', role: 'employee', password: '', joiningDate: '', basicSalary: '' };
const idOf = (e) => e._id || e.id;

export default function Employees() {
  const { isPrivileged } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState('');
  const [dept, setDept] = useState('');
  const [desig, setDesig] = useState('');
  const [modal, setModal] = useState(false);
  const [exporting, setExporting] = useState(false);

  const load = async () => {
    setLoading(true);
    setLoadError('');
    try {
      setEmployees(await employeeService.list({ silent: true }));
    } catch (err) {
      setLoadError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const departments = useMemo(() => [...new Set(employees.map((e) => e.department).filter(Boolean))].sort(), [employees]);
  const designations = useMemo(() => [...new Set(employees.map((e) => e.designation).filter(Boolean))].sort(), [employees]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return employees.filter((e) => {
      if (dept && e.department !== dept) return false;
      if (desig && e.designation !== desig) return false;
      if (!q) return true;
      return [empName(e), e.email, e.employeeCode].some((v) => String(v || '').toLowerCase().includes(q));
    });
  }, [employees, query, dept, desig]);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const res = await employeeService.exportCsv();
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `employees-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Employee directory exported.');
    } catch {
      /* error toast shown by interceptor */
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Employee Directory"
        subtitle={`${filtered.length} of ${employees.length} employees`}
        actions={isPrivileged && (
          <>
            <Button variant="secondary" icon={Download} loading={exporting} onClick={exportCsv}>Export CSV</Button>
            <Button icon={Plus} onClick={() => setModal(true)}>Add employee</Button>
          </>
        )}
      />

      <div className="card mb-4 grid gap-3 p-4 md:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, email or employee code…" className="input pl-9" />
        </div>
        <select value={dept} onChange={(e) => setDept(e.target.value)} className="input md:w-48" aria-label="Filter by department">
          <option value="">All departments</option>
          {departments.map((d) => <option key={d}>{d}</option>)}
        </select>
        <select value={desig} onChange={(e) => setDesig(e.target.value)} className="input md:w-48" aria-label="Filter by designation">
          <option value="">All designations</option>
          {designations.map((d) => <option key={d}>{d}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        {loading ? <PageLoader /> : loadError ? (
          <div className="p-8 text-center">
            <p className="mb-3 text-sm text-red-600">{loadError}</p>
            <Button variant="secondary" onClick={load}>Retry</Button>
          </div>
        ) : filtered.length === 0 ? <EmptyState title="No employees found" hint="Try adjusting your search or filters." /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                <tr>{['Employee', 'Code', 'Department', 'Designation', 'Joined', 'Role'].map((h) => <th key={h} className="th">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((e) => (
                  <tr key={idOf(e)} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="td">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold uppercase text-brand-600 dark:bg-brand-600/20 dark:text-brand-100">{empName(e).charAt(0)}</div>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{empName(e)}</p>
                          <p className="truncate text-xs text-slate-500">{e.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="td font-mono text-xs">{e.employeeCode || '—'}</td>
                    <td className="td">{e.department || '—'}</td>
                    <td className="td">{e.designation || '—'}</td>
                    <td className="td">{formatDate(e.joiningDate || e.createdAt)}</td>
                    <td className="td"><StatusBadge status={e.role || 'employee'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddEmployeeModal open={modal} onClose={() => setModal(false)} onCreated={load} />
    </>
  );
}

function AddEmployeeModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (open) { setForm(emptyForm); setErrors({}); setServerError(''); } }, [open]);

  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const cls = (k) => `input ${errors[k] ? 'input-error' : ''}`;

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Valid email is required';
    if (!form.employeeCode.trim()) e.employeeCode = 'Employee code is required';
    if (!form.department.trim()) e.department = 'Department is required';
    if (!form.designation.trim()) e.designation = 'Designation is required';
    if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (form.basicSalary !== '' && Number(form.basicSalary) < 0) e.basicSalary = 'Salary cannot be negative';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setServerError('');
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { ...form, name: form.name.trim(), email: form.email.trim() };
      if (payload.basicSalary === '') delete payload.basicSalary; else payload.basicSalary = Number(payload.basicSalary);
      if (!payload.joiningDate) delete payload.joiningDate;
      await employeeService.create(payload); // backend sends welcome notification
      toast.success('Employee added. A welcome notification has been sent.');
      onClose();
      onCreated();
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={saving ? () => {} : onClose} title="Add new employee">
      <form onSubmit={submit} noValidate className="space-y-4">
        <FormError message={serverError} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" error={errors.name}><input name="name" value={form.name} onChange={set} className={cls('name')} /></Field>
          <Field label="Employee code" error={errors.employeeCode}><input name="employeeCode" value={form.employeeCode} onChange={set} className={cls('employeeCode')} placeholder="EMP-001" /></Field>
          <Field label="Email" error={errors.email}><input name="email" type="email" value={form.email} onChange={set} className={cls('email')} /></Field>
          <Field label="Temporary password" error={errors.password}><input name="password" type="password" autoComplete="new-password" value={form.password} onChange={set} className={cls('password')} /></Field>
          <Field label="Department" error={errors.department}><input name="department" value={form.department} onChange={set} className={cls('department')} /></Field>
          <Field label="Designation" error={errors.designation}><input name="designation" value={form.designation} onChange={set} className={cls('designation')} /></Field>
          <Field label="Role">
            <select name="role" value={form.role} onChange={set} className="input">
              <option value="employee">Employee</option><option value="hr">HR</option><option value="admin">Admin</option>
            </select>
          </Field>
          <Field label="Joining date"><input name="joiningDate" type="date" value={form.joiningDate} onChange={set} className="input" /></Field>
          <Field label="Basic salary (optional)" error={errors.basicSalary}><input name="basicSalary" type="number" min="0" value={form.basicSalary} onChange={set} className={cls('basicSalary')} /></Field>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" loading={saving} icon={Plus}>{saving ? 'Saving…' : 'Add employee'}</Button>
        </div>
      </form>
    </Modal>
  );
}
