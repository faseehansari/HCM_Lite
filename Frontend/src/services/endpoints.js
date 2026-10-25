import api, { unwrapList, unwrapObject } from './api';

// All backend routes live here so they are trivial to adjust if your API differs.
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials, { silent: true }),
};

export const employeeService = {
  list: (config) => api.get('/employees/directory', config).then((r) => unwrapList(r, 'employees')),
  create: ({ basicSalary, joiningDate, ...payload }) => api.post('/org/employees', {
    ...payload,
    basic: basicSalary === '' || basicSalary == null ? 0 : Number(basicSalary),
  }),
  exportCsv: () => api.get('/employees/export/csv', { responseType: 'blob' }),
};

export const attendanceService = {
  list: (config) => api.get('/attendance', config).then((r) => unwrapList(r, 'attendance')),
  checkIn: () => api.post('/attendance/check-in'),
  checkOut: () => api.post('/attendance/check-out'),
};

export const biometricService = {
  registerOptions: () => api.post('/biometric/register-options', {}, { silent: true }),
  registerVerify: (body) => api.post('/biometric/register-verify', body),
  authOptions: (body) => api.post('/biometric/auth-options', body, { silent: true }),
  authVerify: (body) => api.post('/biometric/auth-verify', body),
};

export const leaveService = {
  list: (config) => api.get('/leaves', config).then((r) => unwrapList(r, 'leaves')),
  create: (payload) => api.post('/leaves/apply', {
    ...payload,
    leaveType: String(payload.leaveType || '').replace(/^\w/, (letter) => letter.toUpperCase()),
  }),
  updateStatus: (id, status) => api.patch(`/leaves/${id}/status`, { status }),
};

export const payrollService = {
  list: (config) => api.get('/payroll', config).then((r) => unwrapList(r, 'payrolls', 'payroll')),
};

export const notificationService = {
  list: (config) => api.get('/notifications', { silent: true, ...config }).then((r) => unwrapList(r, 'notifications')),
  markRead: (id) => api.patch(`/notifications/${id}/read`, {}, { silent: true }),
  markAllRead: () => api.patch('/notifications/read-all', {}, { silent: true }),
};

export { unwrapObject };
