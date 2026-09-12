import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

export default function SearchInput({
  value,
  onChange,
  placeholder = "Search..",
  debounceMs = 300,
  className = "",
}) {
  const [inputValue, setInputValue] = useState(value ?? "");
  const debounceRef = useRef(null);

  // Keep local input in sync if parent resets value externally (e.g. clear filters button)
  useEffect(() => {
    setInputValue(value ?? "");
  }, [value]);

  const handleChange = (e) => {
    const next = e.target.value;
    setInputValue(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onChange(next), debounceMs);
  };

  const handleClear = () => {
    setInputValue("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    onChange("");
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <Search
        size={15}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none"
      />
      <input
        value={inputValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="font-body w-full pl-9 pr-9 py-2.5 bg-[#F3F4F6] border border-transparent rounded-lg text-[13.5px] text-[#10151F] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2F5FEA] focus:bg-white transition"
      />
      {inputValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-[#9CA3AF] hover:bg-[#E5E7EB] hover:text-[#374151] transition"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
