import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

export default function SearchSelect({
  value,
  options,
  getLabel = (o) => o.name,
  getValue = (o) => o.id,
  getSubLabel,
  placeholder = "Search..",
  onSelect,
  onClear,
}) {
  const selected = options.find((o) => String(getValue(o)) === String(value));
  const [query, setQuery] = useState(selected ? getLabel(selected) : "");
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const sel = options.find((o) => String(getValue(o)) === String(value));
    setQuery(sel ? getLabel(sel) : "");
  }, [value, options]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = options.filter((o) =>
    getLabel(o).toLowerCase().includes(query.toLowerCase()),
  );

  const handleClear = () => {
    setQuery("");
    setOpen(true);
    onClear ? onClear() : onSelect(null);
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
          placeholder={placeholder}
          className="w-full min-w-0 font-body rounded-lg border border-transparent bg-[#F3F4F6] pl-7 pr-7 py-2.5 text-[14px] text-[#10151F] focus:outline-none focus:ring-2 focus:ring-[#2F5FEA] focus:bg-white transition truncate"
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
          {filtered.length === 0 && (
            <li className="px-3 py-2 text-[13px] text-[#9CA3AF]">No results</li>
          )}
          {filtered.map((o) => (
            <li
              key={getValue(o)}
              onClick={() => {
                onSelect(o);
                setQuery(getLabel(o));
                setOpen(false);
              }}
              className="px-3 py-2 hover:bg-[#F3F4F6] cursor-pointer text-[13px] text-[#10151F]"
            >
              {getLabel(o)}
              {getSubLabel && (
                <span className="text-[#9CA3AF]"> ({getSubLabel(o)})</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
