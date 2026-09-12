import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { Wallet, TrendingUp, Users, Download, RefreshCw } from "lucide-react";
import SearchInput from "../components/SearchInput";

// Same design tokens as Dashboard.jsx, kept consistent across pages
const COLORS = {
  brand: "#2F5FEA",
  signal: "#F4972B",
  success: "#22C55E",
  danger: "#EF4444",
  muted: "#6B7280",
};

const currency = (n) =>
  typeof n === "number"
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
      }).format(n)
    : "—";

const number = (n) =>
  typeof n === "number" ? new Intl.NumberFormat("en-US").format(n) : "—";

function firstDayOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

export default function Commissions() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [from, setFrom] = useState(firstDayOfMonth());
  const [to, setTo] = useState(todayDate());
  const [search, setSearch] = useState("");

  const load = () => {
    setLoading(true);
    setError(false);
    api
      .get("/commissions/summary", { params: { from, to } })
      .then((res) => setRows(res.data || []))
      .catch((err) => {
        console.error(err);
        setError(true);
      })
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Client-side filter — the summary endpoint already returns every
  // seller for the selected date range in one response, so there's no
  // need for a server round-trip just to narrow by name.
  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return rows;
    return rows.filter((r) =>
      (r.user_name ?? "").toLowerCase().includes(keyword),
    );
  }, [rows, search]);

  const totalCommission = filteredRows.reduce(
    (sum, r) => sum + (Number(r.total_commission) || 0),
    0,
  );
  const totalSales = filteredRows.reduce(
    (sum, r) => sum + (Number(r.total_sale_amount) || 0),
    0,
  );
  const totalSalesCount = filteredRows.reduce(
    (sum, r) => sum + (Number(r.sales_count) || 0),
    0,
  );

  return (
    <div className="bg-[#F9FAFB] min-h-full">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .font-display { font-family: 'Space Grotesk', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
        .font-mono { font-family: 'IBM Plex Mono', monospace; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.8s linear infinite; }
      `}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 px-6 pt-8 pb-6">
        <div>
          <div className="font-mono text-[11px] tracking-[0.14em] text-[#8B92A3] uppercase mb-1.5">
            Insights
          </div>
          <h1 className="font-display font-semibold text-[26px] text-[#10151F]">
            Commissions
          </h1>
          <p className="font-body text-[14px] text-[#6B7280] mt-1">
            Seller commission payouts for the selected period.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={load}
            className="font-body text-[13px] font-medium text-[#374151] bg-white border border-[#E5E7EB] rounded-lg px-3.5 py-2 flex items-center gap-1.5 hover:bg-[#F3F4F6] transition"
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} />
            Refresh
          </button>
          <button className="font-body text-[13px] font-medium text-white bg-[#2F5FEA] rounded-lg px-3.5 py-2 flex items-center gap-1.5 hover:bg-[#1E3FA6] transition">
            <Download size={14} />
            Export
          </button>
        </div>
      </div>

      {/* Date range filter + search */}
      <div className="px-6 mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="block font-body text-[12px] text-[#6B7280] mb-1">
            From
          </label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="font-body text-[13px] border border-[#E5E7EB] rounded-lg px-3 py-2 bg-white"
          />
        </div>
        <div>
          <label className="block font-body text-[12px] text-[#6B7280] mb-1">
            To
          </label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="font-body text-[13px] border border-[#E5E7EB] rounded-lg px-3 py-2 bg-white"
          />
        </div>
        <button
          onClick={load}
          className="font-body text-[13px] font-medium text-white bg-[#2F5FEA] rounded-lg px-4 py-2 hover:bg-[#1E3FA6] transition"
        >
          Apply
        </button>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by seller.."
          className="w-64"
        />
      </div>

      {/* Error state */}
      {error && !loading && (
        <div className="mx-6 mb-6 font-body text-[13px] text-[#B42318] bg-[#FEF3F2] border border-[#FDA29B] rounded-lg px-4 py-3 flex items-center justify-between">
          <span>
            Couldn't load commissions. Check your connection and try again.
          </span>
          <button
            onClick={load}
            className="font-medium underline shrink-0 ml-4"
          >
            Retry
          </button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-6 mb-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-[#E5E7EB] p-5 h-[104px] animate-pulse"
            />
          ))
        ) : (
          <>
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-body text-[13px] text-[#6B7280] mb-1.5">
                    Total commission
                  </p>
                  <p className="font-display font-semibold text-[24px] text-[#10151F]">
                    {currency(totalCommission)}
                  </p>
                </div>
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${COLORS.signal}1A` }}
                >
                  <Wallet size={17} style={{ color: COLORS.signal }} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-body text-[13px] text-[#6B7280] mb-1.5">
                    Total sales value
                  </p>
                  <p className="font-display font-semibold text-[24px] text-[#10151F]">
                    {currency(totalSales)}
                  </p>
                </div>
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${COLORS.brand}1A` }}
                >
                  <TrendingUp size={17} style={{ color: COLORS.brand }} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-body text-[13px] text-[#6B7280] mb-1.5">
                    Sellers with commissions
                  </p>
                  <p className="font-display font-semibold text-[24px] text-[#10151F]">
                    {number(filteredRows.length)}
                  </p>
                  <p className="font-mono text-[11px] text-[#9CA3AF] mt-1">
                    {number(totalSalesCount)} completed sales
                  </p>
                </div>
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${COLORS.success}1A` }}
                >
                  <Users size={17} style={{ color: COLORS.success }} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Leaderboard table */}
      <div className="mx-6 mb-8 bg-white rounded-xl border border-[#E5E7EB] overflow-x-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0F1F3]">
          <h2 className="font-display font-semibold text-[15px] text-[#10151F]">
            Seller breakdown
          </h2>
        </div>

        {loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-10 bg-[#F3F4F6] rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : filteredRows.length ? (
          <table className="w-full min-w-[640px] font-body text-[13px]">
            <thead>
              <tr className="text-left text-[#9CA3AF] text-[11.5px] uppercase font-mono tracking-wide">
                <th className="px-5 py-2.5 font-medium">Rank</th>
                <th className="px-5 py-2.5 font-medium">Seller</th>
                <th className="px-5 py-2.5 font-medium text-right">
                  Sales count
                </th>
                <th className="px-5 py-2.5 font-medium text-right">
                  Sales value
                </th>
                <th className="px-5 py-2.5 font-medium text-right">
                  Commission
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r, i) => (
                <tr key={r.user_id} className="border-t border-[#F0F1F3]">
                  <td className="px-5 py-3 text-[#9CA3AF] font-mono">
                    #{i + 1}
                  </td>
                  <td className="px-5 py-3 text-[#10151F] font-medium">
                    {r.user_name}
                  </td>
                  <td className="px-5 py-3 text-right text-[#6B7280]">
                    {number(r.sales_count)}
                  </td>
                  <td className="px-5 py-3 text-right text-[#6B7280]">
                    {currency(Number(r.total_sale_amount))}
                  </td>
                  <td className="px-5 py-3 text-right text-[#22C55E] font-semibold">
                    {currency(Number(r.total_commission))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-5 py-10 text-center font-body text-[13px] text-[#9CA3AF]">
            {search
              ? "No sellers match your search."
              : "No commissions recorded for this period."}
          </div>
        )}
      </div>
    </div>
  );
}
