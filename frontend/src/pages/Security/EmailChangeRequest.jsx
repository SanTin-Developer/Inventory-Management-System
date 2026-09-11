import { useEffect, useRef, useState } from "react";
import {
  X,
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { usersApi } from "../../services/service";

const inputClass =
  "font-body w-full px-3.5 py-2.5 bg-[#F3F4F6] border border-transparent rounded-lg text-[14px] text-[#10151F] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2F5FEA] focus:bg-white transition";
const inputErrorClass =
  "ring-2 ring-[#FDA29B] bg-[#FEF3F2] focus:ring-[#EF4444]";
const labelClass =
  "block font-body font-medium text-[13px] text-[#374151] mb-1.5";
const errorClass =
  "mt-1.5 font-body text-[12px] text-[#EF4444] flex items-center gap-1";

export default function EmailChangeModal({ open, onClose, currentEmail }) {
  const [password, setPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const firstFieldRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    firstFieldRef.current?.focus();
    const onKeyDown = (e) => {
      if (e.key === "Escape") resetAndClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const resetAndClose = () => {
    setPassword("");
    setNewEmail("");
    setCode("");
    setShowPassword(false);
    setErrors({});
    setError(null);
    setStatus(null);
    onClose();
  };

  const clearFieldError = (field) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setError(null);
    setStatus(null);
    setLoading(true);
    try {
      const res = await usersApi.requestEmailChange({
        password,
        new_email: newEmail,
        two_factor_code: code,
      });
      setStatus(
        res?.data?.status ??
          "Check your new email address to confirm the change.",
      );
      setPassword("");
      setNewEmail("");
      setCode("");
    } catch (err) {
      if (err?.response?.status === 422) {
        setErrors(err.response.data.errors ?? {});
      } else {
        setError(
          err?.response?.data?.message ?? "Something went wrong. Try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={resetAndClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-change-title"
        className="w-full max-w-[440px] rounded-xl bg-white border border-[#E5E7EB] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#F0F1F3] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EFF3FE] text-[#2F5FEA] shrink-0">
              <Mail size={15} aria-hidden="true" />
            </div>
            <div>
              <h2
                id="email-change-title"
                className="font-display font-semibold text-[15px] text-[#10151F]"
              >
                Change email address
              </h2>
              <p className="font-body text-[12px] text-[#6B7280] mt-0.5">
                Current: {currentEmail}
              </p>
            </div>
          </div>
          <button
            onClick={resetAndClose}
            aria-label="Close"
            className="text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F3F4F6] rounded-md p-1 transition"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {status ? (
          <div className="px-5 py-6">
            <div className="rounded-lg bg-[#EFFBF3] border border-[#A6F0C6] px-3 py-3 font-body text-[13px] text-[#15803D] flex items-start gap-2">
              <ShieldCheck
                size={16}
                className="mt-0.5 shrink-0"
                aria-hidden="true"
              />
              <span>{status}</span>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={resetAndClose}
                className="font-body text-[13px] font-medium text-white bg-[#2F5FEA] rounded-lg px-4 py-2.5 hover:bg-[#1E3FA6] active:bg-[#173585] transition"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="px-5 py-4">
            {error && (
              <div
                role="alert"
                className="mb-3 rounded-lg bg-[#FEF3F2] border border-[#FDA29B] px-3 py-2.5 font-body text-[13px] text-[#B42318] flex items-start gap-2"
              >
                <AlertCircle
                  size={15}
                  className="mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                <span>{error}</span>
              </div>
            )}

            <div className="mb-3.5">
              <label htmlFor="ec-password" className={labelClass}>
                Current password
              </label>
              <div className="relative">
                <Lock
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
                  aria-hidden="true"
                />
                <input
                  id="ec-password"
                  ref={firstFieldRef}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearFieldError("password");
                  }}
                  autoComplete="current-password"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={
                    errors.password ? "ec-password-error" : undefined
                  }
                  className={`${inputClass} pl-9 pr-10 ${errors.password ? inputErrorClass : ""}`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#374151]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff size={15} aria-hidden="true" />
                  ) : (
                    <Eye size={15} aria-hidden="true" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p id="ec-password-error" className={errorClass}>
                  {errors.password[0]}
                </p>
              )}
            </div>

            <div className="mb-3.5">
              <label htmlFor="ec-new-email" className={labelClass}>
                New email address
              </label>
              <div className="relative">
                <Mail
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
                  aria-hidden="true"
                />
                <input
                  id="ec-new-email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => {
                    setNewEmail(e.target.value);
                    clearFieldError("new_email");
                  }}
                  autoComplete="email"
                  placeholder="name@company.com"
                  aria-invalid={Boolean(errors.new_email)}
                  aria-describedby={
                    errors.new_email ? "ec-new-email-error" : undefined
                  }
                  className={`${inputClass} pl-9 ${errors.new_email ? inputErrorClass : ""}`}
                  required
                />
              </div>
              {errors.new_email && (
                <p id="ec-new-email-error" className={errorClass}>
                  {errors.new_email[0]}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="ec-code" className={labelClass}>
                2FA code (from your authenticator app)
              </label>
              <div className="relative">
                <ShieldCheck
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
                  aria-hidden="true"
                />
                <input
                  id="ec-code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    clearFieldError("two_factor_code");
                  }}
                  autoComplete="one-time-code"
                  placeholder="000000"
                  aria-invalid={Boolean(errors.two_factor_code)}
                  aria-describedby={
                    errors.two_factor_code ? "ec-code-error" : undefined
                  }
                  className={`${inputClass} pl-9 tracking-[0.3em] placeholder:tracking-normal ${errors.two_factor_code ? inputErrorClass : ""}`}
                  required
                />
              </div>
              {errors.two_factor_code && (
                <p id="ec-code-error" className={errorClass}>
                  {errors.two_factor_code[0]}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2.5 mt-5">
              <button
                type="button"
                onClick={resetAndClose}
                className="font-body text-[13px] font-medium text-[#374151] bg-white border border-[#E5E7EB] rounded-lg px-4 py-2.5 hover:bg-[#F3F4F6] transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="font-body text-[13px] font-medium text-white bg-[#2F5FEA] rounded-lg px-4 py-2.5 hover:bg-[#1E3FA6] active:bg-[#173585] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {loading && (
                  <Loader2
                    size={14}
                    className="animate-spin"
                    aria-hidden="true"
                  />
                )}
                {loading ? "Sending..." : "Request change"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
