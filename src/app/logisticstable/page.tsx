"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

import { useLogisticsTasks } from "./hooks/useLogisticsTasks";
import { useDocumentUploads } from "./hooks/useDocumentUploads";
import { useNewTaskForm } from "./hooks/useNewTaskForm";
import { useTaskFilters } from "./hooks/useTaskFilters";
import { useColumnManager } from "./hooks/useColumnManager";
import { useOcrDrafts } from "./hooks/useOcrDrafts";
import { useExport } from "./hooks/useExport";

import { PageHeader } from "./components/PageHeader";
import { OcrDraftPanel } from "./components/OcrDraftPanel";
import { CreateTaskForm } from "./components/CreateTaskForm";
import { SearchFilterBar } from "./components/SearchFilterBar";
import { ColumnMenu } from "./components/ColumnMenu";
import { TaskTable } from "./components/TaskTable";

export default function LogisticsPage() {
  const { user } = useAuth();
  const [name] = useState(user?.nameUse || "");

  // ── Search & filters（放在 tasks hook 前面，因为过滤条件要传给后端）──
  const filters = useTaskFilters();

  // ── Core task data（分页 + 后端过滤）──
  const {
    tasks,
    page,
    setPage,
    pagination,
    pageSize,
    loading,
    refreshing,
    deletingId,
    fetchTasks,
    deleteTask,
    updateEstimate,
    updateSchedule,
    updatePic,
    markStockArrived,
  } = useLogisticsTasks(user, filters.appliedFilters);

  // ── Documents (install / DO / completion uploads) ──
  const { docStatus, uploadingDoc, triggerUpload, viewDocument } =
    useDocumentUploads(() => fetchTasks(true));

  // ── New task creation form ──
  const {
    showForm,
    setShowForm,
    submitting,
    newTasks,
    addRow,
    updateRow,
    resetForm,
    createTask,
  } = useNewTaskForm(user, () => fetchTasks(true));

  // ── Column visibility / ordering ──
  const {
    columns,
    visibleColumns,
    showColumnMenu,
    setShowColumnMenu,
    sensors,
    handleDragEnd,
    toggleColumn,
    resetColumns,
  } = useColumnManager();

  // ── OCR drafts ──
  const {
    pendingTasks,
    handleOcrUpload,
    updateDraftField,
    updateDraftItem,
    removeDraftItem,
    updateDraftItemStatus,
    addDraftItem,
    removeDraftTask,
    clearDrafts,
    handleConfirmSubmitAll,
  } = useOcrDrafts(user, () => fetchTasks(true));

  // ── Export backup ──
  const { isExporting, handleExportBackup } = useExport({
    searchQuery: filters.searchQuery,
    filterorderNumber: filters.filterorderNumber,
    filterCreatedAt: filters.filterCreatedAt,
    filterFrom: filters.filterFrom,
    filterCompanyName: filters.filterCompanyName,
    filterPic: filters.filterPic,
    filterStatus: filters.filterStatus,
    filterDateFrom: filters.filterDateFrom,
    filterDateTo: filters.filterDateTo,
  });

  return (
    <div className='min-h-screen bg-slate-50'>
      <PageHeader
        refreshing={refreshing}
        onRefresh={() => fetchTasks(true)}
        onOcrFileSelected={handleOcrUpload}
        onNewTaskClick={() => setShowForm((v) => !v)}
        isExporting={isExporting}
        onExport={handleExportBackup}
      />

      <div className='w-full px-8 py-8 space-y-6'>
        <OcrDraftPanel
          pendingTasks={pendingTasks}
          onClearDrafts={clearDrafts}
          onConfirmSubmitAll={handleConfirmSubmitAll}
          onRemoveTask={removeDraftTask}
          onUpdateField={updateDraftField}
          onUpdateItem={updateDraftItem}
          onUpdateItemStatus={updateDraftItemStatus}
          onRemoveItem={removeDraftItem}
          onAddItem={addDraftItem}
        />

        <CreateTaskForm
          show={showForm}
          newTasks={newTasks}
          submitting={submitting}
          name={name}
          onClose={resetForm}
          onAddRow={addRow}
          onUpdateRow={updateRow}
          onSubmit={createTask}
        />

        <SearchFilterBar {...filters} />

        <ColumnMenu
          columns={columns}
          visibleCount={visibleColumns.length}
          showColumnMenu={showColumnMenu}
          setShowColumnMenu={setShowColumnMenu}
          toggleColumn={toggleColumn}
          resetColumns={resetColumns}
        />

        <TaskTable
          loading={loading}
          tasks={tasks}
          hasActiveFilters={
            filters.activeFilterCount > 0 || !!filters.searchQuery
          }
          page={page}
          pageSize={pageSize}
          pagination={pagination}
          onPageChange={(p: number) => {
            setPage(p);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          clearAllFilters={filters.clearAllFilters}
          visibleColumns={visibleColumns}
          sensors={sensors}
          handleDragEnd={handleDragEnd}
          searchQuery={filters.searchQuery}
          docStatus={docStatus}
          uploadingDoc={uploadingDoc}
          triggerUpload={triggerUpload}
          viewDocument={viewDocument}
          updateEstimate={updateEstimate}
          updateSchedule={updateSchedule}
          updatePic={updatePic}
          markStockArrived={markStockArrived}
          deletingId={deletingId}
          deleteTask={deleteTask}
        />
      </div>
    </div>
  );
}