import React, { useEffect, useState, useCallback } from "react";
import { Download } from "lucide-react";
import CommonButton from "../components/CommonButton";
import { exportToExcel } from "../utils/exportExcel";

// ─── helpers ────────────────────────────────────────────────────────────────
const fmt = (n) => (n == null ? "—" : Number(n).toLocaleString("en-IN"));

const fmtTime = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
};

// const timeDiff = (prev, curr) => {
//   if (!prev) return null;
//   const ms = new Date(curr) - new Date(prev);
//   const s = Math.floor(ms / 1000);
//   if (s < 60) return `${s}s`;
//   const m = Math.floor(s / 60);
//   if (m < 60) return `${m}m ${s % 60}s`;
//   return `${Math.floor(m / 60)}h ${m % 60}m`;
// };

const CATEGORIES = [
  "Cat I(EOL)",
  "Cat I(Recycling)",
  "Cat II(EOL)",
  "Cat II(Recycling)",
  "Cat III(EOL)",
  "Cat III(Recycling)",
  "Cat IV(EOL)",
  "Cat IV(Recycling)",
  "Total",
];

// ─── flatten API response into table rows ───────────────────────────────────
// Each row = one category × one snapshot
function flattenSnapshots(snapshots) {
  const rows = [];
  snapshots.forEach((snap, si) => {
    const prevSnap = si > 0 ? snapshots[si - 1] : null;
    snap.data.forEach((cat) => {
      const prevCat = prevSnap
        ? prevSnap.data.find((d) => d.category === cat.category)
        : null;
      rows.push({
        snapshotId: snap.snapshot_id,
        time: snap.time,
        // timeDiffFromPrev: prevSnap ? timeDiff(prevSnap.time, snap.time) : null,
        category: cat.category,
        // current values
        generated: cat.generated,
        transferred: cat.transferred,
        available: cat.available,
        // previous values (prefer interval prev if provided by API)
        prevGenerated: cat.prev_generated_interval ?? (prevCat ? prevCat.generated : null),
        prevTransferred: cat.prev_transferred_interval ?? (prevCat ? prevCat.transferred : null),
        prevAvailable: cat.prev_available_interval ?? (prevCat ? prevCat.available : null),
        // diff from API (prefer interval diff when available)
        generatedDiff: cat.generated_diff_interval ?? cat.generated_diff,
        transferredDiff: cat.transferred_diff_interval ?? cat.transferred_diff,
        availableDiff: cat.available_diff_interval ?? cat.available_diff,
      });
    });
  });
  return rows;
}

function buildHistoryParams({ page, limit, selectedCat, appliedFrom, appliedTo }) {
  const params = new URLSearchParams();
  params.set("limit", limit);
  params.set("page", page);
  if (selectedCat && selectedCat !== "All") params.set("category", selectedCat);
  if (appliedFrom) params.set("from", appliedFrom);
  if (appliedTo) params.set("to", appliedTo);
  // params.set("prev_hours", 2);
  return params;
}

function applyRowFilters(rows, { selectedCat, onlyChanged }) {
  return rows
    .filter((r) => selectedCat === "All" || r.category === selectedCat)
    .filter(
      (r) =>
        !onlyChanged ||
        r.generatedDiff > 0 ||
        r.transferredDiff > 0 ||
        r.availableDiff > 0,
    );
}

function rowsToExcelData(rows) {
  return rows.map((row) => ({
    Time: fmtTime(row.time),
    Category: row.category,
    "Generated (Previous)": row.prevGenerated ?? "",
    "Generated (Current)": row.generated ?? "",
    "Generated (Diff)": row.generatedDiff ?? "",
    "Transferred (Previous)": row.prevTransferred ?? "",
    "Transferred (Current)": row.transferred ?? "",
    "Transferred (Diff)": row.transferredDiff ?? "",
    "Available (Previous)": row.prevAvailable ?? "",
    "Available (Current)": row.available ?? "",
    "Available (Diff)": row.availableDiff ?? "",
  }));
}

