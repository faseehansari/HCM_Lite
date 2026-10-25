export const formatCurrency = (n) =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(n) || 0);

export const formatDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  return isNaN(date) ? '—' : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

export const formatTime = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  return isNaN(date) ? '—' : date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
};

export const timeAgo = (d) => {
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (isNaN(diff)) return '';
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

export const isToday = (d) => {
  if (!d) return false;
  const a = new Date(d);
  const b = new Date();
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
};

// Sum a number, or an object/array of numbers/{amount} (allowances & deductions may be any of these).
export const sumValue = (v) => {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return Number(v) || 0;
  if (Array.isArray(v)) return v.reduce((s, i) => s + (typeof i === 'object' ? Number(i.amount) || 0 : Number(i) || 0), 0);
  return Object.values(v).reduce((s, i) => s + (typeof i === 'object' ? Number(i?.amount) || 0 : Number(i) || 0), 0);
};

// Turn allowances/deductions into [{label, amount}] rows for display.
export const toBreakdown = (v) => {
  if (v == null) return [];
  if (typeof v === 'number') return [{ label: 'Total', amount: v }];
  if (Array.isArray(v)) return v.map((i, idx) => (typeof i === 'object' ? { label: i.name || i.label || i.type || `Item ${idx + 1}`, amount: Number(i.amount) || 0 } : { label: `Item ${idx + 1}`, amount: Number(i) || 0 }));
  return Object.entries(v).map(([k, val]) => ({ label: k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()), amount: typeof val === 'object' ? Number(val?.amount) || 0 : Number(val) || 0 }));
};

export const empName = (e) => {
  if (!e) return '—';
  if (typeof e === 'string') return e;
  return e.name || [e.firstName, e.lastName].filter(Boolean).join(' ') || e.email || '—';
};
