import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
  useLayoutEffect,
} from "react";
import { createPortal } from "react-dom";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  MoreVertical,
  Eye,
  Edit2,
  Trash2,
  GripVertical,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Filter,
  X,
  Check,
} from "lucide-react";

/** Fixed width for Action column so edit-mode Cancel/Save icons are fully visible; column is not resizable. */
const ACTION_COLUMN_WIDTH = 88;
const DEFAULT_MIN_WIDTH = 120;

// ─── Excel-style Checkbox Multi-Select Filter Popover (when enableColumnFilter) ───
function FilterPopover({ column, onClose, anchorRef, allData }) {
  const popoverRef = useRef(null);
  const searchRef = useRef(null);
  const [style, setStyle] = useState({});
  const [search, setSearch] = useState("");

  const currentFilter = column.getFilterValue();
  const columnKey = column.id;

  const uniqueValues = useMemo(() => {
    const raw = allData.map((row) => {
      const val = row[columnKey];
      return val === null || val === undefined ? "—" : String(val);
    });
    return [...new Set(raw)].sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }),
    );
  }, [allData, columnKey]);

  const filteredOptions = useMemo(
    () =>
      search.trim()
        ? uniqueValues.filter((v) =>
            v.toLowerCase().includes(search.toLowerCase()),
          )
        : uniqueValues,
    [uniqueValues, search],
  );

  const [selected, setSelected] = useState(() => {
    if (currentFilter instanceof Set) return new Set(currentFilter);
    return new Set(uniqueValues);
  });

  const allFilteredSelected = filteredOptions.every((v) => selected.has(v));
  const someFilteredSelected =
    !allFilteredSelected && filteredOptions.some((v) => selected.has(v));

  useEffect(() => {
    const updatePosition = () => {
      if (!anchorRef?.current) return;
      const rect = anchorRef.current.getBoundingClientRect();
      setStyle({
        top: rect.bottom + 4,
        left: rect.left,
      });
    };

    searchRef.current?.focus();
    updatePosition();

    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [anchorRef]);

  useEffect(() => {
    const handler = (e) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose, anchorRef]);

  const toggleOne = (val) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(val) ? next.delete(val) : next.add(val);
      return next;
    });
  };

  const toggleAll = () => {
    if (allFilteredSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        filteredOptions.forEach((v) => next.delete(v));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        filteredOptions.forEach((v) => next.add(v));
        return next;
      });
    }
  };

  const apply = () => {
    const allSelected = uniqueValues.every((v) => selected.has(v));
    column.setFilterValue(allSelected ? undefined : selected);
    onClose();
  };

  const clear = () => {
    column.setFilterValue(undefined);
    onClose();
  };

  return createPortal(
    <div
      ref={popoverRef}
      style={{
        position: "fixed",
        top: style.top,
        left: style.left,
        width: 220,
        zIndex: 99999,
      }}
      className="bg-white border border-gray-200 rounded-xl shadow-2xl flex flex-col overflow-hidden"
    >
      <div className="flex items-center gap-2 px-3 pt-3 pb-2 border-b border-gray-100">
        <input
          ref={searchRef}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search"
          className="flex-1 text-sm px-2 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 border-b border-gray-100"
        onClick={toggleAll}
      >
        <span
          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
            allFilteredSelected
              ? "bg-blue-600 border-blue-600"
              : someFilteredSelected
                ? "bg-blue-200 border-blue-400"
                : "border-gray-300"
          }`}
        >
          {allFilteredSelected && (
            <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
              <path
                d="M2 6l3 3 5-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
          {someFilteredSelected && !allFilteredSelected && (
            <span className="w-2 h-0.5 bg-blue-600 block rounded" />
          )}
        </span>
        <span className="text-sm font-medium text-gray-700">Select All</span>
      </div>

      <div className="overflow-y-auto max-h-48 min-h-[60px]">
        {filteredOptions.length === 0 ? (
          <div className="px-3 py-4 text-xs text-gray-400 text-center">
            No results
          </div>
        ) : (
          filteredOptions.map((val) => (
            <div
              key={val}
              className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-gray-50"
              onClick={() => toggleOne(val)}
            >
              <span
                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                  selected.has(val)
                    ? "bg-blue-600 border-blue-600"
                    : "border-gray-300"
                }`}
              >
                {selected.has(val) && (
                  <svg
                    className="w-3 h-3 text-white"
                    viewBox="0 0 12 12"
                    fill="none"
                  >
                    <path
                      d="M2 6l3 3 5-5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              <span className="text-sm text-gray-700 truncate" title={val}>
                {val}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-gray-100 bg-gray-50">
        <span className="text-xs text-gray-400">
          {selected.size}/{uniqueValues.length} selected
        </span>
        <div className="flex gap-2">
          <button
            onClick={apply}
            className="px-3 py-1 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Filter
          </button>
          <button
            onClick={clear}
            className="px-3 py-1 text-xs font-semibold bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ─── Header cell with optional sort + filter (when enableSort / enableColumnFilter) ───
function TableHeaderCell({
  header,
  isSticky,
  left,
  isLastSticky,
  showDragHandle,
  dragState,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  enableColumnFilter,
  enableSort,
  allData,
}) {
  const [showFilter, setShowFilter] = useState(false);
  const filterBtnRef = useRef(null);
  const canSort = enableSort && header.column.getCanSort();
  const sortDir = header.column.getIsSorted?.();
  const filterValue = header.column.getFilterValue?.();
  const hasFilter = !!filterValue;
  const isDragging = dragState.draggedId === header.id;
  const isDropTarget = dragState.dropTargetId === header.id;
  const headerBg = isDropTarget
    ? "#eff6ff"
    : isDragging
      ? "#e0e7ff"
      : "#f3f4f6";

  return (
    <th
      onDragOver={
        showDragHandle
          ? (e) => {
              e.preventDefault();
              onDragOver(e, header.id);
            }
          : undefined
      }
      onDrop={showDragHandle ? (e) => onDrop(e, header.id) : undefined}
      className="relative px-2 py-0 text-left font-bold text-gray-700 border-b-2 border-gray-300 select-none"
      style={{
        width: header.getSize(),
        minWidth: header.column.columnDef.minSize,
        maxWidth: header.column.columnDef.maxSize,
        backgroundColor: headerBg,
        borderRight: "1px solid #e5e7eb",
        position: "sticky",
        top: 0,
        zIndex: isSticky ? (left === 0 ? 25 : 15) : 12,
        ...(isSticky && {
          left,
          boxShadow: isLastSticky ? "4px 0 8px -2px rgba(0,0,0,0.12)" : "none",
        }),
      }}
    >
      <div className="relative flex items-center gap-1 w-full overflow-visible h-10 pr-2">
        {showDragHandle && (
          <span
            className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing shrink-0"
            draggable
            onDragStart={(e) => onDragStart(e, header.id)}
            onDragEnd={onDragEnd}
          >
            <GripVertical size={14} />
          </span>
        )}

        <span
          className={`truncate flex-1 min-w-0 text-xs ${
            canSort ? "cursor-pointer hover:text-blue-600" : ""
          }`}
          onClick={
            canSort ? header.column.getToggleSortingHandler() : undefined
          }
          title={
            typeof header.column.columnDef.header === "string"
              ? header.column.columnDef.header
              : undefined
          }
        >
          {header.isPlaceholder
            ? null
            : flexRender(header.column.columnDef.header, header.getContext())}
        </span>

        {canSort && (
          <span
            className="shrink-0 cursor-pointer text-gray-400 hover:text-blue-500"
            onClick={header.column.getToggleSortingHandler()}
          >
            {sortDir === "asc" ? (
              <ArrowUp size={13} className="text-blue-600" />
            ) : sortDir === "desc" ? (
              <ArrowDown size={13} className="text-blue-600" />
            ) : (
              <ArrowUpDown size={13} />
            )}
          </span>
        )}

        {enableColumnFilter && header.column.getCanFilter?.() && (
          <button
            ref={filterBtnRef}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowFilter((v) => !v);
            }}
            className={`shrink-0 p-0.5 rounded hover:bg-blue-100 transition-colors ${
              hasFilter ? "text-blue-600" : "text-gray-400 hover:text-blue-500"
            }`}
            title={
              hasFilter
                ? filterValue instanceof Set
                  ? `Filtered: ${filterValue.size} value(s)`
                  : `Filtered: "${filterValue}"`
                : "Filter column"
            }
          >
            {hasFilter ? <X size={13} /> : <Filter size={13} />}
          </button>
        )}

        {header.column.getCanResize?.() && (
          <div
            onMouseDown={header.getResizeHandler()}
            onTouchStart={header.getResizeHandler()}
            className="resize-handle absolute right-0 top-0 bottom-0 w-2 cursor-col-resize select-none flex items-center justify-center hover:bg-blue-100 transition-colors rounded group/handle touch-none"
            title="Drag to resize column"
          >
            <span className="w-0.5 h-4 bg-gray-300 group-hover/handle:bg-blue-500 rounded-full pointer-events-none transition-colors" />
          </div>
        )}
      </div>

      {showFilter && enableColumnFilter && (
        <FilterPopover
          column={header.column}
          onClose={() => setShowFilter(false)}
          anchorRef={filterBtnRef}
          allData={allData}
        />
      )}
    </th>
  );
}

