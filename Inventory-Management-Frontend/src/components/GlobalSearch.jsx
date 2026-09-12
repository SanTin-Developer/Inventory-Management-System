import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  X,
  Package,
  Tag,
  Truck,
  Users,
  ShoppingCart,
  FileText,
} from "lucide-react";
import api from "../services/api"; // adjust path to match your project structure

// Maps each result "type" coming back from /search to an icon, a label,
// and the route it should push the user to when clicked.
const TYPE_CONFIG = {
  product: {
    label: "Products",
    icon: Package,
    route: (item) => `/products/${item.id}`,
  },
  category: {
    label: "Categories",
    icon: Tag,
    route: (item) => `/categories/${item.id}`,
  },
  supplier: {
    label: "Suppliers",
    icon: Truck,
    route: (item) => `/suppliers/${item.id}`,
  },
  customer: {
    label: "Customers",
    icon: Users,
    route: (item) => `/customers/${item.id}`,
  },
  sale: {
    label: "Sales",
    icon: ShoppingCart,
    route: (item) => `/sales/${item.id}`,
  },
  purchase: {
    label: "Purchases",
    icon: FileText,
    route: (item) => `/purchases/${item.id}`,
  },
};

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null); // { product: [...], category: [...], ... }
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);
  const navigate = useNavigate();

  // Flatten grouped results into a single ordered list for keyboard navigation
  const flatResults = results
    ? Object.entries(results).flatMap(([type, items]) =>
        (items || []).map((item) => ({ type, item })),
      )
    : [];

  const runSearch = useCallback(async (q) => {
    if (!q.trim()) {
      setResults(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.get("/search", { params: { q } });
      setResults(res.data); // expected shape: { product: [], category: [], supplier: [], customer: [], sale: [], purchase: [] }
      setActiveIndex(-1);
    } catch (err) {
      console.error("Search failed:", err);
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(value), 300);
  };

  const goToResult = (type, item) => {
    const config = TYPE_CONFIG[type];
    if (!config) return;
    setIsOpen(false);
    setQuery("");
    setResults(null);
    navigate(config.route(item));
  };

  const handleKeyDown = (e) => {
    if (!isOpen || flatResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % flatResults.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? flatResults.length - 1 : prev - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      const { type, item } = flatResults[activeIndex];
      goToResult(type, item);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const clearSearch = () => {
    setQuery("");
    setResults(null);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside the component
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasResults = flatResults.length > 0;
  let runningIndex = -1;

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      {/* Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => query && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search products, orders, suppliers..."
          className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-9 text-sm text-gray-700
                     placeholder:text-gray-400 outline-none transition-colors
                     focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && query && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-96 overflow-y-auto">
          {isLoading && (
            <div className="px-4 py-3 text-sm text-gray-500">Searching…</div>
          )}

          {!isLoading && !hasResults && (
            <div className="px-4 py-3 text-sm text-gray-500">
              No results for "{query}"
            </div>
          )}

          {!isLoading &&
            hasResults &&
            Object.entries(results).map(([type, items]) => {
              if (!items || items.length === 0) return null;
              const config = TYPE_CONFIG[type];
              if (!config) return null;
              const Icon = config.icon;

              return (
                <div key={type} className="py-1">
                  <div className="px-4 pt-2 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    {config.label}
                  </div>
                  {items.map((item) => {
                    runningIndex += 1;
                    const isActive = runningIndex === activeIndex;
                    return (
                      <button
                        key={`${type}-${item.id}`}
                        type="button"
                        onClick={() => goToResult(type, item)}
                        onMouseEnter={() => setActiveIndex(runningIndex)}
                        className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors ${
                          isActive
                            ? "bg-blue-50 text-blue-700"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0 text-gray-400" />
                        <span className="truncate">
                          {item.name || item.title || item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
