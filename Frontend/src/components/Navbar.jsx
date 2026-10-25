import { LogOut, Menu, Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import NotificationBell from './NotificationBell';
import { empName } from '../utils/format';

export default function Navbar({ onMenu }) {
  const { user, role, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const name = empName(user);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 sm:px-6">
      <button onClick={onMenu} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden" aria-label="Open menu">
        <Menu size={20} />
      </button>
      <div className="hidden lg:block" />
      <div className="flex items-center gap-1 sm:gap-2">
        <button onClick={toggle} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" aria-label="Toggle theme">
          {dark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <NotificationBell />
        <div className="ml-2 hidden items-center gap-3 border-l border-slate-200 pl-4 dark:border-slate-700 sm:flex">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold uppercase text-white">
            {name.charAt(0) || 'U'}
          </div>
          <div className="leading-tight">
            <p className="max-w-[10rem] truncate text-sm font-medium">{name}</p>
            <p className="text-xs uppercase tracking-wide text-slate-500">{role}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="ml-1 rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" aria-label="Log out" title="Log out">
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