async function fetchAllSnapshots(baseURL, filters) {
  const allSnapshots = [];
  let page = 1;
  let totalPages = 1;
  const exportPageLimit = 100;

  while (page <= totalPages) {
    const params = buildHistoryParams({
      page,
      limit: exportPageLimit,
      ...filters,
    });
    const res = await fetch(`${baseURL}/epr-cer/history?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    allSnapshots.push(...(json.data || []));
    totalPages = json.total_pages ?? 1;
    page += 1;
  }

  return allSnapshots;
}

// ─── sub-components ─────────────────────────────────────────────────────────
const DiffBadge = ({ value }) => {
  if (!value) return <span className="text-gray-400 text-xs">—</span>;
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5">
      ▲ +{fmt(value)}
    </span>
  );
};

const NumCell = ({ current, prev, diff }) => (
  <div className="space-y-0.5">
    <div className="font-mono text-sm font-semibold text-gray-800">
      {fmt(current)}
    </div>
    {prev != null && prev !== current && (
      <div className="font-mono text-xs text-gray-400 line-through">
        {fmt(prev)}
      </div>
    )}
    <DiffBadge value={diff} />
  </div>
);

const Skeleton = () => (
  <div className="animate-pulse space-y-2 p-4">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="h-10 bg-gray-100 rounded" />
    ))}
  </div>
);

// ─── main component ──────────────────────────────────────────────────────────
const EprPwpCertificateAudit = () => {
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);

  // pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalSnapshots, setTotalSnapshots] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const baseURL = import.meta.env.VITE_API_BASE_URL;

  // filters
  const [selectedCat, setSelectedCat] = useState("All");
  const [onlyChanged, setOnlyChanged] = useState(false);
  // date range filters (draft + applied)
  const [draftFrom, setDraftFrom] = useState("");
  const [draftTo, setDraftTo] = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = buildHistoryParams({
        page,
        limit,
        selectedCat,
        appliedFrom,
        appliedTo,
      });

      const res = await fetch(`${baseURL}/epr-cer/history?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setApiData(json);
      setTotalSnapshots(json.total_snapshots ?? json.data?.length ?? 0);
      setTotalPages(json.total_pages ?? 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, limit, selectedCat, appliedFrom, appliedTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filterState = { selectedCat, onlyChanged };

  // derive rows
  const allRows = apiData?.data ? flattenSnapshots(apiData.data) : [];
  const filtered = applyRowFilters(allRows, filterState);

  const handleExport = async () => {
    try {
      setExporting(true);
      setError(null);

      const snapshots = await fetchAllSnapshots(baseURL, {
        selectedCat,
        appliedFrom,
        appliedTo,
      });
      const exportRows = applyRowFilters(
        flattenSnapshots(snapshots),
        filterState,
      );
      const excelData = rowsToExcelData(exportRows);

      if (!excelData.length) {
        alert("No data to export for the current filters.");
        return;
      }

      exportToExcel({
        data: excelData,
        fileName: "epr-pwp-certificate-audit.xlsx",
        sheetName: "Certificate Audit",
      });
    } catch (err) {
      console.error("Export Error:", err);
      setError(err.message || "Export failed");
    } finally {
      setExporting(false);
    }
  };

  // pagination: totalPages is provided by API (set in fetchData)

  return (
    <div className="min-h-screen bg-gray-50 p-2 md:p-4 font-sans">
      {/* ── header ── */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            EPR PWP Certificate Audit
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Snapshot-wise category breakdown — Generated · Transferred · Available
          </p>
        </div>
        <CommonButton
          label={exporting ? "Exporting…" : "Export Excel"}
          onClick={handleExport}
          icon={Download}
          variant="primary"
          size="md"
          disabled={loading || exporting}
        />
      </div>

      {/* ── filters ── */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* category filter */}
        <div className="flex flex-wrap gap-1.5">
          {["All", ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                selectedCat === cat
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* changed only toggle */}
        <label className="ml-auto flex items-center gap-2 cursor-pointer select-none">
          <div
            onClick={() => setOnlyChanged((v) => !v)}
            className={`relative w-9 h-5 rounded-full transition-colors ${
              onlyChanged ? "bg-emerald-500" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                onlyChanged ? "translate-x-4" : ""
              }`}
            />
          </div>
          <span className="text-xs font-medium text-gray-600">
            Show only updated
          </span>
        </label>

        {/* date range inputs */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={draftFrom}
            onChange={(e) => setDraftFrom(e.target.value)}
            className="text-xs px-2 py-1 border rounded"
            aria-label="From date"
          />
          <span className="text-xs text-gray-500">to</span>
          <input
            type="date"
            value={draftTo}
            onChange={(e) => setDraftTo(e.target.value)}
            className="text-xs px-2 py-1 border rounded"
            aria-label="To date"
          />
          <button
            onClick={() => {
              setAppliedFrom(draftFrom);
              setAppliedTo(draftTo);
              setPage(1);
            }}
            disabled={loading}
            className="text-xs px-2 py-1 rounded border bg-white"
          >
            Apply
          </button>
          <button
            onClick={() => {
              setDraftFrom("");
              setDraftTo("");
              setAppliedFrom("");
              setAppliedTo("");
              setPage(1);
            }}
            disabled={loading}
            className="text-xs px-2 py-1 rounded border bg-white"
          >
            Clear
          </button>

          {/* refresh */}
          <button
            onClick={fetchData}
            disabled={loading}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 transition-all"
          >
            {loading ? "Refreshing…" : "↻ Refresh"}
          </button>
        </div>
      </div>

      {/* ── error ── */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          Failed to load data: {error}
        </div>
      )}

      {/* ── table card ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <Skeleton />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="sticky left-0 bg-gray-50 text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap">
                    Time
                  </th>
                  {/* <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap">
                    Gap
                  </th> */}
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap">
                    Category
                  </th>

                  {/* generated group */}
                  <th
                    colSpan={3}
                    className="text-center px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50 border-x border-blue-100 uppercase tracking-wide"
                  >
                    Generated
                  </th>
                  {/* transferred group */}
                  <th
                    colSpan={3}
                    className="text-center px-4 py-2 text-xs font-semibold text-amber-700 bg-amber-50 border-x border-amber-100 uppercase tracking-wide"
                  >
                    Transferred
                  </th>
                  {/* available group */}
                  <th
                    colSpan={3}
                    className="text-center px-4 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border-x border-emerald-100 uppercase tracking-wide"
                  >
                    Available
                  </th>
                </tr>

                {/* sub-headers */}
                <tr className="border-b border-gray-200 bg-white">
                  <th colSpan={2} />
                  {["Generated", "Transferred", "Available"].map((col) => (
                    <React.Fragment key={col}>
                      <th className="px-3 py-2 text-xs font-medium text-gray-500 text-right whitespace-nowrap">
                        Previous
                      </th>
                      <th className="px-3 py-2 text-xs font-medium text-gray-500 text-right whitespace-nowrap">
                        Current
                      </th>
                      <th className="px-3 py-2 text-xs font-medium text-gray-500 text-center whitespace-nowrap">
                        Diff
                      </th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={11}
                      className="text-center py-12 text-gray-400 text-sm"
                    >
                      No data found
                    </td>
                  </tr>
                )}

                {filtered.map((row, i) => {
                  const hasChange =
                    row.generatedDiff > 0 ||
                    row.transferredDiff > 0 ||
                    row.availableDiff > 0;
                  const isTotal = row.category === "Total";

                  return (
                    <tr
                      key={`${row.snapshotId}-${row.category}-${i}`}
                      className={`
                        transition-colors
                        ${isTotal ? "bg-gray-50 font-semibold" : ""}
                        ${hasChange ? "bg-emerald-50/40" : "hover:bg-gray-50/60"}
                      `}
                    >
                      {/* time */}
                      <td className="sticky left-0 bg-inherit px-4 py-3 whitespace-nowrap text-xs text-gray-600 font-mono">
                        {fmtTime(row.time)}
                      </td>

                      {/* gap */}
                      {/* <td className="px-4 py-3 whitespace-nowrap">
                        {row.timeDiffFromPrev ? (
                          <span className="text-xs bg-gray-100 text-gray-500 rounded px-1.5 py-0.5 font-mono">
                            +{row.timeDiffFromPrev}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">base</span>
                        )}
                      </td> */}

                      {/* category */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`text-xs font-medium rounded px-2 py-0.5 ${
                            isTotal
                              ? "bg-gray-200 text-gray-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {row.category}
                        </span>
                        {hasChange && (
                          <span className="ml-1.5 text-[10px] text-emerald-600 font-semibold">
                            ● updated
                          </span>
                        )}
                      </td>

                      {/* generated */}
                      <td className="px-3 py-3 text-right text-xs font-mono text-gray-400">
                        {fmt(row.prevGenerated)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-semibold text-blue-700 text-sm">
                        {fmt(row.generated)}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <DiffBadge value={row.generatedDiff} />
                      </td>

                      {/* transferred */}
                      <td className="px-3 py-3 text-right text-xs font-mono text-gray-400">
                        {fmt(row.prevTransferred)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-semibold text-amber-700 text-sm">
                        {fmt(row.transferred)}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <DiffBadge value={row.transferredDiff} />
                      </td>

                      {/* available */}
                      <td className="px-3 py-3 text-right text-xs font-mono text-gray-400">
                        {fmt(row.prevAvailable)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-semibold text-emerald-700 text-sm">
                        {fmt(row.available)}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <DiffBadge value={row.availableDiff} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── pagination ── */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
          <span className="text-xs text-gray-500">
            {filtered.length} rows · Page {page} of {totalPages || 1}
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1 || loading}
              className="px-2 py-1.5 text-xs rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              «
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="px-2.5 py-1.5 text-xs rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              ‹ Prev
            </button>

            {/* page number buttons */}
            {[...Array(totalPages || 1)].map((_, i) => {
              const p = i + 1;
              if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) {
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    disabled={loading}
                    className={`w-8 h-7 text-xs rounded border transition ${
                      p === page
                        ? "bg-blue-600 text-white border-blue-600 font-semibold"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {p}
                  </button>
                );
              }
              if (Math.abs(p - page) === 2) {
                return (
                  <span key={p} className="text-gray-400 text-xs px-1">
                    …
                  </span>
                );
              }
              return null;
            })}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              className="px-2.5 py-1.5 text-xs rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Next ›
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages || loading}
              className="px-2 py-1.5 text-xs rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              »
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EprPwpCertificateAudit;
