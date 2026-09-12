import { useEffect, useState, useMemo } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Tags,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { categoriesApi } from "../services/service";
import { extractPaginated } from "../utils/extractPaginated";
import SearchInput from "../components/SearchInput"; // adjust path to wherever SearchInput actually lives
import { useAlert } from "../components/Alertsystem"; // adjust to match wherever Alertsystem.jsx lives, e.g. "../components/Alertsystem"
import { useToast } from "../components/Toastsystem"; // adjust path to wherever ToastSystem.jsx lives

const COLORS = {
  brand: "#2F5FEA",
  danger: "#EF4444",
};

function CategoryForm({ category, onClose, onSaved }) {
  const toast = useToast();
  const isEditing = !!category;
  const [form, setForm] = useState({
    category_name: category?.category_name ?? "",
    description: category?.description ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (isEditing) {
        await categoriesApi.update(category.category_id, form);
      } else {
        await categoriesApi.create(form);
      }
      toast.success(
        isEditing ? "Category updated" : "Category added",
        `"${form.category_name}" was ${isEditing ? "updated" : "added"} successfully.`,
      );
      onSaved();
    } catch (err) {
      const message =
        err?.response?.data?.message ??
        (isEditing
          ? "Couldn't update this category."
          : "Couldn't add this category.");
      setError(message);
      toast.error(isEditing ? "Update failed" : "Add failed", message);
    } finally {
      setSaving(false);
    }
  };

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
            {isEditing ? "Edit category" : "Add category"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-[#9CA3AF] hover:bg-[#F3F4F6] hover:text-[#374151] transition"
          >
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4">
          {error && (
            <div className="mb-4 font-body text-[13px] text-[#B42318] bg-[#FEF3F2] border border-[#FDA29B] rounded-lg px-3.5 py-2.5">
              {error}
            </div>
          )}
          <label className="block font-body font-medium text-[13px] text-[#374151] mb-1.5">
            Category name
          </label>
          <input
            required
            value={form.category_name}
            onChange={(e) =>
              setForm({ ...form, category_name: e.target.value })
            }
            className="font-body w-full mb-4 px-3.5 py-2.5 bg-[#F3F4F6] border border-transparent rounded-lg text-[14px] text-[#10151F] focus:outline-none focus:ring-2 focus:ring-[#2F5FEA] focus:bg-white transition"
          />
          <label className="block font-body font-medium text-[13px] text-[#374151] mb-1.5">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="font-body w-full mb-5 px-3.5 py-2.5 bg-[#F3F4F6] border border-transparent rounded-lg text-[14px] text-[#10151F] focus:outline-none focus:ring-2 focus:ring-[#2F5FEA] focus:bg-white transition resize-none"
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

export default function Categories() {
  const { confirm } = useAlert();
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [meta, setMeta] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  });

  const load = async (p = page, q = search) => {
    setLoading(true);
    setError(null);
    try {
      const res = await categoriesApi.list({ page: p, search: q || undefined });
      const { items, meta: m } = extractPaginated(res);
      setCategories(items);
      setMeta(m);
    } catch (err) {
      setError(err?.response?.data?.message ?? "Couldn't load categories.");
    } finally {
      setLoading(false);
    }
  };

  const showingFrom = useMemo(
    () => (categories.length ? (meta.current_page - 1) * 10 + 1 : 0),
    [categories, meta],
  );
  const showingTo = useMemo(
    () => (meta.current_page - 1) * 10 + categories.length,
    [categories, meta],
  );

  // Reload whenever the page changes, or the (already-debounced) search term changes
  useEffect(() => {
    load(page, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  const handleSearchChange = (next) => {
    setSearch(next);
    setPage(1); // reset to first page whenever the search term changes
  };

  const handleDelete = async (cat) => {
    const confirmed = await confirm({
      type: "error",
      title: "Delete category",
      message: `Delete "${cat.category_name}"? This can't be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
    });
    if (!confirmed) return;

    setDeletingId(cat.category_id);
    try {
      await categoriesApi.remove(cat.category_id);
      // Reload from the server (rather than filtering local state) so the
      // "Total categories" stat card and pagination stay accurate — e.g.
      // if this was the last item on the page, the page count shifts too.
      const nextPage = categories.length === 1 && page > 1 ? page - 1 : page;
      if (nextPage !== page) {
        setPage(nextPage); // triggers the [page, search] effect to reload
      } else {
        await load(nextPage, search);
      }
      toast.success(
        "Category deleted",
        `"${cat.category_name}" was deleted successfully.`,
      );
    } catch (err) {
      toast.error(
        "Delete failed",
        err?.response?.data?.message ?? "Couldn't delete this category.",
      );
    } finally {
      setDeletingId(null);
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
            Inventory
          </div>
          <h1 className="font-display font-semibold text-[26px] text-[#10151F]">
            Categories
          </h1>
          <p className="font-body text-[14px] text-[#6B7280] mt-1">
            Organize your products into categories.
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
          Add category
        </button>
      </div>

      <div className="px-6 mb-6">
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 max-w-xs mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-body text-[13px] text-[#6B7280] mb-1.5">
                Total categories
              </p>
              <p className="font-display font-semibold text-[24px] text-[#10151F]">
                {loading ? (
                  <span className="inline-block h-6 w-10 bg-[#F3F4F6] rounded animate-pulse" />
                ) : (
                  meta.total
                )}
              </p>
            </div>
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${COLORS.brand}1A` }}
            >
              <Tags size={17} style={{ color: COLORS.brand }} />
            </div>
          </div>
        </div>

        <SearchInput
          value={search}
          onChange={handleSearchChange}
          placeholder="Search categories..."
          className="max-w-xs"
        />
      </div>

      {error && !loading && (
        <div className="mx-6 mb-4 font-body text-[13px] text-[#B42318] bg-[#FEF3F2] border border-[#FDA29B] rounded-lg px-4 py-3 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => load(page, search)}
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
              <th className="px-5 py-3 font-medium">Description</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-[#F0F1F3] last:border-0">
                  <td colSpan={3} className="px-5 py-3.5">
                    <div className="h-4 bg-[#F3F4F6] rounded animate-pulse" />
                  </td>
                </tr>
              ))}

            {!loading && !error && categories.length === 0 && (
              <tr>
                <td colSpan={3} className="px-5 py-16 text-center">
                  <Tags size={28} className="mx-auto text-[#D1D5DB] mb-2" />
                  <p className="font-body text-[13.5px] text-[#6B7280]">
                    {search
                      ? `No categories match "${search}".`
                      : "No categories yet — add your first one to get started."}
                  </p>
                </td>
              </tr>
            )}

            {!loading &&
              !error &&
              categories.map((c) => (
                <tr
                  key={c.category_id}
                  className="border-b border-[#F0F1F3] last:border-0 hover:bg-[#FAFBFC]"
                >
                  <td className="px-5 py-3.5 text-[#10151F] font-medium">
                    {c.category_name}
                  </td>
                  <td className="px-5 py-3.5 text-[#6B7280]">
                    {c.description || "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          setEditing(c);
                          setShowForm(true);
                        }}
                        className="p-1.5 rounded-md text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#2F5FEA] transition"
                        aria-label={`Edit ${c.category_name}`}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(c)}
                        disabled={deletingId === c.category_id}
                        className="p-1.5 rounded-md text-[#6B7280] hover:bg-[#FEF3F2] hover:text-[#EF4444] transition disabled:opacity-40"
                        aria-label={`Delete ${c.category_name}`}
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

      {showForm && (
        <CategoryForm
          category={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            load(page, search);
          }}
        />
      )}
      {/* Pagination */}
      {!loading && !error && categories.length > 0 && (
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
    </div>
  );
}
