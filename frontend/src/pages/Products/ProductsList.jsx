import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  PackageX,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";
import { productService } from "../../services/service";
import api from "../../services/api";
import { extractPaginated } from "../../utils/extractPaginated";
import ProductForm from "./ProductForm";
import {
  Package,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Wallet,
} from "lucide-react";
import { useAlert } from "../../components/Alertsystem";
import { useToast } from "../../components/Toastsystem";

const COLORS = {
  brand: "#2F5FEA",
  danger: "#EF4444",
  signal: "#F4972B",
  success: "#22C55E",
  muted: "#6B7280",
};

const currency = (n) => {
  const num = typeof n === "number" ? n : parseFloat(n);
  return Number.isFinite(num)
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(num)
    : "—";
};

function stockStatus(product) {
  const qty = parseFloat(product.quantity_in_stock) || 0;
  const reorder = parseFloat(product.reorder_level) || 0;
  if (qty <= 0)
    return { label: "Out of stock", color: COLORS.danger, bg: "#FEF3F2" };
  if (qty <= reorder)
    return { label: "Low stock", color: COLORS.signal, bg: "#FEF6EC" };
  return { label: "In stock", color: COLORS.success, bg: "#EFFBF3" };
}

export default function ProductList() {
  const { confirm } = useAlert();
  const toast = useToast(); // NOTE: useToast() returns { success, error, info, ... } directly — don't destructure { toast }
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [deletingId, setDeletingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [stats, setStats] = useState(null);

  // Debounce search so we're not hitting the API on every keystroke
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    api
      .get("/categories", { params: { all: true } })
      .then((res) => setCategories(extractPaginated(res).items))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    api
      .get("/products/stats")
      .then((res) => setStats(res.data))
      .catch(() => {});
  }, []);

  const load = () => {
    setLoading(true);
    setError(false);
    productService
      .getProducts({
        search: debouncedSearch || undefined,
        category: category || undefined,
        page,
        per_page: 10,
      })
      .then((res) => {
        setProducts(res.data ?? []);
        setMeta({
          current_page: res.current_page ?? 1,
          last_page: res.last_page ?? 1,
          total: res.total ?? (res.data ?? []).length,
        });
      })
      .catch((err) => {
        console.error(err);
        setError(true);
      })
      .finally(() => setLoading(false));
  };

  // Model
  const openAddModal = () => {
    setEditingProductId(null);
    setModalOpen(true);
  };

  const openEditModal = (id) => {
    setEditingProductId(id);
    setModalOpen(true);
  };

  const handleModalSaved = () => {
    setModalOpen(false);
    load();
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, category, page]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category]);

  const handleDelete = async (product) => {
    const confirmed = await confirm({
      type: "error",
      title: "Delete product",
      message: `Are you sure you want to delete "${product.product_name}"? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
    });
    if (!confirmed) return;

    setDeletingId(product.product_id);
    try {
      await productService.deleteProduct(product.product_id);
      await load();
      toast.success(
        "Product deleted",
        `"${product.product_name}" was deleted successfully.`,
      );
    } catch (err) {
      toast.error(
        "Delete failed",
        err?.response?.data?.message ?? "Couldn't delete this product.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const showingFrom = useMemo(
    () => (products.length ? (meta.current_page - 1) * 10 + 1 : 0),
    [products, meta],
  );
  const showingTo = useMemo(
    () => (meta.current_page - 1) * 10 + products.length,
    [products, meta],
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
            Products
          </h1>
          <p className="font-body text-[14px] text-[#6B7280] mt-1">
            {meta.total
              ? `${meta.total} products across all categories.`
              : "Manage your product catalog."}
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="font-body text-[13px] font-medium text-white bg-[#2F5FEA] rounded-lg px-4 py-2.5 flex items-center gap-1.5 hover:bg-[#1E3FA6] transition w-fit"
        >
          <Plus size={15} />
          Add product
        </button>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 px-6 mb-6">
        {[
          {
            label: "Total products",
            value: stats?.total,
            icon: Package,
            accent: COLORS.brand,
          },
          {
            label: "In stock",
            value: stats?.in_stock,
            icon: CheckCircle2,
            accent: COLORS.success,
          },
          {
            label: "Low stock",
            value: stats?.low_stock,
            icon: AlertTriangle,
            accent: COLORS.signal,
          },
          {
            label: "Out of stock",
            value: stats?.out_of_stock,
            icon: XCircle,
            accent: COLORS.danger,
          },
          {
            label: "Inventory value",
            value: stats ? currency(stats.inventory_value) : undefined,
            icon: Wallet,
            accent: COLORS.brand,
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 px-6 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or code…"
            className="font-body w-full pl-9 pr-3 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-[13.5px] text-[#10151F] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2F5FEA] transition"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="font-body px-3 py-3 bg-white border border-[#E5E7EB] rounded-lg text-[13.5px] text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#2F5FEA] transition"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.category_id} value={c.category_id}>
              {c.category_name}
            </option>
          ))}
        </select>
      </div>

      {error && !loading && (
        <div className="mx-6 mb-4 font-body text-[13px] text-[#B42318] bg-[#FEF3F2] border border-[#FDA29B] rounded-lg px-4 py-3 flex items-center justify-between">
          <span>
            Couldn't load products. Check your connection and try again.
          </span>
          <button
            onClick={load}
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
              <th className="px-5 py-3 font-medium">Product</th>
              <th className="px-5 py-3 font-medium">Code</th>
              <th className="px-5 py-3 font-medium">Category</th>
              <th className="px-5 py-3 font-medium text-right">Cost</th>
              <th className="px-5 py-3 font-medium text-right">Price</th>
              <th className="px-5 py-3 font-medium text-right">Stock</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-[#F0F1F3] last:border-0">
                  <td colSpan={8} className="px-5 py-3.5">
                    <div className="h-4 bg-[#F3F4F6] rounded animate-pulse" />
                  </td>
                </tr>
              ))}

            {!loading && !error && products.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-16 text-center">
                  <PackageX size={28} className="mx-auto text-[#D1D5DB] mb-2" />
                  <p className="font-body text-[13.5px] text-[#6B7280]">
                    {debouncedSearch || category
                      ? "No products match your filters."
                      : "No products yet — add your first one to get started."}
                  </p>
                </td>
              </tr>
            )}

            {!loading &&
              !error &&
              products.map((p) => {
                const status = stockStatus(p);
                return (
                  <tr
                    key={p.product_id}
                    className="border-b border-[#F0F1F3] last:border-0 hover:bg-[#FAFBFC]"
                  >
                    <td className="px-5 py-3.5 text-[#10151F] font-medium">
                      {p.product_name}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[12px] text-[#9CA3AF]">
                      {p.product_code}
                    </td>
                    <td className="px-5 py-3.5 text-[#4B5563]">
                      {p.category?.category_name ?? "Uncategorized"}
                    </td>
                    <td className="px-5 py-3.5 text-right text-[#4B5563]">
                      {currency(p.cost_price)}
                    </td>
                    <td className="px-5 py-3.5 text-right text-[#10151F] font-medium">
                      {currency(p.unit_price)}
                    </td>
                    <td className="px-5 py-3.5 text-right text-[#10151F]">
                      {parseFloat(p.quantity_in_stock) || 0}{" "}
                      <span className="text-[#9CA3AF] text-[12px]">
                        {p.unit}
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
                        {status.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/products/${p.product_id}/view`}
                          className="p-1.5 rounded-md text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#2F5FEA] transition"
                          aria-label={`View ${p.product_name}`}
                        >
                          <Eye size={15} />
                        </Link>
                        <button
                          onClick={() => openEditModal(p.product_id)}
                          className="p-1.5 rounded-md text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#2F5FEA] transition"
                          aria-label={`Edit ${p.product_name}`}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          disabled={deletingId === p.product_id}
                          className="p-1.5 rounded-md text-[#6B7280] hover:bg-[#FEF3F2] hover:text-[#EF4444] transition disabled:opacity-40"
                          aria-label={`Delete ${p.product_name}`}
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
        <ProductForm
          open={modalOpen}
          productId={editingProductId}
          onClose={() => setModalOpen(false)}
          onSaved={handleModalSaved}
        />
        {/* Pagination */}
        {!loading && !error && products.length > 0 && (
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
    </div>
  );
}
