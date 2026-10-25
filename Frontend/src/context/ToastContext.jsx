import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { toast, subscribeToasts } from '../services/toast';

const ToastContext = createContext(toast);
export const useToast = () => useContext(ToastContext);

const styles = {
  success: { icon: CheckCircle2, cls: 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' },
  error: { icon: XCircle, cls: 'border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200' },
  info: { icon: Info, cls: 'border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200' },
};

// Renders toasts raised from anywhere (components or Axios interceptors) via services/toast.js
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const remove = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  useEffect(
    () =>
      subscribeToasts(({ action, toast: t, id }) => {
        if (action === 'remove') return remove(id);
        setToasts((list) => [...list.slice(-4), t]);
        setTimeout(() => remove(t.id), t.duration);
      }),
    [remove]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2" aria-live="polite">
        {toasts.map((t) => {
          const { icon: Icon, cls } = styles[t.type] || styles.info;
          return (
            <div key={t.id} className={`animate-slide-in pointer-events-auto flex items-start gap-2 rounded-lg border p-3 text-sm shadow-lg ${cls}`}>
              <Icon size={18} className="mt-0.5 shrink-0" />
              <p className="flex-1 break-words">{t.message}</p>
              <button onClick={() => remove(t.id)} aria-label="Dismiss"><X size={16} /></button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
