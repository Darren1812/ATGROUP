"use client";

import { useEffect, useRef, useState } from "react";
import { API } from "../constants";

export const PAGE_SIZE = 30;

// key 名字必须跟后端 query 参数一致
export interface TaskFilterParams {
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

// 值停止变化 delay 毫秒后才更新（用来给搜索框做 debounce）
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function useLogisticsTasks(user: any, filterParams: TaskFilterParams) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // ── filter debounce ──
  const debouncedFilters = useDebouncedValue(filterParams, 400);
  const filterKey = JSON.stringify(debouncedFilters);

  // ── 页码：filter 一变，页码自动回到第 1 页（不需要额外的 reset effect，也不会多发一次请求）──
  const [pageState, setPageState] = useState({ page: 1, key: filterKey });
  const page = pageState.key === filterKey ? pageState.page : 1;
  const setPage = (p: number) =>
    setPageState({ page: Math.max(1, p), key: filterKey });

  // 永远拿到最新的 user / page / filters（给 fetchTasks 用）
  const latest = useRef({ user, page, filters: debouncedFilters, filterKey });
  latest.current = { user, page, filters: debouncedFilters, filterKey };

  const abortRef = useRef<AbortController | null>(null);

  const fetchTasks = async (isRefresh = false) => {
    const { user, page, filters, filterKey } = latest.current;
    if (!user) return;

    // 取消上一个还没回来的请求
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const params = new URLSearchParams({
        department: user.department,
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.set(k, v as string);
      });

      const res = await fetch(`${API}/by-department?${params.toString()}`, {
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // 替换，不是追加 → 上一页的资料会被丢掉
      setTasks(data.items ?? []);
      setTotalCount(data.totalCount ?? 0);
      setTotalPages(data.totalPages ?? 0);

      // 删除后当前页已经没资料了 → 退回最后一页
      if (data.totalPages > 0 && page > data.totalPages) {
        setPageState({ page: data.totalPages, key: filterKey });
      }
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      console.error(err);
    } finally {
      // 只有「最新那个请求」才有资格关掉 loading
      if (abortRef.current === controller) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  // user / 页码 / filter（debounce 后）变化 → 重新向后端要 30 笔
  useEffect(() => {
    if (user) fetchTasks();
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, page, filterKey]);

  const deleteTask = async (id: number) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    setDeletingId(id);
    const r = await fetch(`${API}/${id}`, { method: "DELETE" });
    if (r.ok) fetchTasks(true);
    setDeletingId(null);
  };

  const updateEstimate = async (id: any, value: string) => {
    const utcString = value + ":00.000Z";
    await fetch(`${API}/estimate/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledTime: utcString }),
    });
  };

  const updateSchedule = async (id: number, value: string) => {
    await fetch(`${API}/schedule/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });
    fetchTasks(true);
  };

  const updatePic = async (id: number, value: string, scheduleAt?: string) => {
    await fetch(`${API}/pic/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });

    let newStatus = "Waiting";
    if (value && scheduleAt) {
      newStatus = "Arranging";
    } else if (value) {
      newStatus = "Arrange";
    }

    await fetch(`${API}/status/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newStatus),
    });

    fetchTasks(true);
  };

  const markStockArrived = async (id: number) => {
    await fetch(`${API}/status/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify("Waiting"),
    });
    fetchTasks(true);
  };

  return {
    tasks,
    totalCount,
    totalPages,
    page,
    setPage,
    pageSize: PAGE_SIZE,
    loading,
    refreshing,
    deletingId,
    fetchTasks,
    deleteTask,
    updateEstimate,
    updateSchedule,
    updatePic,
    markStockArrived,
  };
}