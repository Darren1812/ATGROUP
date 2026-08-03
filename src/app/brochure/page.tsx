'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TemplateCard from './components/TemplateCard';

// 定义 API 基础路径（优先读取环境变量，没有则回退到 http://localhost:5000）
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
const API = `${BASE_URL}/api/Brochure`;

interface FolderGroup {
  folder: string;
  templates: string[];
}

interface SelectedTemplateData {
  templateName: string;
  data: Record<string, string>;
}

const DEFAULT_COMPANIES = ['ASN', 'ARENA', 'ATP', 'SKY'];

export default function BrochurePage() {
  const [selectedCompany, setSelectedCompany] = useState<string>('ASN');
  const [templateGroups, setTemplateGroups] = useState<FolderGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // 记录勾选的模板及输入框数据
  const [selectedTemplates, setSelectedTemplates] = useState<Record<string, SelectedTemplateData>>({});

  // 1. 获取后端 Templates 列表
  useEffect(() => {
    async function loadTemplates() {
      try {
        const res = await fetch(`${API}/templates`);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data: FolderGroup[] = await res.json();
        console.log('Templates Loaded:', data);
        setTemplateGroups(data);
      } catch (err) {
        console.error('Failed to fetch templates:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTemplates();
  }, []);

  // 2. 匹配当前选择的公司 folder（增强比对逻辑，防止斜杠或大小写干扰）
  const currentFolderData = templateGroups.find((g) => {
    if (!g.folder) return false;
    const folderName = g.folder.trim().toUpperCase();
    const targetCompany = selectedCompany.trim().toUpperCase();
    
    // 精确相等、或者结尾匹配（例如 "BROCHURE/ASN" 匹配 "ASN"）
    return folderName === targetCompany || folderName.endsWith(`/${targetCompany}`) || folderName.endsWith(`\\${targetCompany}`);
  });

  // 勾选 / 取消勾选
  const handleToggleSelect = (templateName: string, isSelected: boolean) => {
    const fullTemplatePath = `${selectedCompany}/${templateName}`;
    setSelectedTemplates((prev) => {
      const updated = { ...prev };
      if (isSelected) {
        updated[fullTemplatePath] = {
          templateName: fullTemplatePath,
          data: { customername: '' },
        };
      } else {
        delete updated[fullTemplatePath];
      }
      return updated;
    });
  };

  // 字段更新处理
  const handleFieldChange = (templateName: string, fieldKey: string, value: string) => {
    const fullTemplatePath = `${selectedCompany}/${templateName}`;
    setSelectedTemplates((prev) => ({
      ...prev,
      [fullTemplatePath]: {
        ...prev[fullTemplatePath],
        data: {
          ...prev[fullTemplatePath]?.data,
          [fieldKey]: value,
        },
      },
    }));
  };

  // 提交生成 PDF
  const handleGeneratePdf = async () => {
    const payload = Object.values(selectedTemplates);
    if (payload.length === 0) {
      alert('Please select at least one template.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API}/generate-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templates: payload }),
      });

      if (!res.ok) throw new Error('PDF generation failed.');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Combined_Brochure_${Date.now()}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Error generating PDF.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* 左侧 Sidebar */}
      <Sidebar
        companies={DEFAULT_COMPANIES}
        selectedCompany={selectedCompany}
        onSelectCompany={setSelectedCompany}
      />

      {/* 右侧展示区 */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-xl font-bold text-slate-800">{selectedCompany} Templates</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Select templates and fill in the fields below.
            </p>
          </div>

          <button
            onClick={handleGeneratePdf}
            disabled={submitting || Object.keys(selectedTemplates).length === 0}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
          >
            {submitting ? 'Generating PDF...' : `Generate PDF (${Object.keys(selectedTemplates).length})`}
          </button>
        </header>

        <section className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="text-slate-400 text-sm">Loading templates from server...</div>
          ) : currentFolderData && currentFolderData.templates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
              {currentFolderData.templates.map((tpl) => {
                const fullTemplatePath = `${selectedCompany}/${tpl}`;
                const isSelected = !!selectedTemplates[fullTemplatePath];
                const fields = selectedTemplates[fullTemplatePath]?.data || {};

                return (
                  <TemplateCard
                    key={tpl}
                    templateName={tpl}
                    isSelected={isSelected}
                    fields={fields}
                    onToggleSelect={(checked) => handleToggleSelect(tpl, checked)}
                    onFieldChange={(key, val) => handleFieldChange(tpl, key, val)}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-slate-400 text-sm italic">
              No templates found for &quot;{selectedCompany}&quot;.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}