import { useEffect, useState } from "react";
import {
  RefreshCw,
  TrendingUp,
  Wallet,
  Package,
  AlertTriangle,
  ShoppingCart,
  TurtleIcon,
} from "lucide-react";
import { reportsApi } from "../services/service";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = {
  brand: "#2F5FEA",
  brandDeep: "#1E3FA6",
  signal: "#F4972B",
  success: "#22C55E",
  danger: "#EF4444",
  muted: "#6B7280",
};
const PIE_COLORS = ["#2F5FEA", "#F4972B", "#22C55E", "#8B92A3", "#1E3FA6"];

const currency = (n) => {
  const num = typeof n === "number" ? n : parseFloat(n);
  return Number.isFinite(num)
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(num)
    : "—";
};
const number = (n) => {
  const num = typeof n === "number" ? n : parseFloat(n);
  return Number.isFinite(num)
    ? new Intl.NumberFormat("en-US").format(num)
    : "—";
};

const todayISO = () => new Date().toISOString().slice(0, 10);
const daysAgoISO = (n) =>
  new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

function SectionCard({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
      <div className="mb-4">
        <h2 className="font-display font-semibold text-[15px] text-[#10151F]">
          {title}
        </h2>
        {subtitle && (
          <p className="font-body text-[12px] text-[#9CA3AF]">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function EmptyNote({ children }) {
  return (
    <div className="h-48 flex items-center justify-center text-center font-body text-[12.5px] text-[#9CA3AF] px-6">
      {children}
    </div>
  );
}

export default function Reports() {
  const [from, setFrom] = useState(daysAgoISO(30));
  const [to, setTo] = useState(todayISO());
  const [groupBy, setGroupBy] = useState("day");
  const [topOrderBy, setTopOrderBy] = useState("quantity");
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const [sales, setSales] = useState(null);
  const [purchases, setPurchases] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [topProducts, setTopProducts] = useState(null);
  const [slowMoving, setSlowMoving] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);

    Promise.allSettled([
      reportsApi.salesSummary({ from, to, group_by: groupBy }),
      reportsApi.purchaseSummary({ from, to }),
      reportsApi.inventory({ low_stock_only: lowStockOnly ? 1 : 0 }),
      reportsApi.topProducts({ from, to, limit: 5, order_by: topOrderBy }),
      reportsApi.slowMoving({ from, to, limit: 5 }),
    ]).then(([salesRes, purchasesRes, invRes, topRes, slowRes]) => {
      setSales(salesRes.status === "fulfilled" ? salesRes.value.data : null);
      setPurchases(
        purchasesRes.status === "fulfilled" ? purchasesRes.value.data : null,
      );
      setInventory(invRes.status === "fulfilled" ? invRes.value.data : null);
      setTopProducts(
        topRes.status === "fulfilled"
          ? (topRes.value.data?.products ?? [])
          : [],
      );
      setSlowMoving(
        slowRes.status === "fulfilled"
          ? (slowRes.value.data?.products ?? [])
          : [],
      );
      [salesRes, purchasesRes, invRes, topRes, slowRes].forEach((r) => {
        if (r.status === "rejected") console.error(r.reason);
      });
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const revenueByPeriod = (sales?.breakdown ?? []).map((b) => ({
    period: b.period,
    revenue: parseFloat(b.total_revenue) || 0,
  }));

  const paymentData = (sales?.by_payment_method ?? []).map((p) => ({
    name: p.payment_method,
    value: parseFloat(p.total_revenue) || 0,
    sales: parseInt(p.total_sales, 10) || 0,
  }));

  const supplierSpend = (purchases?.by_supplier ?? []).map((s) => ({
    name: s.supplier_name,
    spend: parseFloat(s.total_spend) || 0,
    purchases: parseInt(s.total_purchases, 10) || 0,
  }));

  const statusData = (purchases?.by_status ?? []).map((s) => ({
    name: s.status,
    value: parseFloat(s.total_spend) || 0,
    purchases: parseInt(s.total_purchases, 10) || 0,
  }));

  const maxSupplierSpend = Math.max(...supplierSpend.map((x) => x.spend), 1);

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
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 px-6 pt-8 pb-6">
        <div>
          <div className="font-mono text-[11px] tracking-[0.14em] text-[#8B92A3] uppercase mb-1.5">
            Analytics
          </div>
          <h1 className="font-display font-semibold text-[26px] text-[#10151F]">
            Reports
          </h1>
          <p className="font-body text-[14px] text-[#6B7280] mt-1">
            Sales, purchases, and inventory performance for the selected period.
          </p>
        </div>
        <button
          onClick={load}
          className="font-body text-[13px] font-medium text-[#374151] bg-white border border-[#E5E7EB] rounded-lg px-3.5 py-2 flex items-center gap-1.5 hover:bg-[#F3F4F6] transition w-fit"
        >
          <RefreshCw size={14} className={loading ? "spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 px-6 mb-4">
        <div>
          <label className="block font-body text-[12px] font-medium text-[#6B7280] mb-1">
            From
          </label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="font-body px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-[13px] text-[#10151F] focus:outline-none focus:ring-2 focus:ring-[#2F5FEA] transition"
          />
        </div>
        <div>
          <label className="block font-body text-[12px] font-medium text-[#6B7280] mb-1">
            To
          </label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="font-body px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-[13px] text-[#10151F] focus:outline-none focus:ring-2 focus:ring-[#2F5FEA] transition"
          />
        </div>
        <div>
          <label className="block font-body text-[12px] font-medium text-[#6B7280] mb-1">
            Group by
          </label>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            className="font-body px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-[13px] text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#2F5FEA] transition"
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
        </div>
        <div>
          <label className="block font-body text-[12px] font-medium text-[#6B7280] mb-1">
            Top products by
          </label>
          <select
            value={topOrderBy}
            onChange={(e) => setTopOrderBy(e.target.value)}
            className="font-body px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-[13px] text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#2F5FEA] transition"
          >
            <option value="quantity">Quantity sold</option>
            <option value="revenue">Revenue</option>
          </select>
        </div>
        <label className="flex items-center gap-2 px-3 py-2 font-body text-[13px] text-[#374151]">
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(e) => setLowStockOnly(e.target.checked)}
            className="rounded accent-[#2F5FEA]"
          />
          Low stock only
        </label>
        <button
          onClick={load}
          className="font-body text-[13px] font-medium text-white bg-[#2F5FEA] rounded-lg px-4 py-2 hover:bg-[#1E3FA6] transition"
        >
          Apply
        </button>
      </div>

      {/* Top-level stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-6">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-[#E5E7EB] p-5 h-[104px] animate-pulse"
              />
            ))
          : [
              {
                label: "Revenue",
                value: currency(sales?.total_revenue),
                sub: `${number(sales?.total_sales)} sales`,
                icon: TrendingUp,
                accent: COLORS.success,
              },
              {
                label: "Purchase spend",
                value: currency(purchases?.total_spend),
                sub: `${number(purchases?.total_purchases)} orders`,
                icon: ShoppingCart,
                accent: COLORS.signal,
              },
              {
                label: "Inventory value",
                value: currency(inventory?.total_retail_value),
                sub: `${currency(inventory?.total_cost_value)} at cost`,
                icon: Wallet,
                accent: COLORS.brand,
              },
              {
                label: "Low stock items",
                value: number(inventory?.low_stock_count),
                sub: `of ${number(inventory?.total_products)} products`,
                icon: AlertTriangle,
                accent: COLORS.danger,
              },
            ].map((c) => {
              const Icon = c.icon;
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
                      <p className="font-display font-semibold text-[22px] text-[#10151F]">
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
                  <p className="font-mono text-[11px] text-[#9CA3AF] mt-3">
                    {c.sub}
                  </p>
                </div>
              );
            })}
      </div>

      {/* Sales charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 px-6 mt-4">
        <div className="lg:col-span-2">
          <SectionCard title="Revenue by period" subtitle={`${from} – ${to}`}>
            {loading ? (
              <div className="h-64 animate-pulse bg-[#F3F4F6] rounded-lg" />
            ) : revenueByPeriod.length ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={revenueByPeriod}>
                  <CartesianGrid vertical={false} stroke="#F0F1F3" />
                  <XAxis
                    dataKey="period"
                    tick={{
                      fontSize: 11,
                      fill: "#9CA3AF",
                      fontFamily: "Inter",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{
                      fontSize: 11,
                      fill: "#9CA3AF",
                      fontFamily: "Inter",
                    }}
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
                  <Bar
                    dataKey="revenue"
                    fill={COLORS.brand}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyNote>No sales in this period yet.</EmptyNote>
            )}
          </SectionCard>
        </div>

        <SectionCard title="By payment method">
          {loading ? (
            <div className="h-64 animate-pulse bg-[#F3F4F6] rounded-lg" />
          ) : paymentData.length ? (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={paymentData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={42}
                    outerRadius={65}
                    paddingAngle={2}
                  >
                    {paymentData.map((_, i) => (
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
                {paymentData.map((p, i) => (
                  <div
                    key={p.name}
                    className="flex items-center justify-between font-body text-[12.5px]"
                  >
                    <span className="flex items-center gap-2 text-[#374151]">
                      <span
                        className="w-2 h-2 rounded-full inline-block"
                        style={{
                          backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                        }}
                      />
                      {p.name}
                      <span className="text-[#9CA3AF] font-mono text-[11px]">
                        ({p.sales})
                      </span>
                    </span>
                    <span className="text-[#10151F] font-medium">
                      {currency(p.value)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyNote>No payment data for this period.</EmptyNote>
          )}
        </SectionCard>
      </div>

      {/* Purchases */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 px-6 mt-4">
        <div className="lg:col-span-2">
          <SectionCard
            title="Purchase spend by supplier"
            subtitle={`${from} – ${to}`}
          >
            {loading ? (
              <div className="h-56 animate-pulse bg-[#F3F4F6] rounded-lg" />
            ) : supplierSpend.length ? (
              <div className="space-y-3">
                {supplierSpend
                  .slice()
                  .sort((a, b) => b.spend - a.spend)
                  .map((s) => (
                    <div key={s.name}>
                      <div className="flex items-center justify-between font-body text-[13px] mb-1">
                        <span className="text-[#374151] font-medium">
                          {s.name}
                        </span>
                        <span className="text-[#10151F] font-medium">
                          {currency(s.spend)}{" "}
                          <span className="text-[#9CA3AF] font-mono text-[11px]">
                            ({s.purchases})
                          </span>
                        </span>
                      </div>
                      <div className="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(s.spend / maxSupplierSpend) * 100}%`,
                            backgroundColor: COLORS.signal,
                          }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <EmptyNote>No purchases in this period yet.</EmptyNote>
            )}
          </SectionCard>
        </div>

        <SectionCard title="By status">
          {loading ? (
            <div className="h-56 animate-pulse bg-[#F3F4F6] rounded-lg" />
          ) : statusData.length ? (
            <div className="space-y-2.5 mt-1">
              {statusData.map((s, i) => (
                <div
                  key={s.name}
                  className="flex items-center justify-between font-body text-[12.5px]"
                >
                  <span className="flex items-center gap-2 text-[#374151]">
                    <span
                      className="w-2 h-2 rounded-full inline-block"
                      style={{
                        backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                      }}
                    />
                    {s.name}
                    <span className="text-[#9CA3AF] font-mono text-[11px]">
                      ({s.purchases})
                    </span>
                  </span>
                  <span className="text-[#10151F] font-medium">
                    {currency(s.value)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyNote>No status data for this period.</EmptyNote>
          )}
        </SectionCard>
      </div>

      {/* Top products + Slow moving */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-6 mt-4 mb-8">
        <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-x-auto">
          <div className="px-5 py-4 border-b border-[#F0F1F3]">
            <h2 className="font-display font-semibold text-[15px] text-[#10151F]">
              Top-selling products
            </h2>
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
          ) : topProducts?.length ? (
            <table className="w-full min-w-[640px] font-body text-[13.5px]">
              <thead>
                <tr className="text-left text-[#9CA3AF] text-[11px] uppercase font-mono tracking-wide">
                  <th className="px-5 py-2.5 font-medium">Product</th>
                  <th className="px-5 py-2.5 font-medium text-right">Units</th>
                  <th className="px-5 py-2.5 font-medium text-right">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, i) => (
                  <tr
                    key={p.product_id ?? i}
                    className="border-t border-[#F0F1F3]"
                  >
                    <td className="px-5 py-3 text-[#10151F] font-medium">
                      {p.product_name ?? "—"}
                      {p.product_code && (
                        <span className="block font-mono text-[11px] text-[#9CA3AF]">
                          {p.product_code}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right text-[#4B5563]">
                      {number(p.total_quantity_sold)}
                    </td>
                    <td className="px-5 py-3 text-right text-[#10151F] font-medium">
                      {currency(p.total_revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="px-5 py-10 text-center">
              <Package size={24} className="mx-auto text-[#D1D5DB] mb-2" />
              <p className="font-body text-[13px] text-[#9CA3AF]">
                No product sales in this period yet.
              </p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-x-auto">
          <div className="px-5 py-4 border-b border-[#F0F1F3]">
            <h2 className="font-display font-semibold text-[15px] text-[#10151F]">
              Slow-moving products
            </h2>
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
          ) : slowMoving?.length ? (
            <table className="w-full min-w-[640px] font-body text-[13.5px]">
              <thead>
                <tr className="text-left text-[#9CA3AF] text-[11px] uppercase font-mono tracking-wide">
                  <th className="px-5 py-2.5 font-medium">Product</th>
                  <th className="px-5 py-2.5 font-medium text-right">
                    Units sold
                  </th>
                </tr>
              </thead>
              <tbody>
                {slowMoving.map((p, i) => (
                  <tr
                    key={p.product_id ?? i}
                    className="border-t border-[#F0F1F3]"
                  >
                    <td className="px-5 py-3 text-[#10151F] font-medium">
                      {p.product_name ?? `Product #${p.product_id ?? i + 1}`}
                    </td>
                    <td className="px-5 py-3 text-right text-[#4B5563]">
                      {number(p.total_quantity_sold)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="px-5 py-10 text-center">
              <TurtleIcon size={24} className="mx-auto text-[#D1D5DB] mb-2" />
              <p className="font-body text-[13px] text-[#9CA3AF]">
                No slow-moving products in this period.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
