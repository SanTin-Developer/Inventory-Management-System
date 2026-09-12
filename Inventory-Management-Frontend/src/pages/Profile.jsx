import { useEffect, useRef, useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Building2,
  BadgeCheck,
  Calendar,
  Wallet,
  Upload,
  Eye,
  EyeOff,
  ShieldCheck,
  UserRound,
  Pencil,
  LifeBuoy,
  Camera,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import { usersApi } from "../services/service";
import TwoFactorSetup from "./TwoFactorSetup";

const ROLE_STYLE = {
  Admin: { color: "#2F5FEA", bg: "#EFF3FE" },
  Manager: { color: "#F4972B", bg: "#FEF6EC" },
  Staff: { color: "#6B7280", bg: "#F3F4F6" },
};

const STATUS_STYLE = {
  Active: { color: "#22C55E", bg: "#EFFBF3" },
  Inactive: { color: "#EF4444", bg: "#FEF3F2" },
  "On Leave": { color: "#F4972B", bg: "#FEF6EC" },
  Terminated: { color: "#6B7280", bg: "#F3F4F6" },
};

// Settings keys that hold the contact-administrator details shown on sign-in
const CONTACT_KEYS = ["contact_email", "contact_phone", "contact_telegram"];

const inputClass =
  "font-body w-full px-3.5 py-2.5 bg-[#F3F4F6] border border-transparent rounded-lg text-[14px] text-[#10151F] focus:outline-none focus:ring-2 focus:ring-[#2F5FEA] focus:bg-white transition";
const labelClass =
  "block font-body font-medium text-[13px] text-[#374151] mb-1.5";
const errorClass = "mb-2 font-body text-[12px] text-[#EF4444]";

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-[#F0F1F3] last:border-0">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F3F4F6] text-[#6B7280]">
        <Icon size={14} />
      </div>
      <div>
        <div className="font-mono text-[10.5px] uppercase tracking-wide text-[#9CA3AF]">
          {label}
        </div>
        <div className="font-body text-[14px] text-[#10151F]">
          {value || "—"}
        </div>
      </div>
    </div>
  );
}

