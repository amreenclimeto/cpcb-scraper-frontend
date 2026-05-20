import { useState, useEffect, useCallback } from "react";
import ExcelLikeTable from "../components/ExcelLikeTable";
import { Download } from "lucide-react";
import { piboService } from "../services/piboService";
import CommonPagination from "../components/CommonPagination";
import { exportToExcel } from "../utils/exportExcel";
import CommonFilters from "../components/CommonFilters";
import CommonButton from "../components/CommonButton";
import { formatDate } from "../utils/formatDate";

function buildPiboParams({
  search,
  entityTypeFilter,
  activeTab,
  fromDate,
  toDate,
  selectedStates,
  page,
  limit,
}) {
  const params = {
    search: search || "",
    entity_type: entityTypeFilter || "",
  };

  if (page != null) params.page = page;
  if (limit != null) params.limit = limit;

  if (activeTab === "new") {
    params.is_new = true;
  }

  if (fromDate && toDate) {
    params.from_date = fromDate;
    params.to_date = toDate;
  }

  // Default All = no states param; e.g. states=Gujarat,Andhra Pradesh
  if (selectedStates?.length > 0) {
    params.states = selectedStates.join(",");
  }

  return params;
}

const TableLoader = () => (
  <div className="flex flex-col items-center justify-center py-20 min-h-[280px] gap-3">
    <div
      className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"
      role="status"
      aria-label="Loading"
    />
    <p className="text-sm font-medium text-gray-600">Loading data...</p>
    <p className="text-xs text-gray-400">Please wait</p>
  </div>
);

const PiboRegisteredList = () => {
  const [activeTab, setActiveTab] = useState("current");

  const [search, setSearch] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState("");
  const [selectedStates, setSelectedStates] = useState([]);
  const [stateOptions, setStateOptions] = useState([]);

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(5);

  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const columns = [
    { key: "company_id", label: "Company ID", minWidth: 50 },
    { key: "company", label: "Company Name", minWidth: 220 },
    { key: "state", label: "State", minWidth: 140 },
    { key: "address", label: "Address", minWidth: 280 },
    { key: "entity_type", label: "Entity Type", minWidth: 80 },
    { key: "status", label: "Status", minWidth: 60 },
    { key: "first_seen_at", label: "First Seen At", minWidth: 140 },
  ];

  const filterConfig = [
    {
      type: "search",
      name: "search",
      value: search,
      placeholder: "Search...",
    },
    {
      type: "select",
      name: "entityType",
      value: entityTypeFilter,
      placeholder: "All Entity",
      options: ["Brand Owner", "Producer", "Importer"],
    },
    {
      type: "multi-select",
      name: "states",
      value: selectedStates,
      placeholder: "All States",
      options: stateOptions,
    },
    {
      type: "date-range",
      name: "dateRange",
      from: fromDate,
      to: toDate,
    },
  ];

  const statesKey = selectedStates.join("|");

  useEffect(() => {
    const loadStateOptions = async () => {
      try {
        const res = await piboService.getPiboRegistered({
          page: 1,
          limit: 5000,
          entity_type: "",
          search: "",
        });
        const states = [
          ...new Set(
            (res?.data?.records || [])
              .map((r) => r.state?.trim())
              .filter(Boolean),
          ),
        ].sort((a, b) => a.localeCompare(b));
        setStateOptions(states);
      } catch (error) {
        console.error("Failed to load state options:", error);
      }
    };
    loadStateOptions();
  }, []);

  const handleFilterChange = (name, value) => {
    setPageIndex(0);

    if (name === "search") setSearch(value);
    if (name === "entityType") setEntityTypeFilter(value);
    if (name === "states") setSelectedStates(value);

    if (name === "dateRange") {
      setFromDate(value.from);
      setToDate(value.to);
    }
  };

  const handleReset = () => {
    setSearch("");
    setEntityTypeFilter("");
    setSelectedStates([]);
    setPageIndex(0);
    setFromDate("");
    setToDate("");
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const params = buildPiboParams({
        search,
        entityTypeFilter,
        activeTab,
        fromDate,
        toDate,
        selectedStates,
        page: pageIndex + 1,
        limit: pageSize,
      });

      const res = await piboService.getPiboRegistered(params);

      setData(res?.data?.records || []);
      setTotal(res?.data?.total || 0);
    } catch (error) {
      console.error("API Error:", error);
    } finally {
      setLoading(false);
    }
  }, [
    pageIndex,
    pageSize,
    search,
    entityTypeFilter,
    activeTab,
    fromDate,
    toDate,
    statesKey,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formattedData = data.map((item) => ({
    ...item,
    first_seen_at: formatDate(item.first_seen_at),
  }));

  const handleExport = async () => {
    try {
      setExporting(true);

      const params = buildPiboParams({
        search,
        entityTypeFilter,
        activeTab,
        fromDate,
        toDate,
        selectedStates,
      });

      const res = await piboService.exportPiboData(params);
      const exportData = res?.data || [];

      if (!exportData.length) {
        alert("No data to export for the current filters.");
        return;
      }

      const formatted = exportData.map((item) => ({
        "Company ID": item.company_id,
        "Company Name": item.company,
        State: item.state,
        "Entity Type": item.entity_type,
        Status: item.status,
        "First Seen At": formatDate(item.first_seen_at),
        Address: item.address,
      }));

      exportToExcel({
        data: formatted,
        fileName: "pibo-data.xlsx",
        sheetName: "PIBO Data",
      });
    } catch (err) {
      console.error("Export Error:", err);
      alert("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="">
      <div className="flex gap-4 mb-4 flex-wrap items-center">
        <CommonButton
          label="All Data"
          onClick={() => {
            setActiveTab("current");
            setPageIndex(0);
          }}
          variant={activeTab === "current" ? "primary" : "secondary"}
        />

        <CommonButton
          label="New Companies 🚀"
          onClick={() => {
            setActiveTab("new");
            setPageIndex(0);
          }}
          variant={activeTab === "new" ? "success" : "secondary"}
        />
        <CommonButton
          label={exporting ? "Exporting…" : "Export Excel"}
          onClick={handleExport}
          icon={Download}
          variant="primary"
          disabled={exporting || loading}
        />
      </div>

      <div className="bg-white rounded-xl shadow border">
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex gap-4">
            <CommonFilters
              filters={filterConfig}
              onChange={handleFilterChange}
              onReset={handleReset}
            />
          </div>

          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPageIndex(0);
            }}
            className="border px-2 py-1 rounded"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </div>

        <div className="p-4 relative min-h-[320px]">
          {loading && <TableLoader />}
          {!loading && formattedData.length > 0 && (
            <ExcelLikeTable
              columns={columns}
              data={formattedData}
              showActions={false}
            />
          )}
          {!loading && formattedData.length === 0 && (
            <p className="text-center py-12 text-sm text-gray-400">
              No records found for the selected filters.
            </p>
          )}
        </div>

        <CommonPagination
          pageIndex={pageIndex}
          pageSize={pageSize}
          total={total}
          onPageChange={(newPage) => setPageIndex(newPage)}
        />
      </div>
    </div>
  );
};

export default PiboRegisteredList;
