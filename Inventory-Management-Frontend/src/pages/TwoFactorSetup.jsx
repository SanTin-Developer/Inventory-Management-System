import { useState, useEffect, useRef } from "react";
import api from "../services/api";
import QRCode from "qrcode";
import { useAuth } from "../contexts/AuthContext";

export default function TwoFactorSetup() {
  const { user, setUser } = useAuth();
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [secret, setSecret] = useState(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [showDisable, setShowDisable] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState(null);
  const canvasRef = useRef(null);

  const startSetup = () => {
    setLoading(true);
    setError("");
    api
      .post("/2fa/setup")
      .then((res) => {
        setQrCodeUrl(res.data.qr_code_url);
        setSecret(res.data.secret);
      })
      .catch((err) =>
        setError(
          err.response?.data?.message ?? "Couldn't start 2FA setup. Try again.",
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (qrCodeUrl && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, qrCodeUrl, { width: 200 });
    }
  }, [qrCodeUrl]);

  const confirmSetup = () => {
    if (code.trim().length !== 6) {
      setError("Enter the 6-digit code from your authenticator app.");
      return;
    }
    setLoading(true);
    setError("");
    api
      .post("/2fa/confirm", { code: code.trim() })
      .then((res) => {
        setRecoveryCodes(res.data.recovery_codes);
      })
      .catch((err) => {
        setError(err.response?.data?.message ?? "Invalid code.");
      })
      .finally(() => setLoading(false));
  };

  const disable2FA = () => {
    if (!password) {
      setError("Enter your password to disable 2FA.");
      return;
    }
    setDisabling(true);
    setError("");
    api
      .post("/2fa/disable", { password })
      .then(() => {
        setUser({ ...user, two_factor_enabled: false });
        setShowDisable(false);
        setPassword("");
      })
      .catch((err) => {
        setError(err.response?.data?.message ?? "Couldn't disable 2FA.");
      })
      .finally(() => setDisabling(false));
  };

  if (recoveryCodes) {
    return (
      <div className="max-w-md">
        <h2 className="font-display font-semibold text-[16px] mb-2">
          2FA is enabled 🎉
        </h2>
        <p className="text-[13px] text-[#6B7280] mb-3">
          Save these recovery codes somewhere safe. Each one can be used once if
          you lose access to your authenticator app. They won't be shown again.
        </p>
        <div className="grid grid-cols-2 gap-2 font-mono text-[13px] bg-[#F3F4F6] rounded-lg p-4">
          {recoveryCodes.map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
      </div>
    );
  }

  if (user?.two_factor_enabled && !qrCodeUrl) {
    return (
      <div className="max-w-md">
        <h2 className="font-display font-semibold text-[16px] mb-2">
          Two-factor authentication is enabled ✓
        </h2>
        <p className="text-[13px] text-[#6B7280] mb-4">
          Your account is protected with an authenticator app.
        </p>
        {showDisable ? (
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="font-body text-[13px] border border-[#E5E7EB] rounded-lg px-3 py-2 mb-2 w-full"
            />
            <div className="flex gap-2">
              <button
                onClick={disable2FA}
                disabled={disabling}
                className="font-body text-[13px] font-medium text-white bg-[#EF4444] rounded-lg px-4 py-2 hover:bg-[#DC2626] transition disabled:opacity-60"
              >
                {disabling ? "Disabling…" : "Confirm disable"}
              </button>
              <button
                onClick={() => {
                  setShowDisable(false);
                  setPassword("");
                  setError("");
                }}
                className="font-body text-[13px] font-medium text-[#6B7280] bg-[#F3F4F6] rounded-lg px-4 py-2 hover:bg-[#E5E7EB] transition"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowDisable(true)}
            className="font-body text-[13px] font-medium text-[#EF4444] border border-[#EF4444] rounded-lg px-4 py-2 hover:bg-[#FEF2F2] transition"
          >
            Disable 2FA
          </button>
        )}
        {error && <p className="text-[13px] text-[#EF4444] mt-2">{error}</p>}
      </div>
    );
  }

  if (!qrCodeUrl) {
    return (
      <div className="max-w-md">
        <h2 className="font-display font-semibold text-[16px] mb-2">
          Two-factor authentication
        </h2>
        <p className="text-[13px] text-[#6B7280] mb-4">
          Add an extra layer of security using an authenticator app like Google
          Authenticator or Authy.
        </p>
        <button
          onClick={startSetup}
          disabled={loading}
          className="font-body text-[13px] font-medium text-white bg-[#2F5FEA] rounded-lg px-4 py-2 hover:bg-[#1E3FA6] transition disabled:opacity-60"
        >
          {loading ? "Starting…" : "Enable 2FA"}
        </button>
        {error && <p className="text-[13px] text-[#EF4444] mt-2">{error}</p>}
      </div>
    );
  }

  return (
    <div className="max-w-md">
      <h2 className="font-display font-semibold text-[16px] mb-2">
        Scan this QR code
      </h2>
      <p className="text-[13px] text-[#6B7280] mb-4">
        Scan with Google Authenticator, Authy, or any TOTP app. Then enter the
        6-digit code it shows.
      </p>
      <canvas ref={canvasRef} className="mb-3" />
      <p className="text-[11px] text-[#9CA3AF] font-mono mb-4 break-all">
        Manual entry key: {secret}
      </p>
      <input
        type="text"
        inputMode="numeric"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
        placeholder="000000"
        className="font-mono text-[16px] tracking-widest w-32 text-center border border-[#E5E7EB] rounded-lg px-3 py-2 mb-3"
      />
      <div>
        <button
          onClick={confirmSetup}
          disabled={loading}
          className="font-body text-[13px] font-medium text-white bg-[#2F5FEA] rounded-lg px-4 py-2 hover:bg-[#1E3FA6] transition disabled:opacity-60"
        >
          {loading ? "Confirming…" : "Confirm & enable"}
        </button>
      </div>
      {error && <p className="text-[13px] text-[#EF4444] mt-2">{error}</p>}
    </div>
  );
}
