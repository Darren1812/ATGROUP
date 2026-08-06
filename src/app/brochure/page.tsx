"use client";

import React, { useState, useEffect } from "react";
import Sidebar, { CompanyCategory } from "./components/Sidebar";
import { SelectedTemplateItem } from "./types";
import ASNBrochureView from "./components/companies/asn/ASNBrochureView";
import ASNMyHijauView from "./components/companies/asn/ASNMyHijauView";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";
const API = `${BASE_URL}/api/Brochure`;

const COMPANY_CONFIG: CompanyCategory[] = [
  {
    company: "ASN",
    files: [
      "1. Brosur",
      "2. Sijil My Hijau",
      "product catalogue",
      "quotation standard",
      "warranty doc",
    ],
  },
  {
    company: "ARENA",
    files: ["brochure compressed", "company profile"],
  },
  {
    company: "ATP",
    files: ["brochure compressed"],
  },
  {
    company: "SKY",
    files: ["brochure compressed"],
  },
];

interface FolderGroup {
  folder: string;
  templates: string[];
}

export default function BrochurePage() {
  const [selectedCompany, setSelectedCompany] = useState<string>("ASN");
  const [selectedFile, setSelectedFile] = useState<string>("1. Brosur");

  const [templateGroups, setTemplateGroups] = useState<FolderGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [selectedItems, setSelectedItems] = useState<SelectedTemplateItem[]>([]);

  // 用于预览 JSON 的状态与 Tab 切换状态
  const [jsonModalOpen, setJsonModalOpen] = useState<boolean>(false);
  const [activeJsonTab, setActiveJsonTab] = useState<"format1" | "format2">("format1");
  const [previewData, setPreviewData] = useState<{
    endpoint: string;
    format1: any;
    format2: any;
  } | null>(null);

  useEffect(() => {
    async function loadTemplates() {
      try {
        const res = await fetch(`${API}/templates`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const data: FolderGroup[] = await res.json();
        setTemplateGroups(data);
      } catch (err) {
        console.error("Failed to fetch templates:", err);
      } finally {
        setLoading(false);
      }
    }

    loadTemplates();
  }, []);

  const handleSelectFolder = (company: string, file: string) => {
    setSelectedCompany(company);
    setSelectedFile(file);
    setSelectedItems([]);
  };

  const currentFolderData = templateGroups.find((g) => {
    if (!g.folder) return false;
    const folderPath = g.folder.trim().toUpperCase().replace(/\\/g, "/");
    const targetPath = `${selectedCompany}/${selectedFile}`.toUpperCase();
    return (
      folderPath.endsWith(targetPath) ||
      folderPath === selectedCompany.toUpperCase()
    );
  });

  const currentTemplates = currentFolderData?.templates || [];

  const handleAddItem = (folderPrefix: string, templateName: string) => {
    const fullPath = templateName.includes("/")
      ? templateName
      : `${folderPrefix}/${templateName}`;

    const newItem: SelectedTemplateItem = {
      instanceId: `${fullPath}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      templateName: fullPath,
      data: {},
      modelConfigs: [],
      modelCodes: [],
    };
    setSelectedItems((prev) => [...prev, newItem]);
  };

  const handleRemoveItem = (instanceId: string) => {
    setSelectedItems((prev) =>
      prev.filter((item) => item.instanceId !== instanceId)
    );
  };

  const handleFieldChange = (
    instanceId: string,
    fieldKey: string,
    value: any
  ) => {
    setSelectedItems((prev) =>
      prev.map((item) => {
        if (item.instanceId === instanceId) {
          if (fieldKey === "modelCode") {
            return { ...item, modelCode: value };
          }
          if (fieldKey === "modelConfigs") {
            return { ...item, modelConfigs: value };
          }
          if (fieldKey === "modelCodes" || fieldKey === "ModelCodes") {
            return { ...item, modelCodes: value };
          }
          return {
            ...item,
            data: { ...item.data, [fieldKey]: value },
          };
        }
        return item;
      })
    );
  };

  const isMyHijau =
    selectedCompany.toUpperCase() === "ASN" &&
    (selectedFile.toLowerCase().includes("sijil_my_hijau") ||
      selectedFile.toLowerCase().includes("sijil my hijau"));

  // 核心：组装 JSON Format 1 与 JSON Format 2 的 Payload
// 核心：组装 JSON Format 1 与 JSON Format 2 的 Payload
const buildPayloads = () => {
  let endpoint = `${API}/generate-pdf`;
  let documentType =
    selectedFile.trim().toUpperCase().includes("BROCHURE") ||
    selectedFile.trim().includes("Brosur")
      ? "BROCHURE"
      : selectedFile.trim().toUpperCase();

  if (isMyHijau) {
    endpoint = `${BASE_URL}/api/MyHijau/generate-sijil`;
    documentType = "SIJIL_MY_HIJAU";
  }

  if (selectedItems.length === 0 && !isMyHijau) {
    return { error: "Please select at least one template.", endpoint: "" };
  }

  // 1. 收集整页所有组件选中的型号并去重 (用于 Format 2)
  const allCollectedModelCodes = Array.from(
    new Set(
      selectedItems.flatMap((item) => [
        ...(item.modelCodes || []),
        ...(item.modelCode ? [item.modelCode] : []),
        ...(item.modelConfigs?.map((c) => c.modelCode) || []),
      ]).filter(Boolean)
    )
  );

  // ----------------------
  // JSON Format 1 (展开的多模板格式)
  // ----------------------
  const format1Templates = selectedItems.map((item) => {
    const itemModelCodes = Array.from(
      new Set(
        [
          ...(item.modelCodes || []),
          ...(item.modelCode ? [item.modelCode] : []),
          ...(item.modelConfigs?.map((c) => c.modelCode) || []),
        ].filter(Boolean)
      )
    );

    return {
      templateName: item.templateName,
      modelCodes: itemModelCodes,
      data: item.data,
    };
  });

  const format1Payload = {
    documentType: documentType,
    templates: format1Templates,
  };

  // ----------------------
  // JSON Format 2 (精简格式：单个 template，汇总所有 modelCodes)
  // ----------------------
  // 合并所有选中的 item 数据中的 data 属性
  const mergedData = selectedItems.reduce((acc, item) => {
    return { ...acc, ...item.data };
  }, {});

  const format2Payload = {
    documentType: documentType,
    templates: [
      {
        templateName: selectedItems[0]?.templateName || `${selectedCompany}/${selectedFile}`,
        data: mergedData,
        modelCode: allCollectedModelCodes[0] || "",
        modelCodes: allCollectedModelCodes,
      },
    ],
  };

  return {
    endpoint,
    error: null,
    format1: format1Payload,
    format2: format2Payload,
  };
};
  // 点击预览 JSON 按钮逻辑
  const handlePreviewJson = () => {
    const res = buildPayloads();
    if (res.error) {
      alert(res.error);
      return;
    }

    setPreviewData({
      endpoint: res.endpoint,
      format1: res.format1,
      format2: res.format2,
    });
    setJsonModalOpen(true);
  };

  // 提交生成 PDF 逻辑 (默认发给后端 Format 1，如果你希望发 Format 2 可以在此更改)
  const handleGeneratePdf = async () => {
    const resPayload = buildPayloads();
    if (resPayload.error || !resPayload.endpoint) {
      alert(resPayload.error || "Invalid endpoint");
      return;
    }

    setSubmitting(true);

    try {
      // 默认使用 Format 1 提交，如果是 MyHijau 则选择 Format 2
      const payloadToSend = isMyHijau ? resPayload.format2 : resPayload.format1;

      const res = await fetch(resPayload.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadToSend),
      });

      if (!res.ok) throw new Error("PDF generation failed.");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = isMyHijau
        ? `Sijil_MyHijau_${Date.now()}.pdf`
        : `${selectedCompany}_${selectedFile.replace(/\s+/g, "_")}_${Date.now()}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Error generating PDF.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderCompanyView = () => {
    if (loading)
      return <div className="text-slate-400 text-sm">Loading templates...</div>;

    const viewKey = `${selectedCompany.toUpperCase()}_${selectedFile.toLowerCase().replace(/\s+/g, "_")}`;

    switch (viewKey) {
      case "ASN_1._brosur":
        if (currentTemplates.length === 0) {
          return (
            <div className="text-slate-400 text-sm italic">
              No templates found for &quot;{selectedCompany} / {selectedFile}&quot;.
            </div>
          );
        }
        return (
          <ASNBrochureView
            templates={currentTemplates}
            selectedItems={selectedItems}
            onAddItem={(tpl: string) =>
              handleAddItem(`${selectedCompany}/${selectedFile}`, tpl)
            }
            onRemoveItem={handleRemoveItem}
            onFieldChange={handleFieldChange}
          />
        );

      case "ASN_2._sijil_my_hijau":
        return (
          <ASNMyHijauView
            templates={currentTemplates}
            selectedItems={selectedItems}
            onAddItem={(tpl: string) =>
              handleAddItem(`${selectedCompany}/${selectedFile}`, tpl)
            }
            onRemoveItem={handleRemoveItem}
            onFieldChange={handleFieldChange}
          />
        );

      default:
        return (
          <div className="text-slate-400 text-sm">
            View for &quot;{selectedCompany} - {selectedFile}&quot; is under development.
          </div>
        );
    }
  };

  const activeCount = isMyHijau
    ? selectedItems[0]?.modelCodes?.length || 0
    : selectedItems.length;

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      <Sidebar
        categories={COMPANY_CONFIG}
        selectedCompany={selectedCompany}
        selectedFile={selectedFile}
        onSelectFolder={handleSelectFolder}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                {selectedCompany}
              </span>
              <h1 className="text-xl font-bold text-slate-800 capitalize">
                {selectedFile}
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isMyHijau
                ? "Select printer models to generate merged MyHijau certificate package."
                : "Select templates and fill in required data to generate PDF."}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* 预览 JSON 按钮 */}
            <button
              onClick={handlePreviewJson}
              disabled={activeCount === 0}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg border border-slate-300 shadow-sm transition-colors disabled:opacity-50"
            >
              Preview JSON Data
            </button>

            {/* 生成 PDF 按钮 */}
            <button
              onClick={handleGeneratePdf}
              disabled={submitting || activeCount === 0}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
            >
              {submitting
                ? "Generating PDF..."
                : `Generate PDF (${activeCount} ${isMyHijau ? "models" : "items"})`}
            </button>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-8">
          {renderCompanyView()}
        </section>
      </main>

      {/* 支持切换 JSON Format 1 / JSON Format 2 的 Modal 弹窗 */}
      {jsonModalOpen && previewData && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-slate-900 text-slate-100 rounded-xl shadow-2xl border border-slate-700 w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* 弹窗 Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                  <h2 className="text-sm font-bold font-mono text-slate-200">
                    JSON Output Preview
                  </h2>
                </div>

                {/* Format 1 / Format 2 切换选项卡 */}
                <div className="flex bg-slate-800 p-1 rounded-lg text-xs font-medium">
                  <button
                    onClick={() => setActiveJsonTab("format1")}
                    className={`px-3 py-1 rounded-md transition-all ${
                      activeJsonTab === "format1"
                        ? "bg-blue-600 text-white shadow"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    JSON Format 1
                  </button>
                  <button
                    onClick={() => setActiveJsonTab("format2")}
                    className={`px-3 py-1 rounded-md transition-all ${
                      activeJsonTab === "format2"
                        ? "bg-blue-600 text-white shadow"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    JSON Format 2 (Model Specified)
                  </button>
                </div>
              </div>

              <button
                onClick={() => setJsonModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm font-bold px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                ✕ Close
              </button>
            </div>

            {/* 弹窗内容 */}
            <div className="p-6 overflow-y-auto space-y-4 font-mono text-xs">
              <div>
                <span className="text-slate-400 uppercase tracking-wider text-[10px]">Target Endpoint:</span>
                <div className="text-emerald-400 font-semibold mt-0.5">{previewData.endpoint}</div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-400 uppercase tracking-wider text-[10px]">
                    {activeJsonTab === "format1" ? "JSON Format 1 Output:" : "JSON Format 2 Output:"}
                  </span>
                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(
                        JSON.stringify(
                          activeJsonTab === "format1" ? previewData.format1 : previewData.format2,
                          null,
                          2
                        )
                      )
                    }
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded hover:text-white transition-colors"
                  >
                    Copy JSON
                  </button>
                </div>

                <pre className="p-4 bg-slate-950 rounded-lg text-blue-300 overflow-x-auto border border-slate-800 leading-relaxed">
                  {JSON.stringify(
                    activeJsonTab === "format1" ? previewData.format1 : previewData.format2,
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}