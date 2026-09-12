import { useEffect, useMemo, useState } from "react";
import {
  History,
  Package,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { stockHistoryApi, productsApi } from "../services/service";
import api from "../services/api";
import { extractPaginated } from "../utils/extractPaginated";

export default function StockHistory() {
  const [entries, setEntries] = useState([]);
  const [products, setProducts] = useState([]);
  const [productFilter, setProductFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 10,
  });
  const [stats, setStats] = useState(null);

  const load = async (productId = productFilter, pageNum = page) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page: pageNum };
      if (productId) params.product_id = productId;
      const res = await stockHistoryApi.list(params);
      setEntries(res.data.data ?? []);
      setMeta({
        current_page: res.data.current_page ?? 1,
        last_page: res.data.last_page ?? 1,
        total: res.data.total ?? (res.data.data ?? []).length,
        per_page: res.data.per_page ?? 10,
      });
    } catch (err) {
      setError(err?.response?.data?.message ?? "Couldn't load stock history.");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = (productId = productFilter) => {
    const params = productId ? { product_id: productId } : {};
    api
      .get("/stock-histories/stats", { params })
      .then((res) => setStats(res.data))
      .catch(() => {});
  };

  useEffect(() => {
    load(productFilter, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    productsApi
      .list({ per_page: 100 })
      .then((res) => setProducts(extractPaginated(res).items))
      .catch(() => {});
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (e) => {
    const productId = e.target.value;
    setProductFilter(productId);
    setPage(1);
    load(productId, 1);
    loadStats(productId);
  };

  const showingFrom = useMemo(
    () => (entries.length ? (meta.current_page - 1) * meta.per_page + 1 : 0),
    [entries, meta],
  );
  const showingTo = useMemo(
    () => (meta.current_page - 1) * meta.per_page + entries.length,
    [entries, meta],
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
      <div className="px-6 pt-8 pb-6">
        <div className="font-mono text-[11px] tracking-[0.14em] text-[#8B92A3] uppercase mb-1.5">
          Inventory
        </div>
        <h1 className="font-display font-semibold text-[26px] text-[#10151F]">
          Stock History
        </h1>
        <p className="font-body text-[14px] text-[#6B7280] mt-1">
          A log of every stock change, automatically recorded.
        </p>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-6 mb-6">
        {[
          {
            label: "Total entries",
            value: stats?.total,
            icon: Package,
            accent: "#2F5FEA",
          },
          {
            label: "Stock increases",
            value: stats?.increases,
            icon: TrendingUp,
            accent: "#22C55E",
          },
          {
            label: "Stock decreases",
            value: stats?.decreases,
            icon: TrendingDown,
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
          value={productFilter}
          onChange={handleFilterChange}
          className="font-body px-3 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-[13.5px] text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#2F5FEA] transition"
        >
          <option value="">All products</option>
          {products.map((p) => (
            <option key={p.product_id} value={p.product_id}>
              {p.product_name}
            </option>
          ))}
        </select>
      </div>

      {error && !loading && (
        <div className="mx-6 mb-4 font-body text-[13px] text-[#B42318] bg-[#FEF3F2] border border-[#FDA29B] rounded-lg px-4 py-3 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => load(productFilter, page)}
            className="font-medium underline shrink-0 ml-4"
          >
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      <div className="mx-6 mb-8 bg-white rounded-xl border border-[#E5E7EB] overflow-x-auto">
        <table className="w-full min-w-[640px] font-body text-[13.5px]">
          <thead>
            <tr className="text-left text-[#9CA3AF] text-[11px] uppercase font-mono tracking-wide border-b border-[#F0F1F3]">
              <th className="px-5 py-3 font-medium">Product</th>
              <th className="px-5 py-3 font-medium">Type</th>
              <th className="px-5 py-3 font-medium text-right">Change</th>
              <th className="px-5 py-3 font-medium">Before → after</th>
              <th className="px-5 py-3 font-medium">When</th>
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-[#F0F1F3] last:border-0">
                  <td colSpan={5} className="px-5 py-3.5">
                    <div className="h-4 bg-[#F3F4F6] rounded animate-pulse" />
                  </td>
                </tr>
              ))}

            {!loading && !error && entries.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-16 text-center">
                  <History size={28} className="mx-auto text-[#D1D5DB] mb-2" />
                  <p className="font-body text-[13.5px] text-[#6B7280]">
                    {productFilter
                      ? "No stock changes for this product yet."
                      : "No stock changes recorded yet."}
                  </p>
                </td>
              </tr>
            )}

            {!loading &&
              !error &&
              entries.map((e) => {
                const positive = e.quantity >= 0;
                return (
                  <tr
                    key={e.history_id}
                    className="border-b border-[#F0F1F3] last:border-0 hover:bg-[#FAFBFC]"
                  >
                    <td className="px-5 py-3.5 text-[#10151F] font-medium">
                      {e.product?.product_name ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-[#6B7280]">
                      {e.transaction_type}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[11.5px] font-medium"
                        style={{
                          color: positive ? "#22C55E" : "#EF4444",
                          backgroundColor: positive ? "#EFFBF3" : "#FEF3F2",
                        }}
                      >
                        {positive ? "+" : ""}
                        {e.quantity}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[12.5px] text-[#6B7280]">
                      {e.old_quantity} → {e.new_quantity}
                    </td>
                    <td className="px-5 py-3.5 text-[#9CA3AF] text-[12.5px]">
                      {new Date(e.created_at).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>

        {/* Pagination */}
        {!loading && !error && entries.length > 0 && (
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
