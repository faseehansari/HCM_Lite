import { useCallback, useEffect, useState } from 'react';
import { startAuthentication, startRegistration, browserSupportsWebAuthn } from '@simplewebauthn/browser';
import { Fingerprint, LogIn, LogOut, ScanFace, ShieldCheck } from 'lucide-react';
import { attendanceService, biometricService } from '../services/endpoints';
import { getErrorMessage } from '../services/api';
import { toast } from '../services/toast';
import { useAuth } from '../context/AuthContext';
import { Button, EmptyState, PageHeader, PageLoader, StatusBadge } from '../components/ui';
import { empName, formatDate, formatTime, isToday } from '../utils/format';

// Backends may return options directly or wrapped ({ options } / { data }).
const pickOptions = (res) => res.data?.options || res.data?.data || res.data;

export default function Attendance() {
  const { user, isPrivileged } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(''); // 'in' | 'out' | 'register' | 'bio'
  const [bioError, setBioError] = useState('');
  const supported = browserSupportsWebAuthn();

  const load = useCallback(async () => {
    try {
      setRecords(await attendanceService.list({ silent: true }));
    } catch {
      toast.error('Could not load attendance records.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const run = (key, fn) => async () => {
    setBusy(key);
    setBioError('');
    try {
      await fn();
      await load();
    } catch (err) {
      if (key === 'register' || key === 'bio') {
        const msg = getErrorMessage(err, 'Biometric operation failed.');
        setBioError(msg);
        // Browser-originated errors (cancelled prompt etc.) bypass the Axios toast.
        if (!err.response) toast.error(msg);
      }
    } finally {
      setBusy('');
    }
  };

  const checkIn = run('in', () => attendanceService.checkIn());
  const checkOut = run('out', () => attendanceService.checkOut());

  const registerFingerprint = run('register', async () => {
    const optionsRes = await biometricService.registerOptions();
    const attResp = await startRegistration(pickOptions(optionsRes)); // triggers navigator.credentials.create
    await biometricService.registerVerify(attResp);
    toast.success('Fingerprint registered successfully.');
  });

  const biometricAttendance = run('bio', async () => {
    const optionsRes = await biometricService.authOptions({ email: user?.email });
    const authResp = await startAuthentication(pickOptions(optionsRes)); // triggers navigator.credentials.get
    await biometricService.authVerify(authResp);
    toast.success('Attendance marked via biometric verification.');
  });

  const myToday = records.filter((r) => isToday(r.date || r.checkIn || r.createdAt));
  const todayRecord = myToday[0];

  return (
    <>
      <PageHeader title="Attendance" subtitle={new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <h2 className="font-semibold">Standard attendance</h2>
          <p className="mt-1 text-sm text-slate-500">Manually record your check-in and check-out.</p>
          {todayRecord && (
            <div className="mt-4 flex gap-6 rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800/60">
              <div><p className="text-xs text-slate-500">Check-in</p><p className="font-medium">{formatTime(todayRecord.checkIn)}</p></div>
              <div><p className="text-xs text-slate-500">Check-out</p><p className="font-medium">{formatTime(todayRecord.checkOut)}</p></div>
            </div>
          )}
          <div className="mt-5 flex flex-wrap gap-3">
            <Button variant="success" icon={LogIn} loading={busy === 'in'} disabled={!!busy} onClick={checkIn}>Check in</Button>
            <Button variant="danger" icon={LogOut} loading={busy === 'out'} disabled={!!busy} onClick={checkOut}>Check out</Button>
          </div>
        </section>

        <section className="card p-6">
          <div className="flex items-center gap-2"><Fingerprint className="text-brand-600" size={20} /><h2 className="font-semibold">Biometric attendance</h2></div>
          <p className="mt-1 text-sm text-slate-500">Use your device's fingerprint / Face ID sensor (WebAuthn). Register once, then verify to mark attendance.</p>
          {!supported && (
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
              This browser doesn't support WebAuthn. Use a modern browser over HTTPS (or localhost).
            </p>
          )}
          {bioError && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">{bioError}</p>}
          <div className="mt-5 flex flex-wrap gap-3">
            <Button variant="secondary" icon={ShieldCheck} loading={busy === 'register'} disabled={!supported || !!busy} onClick={registerFingerprint}>Register fingerprint</Button>
            <Button icon={ScanFace} loading={busy === 'bio'} disabled={!supported || !!busy} onClick={biometricAttendance}>Biometric check-in / out</Button>
          </div>
        </section>
      </div>

      <section className="card mt-6 overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800"><h2 className="font-semibold">{isPrivileged ? 'Attendance records' : 'My attendance history'}</h2></div>
        {loading ? <PageLoader /> : records.length === 0 ? <EmptyState title="No attendance records yet" /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  {isPrivileged && <th className="th">Employee</th>}
                  {['Date', 'Check-in', 'Check-out', 'Method', 'Status'].map((h) => <th key={h} className="th">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {records.map((r) => (
                  <tr key={r._id || r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    {isPrivileged && <td className="td">{empName(r.employee || r.user)}</td>}
                    <td className="td">{formatDate(r.date || r.checkIn)}</td>
                    <td className="td">{formatTime(r.checkIn)}</td>
                    <td className="td">{formatTime(r.checkOut)}</td>
                    <td className="td capitalize">{r.method || r.source || (r.biometric ? 'biometric' : 'manual')}</td>
                    <td className="td"><StatusBadge status={r.status || 'present'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
