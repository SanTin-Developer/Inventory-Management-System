import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, setUser } = useAuth();

  // --- 2FA challenge state ---
  const [awaiting2fa, setAwaiting2fa] = useState(false);
  const [pendingUserId, setPendingUserId] = useState(null);
  const [code, setCode] = useState("");
  const [twoFaSuccess, setTwoFaSuccess] = useState(false);

  // --- Contact admin modal state ---
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactInfo, setContactInfo] = useState(null);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState("");

  // Keys as stored in the `settings` table — adjust to match your seed data
  const SETTING_KEYS = {
    email: "contact_email",
    phone: "contact_phone",
    telegram: "contact_telegram",
  };

  const openContactModal = async () => {
    setShowContactModal(true);

    // Avoid refetching if we already have the data
    if (contactInfo || contactLoading) return;

    setContactLoading(true);
    setContactError("");

    try {
      const [emailRes, phoneRes, telegramRes] = await Promise.all([
        api.get(`/settings/${SETTING_KEYS.email}`),
        api.get(`/settings/${SETTING_KEYS.phone}`),
        api.get(`/settings/${SETTING_KEYS.telegram}`),
      ]);

      // Only accept plain strings/numbers — anything else (missing key,
      // empty object, null) becomes "" so it never hits JSX as an object
      const extractValue = (res) => {
        const v = res?.data?.value;
        return typeof v === "string" || typeof v === "number" ? String(v) : "";
      };

      setContactInfo({
        email: extractValue(emailRes),
        phone: extractValue(phoneRes),
        telegram: extractValue(telegramRes),
      });
    } catch (err) {
      setContactError("Couldn't load contact details. Please try again.");
    } finally {
      setContactLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      if (err?.requires_2fa) {
        setPendingUserId(err.user_id);
        setAwaiting2fa(true);
      } else {
        setError(err.message || "Invalid email or password");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2fa = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/2fa/verify", {
        user_id: pendingUserId,
        code: code.trim(),
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setUser(res.data.user);

      setTwoFaSuccess(true);
      setTimeout(() => navigate("/dashboard"), 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid code. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#F9FAFB]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .font-display { font-family: 'Space Grotesk', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
        .font-mono { font-family: 'IBM Plex Mono', monospace; }

        @keyframes scanSweep {
          0%   { transform: translateY(-10%); opacity: 0; }
          8%   { opacity: 0.55; }
          50%  { opacity: 0.55; }
          92%  { opacity: 0; }
          100% { transform: translateY(110%); opacity: 0; }
        }
        @keyframes livePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.25; }
        }
        @keyframes modalIn {
          0% { opacity: 0; transform: scale(0.96) translateY(6px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .scan-line { animation: scanSweep 5.5s ease-in-out infinite; }
        .live-dot { animation: livePulse 1.8s ease-in-out infinite; }
        .modal-in { animation: modalIn 0.18s ease-out; }
        @media (prefers-reduced-motion: reduce) {
          .scan-line, .live-dot, .modal-in { animation: none; }
        }
      `}</style>

      {/* Left — form panel */}
      <div className="w-full lg:w-[440px] xl:w-[480px] flex flex-col justify-center px-8 sm:px-12 py-12 shrink-0">
        <div className="w-full max-w-sm mx-auto">
          {/* Brand mark */}
          <div className="flex items-center gap-2.5 mb-10">
            <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
              <rect width="34" height="34" rx="9" fill="#2F5FEA" />
              <path
                d="M17 8L24.5 12.2V21.8L17 26L9.5 21.8V12.2L17 8Z"
                stroke="white"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path
                d="M9.5 12.2L17 16.3M17 16.3L24.5 12.2M17 16.3V26"
                stroke="white"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
            <div>
              <div className="font-display font-semibold text-[19px] leading-none text-[#10151F]">
                SMART INVENTORY
              </div>
              <div className="font-mono text-[10px] tracking-[0.14em] text-[#8B92A3] mt-1 uppercase">
                Inventory OS
              </div>
            </div>
          </div>

          {awaiting2fa ? (
            twoFaSuccess ? (
              <>
                <div className="mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#DCFCE7] flex items-center justify-center shrink-0">
                    <svg
                      width="18"
                      height="18"
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
                      Verified
                    </h1>
                    <p className="font-body text-[13px] text-[#6B7280]">
                      Taking you to your dashboard…
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h1 className="font-display font-semibold text-[26px] text-[#10151F] mb-2">
                  Enter your 2FA code
                </h1>
                <p className="font-body text-[14px] text-[#6B7280] mb-8">
                  Open your authenticator app and enter the current 6-digit
                  code, or use one of your recovery codes.
                </p>

                {error && (
                  <div className="mb-5 font-body text-[13px] text-[#B42318] bg-[#FEF3F2] border border-[#FDA29B] rounded-lg px-3.5 py-2.5">
                    {error}
                  </div>
                )}

                <form onSubmit={handleVerify2fa} className="space-y-5">
                  <div>
                    <label
                      htmlFor="code"
                      className="block font-body font-medium text-[13px] text-[#374151] mb-1.5"
                    >
                      Verification code
                    </label>
                    <input
                      id="code"
                      type="text"
                      inputMode="numeric"
                      autoFocus
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="000000"
                      className="font-mono w-full px-3.5 py-2.5 bg-[#F3F4F6] border border-transparent rounded-lg text-[16px] tracking-[0.3em] text-center text-[#10151F] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2F5FEA] focus:bg-white transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#2F5FEA] text-white font-body font-medium text-[14px] py-2.5 rounded-lg hover:bg-[#1E3FA6] transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Verifying…" : "Verify & continue"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAwaiting2fa(false);
                      setCode("");
                      setError("");
                    }}
                    className="w-full font-body text-[13px] text-[#6B7280] hover:text-[#374151]"
                  >
                    ← Back to sign in
                  </button>
                </form>
              </>
            )
          ) : (
            <>
              <h1 className="font-display font-semibold text-[26px] text-[#10151F] mb-2">
                Welcome back
              </h1>
              <p className="font-body text-[14px] text-[#6B7280] mb-8">
                Sign in to manage stock, orders, and shipments in one place.
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
                    Email or phone number
                  </label>
                  <input
                    id="email"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="username"
                    placeholder="you@company.com"
                    className="font-body w-full px-3.5 py-2.5 bg-[#F3F4F6] border border-transparent rounded-lg text-[14px] text-[#10151F] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2F5FEA] focus:bg-white transition"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="password"
                      className="block font-body font-medium text-[13px] text-[#374151]"
                    >
                      Password
                    </label>
                    <a
                      href="/forgot-password"
                      className="font-body text-[13px] font-medium text-[#2F5FEA] hover:text-[#1E3FA6]"
                    >
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      className="font-body w-full px-3.5 py-2.5 pr-10 bg-[#F3F4F6] border border-transparent rounded-lg text-[14px] text-[#10151F] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2F5FEA] focus:bg-white transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
                    >
                      {showPassword ? (
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        >
                          <path
                            d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.3 5.3A9.9 9.9 0 0112 5c5 0 9 4.5 10 7-.4 1-1.1 2.1-2 3.1M6.2 6.5C4.4 7.7 3 9.5 2 12c1 2.5 5 7 10 7 1.3 0 2.6-.3 3.7-.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : (
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        >
                          <path
                            d="M2 12c1-2.5 5-7 10-7s9 4.5 10 7c-1 2.5-5 7-10 7s-9-4.5-10-7z"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <circle
                            cx="12"
                            cy="12"
                            r="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={remember}
                    onClick={() => setRemember((r) => !r)}
                    className={`relative w-9 h-5 rounded-full transition-colors ${
                      remember ? "bg-[#2F5FEA]" : "bg-[#D1D5DB]"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        remember ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <span className="font-body text-[13px] text-[#374151]">
                    Remember me
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#2F5FEA] text-white font-body font-medium text-[14px] py-2.5 rounded-lg hover:bg-[#1E3FA6] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Signing in…" : "Sign in"}
                </button>
              </form>

              <p className="mt-8 text-center font-body text-[13px] text-[#6B7280]">
                Don't have access?{" "}
                <button
                  type="button"
                  onClick={openContactModal}
                  className="font-medium text-[#2F5FEA] transition-colors hover:text-[#1E3FA6]"
                >
                  Contact your administrator
                </button>
              </p>
            </>
          )}
        </div>
      </div>

      {/* Right — warehouse image panel */}
      <div className="hidden lg:block relative flex-1 overflow-hidden rounded-l-[32px] m-3">
        <img
          src="https://res.cloudinary.com/drercy9vt/image/upload/v1784103663/Retail-storage_dua5ed.webp"
          alt="DigiLife warehouse floor"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#10151F]/80 via-[#10151F]/35 to-[#10151F]/85" />
        <div className="absolute inset-0 bg-[#1E3FA6]/25" />

        <div className="absolute inset-x-0 top-0 h-24 pointer-events-none overflow-hidden">
          <div className="scan-line h-px w-full bg-gradient-to-r from-transparent via-[#F4972B] to-transparent shadow-[0_0_18px_2px_rgba(244,151,43,0.7)]" />
        </div>

        <div className="absolute top-8 right-8 text-right">
          <div className="font-display font-semibold text-[22px] text-white/90">
            SMART INVENTORY OS
          </div>
          <div className="font-mono text-[10px] tracking-[0.14em] text-white/50 uppercase mt-0.5">
            Smart Inventory Solutions
          </div>
        </div>

        <div className="absolute bottom-0 inset-x-0 p-10">
          <h2 className="font-display font-semibold text-[34px] leading-[1.15] text-white max-w-md mb-3">
            Know what's on every shelf, every second.
          </h2>
          <p className="font-body text-[14px] text-white/70 max-w-sm mb-7">
            Real-time counts across every warehouse, synced the moment stock
            moves.
          </p>

          <div className="flex items-center gap-2 font-mono text-[12px] text-white/80 border-t border-white/15 pt-5">
            <span className="live-dot w-1.5 h-1.5 rounded-full bg-[#4ADE80] inline-block" />
            <span>LIVE</span>
            <span className="text-white/30 mx-1">·</span>
            <span>12,480 SKUs tracked</span>
            <span className="text-white/30 mx-1">·</span>
            <span>24 sites</span>
            <span className="text-white/30 mx-1">·</span>
            <span>99.9% sync uptime</span>
            <span className="text-white/30 mx-1">·</span>
            <span>Engineered, Designed & Developed with Care by SanTin ❤️</span>
          </div>
        </div>
      </div>

      {/* Contact administrator modal */}
      {showContactModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#10151F]/50 backdrop-blur-sm px-4"
          onClick={() => setShowContactModal(false)}
        >
          <div
            className="modal-in w-full max-w-sm bg-white rounded-2xl shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-1">
              <h3 className="font-display font-semibold text-[19px] text-[#10151F]">
                Contact your administrator
              </h3>
              <button
                type="button"
                onClick={() => setShowContactModal(false)}
                aria-label="Close"
                className="text-[#9CA3AF] hover:text-[#374151] -mr-1 -mt-1 p-1"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            <p className="font-body text-[13px] text-[#6B7280] mb-5">
              Reach out through any of the channels below to request access.
            </p>

            {contactLoading && (
              <div className="py-6 text-center font-body text-[13px] text-[#6B7280]">
                Loading contact details…
              </div>
            )}

            {!contactLoading && contactError && (
              <div className="space-y-3">
                <div className="font-body text-[13px] text-[#B42318] bg-[#FEF3F2] border border-[#FDA29B] rounded-lg px-3.5 py-2.5">
                  {contactError}
                </div>
                <button
                  type="button"
                  onClick={openContactModal}
                  className="w-full font-body font-medium text-[13px] text-[#2F5FEA] hover:text-[#1E3FA6]"
                >
                  Try again
                </button>
              </div>
            )}

            {!contactLoading && !contactError && contactInfo && (
              <div className="space-y-3">
                {/* Email */}
                <a
                  href={
                    contactInfo.email
                      ? `mailto:${contactInfo.email}`
                      : undefined
                  }
                  className="flex items-center gap-3 rounded-lg border border-[#E5E7EB] px-3.5 py-3 hover:bg-[#F3F4F6] transition"
                >
                  <div className="w-9 h-9 rounded-full bg-[#EEF2FF] flex items-center justify-center shrink-0">
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#2F5FEA"
                      strokeWidth="1.8"
                    >
                      <rect
                        x="3"
                        y="5"
                        width="18"
                        height="14"
                        rx="2"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M3.5 6.5L12 13l8.5-6.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="font-body font-medium text-[13px] text-[#10151F]">
                      Email
                    </div>
                    <div className="font-body text-[13px] text-[#6B7280] truncate">
                      {contactInfo.email || "Not set"}
                    </div>
                  </div>
                </a>

                {/* Phone */}
                <a
                  href={
                    contactInfo.phone
                      ? `tel:${String(contactInfo.phone).replace(/\s+/g, "")}`
                      : undefined
                  }
                  className="flex items-center gap-3 rounded-lg border border-[#E5E7EB] px-3.5 py-3 hover:bg-[#F3F4F6] transition"
                >
                  <div className="w-9 h-9 rounded-full bg-[#ECFDF5] flex items-center justify-center shrink-0">
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#16A34A"
                      strokeWidth="1.8"
                    >
                      <path
                        d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.5.6.6 0 1 .5 1 1V20c0 .6-.5 1-1 1C10.6 21 3 13.4 3 4c0-.6.5-1 1-1h3.4c.6 0 1 .5 1 1 0 1.2.2 2.4.6 3.5.1.4 0 .8-.2 1L6.6 10.8z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="font-body font-medium text-[13px] text-[#10151F]">
                      Phone
                    </div>
                    <div className="font-body text-[13px] text-[#6B7280] truncate">
                      {contactInfo.phone || "Not set"}
                    </div>
                  </div>
                </a>

                {/* Telegram */}
                <a
                  href={contactInfo.telegram || undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg border border-[#E5E7EB] px-3.5 py-3 hover:bg-[#F3F4F6] transition"
                >
                  <div className="w-9 h-9 rounded-full bg-[#EFF8FF] flex items-center justify-center shrink-0">
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="#229ED9"
                    >
                      <path d="M21.5 4.5L18.6 19.3c-.2 1-1 1.3-1.9.8l-4.9-3.6-2.4 2.3c-.3.3-.5.4-.9.4l.3-4.6 8.4-7.6c.4-.3-.1-.5-.5-.2L6.4 12.4 1.9 11c-1-.3-1-1 .2-1.5l18.2-7c.8-.3 1.5.2 1.2 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="font-body font-medium text-[13px] text-[#10151F]">
                      Telegram
                    </div>
                    <div className="font-body text-[13px] text-[#6B7280] truncate">
                      {contactInfo.telegram || "Not set"}
                    </div>
                  </div>
                </a>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowContactModal(false)}
              className="mt-5 w-full font-body font-medium text-[14px] text-[#374151] bg-[#F3F4F6] hover:bg-[#E5E7EB] py-2.5 rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
