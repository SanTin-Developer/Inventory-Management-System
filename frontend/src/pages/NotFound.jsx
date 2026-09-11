import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center text-center">
      <p className="text-5xl font-bold text-slate-200">404</p>
      <h1 className="mt-2 text-lg font-semibold text-slate-900">
        Page not found
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        The page you're looking for doesn't exist.
      </p>
      <Link
        to="/"
        className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
