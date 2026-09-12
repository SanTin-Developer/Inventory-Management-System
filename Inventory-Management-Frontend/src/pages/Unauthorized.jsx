import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

export default function Unauthorized() {
  return (
    <div className="flex h-full flex-col items-center justify-center py-24 text-center">
      <ShieldAlert className="mb-4 text-slate-300" size={40} />
      <h1 className="text-lg font-semibold text-slate-900">
        You don't have access to this page
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        This section is restricted to specific roles. Contact an admin if you
        think this is a mistake.
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
