import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Package,
  Wallet,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  purchasesApi,
  suppliersApi,
  productsApi,
} from "../../services/service";
import { extractPaginated } from "../../utils/extractPaginated";
import PurchaseForm from "./PurchaseForm";
import PurchaseDetail from "./PurchaseDetail";
import api from "../../services/api";
import { useToast } from "../../components/Toastsystem";
import { useAlert } from "../../components/Alertsystem";

const STATUS_STYLE = {
  Received: { color: "#22C55E", bg: "#EFFBF3" },
  Cancelled: { color: "#EF4444", bg: "#FEF3F2" },
  Pending: { color: "#F4972B", bg: "#FEF6EC" },
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

export default function Purchases() {
  const { confirm } = useAlert();
  const toast = useToast();
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 10,
  });
  const [showForm, setShowForm] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [viewingId, setViewingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [stats, setStats] = useState(null);

  const load = async (status = statusFilter, pageNum = page) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page: pageNum };
      if (status) params.status = status;
      const res = await purchasesApi.list(params);
      setPurchases(res.data.data ?? []);
      setMeta({
        current_page: res.data.current_page ?? 1,
        last_page: res.data.last_page ?? 1,
        total: res.data.total ?? (res.data.data ?? []).length,
        per_page: res.data.per_page ?? 10,
      });
    } catch (err) {
      setError(err?.response?.data?.message ?? "Couldn't load purchases.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(statusFilter, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    suppliersApi
      .list({ per_page: 100 })
      .then((res) => setSuppliers(extractPaginated(res).items))
      .catch(() => {});
    productsApi
      .list({ per_page: 100 })
      .then((res) => setProducts(extractPaginated(res).items))
      .catch(() => {});
  }, []);

  useEffect(() => {
    api
      .get("/purchases/stats")
      .then((res) => setStats(res.data))
      .catch(() => {});
  }, []);

  const handleFilterChange = (e) => {
    const status = e.target.value;
    setStatusFilter(status);
    setPage(1);
    load(status, 1);
  };

  const openCreate = () => {
    setEditingPurchase(null);
    setShowForm(true);
  };

  const openEdit = async (purchase) => {
    try {
      const res = await purchasesApi.get(purchase.purchase_id);
      const full = res.data?.data ?? res.data;
      setEditingPurchase(full);
      setShowForm(true);
    } catch (err) {
      toast.error(
        "Edit failed",
        err?.response?.data?.message ??
          "Couldn't load this purchase for editing.",
      );
    }
  };

  const handleDelete = async (p) => {
    const confirmed = await confirm({
      type: "error",
      title: "Delete purchase",
      message: `Delete this purchase from "${
        p.supplier?.supplier_name ?? "supplier"
      }"? This can't be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
    });
    if (!confirmed) return;
    setDeletingId(p.purchase_id);
    try {
      await purchasesApi.remove(p.purchase_id);
      load(statusFilter, page);
      toast.success(
        "Purchase deleted",
        `Purchase #${p.purchase_id} was deleted successfully.`,
      );
    } catch (err) {
      toast.error(
        "Delete failed",
        err?.response?.data?.message ?? "Couldn't delete this purchase.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const showingFrom = useMemo(
    () => (purchases.length ? (meta.current_page - 1) * meta.per_page + 1 : 0),
    [purchases, meta],
  );
  const showingTo = useMemo(
    () => (meta.current_page - 1) * meta.per_page + purchases.length,
    [purchases, meta],
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
            Purchases
          </h1>
          <p className="font-body text-[14px] text-[#6B7280] mt-1">
            {meta.total
              ? `${meta.total} purchases from your suppliers.`
              : "Track stock received from suppliers."}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="font-body text-[13px] font-medium text-white bg-[#2F5FEA] rounded-lg px-4 py-2.5 flex items-center gap-1.5 hover:bg-[#1E3FA6] transition w-fit"
        >
          <Plus size={15} />
          New purchase
        </button>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 px-6 mb-6">
        {[
          {
            label: "Total purchases",
            value: stats?.total,
            icon: Package,
            accent: "#2F5FEA",
          },
          {
            label: "Total amount",
            value: stats ? currency(stats.total_amount) : undefined,
            icon: Wallet,
            accent: "#2F5FEA",
          },
          {
            label: "Pending",
            value: stats?.pending,
            icon: Clock,
            accent: "#F4972B",
          },
          {
            label: "Received",
            value: stats?.received,
            icon: CheckCircle2,
            accent: "#22C55E",
          },
          {
            label: "Cancelled",
            value: stats?.cancelled,
            icon: XCircle,
            accent: "#EF4444",
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
        <select
          value={statusFilter}
          onChange={handleFilterChange}
          className="font-body px-3 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-[13.5px] text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#2F5FEA] transition"
        >
          <option value="">All statuses</option>
          <option value="Pending">Pending</option>
          <option value="Received">Received</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {error && !loading && (
        <div className="mx-6 mb-4 font-body text-[13px] text-[#B42318] bg-[#FEF3F2] border border-[#FDA29B] rounded-lg px-4 py-3 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => load()}
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
              <th className="px-5 py-3 font-medium">Supplier</th>
              <th className="px-5 py-3 font-medium">Recorded by</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium text-right">Total</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-[#F0F1F3] last:border-0">
                  <td colSpan={6} className="px-5 py-3.5">
                    <div className="h-4 bg-[#F3F4F6] rounded animate-pulse" />
                  </td>
                </tr>
              ))}

            {!loading && !error && purchases.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center">
                  <ShoppingCart
                    size={28}
                    className="mx-auto text-[#D1D5DB] mb-2"
                  />
                  <p className="font-body text-[13.5px] text-[#6B7280]">
                    {statusFilter
                      ? "No purchases match this status."
                      : "No purchases recorded yet."}
                  </p>
                </td>
              </tr>
            )}

            {!loading &&
              !error &&
              purchases.map((p) => {
                const status = STATUS_STYLE[p.status] ?? STATUS_STYLE.Pending;
                return (
                  <tr
                    key={p.purchase_id}
                    className="border-b border-[#F0F1F3] last:border-0 hover:bg-[#FAFBFC]"
                  >
                    <td className="px-5 py-3.5 text-[#10151F] font-medium">
                      {p.supplier?.supplier_name ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-[#6B7280]">
                      {p.user?.name ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-[#6B7280]">
                      {new Date(p.purchase_date).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right text-[#10151F] font-medium">
                      {currency(p.total_amount)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full font-body text-[11.5px] font-medium"
                        style={{
                          color: status.color,
                          backgroundColor: status.bg,
                        }}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewingId(p.purchase_id)}
                          className="p-1.5 rounded-md text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#2F5FEA] transition"
                          aria-label="View purchase"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => openEdit(p)}
                          className="p-1.5 rounded-md text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#2F5FEA] transition"
                          aria-label="Edit purchase"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          disabled={deletingId === p.purchase_id}
                          className="p-1.5 rounded-md text-[#6B7280] hover:bg-[#FEF3F2] hover:text-[#EF4444] transition disabled:opacity-40"
                          aria-label="Delete purchase"
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
        {!loading && !error && purchases.length > 0 && (
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
        <PurchaseForm
          purchase={editingPurchase}
          suppliers={suppliers}
          products={products}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            setEditingPurchase(null);
            load(statusFilter, page);
          }}
        />
      )}

      {viewingId && (
        <PurchaseDetail
          purchaseId={viewingId}
          onClose={() => setViewingId(null)}
        />
      )}
    </div>
  );
}
