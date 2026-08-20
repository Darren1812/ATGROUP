"use client";

import { useState } from "react";
import { API } from "../constants";

interface ExportFilters {
  searchQuery: string;
  filterorderNumber: string;
  filterCreatedAt: string;
  filterFrom: string;
  filterCompanyName: string;
  filterPic: string;
  filterStatus: string;
  filterDateFrom: string;
  filterDateTo: string;
}

export function useExport(filters: ExportFilters) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (filters.searchQuery) params.set("search", filters.searchQuery);
      if (filters.filterorderNumber)
        params.set("orderNumber", filters.filterorderNumber);
      if (filters.filterCreatedAt)
        params.set("createdAt", filters.filterCreatedAt);
      if (filters.filterFrom) params.set("from", filters.filterFrom);
      if (filters.filterCompanyName)
        params.set("companyName", filters.filterCompanyName);
      if (filters.filterPic) params.set("pic", filters.filterPic);
      if (filters.filterStatus) params.set("status", filters.filterStatus);
      if (filters.filterDateFrom)
        params.set("dateFrom", filters.filterDateFrom);
      if (filters.filterDateTo) params.set("dateTo", filters.filterDateTo);

      const response = await fetch(
        `${API}/export-full-zip?${params.toString()}`,
        { method: "GET" },
      );

      if (!response.ok) throw new Error("Failed to generate zip");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const date = new Date().toISOString().split("T")[0];
      link.setAttribute("download", `Logistics_Backup_${date}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      alert("Export failed. Please check your connection.");
    } finally {
      setIsExporting(false);
    }
  };

  return { isExporting, handleExportBackup };
}
