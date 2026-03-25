import React from "react";

const CommonFilters = ({
  filters,
  onChange,
  onReset,
}) => {
  return (
    <div className="flex gap-4 flex-wrap items-center">
      
      {filters.map((filter) => {

        // 🔍 SEARCH
        if (filter.type === "search") {
          return (
            <input
              key={filter.name}
              placeholder={filter.placeholder}
              className="border px-3 py-2 rounded w-60"
              value={filter.value}
              onChange={(e) =>
                onChange(filter.name, e.target.value)
              }
            />
          );
        }

        // 🔽 SELECT
        if (filter.type === "select") {
          return (
            <select
              key={filter.name}
              value={filter.value}
              onChange={(e) =>
                onChange(filter.name, e.target.value)
              }
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

        // 📅 SINGLE DATE
        if (filter.type === "date") {
          return (
            <input
              key={filter.name}
              type="date"
              value={filter.value}
              onChange={(e) =>
                onChange(filter.name, e.target.value)
              }
              className="border px-3 py-2 rounded"
            />
          );
        }

        // 📅 RANGE DATE (from → to)
        if (filter.type === "date-range") {
          return (
            <div key={filter.name} className="flex gap-2 items-center">
              
              {/* From */}
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

              {/* To */}
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

      {/* 🔄 Reset */}
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