/** Stable wrapper for inline-edit input/select. */
function InlineEditCell({
  value,
  rowId,
  columnKey,
  columnDef,
  onChange,
  onClick,
  onFocus,
  disabled,
}) {
  const valStr = value == null ? "" : String(value);
  const isDisabled = Boolean(disabled);
  if (
    columnDef?.editType === "select" &&
    Array.isArray(columnDef?.editOptions) &&
    columnDef.editOptions.length > 0
  ) {
    return (
      <select
        data-inline-edit="1"
        data-rowid={String(rowId)}
        data-colkey={String(columnKey)}
        className="w-full min-w-0 text-sm border border-gray-300 rounded px-1 py-0.5 bg-white disabled:opacity-60 disabled:cursor-not-allowed"
        value={valStr}
        onChange={(e) => onChange(columnKey, e.target.value)}
        onClick={onClick}
        onFocus={onFocus}
        onKeyDown={(e) => e.stopPropagation()}
        disabled={isDisabled}
      >
        {columnDef.editOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }
  const isNumber = columnDef?.editType === "number";
  const isNumericOnly =
    columnDef?.editInputType === "tel" ||
    columnDef?.editInputType === "numeric";
  return (
    <input
      data-inline-edit="1"
      data-rowid={String(rowId)}
      data-colkey={String(columnKey)}
      type={isNumber ? "number" : "text"}
      step={isNumber ? "any" : undefined}
      inputMode={isNumber ? "decimal" : isNumericOnly ? "numeric" : undefined}
      className="w-full min-w-0 text-sm border border-gray-300 rounded px-1 py-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
      value={valStr}
      onChange={(e) => onChange(columnKey, e.target.value)}
      onClick={onClick}
      onFocus={onFocus}
      onKeyDown={(e) => e.stopPropagation()}
      disabled={isDisabled}
    />
  );
}

/**
 * Reusable Excel-like data table using @tanstack/react-table:
 * - Sticky left columns (Action + configurable keys)
 * - Horizontal scroll for rest
 * - Resizable columns (library-backed)
 * - Optional column reorder via drag-and-drop (columnOrder + onColumnOrderChange, or local when enableColumnFilter/enableSort)
 * - Optional column filter + sort when enableColumnFilter / enableSort (default off for Packaging)
 * - Optional getRowStyle(row) for row background
 * - Action column: three-dot menu (View, Edit, Delete)
 */
const ExcelLikeTable = ({
  columns = [],
  stickyColumnKeys = [],
  data = [],
  getRowId = (row) => row.id,
  renderCell,
  onView,
  onEdit,
  onDelete,
  onRowDoubleClick,
  editingRowId = null,
  editingDraft = {},
  onEditingFieldChange,
  onSaveEdit,
  onCancelEdit,
  enableBulkSelect = false,
  selectedIds = [],
  onSelectRow,
  onSelectAll,
  columnOrder: columnOrderProp,
  onColumnOrderChange,
  enableColumnFilter = false,
  enableSort = false,
  pagination,
  onFilteredCountChange,
  getRowStyle,
  tableMaxHeight,
  showActions = true,
}) => {
  // Keep latest edit props in refs so column definitions stay stable while typing.
  const editingRowIdRef = useRef(editingRowId);
  editingRowIdRef.current = editingRowId;
  const editingDraftRef = useRef(editingDraft);
  editingDraftRef.current = editingDraft;
  const onEditingFieldChangeRef = useRef(onEditingFieldChange);
  onEditingFieldChangeRef.current = onEditingFieldChange;
  const onSaveEditRef = useRef(onSaveEdit);
  onSaveEditRef.current = onSaveEdit;
  const onCancelEditRef = useRef(onCancelEdit);
  onCancelEditRef.current = onCancelEdit;

  // Focus preservation for inline editing:
  // If something causes the input/select to remount on keystroke, we restore focus
  // to the last active edit cell (rowId + columnKey).
  const activeEditCellRef = useRef(null); // { rowId: string, columnKey: string }
  const setActiveEditCell = useCallback((rowId, columnKey) => {
    activeEditCellRef.current = {
      rowId: String(rowId),
      columnKey: String(columnKey),
    };
  }, []);

  useLayoutEffect(() => {
    if (editingRowId == null) {
      activeEditCellRef.current = null;
      return;
    }
    const active = activeEditCellRef.current;
    if (!active) return;

    // Defer until DOM has painted.
    const raf = window.requestAnimationFrame(() => {
      const selector = `[data-inline-edit="1"][data-rowid="${active.rowId}"][data-colkey="${active.columnKey}"]`;
      const el = document.querySelector(selector);
      if (!el) return;
      if (document.activeElement === el) return;
      try {
        el.focus({ preventScroll: true });
      } catch {
        el.focus();
      }
      // Put caret at end for text inputs.
      if (
        typeof el.setSelectionRange === "function" &&
        typeof el.value === "string"
      ) {
        const len = el.value.length;
        try {
          el.setSelectionRange(len, len);
        } catch {}
      }
    });
    return () => window.cancelAnimationFrame(raf);
  }, [editingRowId, editingDraft]);

  const displayRowsRef = useRef([]);
  const [dragState, setDragState] = useState({
    draggedId: null,
    dropTargetId: null,
  });
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);

  const columnMap = useMemo(
    () => Object.fromEntries(columns.map((c) => [c.key, c])),
    [columns],
  );

  const defaultOrder = useMemo(() => columns.map((c) => c.key), [columns]);

  const [columnOrderLocal, setColumnOrderLocal] = useState(() => defaultOrder);
  useEffect(() => {
    const prevSet = new Set(columnOrderLocal);
    const added = defaultOrder.filter((k) => !prevSet.has(k));
    if (added.length > 0) {
      setColumnOrderLocal((prev) => [
        ...prev.filter((k) => defaultOrder.includes(k)),
        ...added,
      ]);
    }
  }, [defaultOrder.join(",")]);

  const effectiveOrder = useMemo(() => {
    if (columnOrderProp && columnOrderProp.length > 0) {
      const ordered = columnOrderProp.filter((k) => columnMap[k]);
      const rest = defaultOrder.filter((k) => !ordered.includes(k));
      return [...ordered, ...rest];
    }
    return columnOrderLocal.filter((k) => columnMap[k]).length
      ? columnOrderLocal
      : defaultOrder;
  }, [columnOrderProp, columnMap, defaultOrder, columnOrderLocal]);

  const orderedStickyKeys = useMemo(() => {
    return effectiveOrder.filter((k) => stickyColumnKeys.includes(k));
  }, [effectiveOrder, stickyColumnKeys]);

  const scrollableKeys = useMemo(() => {
    return effectiveOrder.filter((k) => !stickyColumnKeys.includes(k));
  }, [effectiveOrder, stickyColumnKeys]);

  const dataColumnIds = useMemo(
    () => [...orderedStickyKeys, ...scrollableKeys],
    [orderedStickyKeys, scrollableKeys],
  );

  const showDragForColumn = Boolean(
    (onColumnOrderChange || enableColumnFilter || enableSort) && true,
  );

  const handleHeaderDragStart = useCallback(
    (e, headerId) => {
      if (!dataColumnIds.includes(headerId)) return;
      e.dataTransfer.setData("text/plain", headerId);
      e.dataTransfer.effectAllowed = "move";
      setDragState({ draggedId: headerId, dropTargetId: null });
    },
    [dataColumnIds],
  );

  const handleHeaderDragOver = useCallback(
    (e, headerId) => {
      if (!dataColumnIds.includes(headerId)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDragState((prev) =>
        prev.draggedId ? { ...prev, dropTargetId: headerId } : prev,
      );
    },
    [dataColumnIds],
  );

  const handleHeaderDrop = useCallback(
    (e, headerId) => {
      e.preventDefault();
      if (!dragState.draggedId || dragState.draggedId === headerId) {
        setDragState({ draggedId: null, dropTargetId: null });
        return;
      }
      const fromI = dataColumnIds.indexOf(dragState.draggedId);
      const toI = dataColumnIds.indexOf(headerId);
      if (fromI === -1 || toI === -1) {
        setDragState({ draggedId: null, dropTargetId: null });
        return;
      }
      const newOrder = [...dataColumnIds];
      const [removed] = newOrder.splice(fromI, 1);
      newOrder.splice(toI, 0, removed);
      if (onColumnOrderChange) {
        onColumnOrderChange(newOrder);
      } else {
        setColumnOrderLocal(newOrder);
      }
      setDragState({ draggedId: null, dropTargetId: null });
    },
    [onColumnOrderChange, dragState.draggedId, dataColumnIds],
  );

  const handleHeaderDragEnd = useCallback(() => {
    setDragState({ draggedId: null, dropTargetId: null });
  }, []);

  const getCellContent = useCallback(
    (key, row) => (renderCell ? renderCell(key, row) : (row[key] ?? "—")),
    [renderCell],
  );

  const tableColumns = useMemo(() => {
    const defs = [];

    if (enableBulkSelect) {
      defs.push({
        id: "__select__",
        header: ({ table }) => {
          const rows = pagination
            ? displayRowsRef.current
            : table.getRowModel().rows;
          const currentData = rows.map((r) => r.original);
          const selectableData = currentData.filter(
            (row) =>
              !(
                row.source === "EPR" ||
                row.data_source === "EPR" ||
                row._sourceType === "epr"
              ),
          );

          return (
            <input
              type="checkbox"
              onChange={(e) => onSelectAll?.(e.target.checked, selectableData)}
              checked={
                selectableData.length > 0 &&
                selectableData.every((row) =>
                  selectedIds.includes(getRowId(row)),
                )
              }
            />
          );
        },
        size: 44,
        minSize: 44,
        maxSize: 44,
        enableResizing: false,
        enableSorting: false,
        enableColumnFilter: false,
        meta: { sticky: true },
        cell: ({ row }) => {
          const id = getRowId(row.original);
          const isEPR =
            row.original.source === "EPR" ||
            row.original.data_source === "EPR" ||
            row.original._sourceType === "epr";
          return (
            <input
              type="checkbox"
              checked={selectedIds.includes(id)}
              disabled={isEPR}
              onChange={(e) =>
                onSelectRow?.(id, e.target.checked, row.original)
              }
              className={
                isEPR ? "cursor-not-allowed opacity-50" : "cursor-pointer"
              }
            />
          );
        },
      });
    }

    if (showActions) {
      defs.push({
        id: "__action__",
        header: "Action",
        size: ACTION_COLUMN_WIDTH,
        minSize: ACTION_COLUMN_WIDTH,
        maxSize: ACTION_COLUMN_WIDTH,
        enableResizing: false,
        enableSorting: false,
        enableColumnFilter: false,
        meta: { sticky: true },
        cell: ({ row }) => {
          const rowId = getRowId(row.original);
          const currentEditingRowId = editingRowIdRef.current;
          const isEditing =
            currentEditingRowId != null &&
            String(rowId) === String(currentEditingRowId);

          const save = onSaveEditRef.current;
          const cancel = onCancelEditRef.current;

          if (
            isEditing &&
            typeof save === "function" &&
            typeof cancel === "function"
          ) {
            return (
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    cancel();
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    save();
                  }}
                >
                  Save
                </button>
              </div>
            );
          }

          return (
            <ActionMenu
              row={row.original}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          );
        },
      });
    }

    orderedStickyKeys.forEach((k) => {
      const col = columnMap[k];
      defs.push({
        id: k,
        accessorKey: k,
        header: col?.label ?? k,
        size: col?.defaultWidth ?? col?.minWidth ?? 100,
        minSize: col?.minWidth ?? DEFAULT_MIN_WIDTH,
        enableResizing: true,
        enableSorting: enableSort,
        enableColumnFilter: enableColumnFilter,
        meta: { sticky: true },
        cell: ({ row }) => {
          const rowId = getRowId(row.original);
          const currentEditingRowId = editingRowIdRef.current;
          const isEditing =
            currentEditingRowId != null &&
            String(rowId) === String(currentEditingRowId);
          const onFieldChange = onEditingFieldChangeRef.current;
          const draft = editingDraftRef.current || {};
          if (
            isEditing &&
            col?.editable &&
            typeof onFieldChange === "function"
          ) {
            const value = draft[k] !== undefined ? draft[k] : row.original[k];
            const editDisabled =
              typeof col.editDisabled === "function"
                ? col.editDisabled(row.original, draft)
                : false;
            return (
              <InlineEditCell
                key={`edit-${rowId}-${k}`}
                value={value}
                rowId={rowId}
                columnKey={k}
                columnDef={col}
                onChange={onFieldChange}
                onClick={(e) => e.stopPropagation()}
                onFocus={() => setActiveEditCell(rowId, k)}
                disabled={editDisabled}
              />
            );
          }
          return getCellContent(k, row.original);
        },
        ...(enableColumnFilter && {
          filterFn: (row, columnId, filterValue) => {
            if (!(filterValue instanceof Set)) return true;
            const val = row.getValue(columnId);
            const strVal =
              val === null || val === undefined ? "—" : String(val);
            return filterValue.has(strVal);
          },
        }),
      });
    });

    scrollableKeys.forEach((k) => {
      const col = columnMap[k];
      if (!col) return;
      defs.push({
        id: k,
        accessorKey: k,
        header: col?.label ?? k,
        size: col?.defaultWidth ?? col?.minWidth ?? 100,
        minSize: col?.minWidth ?? DEFAULT_MIN_WIDTH,
        enableResizing: true,
        enableSorting: enableSort,
        enableColumnFilter: enableColumnFilter,
        meta: { sticky: false },
        cell: ({ row }) => {
          const rowId = getRowId(row.original);
          const currentEditingRowId = editingRowIdRef.current;
          const isEditing =
            currentEditingRowId != null &&
            String(rowId) === String(currentEditingRowId);
          const onFieldChange = onEditingFieldChangeRef.current;
          const draft = editingDraftRef.current || {};
          if (
            isEditing &&
            col?.editable &&
            typeof onFieldChange === "function"
          ) {
            const value = draft[k] !== undefined ? draft[k] : row.original[k];
            const editDisabled =
              typeof col.editDisabled === "function"
                ? col.editDisabled(row.original, draft)
                : false;
            return (
              <InlineEditCell
                key={`edit-${rowId}-${k}`}
                value={value}
                rowId={rowId}
                columnKey={k}
                columnDef={col}
                onChange={onFieldChange}
                onClick={(e) => e.stopPropagation()}
                onFocus={() => setActiveEditCell(rowId, k)}
                disabled={editDisabled}
              />
            );
          }
          return getCellContent(k, row.original);
        },
        ...(enableColumnFilter && {
          filterFn: (row, columnId, filterValue) => {
            if (!(filterValue instanceof Set)) return true;
            const val = row.getValue(columnId);
            const strVal =
              val === null || val === undefined ? "—" : String(val);
            return filterValue.has(strVal);
          },
        }),
      });
    });

    return defs;
  }, [
    enableBulkSelect,
    enableSort,
    enableColumnFilter,
    pagination,
    orderedStickyKeys,
    scrollableKeys,
    columnMap,
    selectedIds,
    onSelectRow,
    onSelectAll,
    getRowId,
    onView,
    onEdit,
    onDelete,
    getCellContent,
    // NOTE: do not depend on editingDraft while typing, otherwise columns
    // re-create and the input loses focus after each keystroke.
  ]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      ...(enableSort && { sorting }),
      ...(enableColumnFilter && { columnFilters }),
    },
    onSortingChange: enableSort ? setSorting : undefined,
    onColumnFiltersChange: enableColumnFilter ? setColumnFilters : undefined,
    getCoreRowModel: getCoreRowModel(),
    ...(enableSort && { getSortedRowModel: getSortedRowModel() }),
    ...(enableColumnFilter && {
      getFilteredRowModel: getFilteredRowModel(),
    }),
    columnResizeMode: "onChange",
    enableColumnResizing: true,
    getRowId: (row) => String(getRowId(row)),
    defaultColumn: { minSize: DEFAULT_MIN_WIDTH, maxSize: 800 },
  });

  const fullFilteredRows = table.getRowModel().rows;
  const displayRows =
    pagination && pagination.pageSize > 0
      ? fullFilteredRows.slice(
          pagination.pageIndex * pagination.pageSize,
          (pagination.pageIndex + 1) * pagination.pageSize,
        )
      : fullFilteredRows;
  displayRowsRef.current = displayRows;

  useEffect(() => {
    if (typeof onFilteredCountChange === "function") {
      onFilteredCountChange(fullFilteredRows.length);
    }
  }, [fullFilteredRows.length, onFilteredCountChange]);

  const currentData = displayRows;
  const totalSize = table.getTotalSize();
  const stickyCount =
    (enableBulkSelect ? 1 : 0) +
    (showActions ? 1 : 0) +
    orderedStickyKeys.length;
  const hasActiveFilters =
    enableColumnFilter && table.getState().columnFilters?.length > 0;
  const filteredCount = fullFilteredRows.length;

  return (
    <div
      className="w-full rounded-lg border border-gray-200 bg-white flex flex-col"
      style={{
        maxHeight: tableMaxHeight || undefined,
      }}
    >
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 px-3 py-2 bg-blue-50 border-b border-blue-100 shrink-0">
          <span className="text-xs text-blue-600 font-semibold self-center">
            Active filters:
          </span>
          {table.getState().columnFilters?.map((f) => {
            const col = table.getColumn(f.id);
            const label = col?.columnDef?.header ?? f.id;
            const displayValue =
              f.value instanceof Set
                ? f.value.size === 1
                  ? [...f.value][0]
                  : `${f.value.size} values`
                : String(f.value);
            return (
              <span
                key={f.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
              >
                <span className="font-semibold">{label}:</span> {displayValue}
                <button
                  type="button"
                  onClick={() => col?.setFilterValue(undefined)}
                  className="ml-1 hover:text-red-500"
                >
                  <X size={11} />
                </button>
              </span>
            );
          })}
          <button
            type="button"
            onClick={() => setColumnFilters([])}
            className="text-xs text-red-500 hover:text-red-700 font-medium underline self-center"
          >
            Clear all
          </button>
          <span className="text-xs text-gray-500 self-center ml-auto">
            Showing {filteredCount} of {data.length} rows
          </span>
        </div>
      )}

      <div
        className="flex-1 min-h-0 overflow-auto"
        style={{ maxHeight: tableMaxHeight ? "100%" : undefined }}
      >
        <table
          className="text-sm border-separate border-spacing-0"
          style={{
            tableLayout: "fixed",
            width: totalSize,
            minWidth: "100%",
          }}
        >
          <colgroup>
            {table.getHeaderGroups()[0].headers.map((header) => (
              <col
                key={header.id}
                style={{
                  width: header.getSize(),
                  minWidth: header.column.columnDef.minSize,
                  maxWidth: header.column.columnDef.maxSize,
                }}
              />
            ))}
          </colgroup>
          <thead className="bg-gray-100">
            {table.getHeaderGroups().map((headerGroup) => {
              let stickyLeft = 0;
              let stickyIndex = 0;
              return (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const meta = header.column.columnDef.meta || {};
                    const isSticky = meta.sticky;
                    const left = isSticky ? stickyLeft : undefined;
                    if (isSticky) stickyLeft += header.getSize();
                    const isLastSticky =
                      isSticky && stickyIndex === stickyCount - 1;
                    if (isSticky) stickyIndex++;
                    const isDataColumn = dataColumnIds.includes(header.id);
                    const showDragHandle = showDragForColumn && isDataColumn;
                    return (
                      <TableHeaderCell
                        key={header.id}
                        header={header}
                        isSticky={isSticky}
                        left={left}
                        isLastSticky={isLastSticky}
                        stickyCount={stickyCount}
                        isDataColumn={isDataColumn}
                        showDragHandle={showDragHandle}
                        dragState={dragState}
                        onDragStart={handleHeaderDragStart}
                        onDragOver={handleHeaderDragOver}
                        onDrop={handleHeaderDrop}
                        onDragEnd={handleHeaderDragEnd}
                        enableColumnFilter={enableColumnFilter}
                        enableSort={enableSort}
                        allData={data}
                      />
                    );
                  })}
                </tr>
              );
            })}
          </thead>

          <tbody>
            {currentData.length === 0 ? (
              !hasActiveFilters ? (
                <tr>
                  <td
                    colSpan={tableColumns.length}
                    className="px-4 py-8 text-center text-gray-500 border-b border-gray-200"
                  >
                    No data available
                  </td>
                </tr>
              ) : null
            ) : (
              currentData.map((row) => {
                let stickyLeft = 0;
                let stickyIndex = 0;
                return (
                  <tr
                    key={row.id}
                    className="group border-b border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                    style={getRowStyle ? getRowStyle(row.original) : undefined}
                    onDoubleClick={() => {
                      if (onRowDoubleClick) onRowDoubleClick(row.original);
                    }}
                    role={onRowDoubleClick ? "button" : undefined}
                    title={
                      onRowDoubleClick ? "Double-click to edit" : undefined
                    }
                  >
                    {row.getVisibleCells().map((cell) => {
                      const meta = cell.column.columnDef.meta || {};
                      const isSticky = meta.sticky;
                      const left = isSticky ? stickyLeft : undefined;
                      if (isSticky) stickyLeft += cell.column.getSize();
                      const isLastSticky =
                        isSticky && stickyIndex === stickyCount - 1;
                      if (isSticky) stickyIndex++;
                      return (
                        <td
                          key={cell.id}
                          className={`px-2 py-3 text-gray-600 align-top border-r border-gray-200 ${isSticky ? "bg-white group-hover:!bg-gray-50" : ""}`}
                          style={{
                            width: cell.column.getSize(),
                            minWidth: cell.column.columnDef.minSize,
                            maxWidth: cell.column.columnDef.maxSize,
                            overflow: "hidden",
                            ...(isSticky && {
                              position: "sticky",
                              left,
                              zIndex: left === 0 ? 20 : 10,
                              boxShadow: isLastSticky
                                ? "4px 0 8px -2px rgba(0,0,0,0.12)"
                                : "none",
                            }),
                          }}
                          title={
                            typeof cell.getValue() === "string"
                              ? cell.getValue()
                              : undefined
                          }
                        >
                          <div className="overflow-hidden text-ellipsis whitespace-nowrap max-w-full">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {currentData.length === 0 && hasActiveFilters && (
          <div className="w-full px-4 py-8 text-center text-gray-500 border-b border-gray-200 bg-white shrink-0">
            <div className="flex flex-col items-center gap-2">
              <Filter size={28} className="text-gray-300" />
              <span>No results match your filters.</span>
              <button
                type="button"
                onClick={() => setColumnFilters([])}
                className="text-blue-500 text-sm underline"
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Action Menu (unchanged) ──────────────────────────────────────────────────
function ActionMenu({ row, onView, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const triggerRef = useRef(null);

  const hasActions = onView || onEdit || onDelete;
  if (!hasActions) return <span className="text-gray-400">—</span>;

  const openMenu = () => {
    setOpen(true);
    requestAnimationFrame(() => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const menuHeight = 140;
      const padding = 8;
      const viewportH = window.innerHeight;
      const openDown = rect.bottom + menuHeight + padding <= viewportH;
      setMenuStyle({
        position: "fixed",
        left: Math.max(8, Math.min(rect.left, window.innerWidth - 160)),
        top: openDown ? rect.bottom + padding : undefined,
        bottom: openDown ? undefined : viewportH - rect.top + padding,
        zIndex: 9999,
        minWidth: 140,
      });
    });
  };

  const closeMenu = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target) &&
        !e.target.closest("[data-action-menu]")
      )
        closeMenu();
    };
    document.addEventListener("click", close);
    document.addEventListener("scroll", closeMenu, true);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("scroll", closeMenu, true);
    };
  }, [open, closeMenu]);

  const isEPR =
    row.source === "EPR" ||
    row.data_source === "EPR" ||
    row._sourceType === "epr";

  const menuContent = open && (
    <div
      data-action-menu
      className="py-1 bg-white border border-gray-200 rounded-lg shadow-xl"
      style={menuStyle}
    >
      {onView && (
        <button
          type="button"
          onClick={() => {
            onView(row);
            closeMenu();
          }}
          className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 whitespace-nowrap"
        >
          <Eye size={16} /> View
        </button>
      )}
      {!isEPR && onEdit && (
        <button
          type="button"
          onClick={() => {
            onEdit(row);
            closeMenu();
          }}
          className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 whitespace-nowrap"
        >
          <Edit2 size={16} /> Edit
        </button>
      )}
      {!isEPR && onDelete && (
        <button
          type="button"
          onClick={() => {
            onDelete(row);
            closeMenu();
          }}
          className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 whitespace-nowrap"
        >
          <Trash2 size={16} /> Delete
        </button>
      )}
    </div>
  );

  return (
    <>
      <div className="relative flex ">
        <button
          ref={triggerRef}
          type="button"
          onClick={openMenu}
          className="p-1.5 rounded hover:bg-gray-200 text-gray-600 flex items-center justify-center"
          title="Actions"
          aria-label="Row actions"
        >
          <MoreVertical size={18} />
        </button>
      </div>
      {open && createPortal(menuContent, document.body)}
    </>
  );
}

export default ExcelLikeTable;
