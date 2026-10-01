"use client";

import { useEffect, useMemo, useState } from "react";
import { API } from "../constants";
import type { TaskFilterParams } from "./useLogisticsTasks";

// 过滤全部交给后端做，这里只负责保存输入框的值，
// 并产生 filterParams 传给 useLogisticsTasks。
export function useTaskFilters() {
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

  // PIC 下拉选项：从后端拿全部 PIC（不能再从当前页的 30 笔里取）
  const [picOptions, setPicOptions] = useState<string[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetch(`${API}/pics`)
      .then((r) => (r.ok ? r.json() : []))
      .then((list: string[]) => {
        if (!cancelled) setPicOptions(list);
      })
      .catch((e) => console.error(e));
    return () => {
      cancelled = true;
    };
  }, []);

  // 只有输入框的值真的变了，这个对象才会换新
  const filterParams: TaskFilterParams = useMemo(
    () => ({
      search: searchQuery.trim(),
      orderNumber: filterorderNumber.trim(),
      createdAt: filterCreatedAt,
      from: filterFrom.trim(),
      companyName: filterCompanyName.trim(),
      pic: filterPic,
      status: filterStatus,
      dateFrom: filterDateFrom,
      dateTo: filterDateTo,
    }),
    [
      searchQuery,
      filterorderNumber,
      filterCreatedAt,
      filterFrom,
      filterCompanyName,
      filterPic,
      filterStatus,
      filterDateFrom,
      filterDateTo,
    ],
  );

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

  const hasActiveFilters = activeFilterCount > 0 || !!searchQuery;

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
    filterParams,
    hasActiveFilters,
    activeFilterCount,
    clearAllFilters,
  };
}