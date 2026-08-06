'use client';

import { useState, useEffect } from 'react';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

interface ModelDocument {
  id: number;
  docCategory: string;
  filePath: string;
}

interface PrinterModel {
  id: number;
  modelCode: string;
  seriesName: string;
  seriesNumber: string;
  dutyType: string;
  isColor: boolean;
  ppm: number;
  functions: string;
  documents: ModelDocument[];
}

export default function ModelManagementPage() {
  const [models, setModels] = useState<PrinterModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingModel, setEditingModel] = useState<Partial<PrinterModel> | null>(null);

  // Document Path Modal 状态
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState<number | ''>('');
  const [docCategoryInput, setDocCategoryInput] = useState('BROCHURE');
  const [filePathInput, setFilePathInput] = useState('');
  const [submittingDoc, setSubmittingDoc] = useState(false);

  // 1. 获取所有 Model 列表
  const fetchModels = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/PrinterModels`);
      if (res.ok) {
        const data = await res.json();
        setModels(data);
        if (data.length > 0 && !selectedModelId) {
          setSelectedModelId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch models:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  // 2. 保存/修改 Model
  const handleSaveModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingModel?.modelCode) return alert('Model Code is required');

    const isEdit = !!editingModel.id;
    const url = isEdit
      ? `${BASE_URL}/api/PrinterModels/${editingModel.id}`
      : `${BASE_URL}/api/PrinterModels`;

    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingModel),
      });

      if (res.ok) {
        setEditingModel(null);
        fetchModels();
      } else {
        const errText = await res.text();
        alert(`Error: ${errText}`);
      }
    } catch (err) {
      alert('Failed to save printer model.');
    }
  };

  // 3. 删除 Model
  const handleDeleteModel = async (id: number) => {
    if (!confirm('Are you sure you want to delete this model and its mapped documents?')) return;

    try {
      const res = await fetch(`${BASE_URL}/api/PrinterModels/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) fetchModels();
    } catch (err) {
      alert('Failed to delete model.');
    }
  };

  // 4. 保存/更新 Document Path 映射
  const handleSaveDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModelId) return alert('Please select a printer model');
    if (!filePathInput.trim()) return alert('Please enter file path');

    setSubmittingDoc(true);
    try {
      const res = await fetch(`${BASE_URL}/api/PrinterModels/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: Number(selectedModelId),
          docCategory: docCategoryInput.trim() || 'BROCHURE',
          filePath: filePathInput.trim(),
        }),
      });

      if (res.ok) {
        setIsDocModalOpen(false);
        setFilePathInput('');
        setDocCategoryInput('BROCHURE');
        fetchModels();
      } else {
        const err = await res.text();
        alert(`Failed to save document mapping: ${err}`);
      }
    } catch (err) {
      alert('Network error while saving document.');
    } finally {
      setSubmittingDoc(false);
    }
  };

  // 5. 解绑/删除 Document Path 记录
  const handleDeleteDocument = async (docId: number, modelCode: string) => {
    if (!confirm(`Are you sure you want to delete this document path mapping for ${modelCode}?`)) return;

    try {
      const res = await fetch(`${BASE_URL}/api/PrinterModels/documents/${docId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchModels();
      } else {
        alert('Failed to delete document mapping.');
      }
    } catch (err) {
      alert('Network error while deleting document mapping.');
    }
  };

  // 当在 Modal 中切换 Selected Model 或 Category 时，自动回显现有 Path
  const handleModelOrCategoryChange = (modelId: number, category: string) => {
    setSelectedModelId(modelId);
    setDocCategoryInput(category);
    const targetModel = models.find((m) => m.id === modelId);
    const existingDoc = targetModel?.documents?.find((d) => d.docCategory === category);
    setFilePathInput(existingDoc ? existingDoc.filePath : '');
  };

  const unmappedCount = models.filter((m) => !m.documents || m.documents.length === 0).length;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen">
      {/* Header & Quick Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200 gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">
            Printer Model & Document Path Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage models, technical specs, and mapped brochure file paths.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center space-x-4 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 text-xs">
          <div>
            <span className="text-slate-400 font-medium">Total Models: </span>
            <span className="font-bold text-slate-700">{models.length}</span>
          </div>
          <div className="h-4 w-[1px] bg-slate-300" />
          <div>
            <span className="text-slate-400 font-medium">Unmapped Models: </span>
            <span className={`font-bold ${unmappedCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {unmappedCount}
            </span>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => {
              setIsDocModalOpen(true);
              if (models.length > 0) handleModelOrCategoryChange(models[0].id, 'BROCHURE');
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-all shadow-sm flex items-center gap-1.5"
          >
            <span>+ Bind Path</span>
          </button>

          <button
            onClick={() =>
              setEditingModel({
                modelCode: '',
                seriesName: '',
                seriesNumber: '',
                dutyType: 'HEAVY DUTY',
                isColor: true,
                ppm: 30,
                functions: 'Copy, Print, Scan, Staple',
              })
            }
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-all shadow-sm flex items-center gap-1.5"
          >
            <span>+ Add New Model</span>
          </button>
        </div>
      </div>

      {/* Model Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading models data...</div>
        ) : models.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No printer models found. Click "+ Add New Model" to get started.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="p-4">Model Code</th>
                <th className="p-4">Series</th>
                <th className="p-4">Type</th>
                <th className="p-4">Color Mode</th>
                <th className="p-4">PPM</th>
                <th className="p-4">Mapped Documents</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs text-slate-700">
              {models.map((m) => {
                const docs = m.documents || [];
                return (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-bold text-blue-600 font-mono text-sm">{m.modelCode}</td>
                    <td className="p-4">
                      <div className="font-medium text-slate-800">{m.seriesName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{m.seriesNumber}</div>
                    </td>
                    <td className="p-4">{m.dutyType}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          m.isColor
                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                            : 'bg-slate-200 text-slate-700 border border-slate-300'
                        }`}
                      >
                        {m.isColor ? 'Color' : 'Monochrome'}
                      </span>
                    </td>
                    <td className="p-4 font-medium">{m.ppm} PPM</td>

                    {/* Mapped Document Path List */}
                    <td className="p-4 max-w-md">
                      {docs.length > 0 ? (
                        <div className="space-y-1.5">
                          {docs.map((doc) => (
                            <div
                              key={doc.id || doc.docCategory}
                              className="flex items-center space-x-1.5 text-[11px] group"
                            >
                              <span className="bg-slate-200 text-slate-700 font-bold px-1.5 py-0.5 rounded text-[9px] shrink-0">
                                {doc.docCategory}
                              </span>
                              <span
                                className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-mono truncate max-w-[240px]"
                                title={doc.filePath}
                              >
                                {doc.filePath}
                              </span>
                              <button
                                onClick={() => handleDeleteDocument(doc.id, m.modelCode)}
                                className="text-slate-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100 p-0.5"
                                title="Unbind / Delete Path"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px] bg-slate-100 px-2 py-1 rounded border border-dashed border-slate-200">
                          No path mapped
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          handleModelOrCategoryChange(m.id, 'BROCHURE');
                          setIsDocModalOpen(true);
                        }}
                        className="text-emerald-600 hover:text-emerald-800 font-medium text-xs px-2.5 py-1 rounded bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                      >
                        Path
                      </button>
                      <button
                        onClick={() => setEditingModel(m)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-xs px-2.5 py-1 rounded bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteModel(m.id)}
                        className="text-red-500 hover:text-red-700 font-medium text-xs px-2.5 py-1 rounded bg-red-50 border border-red-200 hover:bg-red-100 transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal 1: Add/Edit Model */}
      {editingModel && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <form
            onSubmit={handleSaveModel}
            className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4"
          >
            <h2 className="text-base font-bold text-slate-800 border-b pb-3">
              {editingModel.id ? 'Edit Printer Model' : 'Add Printer Model'}
            </h2>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Model Code *</label>
                <input
                  type="text"
                  required
                  value={editingModel.modelCode || ''}
                  onChange={(e) =>
                    setEditingModel({ ...editingModel, modelCode: e.target.value })
                  }
                  className="w-full border rounded-lg p-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g. C3935i"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Series Number</label>
                <input
                  type="text"
                  value={editingModel.seriesNumber || ''}
                  onChange={(e) =>
                    setEditingModel({ ...editingModel, seriesNumber: e.target.value })
                  }
                  className="w-full border rounded-lg p-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g. 3900"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="block font-medium text-slate-700 mb-1">Series Name</label>
              <input
                type="text"
                value={editingModel.seriesName || ''}
                onChange={(e) =>
                  setEditingModel({ ...editingModel, seriesName: e.target.value })
                }
                className="w-full border rounded-lg p-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="e.g. imageRUNNER ADVANCE DX"
              />
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Duty Type</label>
                <input
                  type="text"
                  value={editingModel.dutyType || ''}
                  onChange={(e) =>
                    setEditingModel({ ...editingModel, dutyType: e.target.value })
                  }
                  className="w-full border rounded-lg p-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="LIGHT DUTY"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">PPM</label>
                <input
                  type="number"
                  value={editingModel.ppm || 0}
                  onChange={(e) =>
                    setEditingModel({
                      ...editingModel,
                      ppm: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full border rounded-lg p-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Color Mode</label>
                <select
                  value={editingModel.isColor ? 'true' : 'false'}
                  onChange={(e) =>
                    setEditingModel({
                      ...editingModel,
                      isColor: e.target.value === 'true',
                    })
                  }
                  className="w-full border rounded-lg p-2 outline-none focus:border-blue-500 bg-white"
                >
                  <option value="true">Color</option>
                  <option value="false">Monochrome</option>
                </select>
              </div>
            </div>

            <div className="text-xs">
              <label className="block font-medium text-slate-700 mb-1">Functions</label>
              <input
                type="text"
                value={editingModel.functions || ''}
                onChange={(e) =>
                  setEditingModel({ ...editingModel, functions: e.target.value })
                }
                className="w-full border rounded-lg p-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Copy, Print, Scan, Staple"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setEditingModel(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                Save Model
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal 2: Bind / Edit Document Path */}
      {isDocModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <form
            onSubmit={handleSaveDocument}
            className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg p-6 space-y-4"
          >
            <h2 className="text-base font-bold text-slate-800 border-b pb-3">
              Bind / Update Document Path
            </h2>

            <div className="text-xs space-y-3">
              {/* Select Target Model */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Target Printer Model *
                </label>
                <select
                  value={selectedModelId}
                  onChange={(e) => handleModelOrCategoryChange(Number(e.target.value), docCategoryInput)}
                  className="w-full border rounded-lg p-2.5 outline-none focus:border-emerald-500 bg-white text-xs"
                >
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.modelCode} ({m.seriesName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Category */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Document Category *
                </label>
                <select
                  value={docCategoryInput}
                  onChange={(e) => handleModelOrCategoryChange(Number(selectedModelId), e.target.value)}
                  className="w-full border rounded-lg p-2.5 outline-none focus:border-emerald-500 bg-white text-xs"
                >
                  <option value="BROCHURE">BROCHURE</option>
                  <option value="CATALOG">CATALOG</option>
                  <option value="MyHijau">MyHijau</option>
                  <option value="SIRIM">SIRIM</option>
                  <option value="ENERGY_STAR">ENERGY_STAR</option>
                  <option value="EPEAT">EPEAT</option>
                  <option value="ENV_PROFILE">ENVIRONMENTAL_PROFILE</option>
                  <option value="ECO_TONER">ECOTONER</option>
                  <option value="IS_C">Information Security & Compliance</option>
                </select>
              </div>

              {/* Input File Path */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  File Path *
                </label>
                <textarea
                  rows={3}
                  required
                  value={filePathInput}
                  onChange={(e) => setFilePathInput(e.target.value)}
                  placeholder="10. Canon ALL\BROCHURE\ImageFORCE SSeries\imageforce-8100-series-main.pdf"
                  className="w-full font-mono text-xs border rounded-lg p-2.5 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsDocModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingDoc}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {submittingDoc ? 'Saving...' : 'Save Path Mapping'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}