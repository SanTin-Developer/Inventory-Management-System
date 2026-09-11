import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, useNavigate, matchPath } from "react-router-dom";
import {
  Menu,
  Search,
  X,
  Bell,
  ChevronDown,
  UserCircle,
  LogOut,
  AlertTriangle,
  Package,
  Tag,
  Truck,
  Users,
  ShoppingCart,
  Receipt,
  Loader2,
} from "lucide-react";
import { useAuth } from "../hook/useAuth";
import { NAV_ITEMS } from "../config/navConfig"; // <-- same config Sidebar now reads from; adjust path if needed
import api from "../services/api";
import { useLowStock } from "../contexts/LowStockContext";
import { CustomerDetail } from "../pages/Customers";
import GlobalSearch from "./GlobalSearch";

const SEARCH_SECTIONS = [
  {
    key: "products",
    label: "Products",
    icon: Package,
    getId: (item) => item.product_id,
    getTitle: (item) => item.product_name,
    getSubtitle: (item) =>
      `${item.product_code} · ${item.quantity_in_stock} in stock`,
    getPath: (item) => `/products/${item.product_id}/view`,
  },
  {
    key: "categories",
    label: "Categories",
    icon: Tag,
    getId: (item) => item.category_id,
    getTitle: (item) => item.category_name,
    getSubtitle: () => "Category",
    getPath: () => `/categories`,
  },
  {
    key: "suppliers",
    label: "Suppliers",
    icon: Truck,
    getId: (item) => item.supplier_id,
    getTitle: (item) => item.supplier_name,
    getSubtitle: () => "Supplier",
    getPath: () => `/suppliers`,
  },
  {
    key: "customers",
    label: "Customers",
    icon: Users,
    getId: (item) => item.customer_id,
    getTitle: (item) => item.customer_name,
    getSubtitle: () => "Customer",
    getPath: () => `/customers`,
  },
  {
    key: "sales",
    label: "Sales",
    icon: ShoppingCart,
    getId: (item) => item.sale_id,
    getTitle: (item) => `Sale #${item.sale_id}`,
    getSubtitle: (item) => `${item.customer_name} · ${item.status}`,
    getPath: () => `/sales`,
  },
  {
    key: "purchases",
    label: "Purchases",
    icon: Receipt,
    getId: (item) => item.purchase_id,
    getTitle: (item) => `Purchase #${item.purchase_id}`,
    getSubtitle: (item) => `${item.supplier_name} · ${item.status}`,
    getPath: (item) => `/purchases/${item.purchase_id}`,
  },
];

