import { useState, useEffect, useCallback } from "react";
import ExcelLikeTable from "../components/ExcelLikeTable";
import { Download } from "lucide-react";
import CommonPagination from "../components/CommonPagination";
import { exportToExcel } from "../utils/exportExcel";
import CommonFilters from "../components/CommonFilters";
import CommonButton from "../components/CommonButton";
import { pwpService } from "../services/pwpService";
import { formatDate } from "../utils/formatDate";
import { useAuth } from "../auth/AuthContext";
import { getBearerToken } from "../utils/climetoSso";

function buildPwpParams({
  search,
  activeTab,
  fromDate,
  toDate,
  selectedStates,
  page,
  limit,
}) {
  const params = {
    search,
    is_active: true,
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

  // Default All = no states param; e.g. states=PUNJAB,TAMIL NADU,UTTAR PRADESH
  if (selectedStates?.length > 0) {
    params.states = selectedStates.join(",");
  }

  return params;
}

const PwpRegisteredList = () => {
  const { bootstrapped, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("current");

  const [search, setSearch] = useState("");
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
    { key: "company_id", label: "Company ID", minWidth: 130 },
    { key: "company", label: "Company Name", minWidth: 250 },
    { key: "state", label: "State", minWidth: 200 },
    { key: "address", label: "Address", minWidth: 300 },
    { key: "category", label: "Category", minWidth: 130 },
    { key: "class", label: "Class", minWidth: 150 },
    { key: "status", label: "Status", minWidth: 100 },
    { key: "first_seen_at", label: "First Seen At", minWidth: 150 },
  ];

  const filterConfig = [
    {
      type: "search",
      name: "search",
      value: search,
      placeholder: "Search...",
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
    if (!bootstrapped || !getBearerToken()) return;

    const loadStateOptions = async () => {
      try {
        const res = await pwpService.getPwpData({
          page: 1,
          limit: 5000,
          is_active: true,
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
  }, [bootstrapped, isAuthenticated]);

  const handleFilterChange = (name, value) => {
    setPageIndex(0);

    if (name === "search") setSearch(value);
    if (name === "states") setSelectedStates(value);

    if (name === "date") {
      setFromDate("");
      setToDate("");
    }

    if (name === "dateRange") {
      setFromDate(value.from);
      setToDate(value.to);
    }
  };

  const handleReset = () => {
    setSearch("");
    setSelectedStates([]);
    setPageIndex(0);
    setFromDate("");
    setToDate("");
  };

  const fetchData = useCallback(async () => {
    if (!bootstrapped || !getBearerToken()) return;

    try {
      setLoading(true);

      const params = buildPwpParams({
        search,
        activeTab,
        fromDate,
        toDate,
        selectedStates,
        page: pageIndex + 1,
        limit: pageSize,
      });

      const res = await pwpService.getPwpData(params);

      setData(res?.data?.records || []);
      setTotal(res?.data?.total || 0);
    } catch (error) {
      console.error("API Error:", error);
    } finally {
      setLoading(false);
    }
  }, [bootstrapped, isAuthenticated, pageIndex, pageSize, search, activeTab, fromDate, toDate, statesKey]);

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

      const params = buildPwpParams({
        search,
        activeTab,
        fromDate,
        toDate,
        selectedStates,
      });

      const res = await pwpService.exportPwpData(params);
      const exportData = res?.data || [];

      if (!exportData.length) {
        alert("No data to export for the current filters.");
        return;
      }

      const formatted = exportData.map((item) => ({
        "Company Name": item.company,
        State: item.state,
        Category: item.category,
        Class: item.class,
        Address: item.address,
        Status: item.status,
        "First Seen": formatDate(item.first_seen_at),
      }));

      exportToExcel({
        data: formatted,
        fileName: "pwp-data.xlsx",
        sheetName: "PWP Data",
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

        <div className="p-4">
          {loading ? (
            <div className="text-center py-10">Loading...</div>
          ) : (
            <ExcelLikeTable
              columns={columns}
              data={formattedData}
              showActions={false}
            />
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

export default PwpRegisteredList;
