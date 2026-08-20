"use client";

import { useState } from "react";
import { API } from "../constants";

export const emptyRow = {
  orderNumber: "",
  createdAt: "",
  from: "",
  companyName: "",
  location: "",
  item: "",
  scheduledTime: "",
  picDeliver: "",
  phoneNumber: "",
  createdBy: "",
  status: "AwaitingStock",
};

export function useNewTaskForm(user: any, onCreated: () => void) {
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newTasks, setNewTasks] = useState<any[]>([emptyRow]);

  const addRow = () => setNewTasks([...newTasks, { ...emptyRow }]);
  const removeRow = (i: number) =>
    setNewTasks(newTasks.filter((_, idx) => idx !== i));
  const updateRow = (i: number, field: string, value: string) => {
    const copy = [...newTasks];
    copy[i] = { ...copy[i], [field]: value };
    setNewTasks(copy);
  };

  const resetForm = () => {
    setShowForm(false);
    setNewTasks([emptyRow]);
  };

  const createTask = async () => {
    setSubmitting(true);
    try {
      const tasksWithUser = newTasks.map((task) => ({
        ...task,
        createdBy: user?.nameUse || "Unknown",
        department: user?.department || "",
        scheduledTime: task.scheduledTime || null,
      }));

      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tasksWithUser),
      });

      if (res.ok) {
        setNewTasks([emptyRow]);
        setShowForm(false);
        onCreated();
      } else {
        console.error("Failed to save tasks");
      }
    } catch (err) {
      console.error(err);
    }
    setSubmitting(false);
  };

  return {
    showForm,
    setShowForm,
    submitting,
    newTasks,
    addRow,
    removeRow,
    updateRow,
    resetForm,
    createTask,
  };
}