function SearchQuickView({ section, item, onClose, onViewFull }) {
  const entries = Object.entries(item).filter(
    ([key]) => !key.toLowerCase().endsWith("_id"),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10151F]/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#F0F1F3] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <section.icon size={16} className="text-[#2F5FEA]" />
            <h2 className="font-display font-semibold text-[15px] text-[#10151F]">
              {section.getTitle(item)}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-[#9CA3AF] hover:bg-[#F3F4F6] hover:text-[#374151] transition"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-3 max-h-80 overflow-y-auto">
          {entries.map(([key, value]) => (
            <div
              key={key}
              className="flex items-start justify-between py-2 border-b border-[#F0F1F3] last:border-0"
            >
              <span className="font-mono text-[10.5px] uppercase tracking-wide text-[#9CA3AF]">
                {key.replace(/_/g, " ")}
              </span>
              <span className="font-body text-[13px] text-[#10151F] text-right">
                {String(value ?? "—")}
              </span>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2.5 border-t border-[#F0F1F3] px-5 py-4">
          <button
            onClick={onClose}
            className="font-body text-[13px] font-medium text-[#374151] bg-white border border-[#E5E7EB] rounded-lg px-4 py-2.5 hover:bg-[#F3F4F6] transition"
          >
            Close
          </button>
          <button
            onClick={onViewFull}
            className="font-body text-[13px] font-medium text-white bg-[#2F5FEA] rounded-lg px-4 py-2.5 hover:bg-[#1E3FA6] transition"
          >
            View full page
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Navbar({ onOpenMobileSidebar }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const [quickView, setQuickView] = useState(null);

  const [alertsOpen, setAlertsOpen] = useState(false);
  const alertsRef = useRef(null);
  const {
    lowStockCount,
    lowStockItems,
    loading: loadingAlerts,
  } = useLowStock();

  // --- global search ---
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);
  const debounceRef = useRef(null);
  const requestIdRef = useRef(0);
  const [customerQuickView, setCustomerQuickView] = useState(null);

  const current = NAV_ITEMS.find((item) =>
    matchPath(item.path + "/*", location.pathname),
  );
  const pageTitle = current?.label ?? "Overview";

  // Close dropdowns on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setMenuOpen(false);
      if (alertsRef.current && !alertsRef.current.contains(e.target))
        setAlertsOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target))
        setSearchOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const runSearch = useCallback((term) => {
    const thisRequestId = ++requestIdRef.current;
    setSearchLoading(true);
    setSearchError(false);

    api
      .get("/search", { params: { q: term } })
      .then((res) => {
        if (thisRequestId !== requestIdRef.current) return;
        setSearchResults(res.data);
      })
      .catch(() => {
        if (thisRequestId !== requestIdRef.current) return;
        setSearchError(true);
        setSearchResults(null);
      })
      .finally(() => {
        if (thisRequestId !== requestIdRef.current) return;
        setSearchLoading(false);
      });
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setSearchOpen(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setSearchResults(null);
      setSearchLoading(false);
      setSearchError(false);
      return;
    }

    debounceRef.current = setTimeout(() => runSearch(trimmed), 300);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults(null);
    setSearchOpen(false);
    setSearchError(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Escape") {
      clearSearch();
      searchInputRef.current?.blur();
    }
  };

  const goToResult = (section, item) => {
    setSearchOpen(false);
    if (section.key === "customers") {
      setCustomerQuickView(item);
    } else {
      setQuickView({ section, item });
    }
  };
  const hasQuery = searchQuery.trim().length >= 2;
  const visibleSections = searchResults
    ? SEARCH_SECTIONS.filter((s) => (searchResults[s.key]?.length ?? 0) > 0)
    : [];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials =
    user?.name
      ?.split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "?";

  return (
    <header className="h-16 shrink-0 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden text-[#4B5563] hover:text-[#10151F] shrink-0"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <div className="min-w-0">
          <h1 className="font-display font-semibold text-[16px] text-[#10151F] truncate">
            {pageTitle}
          </h1>
        </div>
      </div>

      <div
        className="hidden md:flex items-center relative flex-1 max-w-sm mx-6"
        ref={searchRef}
      >
        <Search
          size={15}
          className="absolute left-3 text-[#9CA3AF] pointer-events-none"
        />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          onFocus={() => hasQuery && setSearchOpen(true)}
          onKeyDown={handleSearchKeyDown}
          placeholder="Search products, orders, suppliers…"
          className="font-body w-full pl-9 pr-8 py-2 bg-[#F3F4F6] border border-transparent rounded-lg text-[13px] text-[#10151F] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2F5FEA] focus:bg-white transition"
        />
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-2.5 text-[#9CA3AF] hover:text-[#4B5563]"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}

        {searchOpen && hasQuery && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-[#E5E7EB] rounded-lg shadow-lg font-body text-[13px] max-h-[26rem] overflow-y-auto">
            {searchLoading ? (
              <div className="px-4 py-6 flex items-center justify-center gap-2 text-[#9CA3AF]">
                <Loader2 size={14} className="animate-spin" />
                Searching…
              </div>
            ) : searchError ? (
              <div className="px-4 py-6 text-center text-[#9CA3AF]">
                Couldn't run that search — try again.
              </div>
            ) : visibleSections.length === 0 ? (
              <div className="px-4 py-6 text-center text-[#9CA3AF]">
                No results for "{searchQuery.trim()}"
              </div>
            ) : (
              visibleSections.map((section) => (
                <div
                  key={section.key}
                  className="py-1.5 border-b border-[#F0F1F3] last:border-0"
                >
                  <div className="px-4 pt-1 pb-1.5 font-mono text-[10.5px] text-[#9CA3AF] uppercase tracking-wide">
                    {section.label}
                  </div>
                  {searchResults[section.key].map((item) => (
                    <button
                      key={section.getId(item)}
                      onClick={() => goToResult(section, item)}
                      className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-[#F3F4F6] text-left"
                    >
                      <section.icon
                        size={15}
                        className="text-[#4B5563] shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-[#10151F] font-medium truncate">
                          {section.getTitle(item)}
                        </p>
                        <p className="text-[#9CA3AF] text-[12px] mt-0.5 truncate">
                          {section.getSubtitle(item)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="relative" ref={alertsRef}>
          <button
            onClick={() => setAlertsOpen((o) => !o)}
            className="relative w-9 h-9 rounded-full flex items-center justify-center text-[#4B5563] hover:bg-[#F3F4F6] transition"
            aria-label="Low stock alerts"
          >
            <Bell size={18} />
            {lowStockCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#EF4444] text-white font-mono text-[9.5px] leading-4 text-center">
                {lowStockCount > 99 ? "99+" : lowStockCount}
              </span>
            )}
          </button>

          {alertsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E5E7EB] rounded-lg shadow-lg font-body text-[13px] max-h-96 overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b border-[#F0F1F3] flex items-center justify-between">
                <span className="font-display font-semibold text-[14px] text-[#10151F]">
                  Low stock alerts
                </span>
                {lowStockCount > 0 && (
                  <span className="font-mono text-[11px] text-[#EF4444]">
                    {lowStockCount} item{lowStockCount === 1 ? "" : "s"}
                  </span>
                )}
              </div>

              <div className="overflow-y-auto">
                {loadingAlerts ? (
                  <div className="px-4 py-6 text-center text-[#9CA3AF]">
                    Loading…
                  </div>
                ) : lowStockItems.length === 0 ? (
                  <div className="px-4 py-6 text-center text-[#9CA3AF]">
                    Nothing needs restocking right now.
                  </div>
                ) : (
                  lowStockItems.map((item, i) => (
                    <div
                      key={item.sku ?? i}
                      className="px-4 py-3 border-b border-[#F0F1F3] last:border-0 flex items-start gap-2.5"
                    >
                      <AlertTriangle
                        size={15}
                        className="text-[#EF4444] mt-0.5 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-[#10151F] font-medium truncate">
                          {item.name}
                        </p>
                        <p className="text-[#9CA3AF] text-[12px] mt-0.5">
                          {item.quantity_in_stock} left · reorder at{" "}
                          {item.reorder_level}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button
                onClick={() => {
                  setAlertsOpen(false);
                  navigate("/products");
                }}
                className="px-4 py-2.5 text-center text-[#2F5FEA] hover:bg-[#F3F4F6] font-medium border-t border-[#F0F1F3] shrink-0"
              >
                View inventory
              </button>
            </div>
          )}
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-full hover:bg-[#F3F4F6] transition"
          >
            {user?.image_url ? (
              <img
                src={user.image_url}
                alt={user?.name ?? "User"}
                className="w-8 h-8 rounded-full object-cover shrink-0"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <span className="w-8 h-8 rounded-full bg-[#2F5FEA] text-white font-body text-[12px] font-semibold flex items-center justify-center shrink-0">
                {initials}
              </span>
            )}
            <span className="hidden sm:block text-left">
              <span className="block font-body text-[13px] font-medium text-[#10151F] leading-tight">
                {user?.name ?? "Account"}
              </span>
              <span className="block font-mono text-[10.5px] text-[#9CA3AF] uppercase leading-tight">
                {user?.role?.role_name ?? "user"}
              </span>
            </span>
            <ChevronDown size={14} className="text-[#9CA3AF]" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-[#E5E7EB] rounded-lg shadow-lg py-1.5 font-body text-[13px]">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/profile");
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[#374151] hover:bg-[#F3F4F6] text-left"
              >
                <UserCircle size={15} />
                My Profile
              </button>
              <div className="h-px bg-[#F0F1F3] my-1" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[#EF4444] hover:bg-[#FEF3F2] text-left"
              >
                <LogOut size={15} />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
      {customerQuickView && (
        <CustomerDetail
          customer={customerQuickView}
          onClose={() => setCustomerQuickView(null)}
          onEdit={() => {
            setCustomerQuickView(null);
            navigate("/customers");
          }}
        />
      )}
      {quickView && (
        <SearchQuickView
          section={quickView.section}
          item={quickView.item}
          onClose={() => setQuickView(null)}
          onViewFull={() => {
            setQuickView(null);
            navigate(quickView.section.getPath(quickView.item));
          }}
        />
      )}
    </header>
  );
}
