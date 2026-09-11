import { useEffect, useState, useMemo } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Boxes,
  Eye,
  FileText,
  Users2,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { departmentsApi } from "../services/service";

function DepartmentForm({ department, onClose, onSaved }) {
  const isEditing = !!department;
  const [form, setForm] = useState({
    department_name: department?.department_name ?? "",
    description: department?.description ?? "",
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  const fieldError = (name) => errors[name]?.[0];

  const inputClass =
    "font-body w-full px-3.5 py-2.5 bg-[#F3F4F6] border border-transparent rounded-lg text-[14px] text-[#10151F] focus:outline-none focus:ring-2 focus:ring-[#2F5FEA] focus:bg-white transition";
  const labelClass =
    "block font-body font-medium text-[13px] text-[#374151] mb-1.5";
  const errorClass = "mb-2 font-body text-[12px] text-[#EF4444]";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setFormError(null);
    setSaving(true);
    try {
      if (isEditing) {
        await departmentsApi.update(department.department_id, form);
      } else {
        await departmentsApi.create(form);
      }
      onSaved();
    } catch (err) {
      if (err?.response?.status === 422) {
        setErrors(err.response.data.errors ?? {});
      } else {
        setFormError(
          err?.response?.data?.message ?? "Failed to save department.",
        );
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10151F]/40 p-4">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .font-display { font-family: 'Space Grotesk', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
      `}</style>
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#F0F1F3] px-5 py-4">
          <h2 className="font-display font-semibold text-[15px] text-[#10151F]">
            {isEditing ? "Edit department" : "Add department"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-[#9CA3AF] hover:bg-[#F3F4F6] hover:text-[#374151] transition"
          >
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4">
          {formError && (
            <div className="mb-3 rounded-lg bg-[#FEF3F2] border border-[#FDA29B] px-3 py-2 font-body text-[13px] text-[#B42318]">
              {formError}
            </div>
          )}

          <label className={labelClass}>Name</label>
          <input
            required
            value={form.department_name}
            onChange={(e) =>
              setForm((f) => ({ ...f, department_name: e.target.value }))
            }
            className={`${inputClass} mb-1`}
          />
          {fieldError("department_name") && (
            <p className={errorClass}>{fieldError("department_name")}</p>
          )}

          <label className={`${labelClass} mt-3`}>Description</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            className={`${inputClass} mb-1`}
          />
          {fieldError("description") && (
            <p className={errorClass}>{fieldError("description")}</p>
          )}

          <div className="flex justify-end gap-2.5 mt-4">
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

function DepartmentDetail({ department, onClose, onEdit }) {
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
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#F0F1F3] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EFF3FE] text-[#2F5FEA]">
              <Boxes size={16} />
            </div>
            <h2 className="font-display font-semibold text-[15px] text-[#10151F]">
              {department.department_name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-[#9CA3AF] hover:bg-[#F3F4F6] hover:text-[#374151] transition"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-3">
          <Row
            icon={FileText}
            label="Description"
            value={department.description}
          />
          <Row icon={Users2} label="Users" value={department.users_count} />
          <Row
            icon={Calendar}
            label="Created"
            value={department.created_at?.slice(0, 10)}
          />
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

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [meta, setMeta] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 10,
  });

  const load = async (p = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await departmentsApi.list({ page: p });

      setDepartments(res.data.data ?? []);

      setMeta({
        current_page: res.data.current_page ?? 1,
        last_page: res.data.last_page ?? 1,
        total: res.data.total ?? (res.data.data ?? []).length,
        per_page: res.data.per_page ?? 10,
      });
    } catch (err) {
      setError(err?.response?.data?.message ?? "Failed to load departments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(page);
  }, [page]);

  const openCreate = () => {
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (dept) => {
    setEditing(dept);
    setViewing(null);
    setShowForm(true);
  };

  const showingFrom = useMemo(
    () =>
      departments.length ? (meta.current_page - 1) * meta.per_page + 1 : 0,
    [departments, meta],
  );
  const showingTo = useMemo(
    () => (meta.current_page - 1) * meta.per_page + departments.length,
    [departments, meta],
  );

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await departmentsApi.remove(deleteTarget.department_id);
      setDeleteTarget(null);
      load(page);
    } catch (err) {
      setError(err?.response?.data?.message ?? "Failed to delete department.");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
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
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 px-6 pt-8 pb-6">
        <div>
          <div className="font-mono text-[11px] tracking-[0.14em] text-[#8B92A3] uppercase mb-1.5">
            Admin
          </div>
          <h1 className="font-display font-semibold text-[26px] text-[#10151F]">
            Departments
          </h1>
          <p className="font-body text-[14px] text-[#6B7280] mt-1">
            Organize staff into departments across the company.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="font-body text-[13px] font-medium text-white bg-[#2F5FEA] rounded-lg px-4 py-2.5 flex items-center gap-1.5 hover:bg-[#1E3FA6] transition w-fit"
        >
          <Plus size={15} />
          New department
        </button>
      </div>

      {/* Status card */}
      <div className="px-6 mb-6">
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 max-w-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-body text-[13px] text-[#6B7280] mb-1.5">
                Total departments
              </p>
              <p className="font-display font-semibold text-[24px] text-[#10151F]">
                {loading ? (
                  <span className="inline-block h-6 w-10 bg-[#F3F4F6] rounded animate-pulse" />
                ) : (
                  meta.total
                )}
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-[#2F5FEA]/10">
              <Boxes size={17} className="text-[#2F5FEA]" />
            </div>
          </div>
        </div>
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
              <th className="px-5 py-3 font-medium">Description</th>
              <th className="px-5 py-3 font-medium">Users</th>
              <th className="px-5 py-3 font-medium">Created</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-[#F0F1F3] last:border-0">
                  <td colSpan={5} className="px-5 py-3.5">
                    <div className="h-4 bg-[#F3F4F6] rounded animate-pulse" />
                  </td>
                </tr>
              ))}

            {!loading && !error && departments.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-16 text-center">
                  <Boxes size={28} className="mx-auto text-[#D1D5DB] mb-2" />
                  <p className="font-body text-[13.5px] text-[#6B7280]">
                    No departments yet — add your first one to get started.
                  </p>
                </td>
              </tr>
            )}

            {!loading &&
              !error &&
              departments.map((dept) => (
                <tr
                  key={dept.department_id}
                  className="border-b border-[#F0F1F3] last:border-0 hover:bg-[#FAFBFC]"
                >
                  <td className="px-5 py-3.5 text-[#10151F] font-medium">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F3F4F6] text-[#9CA3AF]">
                        <Boxes size={14} />
                      </div>
                      {dept.department_name}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-[#6B7280]">
                    {dept.description || "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full font-body text-[11.5px] font-medium text-[#2F5FEA] bg-[#EFF3FE]">
                      {dept.users_count}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[#6B7280]">
                    {dept.created_at?.slice(0, 10)}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setViewing(dept)}
                        className="p-1.5 rounded-md text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#2F5FEA] transition"
                        aria-label={`View ${dept.department_name}`}
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => openEdit(dept)}
                        className="p-1.5 rounded-md text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#2F5FEA] transition"
                        aria-label={`Edit ${dept.department_name}`}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(dept)}
                        className="p-1.5 rounded-md text-[#6B7280] hover:bg-[#FEF3F2] hover:text-[#EF4444] transition"
                        aria-label={`Delete ${dept.department_name}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && !error && departments.length > 0 && (
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#F0F1F3]">
          <p className="font-body text-[12.5px] text-[#9CA3AF]">
            Showing{" "}
            <span className="text-[#374151] font-medium">
              {showingFrom}–{showingTo}
            </span>{" "}
            of <span className="text-[#374151] font-medium">{meta.total}</span>
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

      {showForm && (
        <DepartmentForm
          department={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            load(page);
          }}
        />
      )}

      {viewing && (
        <DepartmentDetail
          department={viewing}
          onClose={() => setViewing(null)}
          onEdit={() => openEdit(viewing)}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10151F]/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2 className="font-display mb-2 text-[15px] font-semibold text-[#10151F]">
              Delete "{deleteTarget.department_name}"?
            </h2>
            <p className="mb-4 font-body text-[13.5px] text-[#6B7280]">
              This can't be undone. Users in this department will need to be
              reassigned.
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setDeleteTarget(null)}
                className="font-body text-[13px] font-medium text-[#374151] bg-white border border-[#E5E7EB] rounded-lg px-4 py-2.5 hover:bg-[#F3F4F6] transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="font-body text-[13px] font-medium text-white bg-[#EF4444] rounded-lg px-4 py-2.5 hover:bg-[#DC2626] transition disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
