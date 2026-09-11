import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-600 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <Outlet />
      </div>
    </div>
  );
}
