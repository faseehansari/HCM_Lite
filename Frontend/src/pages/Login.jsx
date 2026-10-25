import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/api';
import { Button, Field, FormError } from '../components/ui';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email address';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await login(form.email.trim(), form.password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err, 'Invalid email or password.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden flex-1 flex-col justify-between bg-gradient-to-br from-brand-700 via-brand-600 to-indigo-900 p-12 text-white lg:flex">
        <div className="flex items-center gap-2 text-xl font-bold"><Building2 /> HCM Portal</div>
        <div>
          <h2 className="max-w-md text-4xl font-bold leading-tight">People, time and payroll — in one place.</h2>
          <p className="mt-4 max-w-md text-brand-100">Manage your workforce, track attendance with biometric check-in, and keep leave and payroll transparent.</p>
        </div>
        <p className="text-sm text-brand-100/80">© {new Date().getFullYear()} Human Capital Management</p>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <form onSubmit={onSubmit} noValidate className="card w-full max-w-md space-y-5 p-8">
          <div>
            <div className="mb-4 flex items-center gap-2 text-brand-600 lg:hidden"><Building2 /> <span className="font-bold">HCM Portal</span></div>
            <h1 className="text-2xl font-bold">Welcome back</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Sign in to your account to continue.</p>
          </div>

          <FormError message={serverError} />

          <Field label="Email" htmlFor="email" error={errors.email}>
            <input id="email" name="email" type="email" autoComplete="username" value={form.email} onChange={onChange}
              className={`input ${errors.email ? 'input-error' : ''}`} placeholder="you@company.com" disabled={loading} />
          </Field>

          <Field label="Password" htmlFor="password" error={errors.password}>
            <div className="relative">
              <input id="password" name="password" type={show ? 'text' : 'password'} autoComplete="current-password" value={form.password}
                onChange={onChange} className={`input pr-10 ${errors.password ? 'input-error' : ''}`} placeholder="••••••••" disabled={loading} />
              <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600" aria-label={show ? 'Hide password' : 'Show password'}>
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>

          <Button type="submit" loading={loading} icon={LogIn} className="w-full">{loading ? 'Signing in…' : 'Sign in'}</Button>
        </form>
      </div>
    </div>
  );
}
