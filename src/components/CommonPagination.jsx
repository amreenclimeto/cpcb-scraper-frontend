import React from "react";

const CommonPagination = ({
  pageIndex,
  pageSize,
  total,
  onPageChange,
}) => {
  const totalPages = Math.ceil(total / pageSize);

  const start = total === 0 ? 0 : pageIndex * pageSize + 1;
  const end = Math.min((pageIndex + 1) * pageSize, total);

  return (
    <div className="flex justify-between items-center p-4 border-t text-sm">
      
      {/* Info */}
      <span>
        Showing {start} to {end} of {total} entries
      </span>

      {/* Controls */}
      <div className="flex items-center gap-2">
        
        {/* Prev */}
        <button
          disabled={pageIndex === 0}
          onClick={() => onPageChange(pageIndex - 1)}
          className="px-3 py-1 border rounded disabled:opacity-40"
        >
          Prev
        </button>

        {/* Page Number */}
        <span className="px-2">
          Page {pageIndex + 1} of {totalPages || 1}
        </span>

        {/* Next */}
        <button
          disabled={pageIndex + 1 >= totalPages}
          onClick={() => onPageChange(pageIndex + 1)}
          className="px-3 py-1 border rounded disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default CommonPagination;