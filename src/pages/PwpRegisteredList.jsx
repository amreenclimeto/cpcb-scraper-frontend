import { useState, useEffect } from "react";
import ExcelLikeTable from "../components/ExcelLikeTable";
import { Download } from "lucide-react";
import CommonPagination from "../components/CommonPagination";
import { exportToExcel } from "../utils/exportExcel";
import CommonFilters from "../components/CommonFilters";
import CommonButton from "../components/CommonButton";
import { pwpService } from "../services/pwpService";
import { formatDate } from "../utils/formatDate";

const PwpRegisteredList = () => {
  const [activeTab, setActiveTab] = useState("current"); // 🔥 NEW

  const [search, setSearch] = useState("");

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(5);

  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

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
      type: "date-range",
      name: "dateRange",
      from: fromDate,
      to: toDate,
    },
  ];

  const handleFilterChange = (name, value) => {
    setPageIndex(0);

    if (name === "search") setSearch(value);

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
    setPageIndex(0);
    setFromDate("");
    setToDate("");
  };

  const fetchData = async () => {
    if (loading) return;

    try {
      setLoading(true);

      const params = {
        page: pageIndex + 1,
        limit: pageSize,
        search,
        is_active: true, // ✅ recommended
      };

      if (activeTab === "new") {
        params.is_new = true;
      }

      if (fromDate && toDate) {
        params.from_date = fromDate;
        params.to_date = toDate;
      }
      const res = await pwpService.getPwpData(params);

      setData(res?.data?.records || []);
      setTotal(res?.data?.total || 0);
    } catch (error) {
      console.error("API Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 API CALL
  useEffect(() => {
    fetchData();
  }, [pageIndex, pageSize, search, activeTab, fromDate, toDate]);

  const formattedData = data.map((item) => ({
    ...item,
    first_seen_at: formatDate(item.first_seen_at),
  }));

  const handleExport = async () => {
    try {
      const params = {
        search,
        is_active: true,
      };

      if (activeTab === "new") {
        params.is_new = true;
      }

      if (fromDate && toDate) {
        params.from_date = fromDate;
        params.to_date = toDate;
      }

      // 🔥 call export API (no pagination)
      const res = await pwpService.exportPwpData(params);
      const exportData = res?.data || [];

      const formatted = exportData.map((item) => ({
        ...item,
        first_seen_at: formatDate(item.first_seen_at),
      }));

      exportToExcel({
        data: formatted,
        fileName: "pwp-data.xlsx",
        sheetName: "PWP Data",
      });
    } catch (err) {
      console.error("Export Error:", err);
    }
  };
  return (
    <div className="">
      {/* Header */}
      {/* <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-700">PWP Registered</h2>
        <CommonButton
          label="Export Excel"
          onClick={handleExport}
          icon={Download}
          variant="primary"
        />
      </div> */}

      {/* 🔥 Tabs */}
      <div className="flex gap-4 mb-4">
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
          label="Export Excel"
          onClick={handleExport}
          icon={Download}
          variant="primary"
        />
      </div>

      {/* Card */}
      <div className="bg-white rounded-xl shadow border">
        {/* Toolbar */}
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex gap-4">
            <CommonFilters
              filters={filterConfig}
              onChange={handleFilterChange}
              onReset={handleReset}
            />
          </div>

          {/* Page Size */}
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

        {/* Table */}
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

        {/* Pagination */}
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
