import { useState, useEffect, useRef } from "react";
import { X, Search } from "lucide-react";
import { productsApi } from "../services/service";
import { extractPaginated } from "../utils/extractPaginated";

export default function ProductSearchSelect({ value, products, onSelect }) {
  const selected = products.find((p) => String(p.product_id) === String(value));

  const [query, setQuery] = useState(selected?.product_name ?? "");
  const [results, setResults] = useState(products.slice(0, 20));
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const boxRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      productsApi
        .list({ search: query, per_page: 20 })
        .then((res) => setResults(extractPaginated(res).items))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClear = () => {
    setQuery("");
    setOpen(true);
    onSelect({ product_id: "", unit_price: "", cost_price: "" });
    inputRef.current?.focus();
  };

  return (
    <div className="relative" ref={boxRef}>
      <div className="relative">
        <Search
          size={13}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none"
        />
        <input
          ref={inputRef}
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          placeholder="Search products.."
          className="w-full min-w-0 font-body rounded-md border border-transparent bg-[#F3F4F6] pl-7 pr-7 py-1.5 text-[13px] text-[#10151F] focus:outline-none focus:ring-2 focus:ring-[#2F5FEA] focus:bg-white transition truncate"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-[#9CA3AF] hover:bg-[#E5E7EB] hover:text-[#374151] transition"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {open && (
        <ul className="absolute z-20 w-full bg-white border border-[#E5E7EB] rounded-lg mt-1 max-h-48 overflow-auto shadow-lg">
          {results.length === 0 && (
            <li className="px-3 py-2 text-[13px] text-[#9CA3AF]">
              Product not found
            </li>
          )}
          {results.map((p) => (
            <li
              key={p.product_id}
              onClick={() => {
                onSelect(p);
                setQuery(p.product_name);
                setOpen(false);
              }}
              className="px-3 py-2 hover:bg-[#F3F4F6] cursor-pointer text-[13px] text-[#10151F]"
            >
              {p.product_name}{" "}
              <span className="text-[#9CA3AF]">
                ({p.quantity_in_stock} in stock)
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
