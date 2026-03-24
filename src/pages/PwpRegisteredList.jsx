import { useState, useEffect } from "react";
import ExcelLikeTable from "../components/ExcelLikeTable";
import { Download } from "lucide-react";
import { piboService } from "../services/piboService";
import CommonPagination from "../components/CommonPagination";
import { exportToExcel } from "../utils/exportExcel";
import CommonFilters from "../components/CommonFilters";
import CommonButton from "../components/CommonButton";


const formatDate = (dateString) => {
  if (!dateString) return "-";

  const date = new Date(dateString);

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const PwpRegisteredList = () => {
  const [activeTab, setActiveTab] = useState("current"); // 🔥 NEW
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState("");
  
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const columns = [
    { key: "company_id", label: "Company ID", minWidth: 130 },
    { key: "company", label: "Company Name", minWidth: 250 },
    { key: "address", label: "Address", minWidth: 300 },
    { key: "entity_type", label: "Entity Type", minWidth: 130 },
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
      type: "select",
      name: "entityType",
      value: entityTypeFilter,
      placeholder: "All Entity",
      options: ["Brand Owner", "Producer", "Importer"],
    },
  ];

  const handleFilterChange = (name, value) => {
    setPageIndex(0);

    if (name === "search") setSearch(value);
    if (name === "status") setStatusFilter(value);
    if (name === "entityType") setEntityTypeFilter(value);
  };

  const handleReset = () => {
    setSearch("");
    setStatusFilter("");
    setEntityTypeFilter("");
    setPageIndex(0);
  };

  // 🔥 API CALL
  useEffect(() => {
    fetchData();
  }, [pageIndex, pageSize, entityTypeFilter, statusFilter, search, activeTab]);

const fetchData = async () => {
  if (loading) return;

  try {
    setLoading(true);

    const params = {
      page: pageIndex + 1,
      limit: pageSize,
      entity_type: entityTypeFilter,
      status: statusFilter,
      search,
    };

    // 🔥 KEY LOGIC
    if (activeTab === "new") {
      params.is_new = true;
    }

    // current tab me is_new mat bhejo → ALL data aayega

    const res = await piboService.getPiboRegistered(params);

    setData(res?.data?.records || []);
    setTotal(res?.data?.total || 0);

  } catch (error) {
    console.error("API Error:", error);
  } finally {
    setLoading(false);
  }
};
  const formattedData = data.map((item) => ({
    ...item,
    created_on: formatDate(item.created_on),
  }));

  const handleExport = () => {
    exportToExcel({
      data: formattedData,
      fileName: "pibo-data.xlsx",
      sheetName: "PIBO Data",
    });
  };
  return (
    <div className="">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-700">PWP Registered</h2>
        <CommonButton
          label="Export Excel"
          onClick={handleExport}
          icon={Download}
          variant="primary"
        />
      </div>

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
            <ExcelLikeTable columns={columns} data={formattedData}  showActions={false} />
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

