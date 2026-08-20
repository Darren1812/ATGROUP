"use client";

import { useState } from "react";
import { API } from "../constants";
import type { DocStatusEntry } from "../types";

export function useDocumentUploads(onUploaded: () => void) {
  const [docStatus, setDocStatus] = useState<Record<number, DocStatusEntry>>(
    {},
  );
  const [uploadingDoc, setUploadingDoc] = useState<Record<string, boolean>>(
    {},
  );

  const triggerUpload = (
    id: number,
    type: "installation" | "do" | "complete",
  ) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/pdf";

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const key = `${id}-${type}`;
      setUploadingDoc((prev) => ({ ...prev, [key]: true }));

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(`${API}/upload/${id}/${type}`, {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          setDocStatus((prev) => ({
            ...prev,
            [id]: {
              ...prev[id],
              [type === "installation"
                ? "install"
                : type === "do"
                  ? "do"
                  : "complete"]: true,
            } as DocStatusEntry,
          }));

          if (type === "complete") {
            await fetch(`${API}/status/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify("Complete"),
            });
          }
        } else {
          alert("Upload failed. Please try again.");
        }
      } catch (err) {
        console.error(err);
        alert("Upload error.");
      }

      setUploadingDoc((prev) => ({ ...prev, [key]: false }));
      onUploaded();
    };

    input.click();
  };

  const viewDocument = (
    id: number,
    type: "installation" | "do" | "complete",
  ) => {
    window.open(`${API}/view/${id}/${type}`, "_blank");
  };

  return { docStatus, uploadingDoc, triggerUpload, viewDocument };
}
