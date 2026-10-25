import { Loader2, Inbox } from 'lucide-react';

export function Spinner({ size = 16, className = '' }) {
  return <Loader2 size={size} className={`animate-spin ${className}`} />;
}

export function Button({ loading = false, icon: Icon, variant = 'primary', children, className = '', disabled, ...props }) {
  return (
    <button className={`btn-${variant} ${className}`} disabled={loading || disabled} {...props}>
      {loading ? <Spinner /> : Icon ? <Icon size={16} /> : null}
      {children}
    </button>
  );
}

export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
      <Spinner size={20} /> {label}
    </div>
  );
}

export function EmptyState({ title = 'Nothing here yet', hint }) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center text-slate-500">
      <Inbox size={32} className="opacity-60" />
      <p className="font-medium">{title}</p>
      {hint && <p className="text-sm">{hint}</p>}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, hint, tone = 'brand' }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600 dark:bg-brand-600/20 dark:text-brand-100',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300',
    sky: 'bg-sky-50 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300',
  };
  return (
    <div className="card flex items-center gap-4 p-5">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        <p className="truncate text-2xl font-bold">{value}</p>
        {hint && <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
      </div>
    </div>
  );
}

const badgeTones = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
  approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300',
  paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300',
  processed: 'bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300',
  present: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300',
  late: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
  absent: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300',
  default: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
};

export function StatusBadge({ status }) {
  const key = String(status || '').toLowerCase();
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${badgeTones[key] || badgeTones.default}`}>
      {status || '—'}
    </span>
  );
}

export function Field({ label, error, children, htmlFor }) {
  return (
    <div>
      {label && <label htmlFor={htmlFor} className="label">{label}</label>}
      {children}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

export function FormError({ message }) {
  if (!message) return null;
  return <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">{message}</div>;
}
