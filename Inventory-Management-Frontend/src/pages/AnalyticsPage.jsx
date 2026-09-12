import { useEffect, useState } from "react";
import { TrendingUp, RefreshCw, AlertTriangle, Package } from "lucide-react";
import api from "../services/api";

export default function AnalyticsPage() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authExpired, setAuthExpired] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    setAuthExpired(false);
    try {
      const res = await api.get("/recommendations");
      setRecommendations(res.data.recommendations ?? []);
    } catch (err) {
      if (err?.response?.status === 401) {
        setAuthExpired(true);
      } else {
        setError(
          err?.response?.data?.message ??
            "Couldn't load purchase recommendations.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const needsReorderCount = recommendations.filter(
    (r) => r.needs_reorder_now,
  ).length;

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
            Reports
          </div>
          <h1 className="font-display font-semibold text-[26px] text-[#10151F]">
            Purchase Recommendations
          </h1>
          <p className="font-body text-[14px] text-[#6B7280] mt-1">
            Suggested reorder quantities based on recent demand.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="font-body text-[13px] font-medium text-[#374151] bg-white border border-[#E5E7EB] rounded-lg px-4 py-2.5 flex items-center gap-1.5 hover:bg-[#F3F4F6] transition w-fit disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-6 mb-6">
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="font-body text-[12.5px] text-[#6B7280]">
              Total products tracked
            </p>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[#2F5FEA1A]">
              <Package size={15} style={{ color: "#2F5FEA" }} />
            </div>
          </div>
          <p className="font-display font-semibold text-[20px] text-[#10151F]">
            {loading ? (
              <span className="inline-block h-5 w-12 bg-[#F3F4F6] rounded animate-pulse" />
            ) : (
              recommendations.length
            )}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="font-body text-[12.5px] text-[#6B7280]">
              Need reordering now
            </p>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[#F4972B1A]">
              <AlertTriangle size={15} style={{ color: "#F4972B" }} />
            </div>
          </div>
          <p className="font-display font-semibold text-[20px] text-[#10151F]">
            {loading ? (
              <span className="inline-block h-5 w-12 bg-[#F3F4F6] rounded animate-pulse" />
            ) : (
              needsReorderCount
            )}
          </p>
        </div>
      </div>

      {authExpired && (
        <div className="mx-6 mb-4 font-body text-[13px] text-[#B42318] bg-[#FEF3F2] border border-[#FDA29B] rounded-lg px-4 py-3">
          Your session has expired. Please log in again.
        </div>
      )}

      {error && !loading && !authExpired && (
        <div className="mx-6 mb-4 font-body text-[13px] text-[#B42318] bg-[#FEF3F2] border border-[#FDA29B] rounded-lg px-4 py-3 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={load}
            className="font-medium underline shrink-0 ml-4"
          >
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      {!authExpired && (
        <div className="mx-6 mb-8 bg-white rounded-xl border border-[#E5E7EB] overflow-x-auto">
          <table className="w-full min-w-[640px] font-body text-[13.5px]">
            <thead>
              <tr className="text-left text-[#9CA3AF] text-[11px] uppercase font-mono tracking-wide border-b border-[#F0F1F3]">
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium text-right">
                  Current stock
                </th>
                <th className="px-5 py-3 font-medium text-right">
                  Avg daily demand
                </th>
                <th className="px-5 py-3 font-medium text-right">
                  Reorder point
                </th>
                <th className="px-5 py-3 font-medium text-right">
                  Recommended qty
                </th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr
                    key={i}
                    className="border-b border-[#F0F1F3] last:border-0"
                  >
                    <td colSpan={6} className="px-5 py-3.5">
                      <div className="h-4 bg-[#F3F4F6] rounded animate-pulse" />
                    </td>
                  </tr>
                ))}

              {!loading && !error && recommendations.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <TrendingUp
                      size={28}
                      className="mx-auto text-[#D1D5DB] mb-2"
                    />
                    <p className="font-body text-[13.5px] text-[#6B7280]">
                      No products found.
                    </p>
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                recommendations.map((item) => {
                  const noData =
                    item.status === "no_data" || item.status === "not_found";
                  return (
                    <tr
                      key={item.product_id}
                      className={`border-b border-[#F0F1F3] last:border-0 hover:bg-[#FAFBFC] ${
                        item.needs_reorder_now ? "bg-[#FEF6EC]" : ""
                      }`}
                    >
                      {noData ? (
                        <>
                          <td className="px-5 py-3.5 text-[#10151F] font-medium">
                            {item.product_name ?? `Product #${item.product_id}`}
                          </td>
                          <td
                            className="px-5 py-3.5 italic text-[#9CA3AF]"
                            colSpan={4}
                          >
                            {item.message}
                          </td>
                          <td className="px-5 py-3.5 text-[#9CA3AF]">—</td>
                        </>
                      ) : (
                        <>
                          <td className="px-5 py-3.5 text-[#10151F] font-medium">
                            {item.product_name}
                          </td>
                          <td className="px-5 py-3.5 text-right text-[#6B7280]">
                            {item.current_stock}
                          </td>
                          <td className="px-5 py-3.5 text-right text-[#6B7280]">
                            {item.avg_daily_demand}
                          </td>
                          <td className="px-5 py-3.5 text-right text-[#6B7280]">
                            {item.reorder_point}
                          </td>
                          <td className="px-5 py-3.5 text-right text-[#10151F] font-medium">
                            {item.recommended_order_qty}
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-full font-body text-[11.5px] font-medium"
                              style={
                                item.needs_reorder_now
                                  ? {
                                      color: "#F4972B",
                                      backgroundColor: "#FEF6EC",
                                    }
                                  : {
                                      color: "#22C55E",
                                      backgroundColor: "#EFFBF3",
                                    }
                              }
                            >
                              {item.needs_reorder_now ? "Reorder now" : "OK"}
                            </span>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
