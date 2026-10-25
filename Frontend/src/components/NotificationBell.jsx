import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, Fingerprint, Wallet, CalendarCheck, PartyPopper, Info } from 'lucide-react';
import { notificationService } from '../services/endpoints';
import { timeAgo } from '../utils/format';
import { Spinner } from './ui';

const POLL_MS = 60000;

const iconFor = (n) => {
  const s = `${n.type || ''} ${n.title || ''}`.toLowerCase();
  if (s.includes('biometric') || s.includes('fingerprint')) return Fingerprint;
  if (s.includes('payroll') || s.includes('salary')) return Wallet;
  if (s.includes('leave')) return CalendarCheck;
  if (s.includes('welcome')) return PartyPopper;
  return Info;
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  const load = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      setItems(await notificationService.list());
    } catch {
      /* silent: notifications are non-critical */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(true);
    const id = setInterval(() => load(), POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    const onClick = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const isRead = (n) => n.isRead ?? n.read ?? false;
  const unread = items.filter((n) => !isRead(n)).length;
  const id = (n) => n._id || n.id;

  const markRead = async (n) => {
    if (isRead(n)) return;
    setItems((list) => list.map((x) => (id(x) === id(n) ? { ...x, isRead: true, read: true } : x)));
    try { await notificationService.markRead(id(n)); } catch { load(); }
  };

  const markAll = async () => {
    setItems((list) => list.map((x) => ({ ...x, isRead: true, read: true })));
    try { await notificationService.markAllRead(); } catch { load(); }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen((o) => !o); if (!open) load(); }}
        className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-semibold text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="animate-pop absolute right-0 z-50 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <h3 className="text-sm font-semibold">Notifications</h3>
            {unread > 0 && (
              <button onClick={markAll} className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline">
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8 text-slate-500"><Spinner size={20} /></div>
            ) : items.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-500">You're all caught up.</p>
            ) : (
              items.slice(0, 15).map((n) => {
                const Icon = iconFor(n);
                return (
                  <button
                    key={id(n)}
                    onClick={() => markRead(n)}
                    className={`flex w-full gap-3 border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60 ${isRead(n) ? 'opacity-70' : ''}`}
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-600/20 dark:text-brand-100">
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{n.title || 'Notification'}</p>
                      <p className="line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{n.message || n.body}</p>
                      <p className="mt-1 text-[11px] text-slate-400">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!isRead(n) && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
