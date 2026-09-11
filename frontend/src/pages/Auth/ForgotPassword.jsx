import { useState } from "react";
import api from "../../services/api";

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
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F9FAFB] px-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .font-display { font-family: 'Space Grotesk', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
      `}</style>

      <div className="w-full max-w-sm bg-white rounded-2xl border border-[#E5E7EB] p-8">
        <img
          src="https://res.cloudinary.com/drercy9vt/image/upload/v1784427568/logoInventory_oifbze.jpg"
          alt="Inventory logo"
          className="w-12 h-12 rounded-lg object-cover mb-5"
        />
        {sent ? (
          // --- success state ---
          <>
            <div className="w-11 h-11 rounded-full bg-[#DCFCE7] flex items-center justify-center mb-4">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#22C55E"
                strokeWidth="2.2"
              >
                <path
                  d="M4 6l8 6 8-6M4 6h16v12H4V6z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h1 className="font-display font-semibold text-[20px] text-[#10151F] mb-2">
              Check your email
            </h1>
            <p className="font-body text-[13.5px] text-[#6B7280] leading-relaxed mb-6">
              If an account exists for <strong>{email}</strong>, we've sent a
              link to reset your password. It expires in 60 minutes.
            </p>
            <a
              href="/login"
              className="block text-center font-body text-[13px] font-medium text-[#2F5FEA] hover:text-[#1E3FA6]"
            >
              ← Back to sign in
            </a>
          </>
        ) : (
          // --- request form ---
          <>
            <h1 className="font-display font-semibold text-[22px] text-[#10151F] mb-2">
              Forgot your password?
            </h1>
            <p className="font-body text-[13.5px] text-[#6B7280] mb-6">
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

            <a
              href="/login"
              className="mt-6 block text-center font-body text-[13px] font-medium text-[#6B7280] hover:text-[#374151]"
            >
              ← Back to sign in
            </a>
          </>
        )}
      </div>
    </div>
  );
}
