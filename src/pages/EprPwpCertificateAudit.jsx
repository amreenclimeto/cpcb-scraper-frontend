import React, { useEffect, useState, useCallback } from "react";

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

const timeDiff = (prev, curr) => {
  if (!prev) return null;
  const ms = new Date(curr) - new Date(prev);
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
};

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
        snapshotIndex: si + 1,
        time: snap.time,
        timeDiffFromPrev: prevSnap ? timeDiff(prevSnap.time, snap.time) : null,
        category: cat.category,
        // current values
        generated: cat.generated,
        transferred: cat.transferred,
        available: cat.available,
        // previous values (for "updated data" column)
        prevGenerated: prevCat ? prevCat.generated : null,
        prevTransferred: prevCat ? prevCat.transferred : null,
        prevAvailable: prevCat ? prevCat.available : null,
        // diff from API
        generatedDiff: cat.generated_diff,
        transferredDiff: cat.transferred_diff,
        availableDiff: cat.available_diff,
      });
    });
  });
  return rows;
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
  const [error, setError] = useState(null);

  // pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalSnapshots, setTotalSnapshots] = useState(0);
  const baseURL = import.meta.env.VITE_API_BASE_URL;

  // filters
  const [selectedCat, setSelectedCat] = useState("All");
  const [onlyChanged, setOnlyChanged] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `${baseURL}/epr-cer/history?limit=${limit}&page=${page}`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setApiData(json);
      setTotalSnapshots(json.total_snapshots ?? json.data?.length ?? 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // derive rows
  const allRows = apiData?.data ? flattenSnapshots(apiData.data) : [];
  const filtered = allRows
    .filter((r) => selectedCat === "All" || r.category === selectedCat)
    .filter(
      (r) =>
        !onlyChanged ||
        r.generatedDiff > 0 ||
        r.transferredDiff > 0 ||
        r.availableDiff > 0,
    );

  const totalPages = Math.ceil(totalSnapshots / limit);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 font-sans">
      {/* ── header ── */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          EPR PWP Certificate Audit
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Snapshot-wise category breakdown — Generated · Transferred · Available
        </p>
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

        {/* refresh */}
        <button
          onClick={fetchData}
          disabled={loading}
          className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 transition-all"
        >
          {loading ? "Refreshing…" : "↻ Refresh"}
        </button>
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
                    Snapshot
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap">
                    Time
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap">
                    Gap
                  </th>
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
                  <th colSpan={4} />
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
                      colSpan={13}
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
                      {/* snapshot */}
                      <td className="sticky left-0 bg-inherit px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                          S{row.snapshotIndex}
                        </span>
                      </td>

                      {/* time */}
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600 font-mono">
                        {fmtTime(row.time)}
                      </td>

                      {/* gap */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {row.timeDiffFromPrev ? (
                          <span className="text-xs bg-gray-100 text-gray-500 rounded px-1.5 py-0.5 font-mono">
                            +{row.timeDiffFromPrev}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">base</span>
                        )}
                      </td>

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

// import React, { useEffect, useState, useCallback } from "react";

// // ─── helpers ──────────────────────────────────────────────────────────────────
// const fmt = (n) => (n == null ? "—" : Number(n).toLocaleString("en-IN"));

// const fmtTime = (iso) => {
//   if (!iso) return "—";
//   return new Date(iso).toLocaleString("en-IN", {
//     day: "2-digit", month: "short", year: "numeric",
//     hour: "2-digit", minute: "2-digit", second: "2-digit",
//     hour12: false,
//   });
// };

// const calcGap = (prev, curr) => {
//   if (!prev) return null;
//   const s = Math.floor((new Date(curr) - new Date(prev)) / 1000);
//   if (s < 60) return `${s}s`;
//   const m = Math.floor(s / 60);
//   if (m < 60) return `${m}m ${s % 60}s`;
//   return `${Math.floor(m / 60)}h ${m % 60}m`;
// };

// const CATEGORIES = [
//   "All", "Total",
//   "Cat I(EOL)", "Cat I(Recycling)",
//   "Cat II(EOL)", "Cat II(Recycling)",
//   "Cat III(EOL)", "Cat III(Recycling)",
//   "Cat IV(EOL)", "Cat IV(Recycling)",
// ];

// // flatten API response → flat rows for table
// function flattenSnapshots(snapshots) {
//   const rows = [];
//   snapshots.forEach((snap, si) => {
//     const prev = si > 0 ? snapshots[si - 1] : null;
//     snap.data.forEach((cat) => {
//       const prevCat = prev?.data.find((d) => d.category === cat.category);
//       rows.push({
//         snapshotId:      snap.snapshot_id,
//         snapshotIndex:   si + 1,
//         time:            snap.time,
//         gap:             prev ? calcGap(prev.time, snap.time) : null,
//         category:        cat.category,
//         generated:       cat.generated,
//         transferred:     cat.transferred,
//         available:       cat.available,
//         prevGenerated:   prevCat?.generated   ?? null,
//         prevTransferred: prevCat?.transferred  ?? null,
//         prevAvailable:   prevCat?.available    ?? null,
//         generatedDiff:   cat.generated_diff,
//         transferredDiff: cat.transferred_diff,
//         availableDiff:   cat.available_diff,
//       });
//     });
//   });
//   return rows;
// }

// // ─── small components ─────────────────────────────────────────────────────────
// const DiffBadge = ({ value }) =>
//   value > 0 ? (
//     <span className="inline-flex items-center text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5 whitespace-nowrap">
//       ▲ +{fmt(value)}
//     </span>
//   ) : (
//     <span className="text-gray-300 text-xs select-none">—</span>
//   );

// const FilterChip = ({ label, onRemove }) => (
//   <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-1">
//     {label}
//     <button onClick={onRemove} className="font-bold hover:text-blue-900 leading-none">×</button>
//   </span>
// );

// const Skeleton = () => (
//   <div className="animate-pulse p-4 space-y-2">
//     {[...Array(8)].map((_, i) => (
//       <div key={i} className="h-10 bg-gray-100 rounded" />
//     ))}
//   </div>
// );

// // ─── pagination component ──────────────────────────────────────────────────────
// const Pagination = ({ page, totalPages, loading, onPageChange }) => {
//   const pages = [];
//   for (let p = 1; p <= totalPages; p++) {
//     if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) pages.push(p);
//     else if (Math.abs(p - page) === 2) pages.push("...");
//   }
//   // dedupe consecutive "..."
//   const deduped = pages.filter((v, i) => !(v === "..." && pages[i - 1] === "..."));

//   const btn = (label, onClick, disabled, active = false) => (
//     <button
//       key={label + onClick}
//       onClick={onClick}
//       disabled={disabled || loading}
//       className={`px-2.5 py-1.5 text-xs rounded border transition
//         ${active
//           ? "bg-blue-600 text-white border-blue-600 font-semibold"
//           : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}
//         disabled:opacity-40 disabled:cursor-not-allowed`}
//     >
//       {label}
//     </button>
//   );

//   return (
//     <div className="flex items-center gap-1 flex-wrap">
//       {btn("«", () => onPageChange(1),         page === 1)}
//       {btn("‹ Prev", () => onPageChange(page - 1), page === 1)}
//       {deduped.map((p, i) =>
//         p === "..."
//           ? <span key={`dots-${i}`} className="text-gray-400 text-xs px-1">…</span>
//           : btn(p, () => onPageChange(p), false, p === page)
//       )}
//       {btn("Next ›", () => onPageChange(page + 1), page === totalPages)}
//       {btn("»",      () => onPageChange(totalPages), page === totalPages)}
//     </div>
//   );
// };

// // ─── main component ────────────────────────────────────────────────────────────
// const EprPwpCertificateAudit = () => {

//   // filter state (draft — applied on "Apply" click)
//   const [draftFrom,     setDraftFrom]     = useState("");
//   const [draftTo,       setDraftTo]       = useState("");
//   const [draftCategory, setDraftCategory] = useState("All");

//   // applied filter state (drives API call)
//   const [appliedFrom,     setAppliedFrom]     = useState("");
//   const [appliedTo,       setAppliedTo]       = useState("");
//   const [appliedCategory, setAppliedCategory] = useState("All");

//   // pagination
//   const [page,       setPage]       = useState(1);
//   const [limit]                     = useState(10);
//   const [totalPages, setTotalPages] = useState(1);
//   const [totalSnaps, setTotalSnaps] = useState(0);

//   // api data
//   const [apiData, setApiData] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error,   setError]   = useState(null);

//   // ── fetch ──
//   const fetchData = useCallback(async () => {
//     try {
//       setLoading(true);
//       setError(null);

//       const params = new URLSearchParams({ limit, page });
//       if (appliedCategory && appliedCategory !== "All") params.set("category", appliedCategory);
//       if (appliedFrom) params.set("from", appliedFrom);
//       if (appliedTo)   params.set("to",   appliedTo);

//       const res  = await fetch(`http://localhost:3000/api/epr/history?${params}`);
//       if (!res.ok) throw new Error(`HTTP ${res.status}`);
//       const json = await res.json();

//       setApiData(json);
//       setTotalPages(json.total_pages      ?? 1);
//       setTotalSnaps(json.total_snapshots  ?? 0);
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   }, [page, limit, appliedFrom, appliedTo, appliedCategory]);

//   useEffect(() => { fetchData(); }, [fetchData]);

//   // ── filter actions ──
//   const handleApply = () => {
//     setAppliedFrom(draftFrom);
//     setAppliedTo(draftTo);
//     setAppliedCategory(draftCategory);
//     setPage(1);
//   };

//   const handleClear = () => {
//     setDraftFrom(""); setDraftTo(""); setDraftCategory("All");
//     setAppliedFrom(""); setAppliedTo(""); setAppliedCategory("All");
//     setPage(1);
//   };

//   const activeFilters = [
//     appliedFrom     && { label: `From: ${appliedFrom}`,  clear: () => { setAppliedFrom("");     setDraftFrom("");     setPage(1); } },
//     appliedTo       && { label: `To: ${appliedTo}`,      clear: () => { setAppliedTo("");       setDraftTo("");       setPage(1); } },
//     (appliedCategory && appliedCategory !== "All") &&
//                        { label: appliedCategory,          clear: () => { setAppliedCategory("All"); setDraftCategory("All"); setPage(1); } },
//   ].filter(Boolean);

//   const rows = apiData?.data ? flattenSnapshots(apiData.data) : [];

//   return (
//     <div className="min-h-screen bg-gray-50 p-4 md:p-6">

//       {/* ── header ── */}
//       <div className="mb-5 flex items-start justify-between flex-wrap gap-3">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
//             EPR PWP Certificate Audit
//           </h1>
//           <p className="text-sm text-gray-500 mt-0.5">
//             Snapshot history · Generated · Transferred · Available
//           </p>
//         </div>
//         <button
//           onClick={fetchData}
//           disabled={loading}
//           className="text-xs px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition"
//         >
//           {loading ? "Loading…" : "↻ Refresh"}
//         </button>
//       </div>

//       {/* ── filter panel ── */}
//       <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4 space-y-3">
//         <div className="flex flex-wrap gap-4 items-end">

//           {/* from */}
//           <div className="flex flex-col gap-1">
//             <label className="text-xs font-medium text-gray-500">From date</label>
//             <input
//               type="date"
//               value={draftFrom}
//               max={draftTo || undefined}
//               onChange={(e) => setDraftFrom(e.target.value)}
//               className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//             />
//           </div>

//           {/* to */}
//           <div className="flex flex-col gap-1">
//             <label className="text-xs font-medium text-gray-500">To date</label>
//             <input
//               type="date"
//               value={draftTo}
//               min={draftFrom || undefined}
//               onChange={(e) => setDraftTo(e.target.value)}
//               className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//             />
//           </div>

//           {/* category */}
//           <div className="flex flex-col gap-1">
//             <label className="text-xs font-medium text-gray-500">Category</label>
//             <select
//               value={draftCategory}
//               onChange={(e) => setDraftCategory(e.target.value)}
//               className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[170px]"
//             >
//               {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
//             </select>
//           </div>

//           {/* action buttons */}
//           <div className="flex gap-2 pb-0.5">
//             <button
//               onClick={handleApply}
//               disabled={loading}
//               className="text-sm px-5 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition"
//             >
//               Apply
//             </button>
//             <button
//               onClick={handleClear}
//               disabled={loading}
//               className="text-sm px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition"
//             >
//               Clear
//             </button>
//           </div>
//         </div>

//         {/* active filter chips */}
//         {activeFilters.length > 0 && (
//           <div className="flex flex-wrap gap-2 pt-1">
//             <span className="text-xs text-gray-400 self-center">Active:</span>
//             {activeFilters.map((f) => (
//               <FilterChip key={f.label} label={f.label} onRemove={f.clear} />
//             ))}
//           </div>
//         )}
//       </div>

//       {/* ── error ── */}
//       {error && (
//         <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
//           Failed to load: {error}
//         </div>
//       )}

//       {/* ── table card ── */}
//       <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
//         {loading ? (
//           <Skeleton />
//         ) : (
//           <div className="overflow-x-auto">
//             <table className="w-full text-sm border-collapse">
//               <thead>
//                 {/* group row */}
//                 <tr className="bg-gray-50 border-b border-gray-200">
//                   <th rowSpan={2} className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap align-bottom border-r border-gray-200">
//                     Snap
//                   </th>
//                   <th rowSpan={2} className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap align-bottom">
//                     Time
//                   </th>
//                   <th rowSpan={2} className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap align-bottom">
//                     Gap
//                   </th>
//                   <th rowSpan={2} className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap align-bottom border-r border-gray-200">
//                     Category
//                   </th>
//                   <th colSpan={3} className="text-center px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50 border-x border-blue-100 uppercase tracking-wide">
//                     Generated
//                   </th>
//                   <th colSpan={3} className="text-center px-4 py-2 text-xs font-semibold text-amber-700 bg-amber-50 border-x border-amber-100 uppercase tracking-wide">
//                     Transferred
//                   </th>
//                   <th colSpan={3} className="text-center px-4 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border-x border-emerald-100 uppercase tracking-wide">
//                     Available
//                   </th>
//                 </tr>
//                 {/* sub-headers */}
//                 <tr className="bg-gray-50 border-b border-gray-200">
//                   {[0, 1, 2].map((i) => (
//                     <React.Fragment key={i}>
//                       <th className="px-3 py-2 text-xs font-medium text-gray-400 text-right whitespace-nowrap">Prev</th>
//                       <th className="px-3 py-2 text-xs font-medium text-gray-600 text-right whitespace-nowrap">Current</th>
//                       <th className="px-3 py-2 text-xs font-medium text-gray-400 text-center whitespace-nowrap">Diff</th>
//                     </React.Fragment>
//                   ))}
//                 </tr>
//               </thead>

//               <tbody className="divide-y divide-gray-100">
//                 {rows.length === 0 ? (
//                   <tr>
//                     <td colSpan={13} className="text-center py-16 text-gray-400 text-sm">
//                       No records found. Try adjusting the filters.
//                     </td>
//                   </tr>
//                 ) : (
//                   rows.map((row) => {
//                     const changed = row.generatedDiff > 0 || row.transferredDiff > 0 || row.availableDiff > 0;
//                     const isTotal = row.category === "Total";
//                     return (
//                       <tr
//                         key={`${row.snapshotId}-${row.category}`}
//                         className={`transition-colors
//                           ${isTotal   ? "bg-gray-50/80 font-medium" : ""}
//                           ${changed   ? "bg-emerald-50/40" : "hover:bg-gray-50/60"}
//                         `}
//                       >
//                         {/* snap badge */}
//                         <td className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">
//                           <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
//                             S{row.snapshotIndex}
//                           </span>
//                         </td>

//                         {/* time */}
//                         <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600 font-mono">
//                           {fmtTime(row.time)}
//                         </td>

//                         {/* gap */}
//                         <td className="px-4 py-3 whitespace-nowrap">
//                           {row.gap
//                             ? <span className="text-xs bg-gray-100 text-gray-500 rounded px-1.5 py-0.5 font-mono">+{row.gap}</span>
//                             : <span className="text-gray-300 text-xs">base</span>}
//                         </td>

//                         {/* category */}
//                         <td className="px-4 py-3 whitespace-nowrap border-r border-gray-100">
//                           <span className={`text-xs font-medium rounded px-2 py-0.5 ${isTotal ? "bg-gray-200 text-gray-700" : "bg-gray-100 text-gray-600"}`}>
//                             {row.category}
//                           </span>
//                           {changed && (
//                             <span className="ml-1.5 text-[10px] text-emerald-600 font-semibold">● updated</span>
//                           )}
//                         </td>

//                         {/* generated */}
//                         <td className="px-3 py-3 text-right text-xs font-mono text-gray-400">{fmt(row.prevGenerated)}</td>
//                         <td className="px-3 py-3 text-right font-mono font-semibold text-blue-700">{fmt(row.generated)}</td>
//                         <td className="px-3 py-3 text-center"><DiffBadge value={row.generatedDiff} /></td>

//                         {/* transferred */}
//                         <td className="px-3 py-3 text-right text-xs font-mono text-gray-400">{fmt(row.prevTransferred)}</td>
//                         <td className="px-3 py-3 text-right font-mono font-semibold text-amber-700">{fmt(row.transferred)}</td>
//                         <td className="px-3 py-3 text-center"><DiffBadge value={row.transferredDiff} /></td>

//                         {/* available */}
//                         <td className="px-3 py-3 text-right text-xs font-mono text-gray-400">{fmt(row.prevAvailable)}</td>
//                         <td className="px-3 py-3 text-right font-mono font-semibold text-emerald-700">{fmt(row.available)}</td>
//                         <td className="px-3 py-3 text-center"><DiffBadge value={row.availableDiff} /></td>
//                       </tr>
//                     );
//                   })
//                 )}
//               </tbody>
//             </table>
//           </div>
//         )}

//         {/* ── pagination footer ── */}
//         <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50 flex-wrap gap-3">
//           <span className="text-xs text-gray-500">
//             {totalSnaps.toLocaleString()} snapshot{totalSnaps !== 1 ? "s" : ""} · Page {page} of {totalPages || 1}
//           </span>
//           <Pagination
//             page={page}
//             totalPages={totalPages || 1}
//             loading={loading}
//             onPageChange={setPage}
//           />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default EprPwpCertificateAudit;