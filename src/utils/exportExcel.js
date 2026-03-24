import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export const exportToExcel = ({
  data = [],
  fileName = "data.xlsx",
  sheetName = "Sheet1",
}) => {
  if (!data || data.length === 0) {
    console.warn("No data to export");
    return;
  }

  // Convert JSON → Sheet
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Create Workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Generate file
  const buffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const blob = new Blob([buffer], {
    type: "application/octet-stream",
  });

  saveAs(blob, fileName);
};