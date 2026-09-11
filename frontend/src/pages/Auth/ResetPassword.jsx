import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../services/api";

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
      // the whole point of asking for this was "last it auto ... to
      // set new password", i.e. no extra click needed once it's done.
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
        {success ? (
          // --- success state ---
          <>
            <div className="w-11 h-11 rounded-full bg-[#DCFCE7] flex items-center justify-center mb-4">
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
            <h1 className="font-display font-semibold text-[20px] text-[#10151F] mb-2">
              Password updated
            </h1>
            <p className="font-body text-[13.5px] text-[#6B7280]">
              Taking you to the sign-in page…
            </p>
          </>
        ) : !token || !email ? (
          // --- missing/invalid link params ---
          <>
            <h1 className="font-display font-semibold text-[20px] text-[#10151F] mb-2">
              Invalid reset link
            </h1>
            <p className="font-body text-[13.5px] text-[#6B7280] mb-6">
              This link is missing required information. Request a new one from
              the forgot password page.
            </p>
            <a
              href="/forgot-password"
              className="block text-center font-body text-[13px] font-medium text-[#2F5FEA] hover:text-[#1E3FA6]"
            >
              Request a new link
            </a>
          </>
        ) : (
          // --- new password form ---
          <>
            <h1 className="font-display font-semibold text-[22px] text-[#10151F] mb-2">
              Set a new password
            </h1>
            <p className="font-body text-[13.5px] text-[#6B7280] mb-6">
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
          </>
        )}
      </div>
    </div>
  );
}
