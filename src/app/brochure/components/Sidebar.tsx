'use client';

import React from 'react';

interface SidebarProps {
  companies: string[];
  selectedCompany: string;
  onSelectCompany: (company: string) => void;
}

export default function Sidebar({ companies, selectedCompany, onSelectCompany }: SidebarProps) {
  return (
    <aside className="w-56 bg-slate-900 text-slate-300 flex flex-col p-4 border-r border-slate-800 shrink-0">
      <div className="mb-6 px-2">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Company List
        </h2>
      </div>

      <nav className="space-y-1">
        {companies.map((company) => {
          const isActive = selectedCompany.toUpperCase() === company.toUpperCase();
          return (
            <button
              key={company}
              onClick={() => onSelectCompany(company)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {company}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}