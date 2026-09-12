import { useEffect, useState } from "react";
import api from "../services/api";
import {
  Package,
  Truck,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Download,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// DigiLife design tokens — kept consistent with pages/Auth/Login.jsx
const COLORS = {
  ink: "#10151F",
  brand: "#2F5FEA",
  brandDeep: "#1E3FA6",
  signal: "#F4972B",
  success: "#22C55E",
  danger: "#EF4444",
  muted: "#6B7280",
  field: "#F3F4F6",
  paper: "#F9FAFB",
};

const PIE_COLORS = ["#2F5FEA", "#F4972B", "#22C55E", "#8B92A3", "#1E3FA6"];

const currency = (n) =>
  typeof n === "number"
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(n)
    : "—";

const number = (n) =>
  typeof n === "number" ? new Intl.NumberFormat("en-US").format(n) : "—";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    api
      .get("/dashboard")
      .then((res) => {
        setStats(res.data);
      })
      .catch((err) => {
        console.error(err);
        setError(true);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const cards = stats
    ? [
        {
          label: "Total products",
          value: number(stats.total_products),
          delta: stats.total_products_change,
          icon: Package,
          accent: COLORS.brand,
        },
        {
          label: "Suppliers",
          value: number(stats.total_suppliers),
          delta: stats.total_suppliers_change,
          icon: Truck,
          accent: COLORS.muted,
        },
        {
          label: "Purchases",
          value: number(stats.total_purchases),
          delta: stats.total_purchases_change,
          icon: ShoppingCart,
          accent: COLORS.muted,
        },
        {
          label: "Sales",
          value: number(stats.total_sales),
          delta: stats.total_sales_change,
          icon: TrendingUp,
          accent: COLORS.success,
        },
        {
          label: "Low stock items",
          value: number(stats.low_stock),
          delta: stats.low_stock_change,
          icon: AlertTriangle,
          accent: COLORS.danger,
          invertDelta: true,
        },
        {
          label: "Inventory value",
          value: currency(stats.inventory_value),
          delta: stats.inventory_value_change,
          icon: Wallet,
          accent: COLORS.signal,
        },
      ]
    : [];

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
            Overview
          </div>
          <h1 className="font-display font-semibold text-[26px] text-[#10151F]">
            Dashboard
          </h1>
          <p className="font-body text-[14px] text-[#6B7280] mt-1">
            A snapshot of stock, orders, and revenue across your warehouses.
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
            Export report
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && !loading && (
        <div className="mx-6 mb-6 font-body text-[13px] text-[#B42318] bg-[#FEF3F2] border border-[#FDA29B] rounded-lg px-4 py-3 flex items-center justify-between">
          <span>
            Couldn't load dashboard data. Check your connection and try again.
          </span>
          <button
            onClick={load}
            className="font-medium underline shrink-0 ml-4"
          >
            Retry
          </button>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-6">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-[#E5E7EB] p-5 h-[104px] animate-pulse"
              />
            ))
          : cards.map((c) => {
              const Icon = c.icon;
              const hasDelta = typeof c.delta === "number";
              const isUp = hasDelta && c.delta >= 0;
              const isGood = hasDelta && (c.invertDelta ? !isUp : isUp);
              return (
                <div
                  key={c.label}
                  className="bg-white rounded-xl border border-[#E5E7EB] p-5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-body text-[13px] text-[#6B7280] mb-1.5">
                        {c.label}
                      </p>
                      <p className="font-display font-semibold text-[24px] text-[#10151F]">
                        {c.value}
                      </p>
                    </div>
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${c.accent}1A` }}
                    >
                      <Icon size={17} style={{ color: c.accent }} />
                    </div>
                  </div>
                  {hasDelta && (
                    <div
                      className="flex items-center gap-1 mt-3 font-mono text-[12px]"
                      style={{ color: isGood ? COLORS.success : COLORS.danger }}
                    >
                      {isUp ? (
                        <ArrowUpRight size={13} />
                      ) : (
                        <ArrowDownRight size={13} />
                      )}
                      {Math.abs(c.delta)}%
                      <span className="text-[#9CA3AF] font-body ml-0.5">
                        vs last period
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 px-6 mt-4">
        {/* Sales vs purchases trend */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#E5E7EB] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display font-semibold text-[15px] text-[#10151F]">
                Sales & purchases
              </h2>
              <p className="font-body text-[12px] text-[#9CA3AF]">
                Last 30 days
              </p>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px] text-[#6B7280]">
              <span className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: COLORS.brand }}
                />
                Sales
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: COLORS.signal }}
                />
                Purchases
              </span>
            </div>
          </div>

          {loading ? (
            <div className="h-64 animate-pulse bg-[#F3F4F6] rounded-lg" />
          ) : stats?.sales_trend?.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={stats.sales_trend}>
                <defs>
                  <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor={COLORS.brand}
                      stopOpacity={0.25}
                    />
                    <stop
                      offset="100%"
                      stopColor={COLORS.brand}
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient
                    id="purchasesFill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={COLORS.signal}
                      stopOpacity={0.2}
                    />
                    <stop
                      offset="100%"
                      stopColor={COLORS.signal}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#F0F1F3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#9CA3AF", fontFamily: "Inter" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9CA3AF", fontFamily: "Inter" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    fontFamily: "Inter",
                    fontSize: 12,
                    borderRadius: 8,
                    border: "1px solid #E5E7EB",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke={COLORS.brand}
                  strokeWidth={2}
                  fill="url(#salesFill)"
                />
                <Area
                  type="monotone"
                  dataKey="purchases"
                  stroke={COLORS.signal}
                  strokeWidth={2}
                  fill="url(#purchasesFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No trend data yet. It'll show up here once sales and purchases start coming in." />
          )}
        </div>

        {/* Inventory by category */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
          <h2 className="font-display font-semibold text-[15px] text-[#10151F] mb-4">
            Inventory by category
          </h2>
          {loading ? (
            <div className="h-64 animate-pulse bg-[#F3F4F6] rounded-lg" />
          ) : stats?.category_breakdown?.length ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={stats.category_breakdown}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={2}
                  >
                    {stats.category_breakdown.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      fontFamily: "Inter",
                      fontSize: 12,
                      borderRadius: 8,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {stats.category_breakdown.map((c, i) => (
                  <div
                    key={c.name}
                    className="flex items-center justify-between font-body text-[12.5px]"
                  >
                    <span className="flex items-center gap-2 text-[#374151]">
                      <span
                        className="w-2 h-2 rounded-full inline-block"
                        style={{
                          backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                        }}
                      />
                      {c.name}
                    </span>
                    <span className="text-[#9CA3AF] font-mono">
                      {number(c.value)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyChart message="No category data yet." />
          )}
        </div>
      </div>

      {/* Low stock + recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 px-6 mt-4 pb-8">
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#E5E7EB] overflow-x-auto">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0F1F3]">
            <h2 className="font-display font-semibold text-[15px] text-[#10151F]">
              Needs restocking
            </h2>
            <a
              href="/products"
              className="font-body text-[12.5px] font-medium text-[#2F5FEA] hover:text-[#1E3FA6]"
            >
              View inventory
            </a>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-10 bg-[#F3F4F6] rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : stats?.low_stock_items?.length ? (
            <table className="w-full min-w-[640px] font-body text-[13px]">
              <thead>
                <tr className="text-left text-[#9CA3AF] text-[11.5px] uppercase font-mono tracking-wide">
                  <th className="px-5 py-2.5 font-medium">Product</th>
                  <th className="px-5 py-2.5 font-medium">SKU</th>
                  <th className="px-5 py-2.5 font-medium text-right">
                    In stock
                  </th>
                  <th className="px-5 py-2.5 font-medium text-right">
                    Reorder at
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.low_stock_items.map((item, i) => (
                  <tr key={item.sku ?? i} className="border-t border-[#F0F1F3]">
                    <td className="px-5 py-3 text-[#10151F] font-medium">
                      {item.name}
                    </td>
                    <td className="px-5 py-3 text-[#9CA3AF] font-mono text-[12px]">
                      {item.sku}
                    </td>
                    <td className="px-5 py-3 text-right text-[#EF4444] font-medium">
                      {number(item.quantity_in_stock)}
                    </td>
                    <td className="px-5 py-3 text-right text-[#9CA3AF]">
                      {number(item.reorder_level)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="px-5 py-10 text-center font-body text-[13px] text-[#9CA3AF]">
              Nothing needs restocking right now.
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-x-auto">
          <div className="px-5 py-4 border-b border-[#F0F1F3]">
            <h2 className="font-display font-semibold text-[15px] text-[#10151F]">
              Recent activity
            </h2>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-9 bg-[#F3F4F6] rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : stats?.recent_activity?.length ? (
            <ul className="divide-y divide-[#F0F1F3]">
              {stats.recent_activity.map((a, i) => (
                <li
                  key={i}
                  className="px-5 py-3 font-body text-[13px] text-[#374151] flex items-center justify-between"
                >
                  <span>{a.message}</span>
                  <span className="font-mono text-[11px] text-[#9CA3AF] shrink-0 ml-3">
                    {a.time}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-5 py-10 text-center font-body text-[13px] text-[#9CA3AF]">
              No recent activity.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyChart({ message }) {
  return (
    <div className="h-64 flex items-center justify-center text-center font-body text-[12.5px] text-[#9CA3AF] px-6">
      {message}
    </div>
  );
}
