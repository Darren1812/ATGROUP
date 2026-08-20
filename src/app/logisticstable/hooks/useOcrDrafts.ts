"use client";

import { useState } from "react";
import { API2 } from "../constants";
import type { PendingTaskDraft } from "../types";

export function useOcrDrafts(user: any, onSubmitted: () => void) {
  const [pendingTasks, setPendingTasks] = useState<PendingTaskDraft[]>([]);

  const handleOcrUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API2}/parse-document`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("OCR processing failed");

      const ocrData = await response.json();
      const newTaskDraft: PendingTaskDraft = {
        from: ocrData.from_shop || "",
        companyName: ocrData.to_company || "",
        location: ocrData.to_location || "",
        phoneNumber: ocrData.phone_number || "",
        department: user?.department || "Marketing",
        picDeliver: "",
        status: "AwaitingStock",
        scheduledTime: null,
        items: (ocrData.items || []).map((i: any) => ({
          description: i.description || "",
          status: "AwaitingStock", // 每个 item 各自默认待货
        })),
      };

      setPendingTasks((prev) => [...prev, newTaskDraft]);
    } catch (error) {
      console.error("OCR Error:", error);
      alert("OCR parsing failed, please try again.");
    }
  };

  const updateDraftField = <K extends keyof PendingTaskDraft>(
    taskIdx: number,
    field: K,
    value: PendingTaskDraft[K],
  ) => {
    setPendingTasks((prev) =>
      prev.map((draft, idx) =>
        idx === taskIdx ? { ...draft, [field]: value } : draft,
      ),
    );
  };

  const updateDraftItem = (
    taskIdx: number,
    itemIdx: number,
    value: string,
  ) => {
    setPendingTasks((prev) =>
      prev.map((draft, idx) => {
        if (idx !== taskIdx) return draft;
        const updatedItems = draft.items.map((item, i) =>
          i === itemIdx ? { description: value, status: item.status } : item,
        );
        return { ...draft, items: updatedItems };
      }),
    );
  };

  const removeDraftItem = (taskIdx: number, itemIdx: number) => {
    setPendingTasks((prev) =>
      prev.map((draft, idx) => {
        if (idx !== taskIdx) return draft;
        return {
          ...draft,
          items: draft.items.filter((_, i) => i !== itemIdx),
        };
      }),
    );
  };

  const updateDraftItemStatus = (
    taskIdx: number,
    itemIdx: number,
    value: string,
  ) => {
    setPendingTasks((prev) =>
      prev.map((draft, idx) => {
        if (idx !== taskIdx) return draft;
        const updatedItems = draft.items.map((item, i) =>
          i === itemIdx ? { ...item, status: value } : item,
        );
        return { ...draft, items: updatedItems };
      }),
    );
  };

  const addDraftItem = (taskIdx: number) => {
    setPendingTasks((prev) =>
      prev.map((draft, idx) => {
        if (idx !== taskIdx) return draft;
        return {
          ...draft,
          items: [...draft.items, { description: "", status: "AwaitingStock" }],
        };
      }),
    );
  };

  const removeDraftTask = (taskIdx: number) => {
    setPendingTasks((prev) => prev.filter((_, idx) => idx !== taskIdx));
  };

  const clearDrafts = () => setPendingTasks([]);

  const handleConfirmSubmitAll = async () => {
    try {
      const payload = pendingTasks.map((draft) => {
        let formattedTime = null;

        if (draft.scheduledTime) {
          // 1. 先把可能存在的 'Z' 尾巴去掉
          let cleanTime = draft.scheduledTime.replace("Z", "");

          // 2. 关键防御：如果发现时间被转换成了非你所选的少 8 小时的 UTC 格式
          //    我们通过 JavaScript 的 Date 对象，强行把它还原成"所见即所得"的本地真实输入文本
          if (draft.scheduledTime.includes("Z")) {
            const utcDate = new Date(draft.scheduledTime);
            const year = utcDate.getFullYear();
            const month = String(utcDate.getMonth() + 1).padStart(2, "0");
            const day = String(utcDate.getDate()).padStart(2, "0");
            const hours = String(utcDate.getHours()).padStart(2, "0");
            const minutes = String(utcDate.getMinutes()).padStart(2, "0");
            const seconds = String(utcDate.getSeconds()).padStart(2, "0");

            formattedTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
          } else {
            formattedTime = cleanTime.includes("T")
              ? cleanTime.split(":").length === 2
                ? `${cleanTime}:00`
                : cleanTime
              : `${cleanTime}:00`;
          }
        }

        return {
          department: user?.department || "Software Engineer",
          createdBy: user?.nameUse || "Darren",
          from: draft.from,
          companyName: draft.companyName,
          location: draft.location,
          phoneNumber: draft.phoneNumber,
          picDeliver: draft.picDeliver || "",
          status: draft.status || "AwaitingStock",
          scheduledTime: formattedTime,
          items: draft.items.map((i) => ({
            description: i.description,
            status: i.status || "AwaitingStock",
          })),
        };
      });

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/Logistics/create-from-ocr`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (res.ok) {
        setPendingTasks([]);
        onSubmitted();
        alert("Tasks created successfully!");
      } else {
        alert("Save failed.");
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred during submission.");
    }
  };

  return {
    pendingTasks,
    setPendingTasks,
    handleOcrUpload,
    updateDraftField,
    updateDraftItem,
    removeDraftItem,
    updateDraftItemStatus,
    addDraftItem,
    removeDraftTask,
    clearDrafts,
    handleConfirmSubmitAll,
  };
}
