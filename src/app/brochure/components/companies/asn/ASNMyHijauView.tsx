"use client";

import React, { useEffect, useState } from "react";
import { CompanyViewProps } from "../../../types";

interface PrinterModel {
  id: number;
  model_code: string;
  series_name?: string;
  series_number?: string;
  duty_type?: string;
  is_color?: boolean;
  ppm?: number;
  functions?: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export default function ASNMyHijauView({
  selectedItems,
  onAddItem,
  onRemoveItem,
  onFieldChange,
}: CompanyViewProps) {
  const [printerModels, setPrinterModels] = useState<PrinterModel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    async function fetchPrinterModels() {
      try {
        const res = await fetch(`${BASE_URL}/api/Brochure/printer-models`);
        if (!res.ok) throw new Error("Failed to fetch printer models");
        const data = await res.json();
        setPrinterModels(data);
      } catch (err) {
        console.error("Error loading printer models:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchPrinterModels();
  }, []);

  // 从当前选中的第一个 item 中获取 selectedModelCodes 数组
  const activeInstance = selectedItems[0];
  const selectedModelCodes: string[] = activeInstance?.modelCodes || [];

  const handleEnsureItem = (newCodes: string[]) => {
    if (!activeInstance) {
      // 如果还没创建 item，自动添加一个 item
      onAddItem("MyHijauPackage");
    }
    // 更新该 item 的 modelCodes
    const instanceId = activeInstance?.instanceId;
    if (instanceId) {
      onFieldChange(instanceId, "modelCodes", newCodes);
    }
  };

  const handleToggleModel = (code: string) => {
    let updatedCodes: string[];
    if (selectedModelCodes.includes(code)) {
      updatedCodes = selectedModelCodes.filter((c) => c !== code);
    } else {
      updatedCodes = [...selectedModelCodes, code];
    }

    if (!activeInstance) {
      // 触发添加
      onAddItem("MyHijauPackage");
      setTimeout(() => {
        // 由于 setState 是异步的，这里在更新时通知
      }, 0);
    }
    
    // 如果已经有 activeInstance 或者是第一个
    if (activeInstance) {
      onFieldChange(activeInstance.instanceId, "modelCodes", updatedCodes);
    }
  };

  useEffect(() => {
    if (selectedItems.length === 0) {
      onAddItem("MyHijauPackage");
    }
  }, [selectedItems.length, onAddItem]);

  const handleSelectAllFiltered = () => {
    const filteredCodes = filteredModels.map((m) => m.model_code);
    const combined = Array.from(new Set([...selectedModelCodes, ...filteredCodes]));
    if (activeInstance) {
      onFieldChange(activeInstance.instanceId, "modelCodes", combined);
    }
  };

  const handleClearAll = () => {
    if (activeInstance) {
      onFieldChange(activeInstance.instanceId, "modelCodes", []);
    }
  };

  const filteredModels = printerModels.filter(
    (m) =>
      m.model_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.series_name && m.series_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            Sijil MyHijau Certificate Generator
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Select printer models to generate the merged MyHijau, SIRIM, Energy Star, EPEAT & ECO Toner certificate package.
          </p>
        </div>

        {/* 搜索框与全选/清空按钮 */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pt-2">
          <input
            type="text"
            placeholder="Search model code or series..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-80 text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
          />

          <div className="flex items-center space-x-2 text-xs">
            <button
              type="button"
              onClick={handleSelectAllFiltered}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium transition-colors"
            >
              Select Filtered
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* 已选型号标签 */}
        {selectedModelCodes.length > 0 && (
          <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 space-y-2">
            <div className="text-xs font-semibold text-blue-900">
              Selected Models ({selectedModelCodes.length}):
            </div>
            <div className="flex flex-wrap gap-1.5">
              {selectedModelCodes.map((code) => (
                <span
                  key={code}
                  className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-600 text-white shadow-sm"
                >
                  {code}
                  <button
                    type="button"
                    onClick={() => handleToggleModel(code)}
                    className="ml-1.5 hover:text-blue-200 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 型号列表 */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 text-xs font-semibold text-slate-600 grid grid-cols-12 gap-2">
            <span className="col-span-1">Select</span>
            <span className="col-span-4">Model Code</span>
            <span className="col-span-4">Series</span>
            <span className="col-span-3">PPM / Type</span>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-6 text-center text-slate-400 text-sm">
                Loading printer models...
              </div>
            ) : filteredModels.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-sm">
                No printer models found.
              </div>
            ) : (
              filteredModels.map((m) => {
                const isChecked = selectedModelCodes.includes(m.model_code);
                return (
                  <label
                    key={m.id || m.model_code}
                    className={`grid grid-cols-12 gap-2 px-4 py-2.5 text-xs items-center cursor-pointer select-none transition-colors ${
                      isChecked ? "bg-blue-50/60 font-medium" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="col-span-1">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleModel(m.model_code)}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                      />
                    </div>
                    <span className="col-span-4 font-semibold text-slate-800">
                      {m.model_code}
                    </span>
                    <span className="col-span-4 text-slate-500">
                      {m.series_name || "-"}
                    </span>
                    <span className="col-span-3 text-slate-400">
                      {m.ppm ? `${m.ppm} PPM` : ""} {m.is_color ? "(Color)" : ""}
                    </span>
                  </label>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}