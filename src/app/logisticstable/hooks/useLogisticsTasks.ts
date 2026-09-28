"use client";

import { useEffect, useRef, useState } from "react";
import { API } from "../constants";
import { computeDisplayStatus } from "../utils";
import type { TaskQueryFilters } from "./useTaskFilters";

export const PAGE_SIZE = 30;

export function useLogisticsTasks(user: any, filters: TaskQueryFilters) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pagination, setPagination] = useState({
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  });

  // 页码跟「当前过滤条件」绑在一起：过滤条件一变，页码自动回到第 1 页（不会多发一次请求）
  const filtersKey = JSON.stringify(filters);
  const [pageState, setPageState] = useState({ page: 1, key: filtersKey });
  const page = pageState.key === filtersKey ? pageState.page : 1;
  const setPage = (p: number) => setPageState({ page: p, key: filtersKey });

  // 让 fetchTasks 永远读到最新的 page / filters（避免 async 回调拿到旧值）
  const latest = useRef({ user, page, filters });
  latest.current = { user, page, filters };
  const requestId = useRef(0); // 防止旧请求比新请求晚回来，覆盖掉新数据

  const fetchTasks = async (isRefresh = false) => {
    const { user, page, filters } = latest.current;
    if (!user) return;
    const myId = ++requestId.current;
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

      const res = await fetch(`${API}/by-department?${params.toString()}`);
      if (!res.ok) throw new Error(`Failed to load tasks (${res.status})`);
      const data = await res.json();
      if (myId !== requestId.current) return; // 已经有更新的请求了，丢掉这个

      const items: any[] = data.items ?? [];

      // 删掉当前页最后一笔之后，这一页可能空了 → 退回到最后一页
      if (items.length === 0 && page > 1) {
        setPage(Math.max(1, data.totalPages ?? 1));
        return;
      }

      await Promise.all(
        items.map(async (t: any) => {
          if (t.hasComplete && t.status !== "Complete") {
            await fetch(`${API}/status/${t.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify("Complete"),
            });
          }
        }),
      );
      if (myId !== requestId.current) return;

      setTasks(
        items.map((t: any) => ({ ...t, status: computeDisplayStatus(t) })),
      );
      setPagination({
        totalCount: data.totalCount ?? 0,
        totalPages: data.totalPages ?? 0,
        hasNext: !!data.hasNext,
        hasPrevious: !!data.hasPrevious,
      });
    } catch (err) {
      console.error(err);
    } finally {
      if (myId === requestId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  // user / 页码 / 过滤条件 任何一个变了就重新拿数据
  useEffect(() => {
    if (user) {
      fetchTasks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, page, filtersKey]);

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
    page,
    setPage,
    pagination,
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