import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import AuthPageLayout from "../../layouts/AuthPageLayout";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/forgot-password", { email });
      // Always show the same success message whether or not the email
      // exists in the system — don't reveal which emails are registered.
      setSent(true);
    } catch (err) {
      setError(
        err.response?.data?.message || "Something went wrong. Try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageLayout>
      {sent ? (
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
                Check your email
              </h1>
              <p className="font-body text-[13px] text-[#6B7280]">
                We've sent you a secure reset link.
              </p>
            </div>
          </div>

          <p className="font-body text-[14px] text-[#6B7280] leading-relaxed mb-8">
            If an account exists for <strong>{email}</strong>, a link to reset
            your password is on its way. It expires in 60 minutes.
          </p>

          <Link
            to="/login"
            className="block text-center font-body text-[13px] font-medium text-[#2F5FEA] hover:text-[#1E3FA6]"
          >
            ← Back to sign in
          </Link>
        </>
      ) : (
        // --- request form ---
        <>
          <h1 className="font-display font-semibold text-[26px] text-[#10151F] mb-2">
            Forgot your password?
          </h1>
          <p className="font-body text-[14px] text-[#6B7280] mb-8">
            Enter your email and we'll send you a link to reset it.
          </p>

          {error && (
            <div className="mb-5 font-body text-[13px] text-[#B42318] bg-[#FEF3F2] border border-[#FDA29B] rounded-lg px-3.5 py-2.5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block font-body font-medium text-[13px] text-[#374151] mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="you@company.com"
                className="font-body w-full px-3.5 py-2.5 bg-[#F3F4F6] border border-transparent rounded-lg text-[14px] text-[#10151F] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2F5FEA] focus:bg-white transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2F5FEA] text-white font-body font-medium text-[14px] py-2.5 rounded-lg hover:bg-[#1E3FA6] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending…" : "Send reset link"}
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