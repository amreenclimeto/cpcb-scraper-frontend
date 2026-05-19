import React, { useEffect, useMemo, useRef, useState } from "react";

function MultiSelectFilter({ filter, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);
  const selected = filter.value || [];
  const options = filter.options || [];

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter((opt) => opt.toLowerCase().includes(q));
  }, [options, search]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (opt) => {
    const next = selectedSet.has(opt)
      ? selected.filter((v) => v !== opt)
      : [...selected, opt];
    onChange(filter.name, next);
  };

  const label =
    selected.length === 0
      ? filter.placeholder || "All States"
      : selected.length === options.length
        ? `All States (${options.length})`
        : `${selected.length} state${selected.length > 1 ? "s" : ""} selected`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="border px-3 py-2 rounded min-w-[200px] text-left text-sm flex justify-between items-center gap-2 bg-white hover:bg-gray-50"
      >
        <span className="truncate">{label}</span>
        <span className="text-gray-400 shrink-0">▾</span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-72 bg-white border rounded-lg shadow-lg flex flex-col">
          <div className="p-2 border-b">
            <input
              type="text"
              placeholder="Search state..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border px-2 py-1.5 rounded text-sm"
            />
          </div>

          <div className="flex gap-1 px-2 py-1.5 border-b bg-gray-50">
            <button
              type="button"
              onClick={() => onChange(filter.name, [])}
              className="text-xs px-2 py-1 rounded border bg-white hover:bg-gray-100"
            >
              All
            </button>
            <button
              type="button"
              onClick={() => onChange(filter.name, [...options])}
              className="text-xs px-2 py-1 rounded border bg-white hover:bg-gray-100"
            >
              Select all
            </button>
            <button
              type="button"
              onClick={() => onChange(filter.name, [])}
              className="text-xs px-2 py-1 rounded border bg-white hover:bg-gray-100"
            >
              Clear
            </button>
          </div>

          <div className="overflow-y-auto max-h-60 p-1">
            {filteredOptions.length === 0 ? (
              <p className="text-xs text-gray-400 px-2 py-3">No states found</p>
            ) : (
              filteredOptions.map((opt) => (
                <label
                  key={opt}
                  className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selectedSet.has(opt)}
                    onChange={() => toggle(opt)}
                    className="rounded"
                  />
                  <span className="truncate">{opt}</span>
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const CommonFilters = ({ filters, onChange, onReset }) => {
  return (
    <div className="flex gap-4 flex-wrap items-center">
      {filters.map((filter) => {
        if (filter.type === "search") {
          return (
            <input
              key={filter.name}
              placeholder={filter.placeholder}
              className="border px-3 py-2 rounded w-60"
              value={filter.value}
              onChange={(e) => onChange(filter.name, e.target.value)}
            />
          );
        }

        if (filter.type === "select") {
          return (
            <select
              key={filter.name}
              value={filter.value}
              onChange={(e) => onChange(filter.name, e.target.value)}
              className="border px-3 py-2 rounded"
            >
              <option value="">{filter.placeholder}</option>
              {filter.options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          );
        }

        if (filter.type === "multi-select") {
          return (
            <MultiSelectFilter
              key={filter.name}
              filter={filter}
              onChange={onChange}
            />
          );
        }

        if (filter.type === "date") {
          return (
            <input
              key={filter.name}
              type="date"
              value={filter.value}
              onChange={(e) => onChange(filter.name, e.target.value)}
              className="border px-3 py-2 rounded"
            />
          );
        }

        if (filter.type === "date-range") {
          return (
            <div key={filter.name} className="flex gap-2 items-center">
              <input
                type="date"
                value={filter.from}
                onChange={(e) =>
                  onChange(filter.name, {
                    from: e.target.value,
                    to: filter.to,
                  })
                }
                className="border px-2 py-2 rounded"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={filter.to}
                onChange={(e) =>
                  onChange(filter.name, {
                    from: filter.from,
                    to: e.target.value,
                  })
                }
                className="border px-2 py-2 rounded"
              />
            </div>
          );
        }

        return null;
      })}

      <button
        onClick={onReset}
        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
      >
        Reset
      </button>
    </div>
  );
};

export default CommonFilters;
