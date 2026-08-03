'use client';

import React from 'react';

interface TemplateCardProps {
  templateName: string;
  isSelected: boolean;
  fields: Record<string, string>;
  onToggleSelect: (isSelected: boolean) => void;
  onFieldChange: (fieldKey: string, value: string) => void;
}

export default function TemplateCard({
  templateName,
  isSelected,
  fields,
  onToggleSelect,
  onFieldChange,
}: TemplateCardProps) {
  return (
    <div
      className={`border rounded-xl p-5 bg-white transition-all ${
        isSelected ? 'border-blue-500 shadow-md ring-1 ring-blue-500' : 'border-slate-200 shadow-sm'
      }`}
    >
      <div className="flex items-center space-x-3 mb-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onToggleSelect(e.target.checked)}
          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
        />
        <h3 className="font-semibold text-slate-800 text-base">{templateName}</h3>
      </div>

      {isSelected && (
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Customer Name</label>
            <input
              type="text"
              value={fields['customername'] || ''}
              onChange={(e) => onFieldChange('customername', e.target.value)}
              placeholder="e.g. TESTING SDN BHD"
              className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Content / Details</label>
            <textarea
              rows={4}
              value={fields['nilaitambahancontent'] || fields['modeldetails'] || ''}
              onChange={(e) => {
                const key = templateName.toLowerCase().includes('nilai')
                  ? 'nilaitambahancontent'
                  : 'modeldetails';
                onFieldChange(key, e.target.value);
              }}
              placeholder="Enter details (Line breaks supported)..."
              className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
            />
          </div>
        </div>
      )}
    </div>
  );
}