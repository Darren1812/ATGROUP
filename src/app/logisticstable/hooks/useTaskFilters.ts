"use client";

import { useMemo, useState } from "react";
import { computeDisplayStatus } from "../utils";

export function useTaskFilters(tasks: any[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPic, setFilterPic] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterCompanyName, setFilterCompanyName] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterorderNumber, setFilterorderNumber] = useState("");
  const [filterCreatedAt, setFilterCreatedAt] = useState("");

  const picOptions = useMemo(() => {
    const s = new Set(tasks.map((t) => t.picDeliver).filter(Boolean));
    return Array.from(s).sort() as string[];
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const haystack = [
          t.companyName,
          t.createdAt,
          t.item,
          t.location,
          t.companyName,
          t.picDeliver,
          t.from,
          t.createdAt,
          t.orderNumber,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (filterPic && t.picDeliver !== filterPic) return false;
      const computedStatus = computeDisplayStatus(t);
      if (filterStatus && computedStatus !== filterStatus) return false;
      if (filterDateFrom || filterDateTo) {
        const scheduled = t.scheduledAt ? new Date(t.scheduledAt) : null;
        if (!scheduled) return false;
        if (filterDateFrom && scheduled < new Date(filterDateFrom))
          return false;
        if (filterDateTo) {
          const to = new Date(filterDateTo);
          to.setHours(23, 59, 59, 999);
          if (scheduled > to) return false;
        }
      }
      if (filterCompanyName) {
        const company = t.companyName?.toLowerCase() || "";
        if (!company.includes(filterCompanyName.toLowerCase())) return false;
      }
      if (filterFrom) {
        const from = t.from?.toLowerCase() || "";
        if (!from.includes(filterFrom.toLowerCase())) return false;
      }
      if (filterorderNumber) {
        const orderNumber = t.orderNumber?.toLowerCase() || "";
        if (!orderNumber.includes(filterorderNumber.toLowerCase()))
          return false;
      }
      if (filterCreatedAt) {
        const createdAt = t.createdAt?.toLowerCase() || "";
        if (!createdAt.includes(filterCreatedAt.toLowerCase())) return false;
      }

      return true;
    });
  }, [
    tasks,
    searchQuery,
    filterCompanyName,
    filterPic,
    filterStatus,
    filterDateFrom,
    filterDateTo,
    filterFrom,
    filterCreatedAt,
    filterorderNumber,
  ]);

  const activeFilterCount = [
    filterCompanyName,
    filterFrom,
    filterPic,
    filterStatus,
    filterDateFrom,
    filterDateTo,
    filterCreatedAt,
    filterorderNumber,
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setFilterCreatedAt("");
    setFilterorderNumber("");
    setFilterFrom("");
    setFilterCompanyName("");
    setSearchQuery("");
    setFilterPic("");
    setFilterStatus("");
    setFilterDateFrom("");
    setFilterDateTo("");
  };

  return {
    searchQuery,
    setSearchQuery,
    filterPic,
    setFilterPic,
    filterStatus,
    setFilterStatus,
    filterDateFrom,
    setFilterDateFrom,
    filterDateTo,
    setFilterDateTo,
    showFilters,
    setShowFilters,
    filterCompanyName,
    setFilterCompanyName,
    filterFrom,
    setFilterFrom,
    filterorderNumber,
    setFilterorderNumber,
    filterCreatedAt,
    setFilterCreatedAt,
    picOptions,
    filteredTasks,
    activeFilterCount,
    clearAllFilters,
  };
}
