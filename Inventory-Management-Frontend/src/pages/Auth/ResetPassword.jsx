import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../../services/api";
import AuthPageLayout from "../../layouts/AuthPageLayout";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== passwordConfirmation) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/reset-password", {
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });

      setSuccess(true);
      // Auto-redirect to login after showing the success message —
      // no extra click needed once it's done.
      setTimeout(() => navigate("/login"), 1800);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "This reset link is invalid or has expired.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageLayout>
      {success ? (
        // --- success state ---
        <>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-full bg-[#DCFCE7] flex items-center justify-center shrink-0">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#22C55E"
                strokeWidth="2.4"
              >
                <path
                  d="M5 13l4 4L19 7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <h1 className="font-display font-semibold text-[20px] text-[#10151F]">
                Password updated
              </h1>
              <p className="font-body text-[13px] text-[#6B7280]">
                Taking you to the sign-in page…
              </p>
            </div>
          </div>
        </>
      ) : !token || !email ? (
        // --- missing/invalid link params ---
        <>
          <h1 className="font-display font-semibold text-[26px] text-[#10151F] mb-2">
            Invalid reset link
          </h1>
          <p className="font-body text-[14px] text-[#6B7280] mb-8">
            This link is missing required information. Request a new one from
            the forgot password page.
          </p>
          <Link
            to="/forgot-password"
            className="block text-center font-body text-[13px] font-medium text-[#2F5FEA] hover:text-[#1E3FA6]"
          >
            Request a new link
          </Link>
        </>
      ) : (
        // --- new password form ---
        <>
          <h1 className="font-display font-semibold text-[26px] text-[#10151F] mb-2">
            Set a new password
          </h1>
          <p className="font-body text-[14px] text-[#6B7280] mb-8">
            Choose a new password for <strong>{email}</strong>.
          </p>

          {error && (
            <div className="mb-5 font-body text-[13px] text-[#B42318] bg-[#FEF3F2] border border-[#FDA29B] rounded-lg px-3.5 py-2.5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="password"
                className="block font-body font-medium text-[13px] text-[#374151] mb-1.5"
              >
                New password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoFocus
                placeholder="At least 8 characters"
                className="font-body w-full px-3.5 py-2.5 bg-[#F3F4F6] border border-transparent rounded-lg text-[14px] text-[#10151F] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2F5FEA] focus:bg-white transition"
              />
            </div>

            <div>
              <label
                htmlFor="password_confirmation"
                className="block font-body font-medium text-[13px] text-[#374151] mb-1.5"
              >
                Confirm new password
              </label>
              <input
                id="password_confirmation"
                type="password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                required
                minLength={8}
                placeholder="Re-enter your new password"
                className="font-body w-full px-3.5 py-2.5 bg-[#F3F4F6] border border-transparent rounded-lg text-[14px] text-[#10151F] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2F5FEA] focus:bg-white transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2F5FEA] text-white font-body font-medium text-[14px] py-2.5 rounded-lg hover:bg-[#1E3FA6] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Updating…" : "Update password"}
            </button>
          </form>

          <Link
            to="/login"
            className="mt-6 block text-center font-body text-[13px] font-medium text-[#6B7280] hover:text-[#374151]"
          >
            ← Back to sign in
          </Link>
        </>
      )}
    </AuthPageLayout>
  );
}