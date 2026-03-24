import React from "react";

const CommonFilters = ({
  filters,
  onChange,
  onReset,
}) => {
  return (
    <div className="flex gap-4 flex-wrap">
      
      {filters.map((filter) => {
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

        return null;
      })}

      {/* Reset Button */}
      <button
        onClick={onReset}
        className="px-3 py-2 bg-gray-200 rounded"
      >
        Reset
      </button>
    </div>
  );
};

export default CommonFilters;