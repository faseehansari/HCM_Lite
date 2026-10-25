// Tiny pub/sub toast store so non-React code (the Axios interceptors) can raise toasts too.
let listeners = [];
let nextId = 1;

const emit = (type, message, duration = 4500) => {
  if (!message) return;
  const toast = { id: nextId++, type, message: String(message), duration };
  listeners.forEach((l) => l({ action: 'add', toast }));
  return toast.id;
};

export const toast = {
  success: (m, d) => emit('success', m, d),
  error: (m, d) => emit('error', m, d ?? 6000),
  info: (m, d) => emit('info', m, d),
  dismiss: (id) => listeners.forEach((l) => l({ action: 'remove', id })),
};

export const subscribeToasts = (fn) => {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
};
