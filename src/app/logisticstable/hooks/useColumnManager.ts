"use client";

import { useMemo, useState } from "react";
import {
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { COLUMN_DEFS } from "../constants";

export function useColumnManager() {
  const [columns, setColumns] = useState(
    COLUMN_DEFS.map((c) => ({ ...c, visible: true })),
  );
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setColumns((cols) => {
      const oldIndex = cols.findIndex((c) => c.key === active.id);
      const newIndex = cols.findIndex((c) => c.key === over.id);
      return arrayMove(cols, oldIndex, newIndex);
    });
  };

  const toggleColumn = (key: string) => {
    setColumns((cols) =>
      cols.map((c) => (c.key === key ? { ...c, visible: !c.visible } : c)),
    );
  };

  const resetColumns = () => {
    setColumns(COLUMN_DEFS.map((c) => ({ ...c, visible: true })));
  };

  const visibleColumns = useMemo(
    () => columns.filter((c) => c.visible),
    [columns],
  );

  return {
    columns,
    visibleColumns,
    showColumnMenu,
    setShowColumnMenu,
    sensors,
    handleDragEnd,
    toggleColumn,
    resetColumns,
  };
}
