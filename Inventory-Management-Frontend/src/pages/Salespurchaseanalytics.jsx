import { useEffect, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Package,
} from "lucide-react";
import api from "../services/api";

const currency = (n) => {
  const num = typeof n === "number" ? n : parseFloat(n);
  return Number.isFinite(num)
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(num)
    : "—";
};

export default function SalesPurchaseAnalytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [purchaseSummary, setPurchaseSummary] = useState(null);
  const [salesSummary, setSalesSummary] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [slowMoving, setSlowMoving] = useState([]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [purchaseRes, salesRes, topRes, slowRes] = await Promise.all([
        api.get("/reports/purchase-summary"),
        api.get("/reports/sales-summary"),
        api.get("/reports/top-products", { params: { limit: 5 } }),
        api.get("/reports/slow-moving", { params: { limit: 5 } }),
      ]);

      // Real shapes confirmed via devtools:
      // purchase-summary: { by_status, by_supplier, from, to, total_purchases, total_spend }
      // sales-summary: { breakdown, by_payment_method, from, group_by, to, total_revenue, total_sales }

      setPurchaseSummary({
        total: Number(purchaseRes.data?.total_spend ?? 0),
        raw: purchaseRes.data,
      });
      setSalesSummary({
        total: Number(salesRes.data?.total_revenue ?? 0),
        raw: salesRes.data,
      });

      // Real shape confirmed via devtools for top-products:
      // { from, to, order_by, products: [{ product_id, product_name,
      //   product_code, total_quantity_sold, total_revenue }] }
      // Slow-moving shape still unconfirmed.

      const toArray = (data) => {
        if (Array.isArray(data?.products)) return data.products;
        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.data)) return data.data;
        return [];
      };

      setTopProducts(toArray(topRes.data));
      setSlowMoving(toArray(slowRes.data));
    } catch (err) {
      setError(err?.response?.data?.message ?? "Couldn't load analytics data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const totalSales = salesSummary?.total ?? 0;
  const totalPurchases = purchaseSummary?.total ?? 0;
  const net = totalSales - totalPurchases;

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
            Insights
          </div>
          <h1 className="font-display font-semibold text-[26px] text-[#10151F]">
            Buy vs Sale Analytics
          </h1>
          <p className="font-body text-[14px] text-[#6B7280] mt-1">
            Purchase and sales value, plus top and slow-moving products.
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

      {error && !loading && (
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

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-6 mb-6">
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="font-body text-[12.5px] text-[#6B7280]">
              Total sales
            </p>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[#22C55E1A]">
              <ArrowUpRight size={15} style={{ color: "#22C55E" }} />
            </div>
          </div>
          <p className="font-display font-semibold text-[20px] text-[#10151F]">
            {loading ? (
              <span className="inline-block h-5 w-16 bg-[#F3F4F6] rounded animate-pulse" />
            ) : (
              currency(totalSales)
            )}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="font-body text-[12.5px] text-[#6B7280]">
              Total purchases
            </p>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[#EF44441A]">
              <ArrowDownRight size={15} style={{ color: "#EF4444" }} />
            </div>
          </div>
          <p className="font-display font-semibold text-[20px] text-[#10151F]">
            {loading ? (
              <span className="inline-block h-5 w-16 bg-[#F3F4F6] rounded animate-pulse" />
            ) : (
              currency(totalPurchases)
            )}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="font-body text-[12.5px] text-[#6B7280]">
              Net (sales − purchases)
            </p>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{
                backgroundColor: `${net >= 0 ? "#2F5FEA" : "#EF4444"}1A`,
              }}
            >
              <Wallet
                size={15}
                style={{ color: net >= 0 ? "#2F5FEA" : "#EF4444" }}
              />
            </div>
          </div>
          <p
            className="font-display font-semibold text-[20px]"
            style={{ color: net >= 0 ? "#10151F" : "#EF4444" }}
          >
            {loading ? (
              <span className="inline-block h-5 w-16 bg-[#F3F4F6] rounded animate-pulse" />
            ) : (
              currency(net)
            )}
          </p>
        </div>
      </div>

      {/* Top sellers / Slow movers side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-6 mb-8">
        {/* Top sellers */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-x-auto">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#F0F1F3]">
            <TrendingUp size={15} style={{ color: "#22C55E" }} />
            <h2 className="font-display font-semibold text-[14px] text-[#10151F]">
              Top-selling products
            </h2>
          </div>
          <table className="w-full min-w-[640px] font-body text-[13.5px]">
            <thead>
              <tr className="text-left text-[#9CA3AF] text-[11px] uppercase font-mono tracking-wide border-b border-[#F0F1F3]">
                <th className="px-5 py-2.5 font-medium">Product</th>
                <th className="px-5 py-2.5 font-medium text-right">Qty sold</th>
                <th className="px-5 py-2.5 font-medium text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {loading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr
                    key={i}
                    className="border-b border-[#F0F1F3] last:border-0"
                  >
                    <td colSpan={3} className="px-5 py-3">
                      <div className="h-4 bg-[#F3F4F6] rounded animate-pulse" />
                    </td>
                  </tr>
                ))}
              {!loading && topProducts.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-10 text-center">
                    <Package
                      size={24}
                      className="mx-auto text-[#D1D5DB] mb-2"
                    />
                    <p className="font-body text-[13px] text-[#6B7280]">
                      No sales data yet.
                    </p>
                  </td>
                </tr>
              )}
              {!loading &&
                topProducts.map((p) => (
                  <tr
                    key={p.product_id}
                    className="border-b border-[#F0F1F3] last:border-0 hover:bg-[#FAFBFC]"
                  >
                    <td className="px-5 py-3 text-[#10151F] font-medium">
                      {p.product_name}
                    </td>
                    <td className="px-5 py-3 text-right text-[#6B7280]">
                      {p.total_quantity_sold}
                    </td>
                    <td className="px-5 py-3 text-right text-[#10151F] font-medium">
                      {currency(p.total_revenue)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Slow movers */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-x-auto">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#F0F1F3]">
            <TrendingDown size={15} style={{ color: "#EF4444" }} />
            <h2 className="font-display font-semibold text-[14px] text-[#10151F]">
              Slow-moving products
            </h2>
          </div>
          <table className="w-full min-w-[640px] font-body text-[13.5px]">
            <thead>
              <tr className="text-left text-[#9CA3AF] text-[11px] uppercase font-mono tracking-wide border-b border-[#F0F1F3]">
                <th className="px-5 py-2.5 font-medium">Product</th>
                <th className="px-5 py-2.5 font-medium text-right">Qty sold</th>
                <th className="px-5 py-2.5 font-medium text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {loading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr
                    key={i}
                    className="border-b border-[#F0F1F3] last:border-0"
                  >
                    <td colSpan={3} className="px-5 py-3">
                      <div className="h-4 bg-[#F3F4F6] rounded animate-pulse" />
                    </td>
                  </tr>
                ))}
              {!loading && slowMoving.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-10 text-center">
                    <Package
                      size={24}
                      className="mx-auto text-[#D1D5DB] mb-2"
                    />
                    <p className="font-body text-[13px] text-[#6B7280]">
                      No slow-moving products found.
                    </p>
                  </td>
                </tr>
              )}
              {!loading &&
                slowMoving.map((p, i) => (
                  <tr
                    key={p.product_id ?? i}
                    className="border-b border-[#F0F1F3] last:border-0 hover:bg-[#FAFBFC]"
                  >
                    <td className="px-5 py-3 text-[#10151F] font-medium">
                      {p.product_name}
                    </td>
                    <td className="px-5 py-3 text-right text-[#6B7280]">
                      {p.total_quantity_sold}
                    </td>
                    <td className="px-5 py-3 text-right text-[#10151F] font-medium">
                      {currency(p.total_revenue)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
