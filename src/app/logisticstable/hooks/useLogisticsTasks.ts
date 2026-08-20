"use client";

import { useEffect, useState } from "react";
import { API } from "../constants";
import { computeDisplayStatus } from "../utils";

export function useLogisticsTasks(user: any) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchTasks = async (isRefresh = false) => {
    if (!user) return;
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const department = user.department;

      const res = await fetch(
        `${API}/by-department?department=${encodeURIComponent(department)}`,
      );
      const data = await res.json();

      await Promise.all(
        data.map(async (t: any) => {
          if (t.hasComplete && t.status !== "Complete") {
            await fetch(`${API}/status/${t.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify("Complete"),
            });
          }
        }),
      );

      const updated = data.map((t: any) => ({
        ...t,
        status: computeDisplayStatus(t),
      }));

      setTasks(updated);
    } catch (err) {
      console.error(err);
    }
    isRefresh ? setRefreshing(false) : setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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
