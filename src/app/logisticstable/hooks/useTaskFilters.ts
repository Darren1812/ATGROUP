"use client";

import { useEffect, useMemo, useState } from "react";
import { PIC_OPTIONS_STATIC } from "../constants";

// 传给后端的过滤条件（key 名字跟后端 query 参数一致）
export interface TaskQueryFilters {
  search: string;
  orderNumber: string;
  createdAt: string;
  from: string;
  companyName: string;
  pic: string;
  status: string;
  dateFrom: string;
  dateTo: string;
}

// 现在过滤由后端做（分页之前先过滤），所以这里不再需要 tasks 参数
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

  // 只有 PIC 在当前页的数据里是不完整的，所以改用固定列表
  const picOptions = PIC_OPTIONS_STATIC;

  const rawFilters: TaskQueryFilters = useMemo(
    () => ({
      search: searchQuery.trim(),
      orderNumber: filterorderNumber.trim(),
      createdAt: filterCreatedAt.trim(),
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

  // 🕐 Debounce：用户打字停 400ms 才真正发请求，避免每按一个键就打一次 API
  const rawKey = JSON.stringify(rawFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<TaskQueryFilters>(rawFilters);

  useEffect(() => {
    const id = setTimeout(() => setAppliedFilters(rawFilters), 400);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawKey]);

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
    appliedFilters, // 🆕 debounce 之后、真正发给后端的条件
    activeFilterCount,
    clearAllFilters,
  };
}