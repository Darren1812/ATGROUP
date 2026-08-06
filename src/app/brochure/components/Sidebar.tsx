'use client';

import React, { useState } from 'react';

export interface CompanyCategory {
  company: string;
  files: string[]; // 例如 ['Brochure Compressed', 'Technical Specs', 'Quotation Doc']
}

interface SidebarProps {
  categories: CompanyCategory[];
  selectedCompany: string;
  selectedFile: string;
  onSelectFolder: (company: string, file: string) => void;
}

export default function Sidebar({
  categories,
  selectedCompany,
  selectedFile,
  onSelectFolder,
}: SidebarProps) {
  // 记录哪些公司在 Sidebar 中处于展开状态
  const [openCompanies, setOpenCompanies] = useState<Record<string, boolean>>({
    ASN: true, // 默认展开 ASN
  });

  const toggleCompany = (company: string) => {
    setOpenCompanies((prev) => ({
      ...prev,
      [company]: !prev[company],
    }));
  };

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0">
      <div className="p-4 border-b border-slate-800 font-bold text-white text-lg tracking-wide flex items-center space-x-2">
        <span>COMPANY LIST</span>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1 text-sm">
        {categories.map(({ company, files }) => {
          const isOpen = !!openCompanies[company];
          const isCompanyActive = selectedCompany === company;

          return (
            <div key={company} className="space-y-1">
              {/* 第一层：公司名称按钮 */}
              <button
                type="button"
                onClick={() => toggleCompany(company)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left font-semibold transition-colors ${
                  isCompanyActive
                    ? 'bg-slate-800 text-white'
                    : 'hover:bg-slate-800/60 text-slate-400'
                }`}
              >
                <span>{company}</span>
                <span className="text-xs text-slate-500">
                  {isOpen ? '▲' : '▼'}
                </span>
              </button>

              {/* 第二层：子文件 / 项目列表 */}
              {isOpen && (
                <div className="pl-4 space-y-1 border-l-2 border-slate-800 ml-3 my-1">
                  {files.map((file) => {
                    const isSelected = isCompanyActive && selectedFile === file;
                    return (
                      <button
                        key={file}
                        type="button"
                        onClick={() => onSelectFolder(company, file)}
                        className={`w-full text-left px-3 py-2 rounded-md text-xs transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white font-medium shadow'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        {file}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}