export default function Profile() {
  const auth = useAuth();
  const { user } = auth;
  const setUser = typeof auth.setUser === "function" ? auth.setUser : null;

  // Personal info form
  const [editingInfo, setEditingInfo] = useState(false);
  const [infoForm, setInfoForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    address: user?.address ?? "",
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(user?.image_url ?? null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState(null);
  const avatarInputRef = useRef(null);
  const [infoErrors, setInfoErrors] = useState({});
  const [infoError, setInfoError] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);
  const [savingInfo, setSavingInfo] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwdErrors, setPwdErrors] = useState({});
  const [pwdError, setPwdError] = useState(null);
  const [pwdMessage, setPwdMessage] = useState(null);
  const [savingPwd, setSavingPwd] = useState(false);

  // Step-1 verification state
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [verifyingPwd, setVerifyingPwd] = useState(false);
  const [verifyError, setVerifyError] = useState(null);

  // Contact administrator (company) info — shown on the sign-in page
  const [contactLoading, setContactLoading] = useState(true);
  const [contactForm, setContactForm] = useState({
    email: "",
    phone: "",
    telegram: "",
  });
  const [contactError, setContactError] = useState(null);
  const [contactMessage, setContactMessage] = useState(null);
  const [savingContact, setSavingContact] = useState(false);

  useEffect(() => {
    let active = true;
    // One key returns the whole { email, phone, telegram } object.
    api
      .get(`/settings/${CONTACT_KEYS[0]}`)
      .then((res) => {
        const d = res?.data;
        const pick = (v) =>
          typeof v === "string" || typeof v === "number" ? String(v) : "";
        if (active) {
          setContactForm({
            email: pick(d?.email),
            phone: pick(d?.phone),
            telegram: pick(d?.telegram),
          });
        }
      })
      .catch(() => {
        if (active) setContactError("Couldn't load contact details.");
      })
      .finally(() => {
        if (active) setContactLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!user) return null;

  const roleName = user.role?.role_name ?? "Staff";
  const role = ROLE_STYLE[roleName] ?? ROLE_STYLE.Staff;
  const status = STATUS_STYLE[user.status] ?? STATUS_STYLE.Active;

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAvatarError("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Profile image must be under 5 MB.");
      return;
    }

    setAvatarError(null);
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await api.put(`/users/${user.user_id}`, fd);
      URL.revokeObjectURL(previewUrl);
      const newUrl = res?.data?.image_url ?? previewUrl;
      setImagePreview(newUrl);
      if (setUser) {
        setUser({ ...user, image_url: newUrl });
      }
    } catch (err) {
      URL.revokeObjectURL(previewUrl);
      setImagePreview(user.image_url ?? null);
      setAvatarError(
        err?.response?.data?.message ?? "Failed to update profile photo.",
      );
    } finally {
      setAvatarUploading(false);
    }
  };

  const cancelInfoEdit = () => {
    setInfoForm({
      name: user.name ?? "",
      email: user.email ?? "",
      phone: user.phone ?? "",
      address: user.address ?? "",
    });
    setImage(null);
    setImagePreview(user.image_url ?? null);
    setInfoErrors({});
    setInfoError(null);
    setEditingInfo(false);
  };

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    setInfoErrors({});
    setInfoError(null);
    setInfoMessage(null);
    setSavingInfo(true);
    try {
      let res;
      if (image) {
        const fd = new FormData();
        Object.entries(infoForm).forEach(([key, value]) => {
          if (value !== "" && value !== null && value !== undefined) {
            fd.append(key, value);
          }
        });
        fd.append("image", image);
        res = await usersApi.updateForm(user.user_id, fd);
      } else {
        res = await usersApi.update(user.user_id, infoForm);
      }
      if (setUser) {
        setUser({
          ...user,
          ...infoForm,
          image_url: res?.data?.image_url ?? user.image_url,
        });
      }
      setImage(null);
      setInfoMessage("Profile updated successfully.");
      setEditingInfo(false);
    } catch (err) {
      if (err?.response?.status === 422) {
        setInfoErrors(err.response.data.errors ?? {});
      } else {
        setInfoError(
          err?.response?.data?.message ?? "Failed to update profile.",
        );
      }
    } finally {
      setSavingInfo(false);
    }
  };

  const handleCurrentPasswordChange = (e) => {
    setCurrentPassword(e.target.value);
    // any edit after a successful verify invalidates it — force re-check
    if (passwordVerified) setPasswordVerified(false);
    setVerifyError(null);
  };

  const handleVerifyCurrentPassword = async () => {
    if (!currentPassword) {
      setVerifyError("Enter your current password.");
      return;
    }
    setVerifyError(null);
    setVerifyingPwd(true);
    try {
      // Adjust this call to match your actual backend endpoint.
      // Expected: resolves if correct, throws (e.g. 401/422) if not.
      await usersApi.verifyPassword(user.user_id, {
        current_password: currentPassword,
      });
      setPasswordVerified(true);
    } catch (err) {
      setPasswordVerified(false);
      setVerifyError(
        err?.response?.data?.message ?? "Current password is incorrect.",
      );
    } finally {
      setVerifyingPwd(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdErrors({});
    setPwdError(null);
    setPwdMessage(null);

    if (!passwordVerified) {
      setPwdError("Please verify your current password first.");
      return;
    }
    if (!password || password.length < 8) {
      setPwdError("New password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setPwdError("Passwords do not match.");
      return;
    }

    setSavingPwd(true);
    try {
      await usersApi.update(user.user_id, {
        current_password: currentPassword,
        password,
      });
      setPwdMessage("Password updated successfully.");
      setCurrentPassword("");
      setPassword("");
      setConfirmPassword("");
      setPasswordVerified(false);
    } catch (err) {
      if (err?.response?.status === 422) {
        setPwdErrors(err.response.data.errors ?? {});
      } else {
        setPwdError(
          err?.response?.data?.message ?? "Failed to update password.",
        );
      }
    } finally {
      setSavingPwd(false);
    }
  };

  const handleSaveContact = async (e) => {
    e.preventDefault();
    setContactError(null);
    setContactMessage(null);
    if (!contactForm.email.trim()) {
      setContactError("Email is required.");
      return;
    }
    setSavingContact(true);
    try {
      const body = {
        email: contactForm.email.trim(),
        phone: contactForm.phone.trim(),
        telegram: contactForm.telegram.trim(),
      };
      await Promise.all(
        CONTACT_KEYS.map((key) =>
          api.put(`/settings/${key}`, body, {
            headers: { "Content-Type": "application/json" },
          }),
        ),
      );
      setContactMessage(
        "Saved — these details are shown under “Contact your administrator” on the sign-in page.",
      );
    } catch (err) {
      setContactError(
        err?.response?.data?.message ?? "Failed to save contact details.",
      );
    } finally {
      setSavingContact(false);
    }
  };

  return (
    <div className="bg-[#F9FAFB] min-h-full">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .font-display { font-family: 'Space Grotesk', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
        .font-mono { font-family: 'IBM Plex Mono', monospace; }
      `}</style>

      {/* Header */}
      <div className="px-6 pt-8 pb-6">
        <div className="font-mono text-[11px] tracking-[0.14em] text-[#8B92A3] uppercase mb-1.5">
          Account
        </div>
        <h1 className="font-display font-semibold text-[26px] text-[#10151F]">
          My Profile
        </h1>
        <p className="font-body text-[14px] text-[#6B7280] mt-1">
          View your account details and manage your security settings.
        </p>
      </div>

      <div className="mx-6 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5 pb-10">
        {/* Identity card */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 h-fit">
          <div className="flex flex-col items-center text-center">
<div className="relative">
                <div className="h-20 w-20 overflow-hidden rounded-full bg-[#F3F4F6]">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt={user.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[#9CA3AF]">
                      <UserRound size={28} />
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 font-body text-[12px] font-medium text-[#374151] hover:bg-[#F3F4F6] transition disabled:opacity-50"
                >
                  <Camera size={13} />
                  {avatarUploading ? "Uploading…" : "Change photo"}
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
              {avatarError && (
                <p className="mt-2 font-body text-[12px] text-[#EF4444]">
                  {avatarError}
                </p>
              )}
            <h2 className="font-display font-semibold text-[16px] text-[#10151F] mt-3">
              {user.name}
            </h2>
            <p className="font-body text-[13px] text-[#6B7280]">{user.email}</p>
            <div className="mt-2.5 flex items-center gap-1.5">
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full font-body text-[11px] font-medium"
                style={{ color: role.color, backgroundColor: role.bg }}
              >
                {roleName}
              </span>
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full font-body text-[11px] font-medium"
                style={{ color: status.color, backgroundColor: status.bg }}
              >
                {user.status}
              </span>
            </div>
          </div>

          <div className="mt-5 pt-1">
            <InfoRow
              icon={Building2}
              label="Department"
              value={user.department?.department_name}
            />
            <InfoRow icon={Wallet} label="Salary" value={user.salary} />
            <InfoRow
              icon={BadgeCheck}
              label="ID card number"
              value={user.id_card_number}
            />
            <InfoRow
              icon={Calendar}
              label="Hire date"
              value={user.hire_date?.slice(0, 10)}
            />
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">
          {/* Personal information */}
          <div className="bg-white rounded-xl border border-[#E5E7EB]">
            <div className="flex items-center justify-between border-b border-[#F0F1F3] px-5 py-4">
              <div>
                <h2 className="font-display font-semibold text-[15px] text-[#10151F]">
                  Personal information
                </h2>
                <p className="font-body text-[13px] text-[#6B7280] mt-0.5">
                  Update your name, contact details, and photo.
                </p>
              </div>
              {!editingInfo && (
                <button
                  onClick={() => setEditingInfo(true)}
                  className="font-body text-[13px] font-medium text-[#374151] bg-white border border-[#E5E7EB] rounded-lg px-3.5 py-2 flex items-center gap-1.5 hover:bg-[#F3F4F6] transition"
                >
                  <Pencil size={13} />
                  Edit
                </button>
              )}
            </div>

            {!editingInfo ? (
              <div className="px-5 py-3">
                {infoMessage && (
                  <div className="mb-3 mt-2 rounded-lg bg-[#EFFBF3] border border-[#A6F0C6] px-3 py-2 font-body text-[13px] text-[#15803D]">
                    {infoMessage}
                  </div>
                )}
                <InfoRow icon={Mail} label="Email" value={user.email} />
                <InfoRow icon={Phone} label="Phone" value={user.phone} />
                <InfoRow icon={MapPin} label="Address" value={user.address} />
              </div>
            ) : (
              <form onSubmit={handleSaveInfo} className="px-5 py-4">
                {infoError && (
                  <div className="mb-3 rounded-lg bg-[#FEF3F2] border border-[#FDA29B] px-3 py-2 font-body text-[13px] text-[#B42318]">
                    {infoError}
                  </div>
                )}

                <div className="mb-4 flex items-center gap-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-[#F3F4F6]">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Profile preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#9CA3AF]">
                        <UserRound size={20} />
                      </div>
                    )}
                  </div>
                  <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 font-body text-[13px] font-medium text-[#374151] hover:bg-[#F3F4F6] transition">
                    <Upload size={14} />
                    Upload photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>

                <label className={labelClass}>Name</label>
                <input
                  required
                  value={infoForm.name}
                  onChange={(e) =>
                    setInfoForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className={`${inputClass} mb-1`}
                />
                {infoErrors.name && (
                  <p className={errorClass}>{infoErrors.name[0]}</p>
                )}

                <label className={`${labelClass} mt-3`}>Email</label>
                <input
                  required
                  type="email"
                  value={infoForm.email}
                  onChange={(e) =>
                    setInfoForm((f) => ({ ...f, email: e.target.value }))
                  }
                  className={`${inputClass} mb-1`}
                />
                {infoErrors.email && (
                  <p className={errorClass}>{infoErrors.email[0]}</p>
                )}

                <label className={`${labelClass} mt-3`}>Phone</label>
                <input
                  value={infoForm.phone}
                  onChange={(e) =>
                    setInfoForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  className={`${inputClass} mb-1`}
                />
                {infoErrors.phone && (
                  <p className={errorClass}>{infoErrors.phone[0]}</p>
                )}

                <label className={`${labelClass} mt-3`}>Address</label>
                <input
                  value={infoForm.address}
                  onChange={(e) =>
                    setInfoForm((f) => ({ ...f, address: e.target.value }))
                  }
                  className={`${inputClass} mb-1`}
                />
                {infoErrors.address && (
                  <p className={errorClass}>{infoErrors.address[0]}</p>
                )}

                <div className="flex justify-end gap-2.5 mt-4">
                  <button
                    type="button"
                    onClick={cancelInfoEdit}
                    className="font-body text-[13px] font-medium text-[#374151] bg-white border border-[#E5E7EB] rounded-lg px-4 py-2.5 hover:bg-[#F3F4F6] transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingInfo}
                    className="font-body text-[13px] font-medium text-white bg-[#2F5FEA] rounded-lg px-4 py-2.5 hover:bg-[#1E3FA6] transition disabled:opacity-50"
                  >
                    {savingInfo ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Security */}
          <div className="bg-white rounded-xl border border-[#E5E7EB]">
            <div className="flex items-center gap-2.5 border-b border-[#F0F1F3] px-5 py-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EFF3FE] text-[#2F5FEA]">
                <ShieldCheck size={15} />
              </div>
              <div>
                <h2 className="font-display font-semibold text-[15px] text-[#10151F]">
                  Security
                </h2>
                <p className="font-body text-[13px] text-[#6B7280] mt-0.5">
                  Verify your current password, then set a new one (min. 8
                  characters).
                </p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="px-5 py-4">
              {pwdMessage && (
                <div className="mb-3 rounded-lg bg-[#EFFBF3] border border-[#A6F0C6] px-3 py-2 font-body text-[13px] text-[#15803D]">
                  {pwdMessage}
                </div>
              )}
              {pwdError && (
                <div className="mb-3 rounded-lg bg-[#FEF3F2] border border-[#FDA29B] px-3 py-2 font-body text-[13px] text-[#B42318]">
                  {pwdError}
                </div>
              )}

              {/* Step 1: current password */}
              <label className={labelClass}>Current password</label>
              <div className="flex items-start gap-2 mb-1">
                <div className="relative flex-1">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={handleCurrentPasswordChange}
                    disabled={passwordVerified}
                    className={`${inputClass} pr-10 ${
                      passwordVerified ? "opacity-70" : ""
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#374151] transition"
                    tabIndex={-1}
                  >
                    {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                {passwordVerified ? (
                  <span className="flex items-center gap-1 rounded-lg bg-[#EFFBF3] border border-[#A6F0C6] px-3 py-2.5 font-body text-[13px] text-[#15803D] whitespace-nowrap">
                    <ShieldCheck size={14} />
                    Verified
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleVerifyCurrentPassword}
                    disabled={verifyingPwd}
                    className="font-body text-[13px] font-medium text-[#2F5FEA] bg-[#EFF3FE] rounded-lg px-3.5 py-2.5 hover:bg-[#DCE6FD] transition disabled:opacity-50 whitespace-nowrap"
                  >
                    {verifyingPwd ? "Checking…" : "Verify"}
                  </button>
                )}
              </div>
              {verifyError && <p className={errorClass}>{verifyError}</p>}
              {pwdErrors.current_password && (
                <p className={errorClass}>{pwdErrors.current_password[0]}</p>
              )}

              {/* Step 2: new password — only unlocked after verification */}
              <div
                className={`mt-3 transition ${
                  passwordVerified ? "" : "opacity-40 pointer-events-none"
                }`}
              >
                <label className={labelClass}>New password</label>
                <div className="relative mb-1">
                  <input
                    type={showNew ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={!passwordVerified}
                    className={`${inputClass} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#374151] transition"
                    tabIndex={-1}
                  >
                    {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {pwdErrors.password && (
                  <p className={errorClass}>{pwdErrors.password[0]}</p>
                )}

                <label className={`${labelClass} mt-3`}>
                  Confirm new password
                </label>
                <input
                  type={showNew ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={!passwordVerified}
                  className={`${inputClass} mb-1`}
                />

                <div className="flex justify-end mt-4">
                  <button
                    type="submit"
                    disabled={savingPwd || !passwordVerified}
                    className="font-body text-[13px] font-medium text-white bg-[#2F5FEA] rounded-lg px-4 py-2.5 hover:bg-[#1E3FA6] transition disabled:opacity-50"
                  >
                    {savingPwd ? "Updating…" : "Update password"}
                  </button>
                </div>
              </div>
            </form>
          </div>
          {/* Two-factor authentication — ADD THIS CARD */}
          <div className="bg-white rounded-xl border border-[#E5E7EB]">
            <div className="flex items-center gap-2.5 border-b border-[#F0F1F3] px-5 py-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EFF3FE] text-[#2F5FEA]">
                <ShieldCheck size={15} />
              </div>
              <div>
                <h2 className="font-display font-semibold text-[15px] text-[#10151F]">
                  Two-factor authentication
                </h2>
                <p className="font-body text-[13px] text-[#6B7280] mt-0.5">
                  Add an extra layer of protection to your account.
                </p>
              </div>
            </div>
            <div className="px-5 py-4">
              <TwoFactorSetup />
            </div>
          </div>

          {/* Contact administrator (shown on the sign-in page) */}
          <div className="bg-white rounded-xl border border-[#E5E7EB]">
            <div className="flex items-center gap-2.5 border-b border-[#F0F1F3] px-5 py-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FEF6EC] text-[#F4972B]">
                <LifeBuoy size={15} />
              </div>
              <div>
                <h2 className="font-display font-semibold text-[15px] text-[#10151F]">
                  Contact administrator
                </h2>
                <p className="font-body text-[13px] text-[#6B7280] mt-0.5">
                  Details users see via “Contact your administrator” on the
                  sign-in page. Admins only.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveContact} className="px-5 py-4">
              {contactLoading && (
                <div className="py-4 text-center font-body text-[13px] text-[#6B7280]">
                  Loading contact details…
                </div>
              )}

              {!contactLoading && (
                <>
                  {contactMessage && (
                    <div className="mb-3 rounded-lg bg-[#EFFBF3] border border-[#A6F0C6] px-3 py-2 font-body text-[13px] text-[#15803D]">
                      {contactMessage}
                    </div>
                  )}
                  {contactError && (
                    <div className="mb-3 rounded-lg bg-[#FEF3F2] border border-[#FDA29B] px-3 py-2 font-body text-[13px] text-[#B42318]">
                      {contactError}
                    </div>
                  )}

                  <label className={labelClass}>Email</label>
                  <input
                    required
                    type="email"
                    value={contactForm.email}
                    onChange={(e) =>
                      setContactForm((f) => ({ ...f, email: e.target.value }))
                    }
                    className={`${inputClass} mb-1`}
                    placeholder="admin@company.com"
                  />

                  <label className={`${labelClass} mt-3`}>Phone</label>
                  <input
                    value={contactForm.phone}
                    onChange={(e) =>
                      setContactForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    className={`${inputClass} mb-1`}
                    placeholder="+855 12 345 678"
                  />

                  <label className={`${labelClass} mt-3`}>Telegram</label>
                  <input
                    value={contactForm.telegram}
                    onChange={(e) =>
                      setContactForm((f) => ({
                        ...f,
                        telegram: e.target.value,
                      }))
                    }
                    className={`${inputClass} mb-1`}
                    placeholder="https://t.me/your_username"
                  />

                  <div className="flex justify-end mt-4">
                    <button
                      type="submit"
                      disabled={savingContact}
                      className="font-body text-[13px] font-medium text-white bg-[#2F5FEA] rounded-lg px-4 py-2.5 hover:bg-[#1E3FA6] transition disabled:opacity-50"
                    >
                      {savingContact ? "Saving…" : "Save"}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
