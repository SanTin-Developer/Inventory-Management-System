import {
  LayoutDashboard,
  Package,
  Tags,
  Truck,
  ShoppingCart,
  TrendingUp,
  History,
  Contact2,
  BarChart3,
  Building2,
  ShieldCheck,
  Users,
  FileClock,
  Sparkles,
  LineChart,
  Wallet
} from "lucide-react";

export const NAV_ITEMS = [
  // ---- Overview ----
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard", category: "Overview", order: 1 },

  // ---- Inventory ----
  { label: "Products", icon: Package, path: "/products", category: "Inventory", order: 1 },
  { label: "Categories", icon: Tags, path: "/categories", category: "Inventory", order: 2 },
  { label: "Suppliers", icon: Truck, path: "/suppliers", category: "Inventory", order: 3 },
  { label: "Stock History", icon: History, path: "/stock-history", category: "Inventory", order: 4 },

  // ---- Sales & Purchases ----
  { label: "Purchases", icon: ShoppingCart, path: "/purchases", category: "Sales & Purchases", order: 1 },
  { label: "Sales", icon: TrendingUp, path: "/sales", category: "Sales & Purchases", order: 2 },
  { label: "Customers", icon: Contact2, path: "/customers", category: "Sales & Purchases", order: 3 },

  // ---- Insights ----
  { label: "Reports", icon: BarChart3, path: "/reports", category: "Insights", order: 1 },
  { label: "Recommendations", icon: Sparkles, path: "/recommendations", category: "Insights", order: 2 },
  { label: "Buy vs Sale Analytics", icon: LineChart, path: "/analytics/buy-vs-sale", category: "Insights", order: 3 },
  { label: "Commissions", icon: Wallet, path: "/commissions", category: "Insights", order: 4 },

  // ---- Admin ----
  { label: "Departments", icon: Building2, path: "/departments", adminOnly: true, category: "Admin", order: 1 },
  { label: "Roles", icon: ShieldCheck, path: "/roles", adminOnly: true, category: "Admin", order: 2 },
  { label: "Users", icon: Users, path: "/users", adminOnly: true, category: "Admin", order: 3 },
  { label: "Audit Log", icon: FileClock, path: "/audit-log", adminOnly: true, category: "Admin", order: 4 },
];

// Explicit category order (so section headers appear top-to-bottom in this sequence)
const CATEGORY_ORDER = ["Overview", "Inventory", "Sales & Purchases", "Insights", "Admin"];

// Groups NAV_ITEMS by category, sorted correctly within each group
export const getGroupedNavItems = (items = NAV_ITEMS) => {
  const groups = {};

  items.forEach((item) => {
    if (!groups[item.category]) groups[item.category] = [];
    groups[item.category].push(item);
  });

  return CATEGORY_ORDER
    .filter((cat) => groups[cat]) // skip empty categories
    .map((cat) => ({
      category: cat,
      items: [...groups[cat]].sort((a, b) => a.order - b.order),
    }));
};

export const getFlatNavItems = (items = NAV_ITEMS) =>
  getGroupedNavItems(items).flatMap((group) => group.items);