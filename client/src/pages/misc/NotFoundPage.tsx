import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button.js';
import { AlertCircle, Home } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-slate-50 dark:bg-slate-950">
      <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8" />
      </div>

      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
        404 — Page Not Found
      </h1>
      <p className="mt-2 text-sm text-slate-500 max-w-sm">
        The page or project resource you are looking for does not exist or has been moved.
      </p>

      <div className="mt-6">
        <Link to="/dashboard">
          <Button icon={<Home className="w-4 h-4" />}>Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}

export function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-slate-50 dark:bg-slate-950">
      <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8" />
      </div>

      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
        Access Denied
      </h1>
      <p className="mt-2 text-sm text-slate-500 max-w-sm">
        You do not have the required permissions to view or modify this workspace resource.
      </p>

      <div className="mt-6">
        <Link to="/dashboard">
          <Button icon={<Home className="w-4 h-4" />}>Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
