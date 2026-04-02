import { useState, useEffect } from "react";
import ExcelLikeTable from "../components/ExcelLikeTable";
import CommonPagination from "../components/CommonPagination";
import CommonFilters from "../components/CommonFilters";
import { formatDate } from "../utils/formatDate";
import { batteryService } from "../services/batteryService";

const BatteryManagement = () => {
  const [search, setSearch] = useState("");
  const [metalFilter, setMetalFilter] = useState("");

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // ✅ TABLE COLUMNS
  const columns = [
    { key: "legal_name", label: "Company", minWidth: 250 },
    { key: "state", label: "State", minWidth: 120 },
    { key: "metal_type", label: "Metal", minWidth: 120 },
    { key: "epr_target", label: "EPR Target", minWidth: 150 },
    { key: "credits_received", label: "Credits", minWidth: 120 },
    { key: "credits_diff", label: "Credits Diff", minWidth: 150 },
    { key: "last_scraped_at", label: "Last Scraped", minWidth: 180 },
  ];

  // ✅ FILTER CONFIG
  const filterConfig = [
    {
      type: "search",
      name: "search",
      value: search,
      placeholder: "Search company...",
    },
    {
      type: "select",
      name: "metal",
      value: metalFilter,
      placeholder: "All Metals",
      options: [
        "lead",
        "lithium",
        "copper",
        "nickel",
        "cobalt",
        "zinc",
        "manganese",
        "aluminium",
      ],
    },
  ];

  const handleFilterChange = (name, value) => {
    setPageIndex(0);
    if (name === "search") setSearch(value);
    if (name === "metal") setMetalFilter(value);
  };

  const handleReset = () => {
    setSearch("");
    setMetalFilter("");
    setPageIndex(0);
  };

  // 🔥 API CALL
  useEffect(() => {
    fetchData();
  }, [pageIndex, pageSize, search, metalFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const params = {
        page: pageIndex + 1,
        limit: pageSize,
        metal: metalFilter,
        search,
      };

      const res = await batteryService.getMetalProdDashboard(params);
console.log(res,"check res")
      setData(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error("Battery API Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FORMAT DATA
  const formattedData = data.map((item) => ({
    ...item,
    last_scraped_at: formatDate(item.last_scraped_at),
    // status: item.status === "active" ? "🟢 Active" : "🔴 Inactive",
  }));

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-700">
          Battery Metal Dashboard
        </h2>
      </div>

      {/* Card */}
      <div className="bg-white rounded-xl shadow border">
        {/* Filters */}
        <div className="flex justify-between items-center p-4 border-b">
          <CommonFilters
            filters={filterConfig}
            onChange={handleFilterChange}
            onReset={handleReset}
          />

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

export default BatteryManagement;
