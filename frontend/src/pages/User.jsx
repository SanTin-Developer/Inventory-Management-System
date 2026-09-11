import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  UsersRound,
  Upload,
  Eye,
  EyeOff,
  Mail,
  Phone,
  MapPin,
  Building2,
  Wallet,
  BadgeCheck,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { usersApi, rolesApi, departmentsApi } from "../services/service";
import api from "../services/api";

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

function UserForm({ user, roles, departments, onClose, onSaved }) {
  const isEditing = !!user;
  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    password: "",
    role_id: user?.role_id ?? roles[0]?.role_id ?? "",
    department_id: user?.department_id ?? "",
    phone: user?.phone ?? "",
    status: user?.status ?? "Active",
    salary: user?.salary ?? "",
    id_card_number: user?.id_card_number ?? "",
    hire_date: user?.hire_date?.slice(0, 10) ?? "",
    address: user?.address ?? "",
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(user?.image_url ?? null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const buildFormData = () => {
    const fd = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (key === "password" && !value) return; // don't overwrite password when blank
      if (value === "" || value === null || value === undefined) return;
      fd.append(key, value);
    });
    if (image) fd.append("image", image);
    return fd;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSaving(true);
    try {
      if (image) {
        // File present — must go through multipart/form-data
        const fd = buildFormData();
        if (isEditing) {
          await usersApi.updateForm(user.user_id, fd);
        } else {
          await usersApi.create(fd);
        }
      } else {
        // No file — plain JSON is simpler
        const payload = { ...form };
        if (isEditing && !payload.password) delete payload.password;

        if (isEditing) {
          await usersApi.update(user.user_id, payload);
        } else {
          await usersApi.create(payload);
        }
      }
      onSaved();
    } catch (err) {
      if (err?.response?.status === 422) {
        setErrors(err.response.data.errors ?? {});
      } else {
        alert(err?.response?.data?.message ?? "Failed to save user.");
      }
    } finally {
      setSaving(false);
    }
  };

  const fieldError = (name) => errors[name]?.[0];

  const inputClass =
    "font-body w-full px-3.5 py-2.5 bg-[#F3F4F6] border border-transparent rounded-lg text-[14px] text-[#10151F] focus:outline-none focus:ring-2 focus:ring-[#2F5FEA] focus:bg-white transition";
  const labelClass =
    "block font-body font-medium text-[13px] text-[#374151] mb-1.5";
  const errorClass = "mb-2 font-body text-[12px] text-[#EF4444]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10151F]/40 p-4">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .font-display { font-family: 'Space Grotesk', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
      `}</style>
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#F0F1F3] px-5 py-4">
          <h2 className="font-display font-semibold text-[15px] text-[#10151F]">
            {isEditing ? "Edit user" : "Add user"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-[#9CA3AF] hover:bg-[#F3F4F6] hover:text-[#374151] transition"
          >
            <X size={16} />
          </button>
        </div>
        <form
          onSubmit={handleSubmit}
          className="px-5 py-4 max-h-[75vh] overflow-y-auto"
        >
          {/* Profile image */}
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
                  <UsersRound size={20} />
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
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={`${inputClass} mb-1`}
          />
          {fieldError("name") && (
            <p className={errorClass}>{fieldError("name")}</p>
          )}

          <label className={`${labelClass} mt-3`}>Email</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={`${inputClass} mb-1`}
          />
          {fieldError("email") && (
            <p className={errorClass}>{fieldError("email")}</p>
          )}

          <label className={`${labelClass} mt-3`}>
            Password{" "}
            {isEditing && (
              <span className="text-[#9CA3AF] font-normal">
                (leave blank to keep current)
              </span>
            )}
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required={!isEditing}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className={`${inputClass} mb-1 pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {fieldError("password") && (
            <p className={errorClass}>{fieldError("password")}</p>
          )}

          <div className="grid grid-cols-2 gap-3 mt-3 mb-3">
            <div>
              <label className={labelClass}>Role</label>
              <select
                required
                value={form.role_id}
                onChange={(e) => setForm({ ...form, role_id: e.target.value })}
                className={inputClass}
              >
                {roles.map((r) => (
                  <option key={r.role_id} value={r.role_id}>
                    {r.role_name}
                  </option>
                ))}
              </select>
              {fieldError("role_id") && (
                <p className={errorClass}>{fieldError("role_id")}</p>
              )}
            </div>
            <div>
              <label className={labelClass}>Department</label>
              <select
                value={form.department_id}
                onChange={(e) =>
                  setForm({ ...form, department_id: e.target.value })
                }
                className={inputClass}
              >
                <option value="">— None —</option>
                {departments.map((d) => (
                  <option key={d.department_id} value={d.department_id}>
                    {d.department_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className={labelClass}>Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className={inputClass}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="On Leave">On Leave</option>
                <option value="Terminated">Terminated</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className={labelClass}>Salary</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.salary}
                onChange={(e) => setForm({ ...form, salary: e.target.value })}
                className={inputClass}
              />
              {fieldError("salary") && (
                <p className={errorClass}>{fieldError("salary")}</p>
              )}
            </div>
            <div>
              <label className={labelClass}>Hire date</label>
              <input
                type="date"
                value={form.hire_date}
                onChange={(e) =>
                  setForm({ ...form, hire_date: e.target.value })
                }
                className={inputClass}
              />
            </div>
          </div>

          <label className={labelClass}>ID card number</label>
          <input
            value={form.id_card_number}
            onChange={(e) =>
              setForm({ ...form, id_card_number: e.target.value })
            }
            className={`${inputClass} mb-3`}
          />

          <label className={labelClass}>Address</label>
          <input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className={`${inputClass} mb-5`}
          />

          <div className="flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="font-body text-[13px] font-medium text-[#374151] bg-white border border-[#E5E7EB] rounded-lg px-4 py-2.5 hover:bg-[#F3F4F6] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="font-body text-[13px] font-medium text-white bg-[#2F5FEA] rounded-lg px-4 py-2.5 hover:bg-[#1E3FA6] transition disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UserDetail({ user, onClose, onEdit }) {
  const roleName = user.role?.role_name ?? "Staff";
  const role = ROLE_STYLE[roleName] ?? ROLE_STYLE.Staff;
  const status = STATUS_STYLE[user.status] ?? STATUS_STYLE.Active;

  const Row = ({ icon: Icon, label, value }) => (
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10151F]/40 p-4">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .font-display { font-family: 'Space Grotesk', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
        .font-mono { font-family: 'IBM Plex Mono', monospace; }
      `}</style>
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#F0F1F3] px-5 py-4">
          <div className="flex items-center gap-3">
            {user.image_url ? (
              <img
                src={user.image_url}
                alt={user.name}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EFF3FE] text-[#2F5FEA]">
                <UsersRound size={16} />
              </div>
            )}
            <div>
              <h2 className="font-display font-semibold text-[15px] text-[#10151F]">
                {user.name}
              </h2>
              <div className="mt-0.5 flex items-center gap-1.5">
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
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-[#9CA3AF] hover:bg-[#F3F4F6] hover:text-[#374151] transition"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-3 max-h-[65vh] overflow-y-auto">
          <Row icon={Mail} label="Email" value={user.email} />
          <Row icon={Phone} label="Phone" value={user.phone} />
          <Row
            icon={Building2}
            label="Department"
            value={user.department?.department_name}
          />
          <Row icon={Wallet} label="Salary" value={user.salary} />
          <Row
            icon={BadgeCheck}
            label="ID card number"
            value={user.id_card_number}
          />
          <Row
            icon={Calendar}
            label="Hire date"
            value={user.hire_date?.slice(0, 10)}
          />
          <Row icon={MapPin} label="Address" value={user.address} />
        </div>

        <div className="flex justify-end gap-2.5 border-t border-[#F0F1F3] px-5 py-4">
          <button
            onClick={onClose}
            className="font-body text-[13px] font-medium text-[#374151] bg-white border border-[#E5E7EB] rounded-lg px-4 py-2.5 hover:bg-[#F3F4F6] transition"
          >
            Close
          </button>
          <button
            onClick={onEdit}
            className="font-body text-[13px] font-medium text-white bg-[#2F5FEA] rounded-lg px-4 py-2.5 hover:bg-[#1E3FA6] transition"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Users() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 10,
  });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [stats, setStats] = useState(null);

  const load = async (pageNum = page) => {
    setLoading(true);
    setError(null);
    try {
      const res = await usersApi.list({ page: pageNum });
      setUsers(res.data.data ?? []);
      setMeta({
        current_page: res.data.current_page ?? 1,
        last_page: res.data.last_page ?? 1,
        total: res.data.total ?? (res.data.data ?? []).length,
        per_page: res.data.per_page ?? 10,
      });
    } catch (err) {
      setError(err?.response?.data?.message ?? "Couldn't load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    api
      .get("/users/stats")
      .then((res) => setStats(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    rolesApi
      .list()
      .then((res) => setRoles(res.data.data ?? res.data ?? []))
      .catch(() => {});
    departmentsApi
      .list()
      .then((res) => setDepartments(res.data.data ?? res.data ?? []))
      .catch(() => {});
  }, []);

  const openEdit = (u) => {
    setEditing(u);
    setViewing(null);
    setShowForm(true);
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Delete "${u.name}"? This can't be undone.`)) return;
    setDeletingId(u.user_id);
    try {
      await usersApi.remove(u.user_id);
      // If this was the last row on the page, step back a page; otherwise reload current page
      if (users.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        load(page);
      }
    } catch (err) {
      alert(err?.response?.data?.message ?? "Couldn't delete this user.");
    } finally {
      setDeletingId(null);
    }
  };

  const showingFrom = useMemo(
    () => (users.length ? (meta.current_page - 1) * meta.per_page + 1 : 0),
    [users, meta],
  );
  const showingTo = useMemo(
    () => (meta.current_page - 1) * meta.per_page + users.length,
    [users, meta],
  );

  return (
    <div className="bg-[#F9FAFB] min-h-full">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .font-display { font-family: 'Space Grotesk', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
        .font-mono { font-family: 'IBM Plex Mono', monospace; }
      `}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 px-6 pt-8 pb-6">
        <div>
          <div className="font-mono text-[11px] tracking-[0.14em] text-[#8B92A3] uppercase mb-1.5">
            Admin
          </div>
          <h1 className="font-display font-semibold text-[26px] text-[#10151F]">
            Users
          </h1>
          <p className="font-body text-[14px] text-[#6B7280] mt-1">
            {meta.total
              ? `${meta.total} staff accounts.`
              : "Manage staff accounts and permissions."}
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="font-body text-[13px] font-medium text-white bg-[#2F5FEA] rounded-lg px-4 py-2.5 flex items-center gap-1.5 hover:bg-[#1E3FA6] transition w-fit"
        >
          <Plus size={15} />
          Add user
        </button>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-6 mb-6">
        {[
          {
            label: "Total users",
            value: stats?.total,
            icon: UsersRound,
            accent: "#2F5FEA",
          },
          {
            label: "Active",
            value: stats?.active,
            icon: CheckCircle2,
            accent: "#22C55E",
          },
          {
            label: "Inactive / On leave / Terminated",
            value: stats
              ? stats.inactive + stats.on_leave + stats.terminated
              : undefined,
            icon: UsersRound,
            accent: "#EF4444",
          },
          {
            label: "Admins",
            value: stats?.admin_count,
            icon: ShieldCheck,
            accent: "#F4972B",
          },
        ].map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className="bg-white rounded-xl border border-[#E5E7EB] p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="font-body text-[12.5px] text-[#6B7280]">
                  {c.label}
                </p>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${c.accent}1A` }}
                >
                  <Icon size={15} style={{ color: c.accent }} />
                </div>
              </div>
              <p className="font-display font-semibold text-[20px] text-[#10151F]">
                {c.value === undefined ? (
                  <span className="inline-block h-5 w-12 bg-[#F3F4F6] rounded animate-pulse" />
                ) : (
                  c.value
                )}
              </p>
            </div>
          );
        })}
      </div>

      {error && !loading && (
        <div className="mx-6 mb-4 font-body text-[13px] text-[#B42318] bg-[#FEF3F2] border border-[#FDA29B] rounded-lg px-4 py-3 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => load(page)}
            className="font-medium underline shrink-0 ml-4"
          >
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      <div className="mx-6 bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
        <table className="w-full font-body text-[13.5px]">
          <thead>
            <tr className="text-left text-[#9CA3AF] text-[11px] uppercase font-mono tracking-wide border-b border-[#F0F1F3]">
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Email</th>
              <th className="px-5 py-3 font-medium">Department</th>
              <th className="px-5 py-3 font-medium">Role</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-[#F0F1F3] last:border-0">
                  <td colSpan={6} className="px-5 py-3.5">
                    <div className="h-4 bg-[#F3F4F6] rounded animate-pulse" />
                  </td>
                </tr>
              ))}

            {!loading && !error && users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center">
                  <UsersRound
                    size={28}
                    className="mx-auto text-[#D1D5DB] mb-2"
                  />
                  <p className="font-body text-[13.5px] text-[#6B7280]">
                    No users yet — add your first one to get started.
                  </p>
                </td>
              </tr>
            )}

            {!loading &&
              !error &&
              users.map((u) => {
                const roleName = u.role?.role_name ?? "Staff";
                const role = ROLE_STYLE[roleName] ?? ROLE_STYLE.Staff;
                const status = STATUS_STYLE[u.status] ?? STATUS_STYLE.Active;
                return (
                  <tr
                    key={u.user_id}
                    className="border-b border-[#F0F1F3] last:border-0 hover:bg-[#FAFBFC]"
                  >
                    <td className="px-5 py-3.5 text-[#10151F] font-medium">
                      <div className="flex items-center gap-2.5">
                        {u.image_url ? (
                          <img
                            src={u.image_url}
                            alt={u.name}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F3F4F6] text-[#9CA3AF]">
                            <UsersRound size={14} />
                          </div>
                        )}
                        {u.name}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[#6B7280]">{u.email}</td>
                    <td className="px-5 py-3.5 text-[#6B7280]">
                      {u.department?.department_name ?? "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full font-body text-[11.5px] font-medium"
                        style={{ color: role.color, backgroundColor: role.bg }}
                      >
                        {roleName}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full font-body text-[11.5px] font-medium"
                        style={{
                          color: status.color,
                          backgroundColor: status.bg,
                        }}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewing(u)}
                          className="p-1.5 rounded-md text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#2F5FEA] transition"
                          aria-label={`View ${u.name}`}
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => openEdit(u)}
                          className="p-1.5 rounded-md text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#2F5FEA] transition"
                          aria-label={`Edit ${u.name}`}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(u)}
                          disabled={deletingId === u.user_id}
                          className="p-1.5 rounded-md text-[#6B7280] hover:bg-[#FEF3F2] hover:text-[#EF4444] transition disabled:opacity-40"
                          aria-label={`Delete ${u.name}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>

        {/* Pagination */}
        {!loading && !error && users.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#F0F1F3]">
            <p className="font-body text-[12.5px] text-[#9CA3AF]">
              Showing{" "}
              <span className="text-[#374151] font-medium">
                {showingFrom}–{showingTo}
              </span>{" "}
              of{" "}
              <span className="text-[#374151] font-medium">{meta.total}</span>
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={meta.current_page <= 1}
                className="p-1.5 rounded-md border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F3F4F6] disabled:opacity-40 disabled:hover:bg-transparent transition"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="font-mono text-[12px] text-[#6B7280] px-2">
                {meta.current_page} / {meta.last_page}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                disabled={meta.current_page >= meta.last_page}
                className="p-1.5 rounded-md border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F3F4F6] disabled:opacity-40 disabled:hover:bg-transparent transition"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <UserForm
          user={editing}
          roles={roles}
          departments={departments}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            load(page);
          }}
        />
      )}

      {viewing && (
        <UserDetail
          user={viewing}
          onClose={() => setViewing(null)}
          onEdit={() => openEdit(viewing)}
        />
      )}
    </div>
  );
}
