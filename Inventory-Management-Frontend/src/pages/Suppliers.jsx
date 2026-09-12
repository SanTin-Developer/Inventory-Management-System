import { useEffect, useState, useMemo } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Truck,
  Eye,
  Phone,
  Mail,
  MapPin,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { suppliersApi } from "../services/service";
import { extractPaginated } from "../utils/extractPaginated";
import { useAlert } from "../components/Alertsystem";
import { useToast } from "../components/Toastsystem";

function SupplierForm({ supplier, onClose, onSaved }) {
  const toast = useToast();
  const isEditing = !!supplier;
  const [form, setForm] = useState({
    supplier_name: supplier?.supplier_name ?? "",
    contact_person: supplier?.contact_person ?? "",
    phone: supplier?.phone ?? "",
    email: supplier?.email ?? "",
    address: supplier?.address ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      if (isEditing) {
        await suppliersApi.update(supplier.supplier_id, form);
      } else {
        await suppliersApi.create(form);
      }
      toast.success(
        isEditing ? "Supplier updated" : "Supplier added",
        `"${form.supplier_name}" was ${
          isEditing ? "updated" : "added"
        } successfully.`,
      );
      onSaved();
    } catch (err) {
      if (err?.response?.status === 422) {
        setErrors(err.response.data.errors ?? {});
      } else {
        toast.error(
          "Save failed",
          err?.response?.data?.message ?? "Failed to save supplier.",
        );
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10151F]/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
          .font-display { font-family: 'Space Grotesk', sans-serif; }
          .font-body { font-family: 'Inter', sans-serif; }
        `}</style>
        <div className="flex items-center justify-between border-b border-[#F0F1F3] px-5 py-4">
          <h2 className="font-display font-semibold text-[15px] text-[#10151F]">
            {isEditing ? "Edit supplier" : "Add supplier"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-[#9CA3AF] hover:bg-[#F3F4F6] hover:text-[#374151] transition"
          >
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4">
          <label className={labelClass}>Supplier name</label>
          <input
            required
            value={form.supplier_name}
            onChange={(e) =>
              setForm({ ...form, supplier_name: e.target.value })
            }
            className={`${inputClass} mb-1`}
          />
          {fieldError("supplier_name") && (
            <p className="mb-2 font-body text-[12px] text-[#EF4444]">
              {fieldError("supplier_name")}
            </p>
          )}

          <label className={`${labelClass} mt-3`}>Contact person</label>
          <input
            value={form.contact_person}
            onChange={(e) =>
              setForm({ ...form, contact_person: e.target.value })
            }
            className={`${inputClass} mb-4`}
          />

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className={labelClass}>Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <label className={labelClass}>Address</label>
          <textarea
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            rows={2}
            className={`${inputClass} mb-5 resize-none`}
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

function SupplierDetail({ supplier, onClose, onEdit }) {
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
              <Truck size={16} />
            </div>
            <h2 className="font-display font-semibold text-[15px] text-[#10151F]">
              {supplier.supplier_name}
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
            icon={User}
            label="Contact person"
            value={supplier.contact_person}
          />
          <Row icon={Phone} label="Phone" value={supplier.phone} />
          <Row icon={Mail} label="Email" value={supplier.email} />
          <Row icon={MapPin} label="Address" value={supplier.address} />
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

export default function Suppliers() {
  const { confirm } = useAlert();
  const toast = useToast();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  });

  const load = async (p = page) => {
    setLoading(true);
    setError(null);
    try {
      const res = await suppliersApi.list({ page: p });
      const { items, meta: m } = extractPaginated(res);
      setSuppliers(items);
      setMeta(m);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message ?? "Couldn't load suppliers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const openEdit = (s) => {
    setEditing(s);
    setViewing(null);
    setShowForm(true);
  };

  const handleDelete = async (s) => {
    const confirmed = await confirm({
      type: "error",
      title: "Delete supplier",
      message: `Delete "${s.supplier_name}"? This can't be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
    });
    if (!confirmed) return;
    setDeletingId(s.supplier_id);
    try {
      await suppliersApi.remove(s.supplier_id);
      load(page);
      toast.success(
        "Supplier deleted",
        `"${s.supplier_name}" was deleted successfully.`,
      );
    } catch (err) {
      toast.error(
        "Delete failed",
        err?.response?.data?.message ?? "Couldn't delete this supplier.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const showingFrom = useMemo(
    () => (suppliers.length ? (meta.current_page - 1) * 10 + 1 : 0),
    [suppliers, meta],
  );
  const showingTo = useMemo(
    () => (meta.current_page - 1) * 10 + suppliers.length,
    [suppliers, meta],
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
            Inventory
          </div>
          <h1 className="font-display font-semibold text-[26px] text-[#10151F]">
            Suppliers
          </h1>
          <p className="font-body text-[14px] text-[#6B7280] mt-1">
            Manage the vendors you purchase from.
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
          Add supplier
        </button>
      </div>

      {/* Status card */}
      <div className="px-6 mb-6">
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 max-w-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-body text-[13px] text-[#6B7280] mb-1.5">
                Total suppliers
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
              <Truck size={17} className="text-[#2F5FEA]" />
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
      <div className="mx-6 bg-white rounded-xl border border-[#E5E7EB] overflow-x-auto">
        <table className="w-full min-w-[640px] font-body text-[13.5px]">
          <thead>
            <tr className="text-left text-[#9CA3AF] text-[11px] uppercase font-mono tracking-wide border-b border-[#F0F1F3]">
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Contact</th>
              <th className="px-5 py-3 font-medium">Phone</th>
              <th className="px-5 py-3 font-medium">Email</th>
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

            {!loading && !error && suppliers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-16 text-center">
                  <Truck size={28} className="mx-auto text-[#D1D5DB] mb-2" />
                  <p className="font-body text-[13.5px] text-[#6B7280]">
                    No suppliers yet — add your first one to get started.
                  </p>
                </td>
              </tr>
            )}

            {!loading &&
              !error &&
              suppliers.map((s) => (
                <tr
                  key={s.supplier_id}
                  className="border-b border-[#F0F1F3] last:border-0 hover:bg-[#FAFBFC]"
                >
                  <td className="px-5 py-3.5 text-[#10151F] font-medium">
                    {s.supplier_name}
                  </td>
                  <td className="px-5 py-3.5 text-[#6B7280]">
                    {s.contact_person || "—"}
                  </td>
                  <td className="px-5 py-3.5 text-[#6B7280]">
                    {s.phone || "—"}
                  </td>
                  <td className="px-5 py-3.5 text-[#6B7280]">
                    {s.email || "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setViewing(s)}
                        className="p-1.5 rounded-md text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#2F5FEA] transition"
                        aria-label={`View ${s.supplier_name}`}
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => openEdit(s)}
                        className="p-1.5 rounded-md text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#2F5FEA] transition"
                        aria-label={`Edit ${s.supplier_name}`}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(s)}
                        disabled={deletingId === s.supplier_id}
                        className="p-1.5 rounded-md text-[#6B7280] hover:bg-[#FEF3F2] hover:text-[#EF4444] transition disabled:opacity-40"
                        aria-label={`Delete ${s.supplier_name}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        {/* Pagination */}
        {!loading && !error && suppliers.length > 0 && (
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
        <SupplierForm
          supplier={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            load(page);
          }}
        />
      )}

      {viewing && (
        <SupplierDetail
          supplier={viewing}
          onClose={() => setViewing(null)}
          onEdit={() => openEdit(viewing)}
        />
      )}
    </div>
  );
}
