'use client';

import { useState, useEffect, useCallback } from 'react';
import { CompanyViewProps, PrinterModel, ModelConfig } from '../../../types';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export default function ASNBrochureView({
  templates,
  selectedItems,
  onAddItem,
  onRemoveItem,
  onFieldChange,
}: CompanyViewProps) {
  const [printerModels, setPrinterModels] = useState<PrinterModel[]>([]);

  // 1. 请求后端数据库中的 printer_models
  useEffect(() => {
    fetch(`${BASE_URL}/api/Brochure/printer-models`)
      .then(async (res) => {
        if (!res.ok) return [];
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return res.json();
        }
        return [];
      })
      .then((data) => setPrinterModels(data || []))
      .catch((err) => console.error('Error fetching printer models:', err));
  }, []);

  // 2. 格式化文本生成逻辑
  const generateModelDetailsText = useCallback(
    (configs: ModelConfig[] = [], models: PrinterModel[] = printerModels) => {
      return configs
        .map((cfg) => {
          const model = models.find((m) => m.model_code === cfg.modelCode);
          if (!model) return '';

          const colorStr = model.is_color ? '(HITAM/PUTIH DAN BERWARNA)' : '(HITAM/PUTIH)';
          const colorPpmStr = model.is_color ? 'Color' : 'Monochrome';

          let finisherStr = '';
          if (cfg.finisher === 'INNER') finisherStr = 'With INNER Finisher\n';
          else if (cfg.finisher === 'EXTERNAL STAPLE') finisherStr = 'With EXTERNAL STAPLE Finisher\n';
          else if (cfg.finisher === 'BOOKLET') finisherStr = 'With BOOKLET Finisher\n';

          return `${cfg.itemLabel}. MESIN PENYALIN JENIS\n${model.duty_type} ${colorStr} - ${cfg.units} UNIT\n\n\n${cfg.units} UNIT ${model.series_name} ${model.model_code}\n${finisherStr}(${model.ppm}PPM, ${colorPpmStr})\n${model.functions}`;
        })
        .filter(Boolean)
        .join('\n\n');
    },
    [printerModels]
  );

  // 3. 当 selectedItems 发生变化或 printerModels 加载完成后，自动对全局的 Item_Coverpage 进行字母排序 (A, B, C...) 与文本刷新
  useEffect(() => {
    if (printerModels.length === 0) return;

    let globalIndex = 0;
    selectedItems.forEach((item) => {
      if (item.templateName.includes('Item_Coverpage') && item.modelConfigs && item.modelConfigs.length > 0) {
        let hasLabelChanged = false;

        // 重新刷新字母序号
        const updatedConfigs = item.modelConfigs.map((cfg) => {
          const expectedLabel = String.fromCharCode(65 + globalIndex);
          globalIndex++;
          if (cfg.itemLabel !== expectedLabel) {
            hasLabelChanged = true;
            return { ...cfg, itemLabel: expectedLabel };
          }
          return cfg;
        });

        // 自动计算并同步最新文本与 ModelCodes
        const newText = generateModelDetailsText(updatedConfigs, printerModels);
        const modelCodes = Array.from(new Set(updatedConfigs.map((c) => c.modelCode).filter(Boolean)));

        if (hasLabelChanged) {
          onFieldChange(item.instanceId, 'modelConfigs', updatedConfigs);
        }
        if (item.data['modeldetails'] !== newText) {
          onFieldChange(item.instanceId, 'modeldetails', newText);
        }
        if (JSON.stringify(item.modelCodes) !== JSON.stringify(modelCodes)) {
          onFieldChange(item.instanceId, 'modelCodes', modelCodes);
        }
      }
    });
  }, [selectedItems.length, printerModels, generateModelDetailsText]);

  // 4. 统一更新单一 Instance 内部 Model 配置 Helper
  const handleUpdateConfigs = (instanceId: string, updatedConfigs: ModelConfig[]) => {
    onFieldChange(instanceId, 'modelConfigs', updatedConfigs);

    const newDetailsText = generateModelDetailsText(updatedConfigs);
    onFieldChange(instanceId, 'modeldetails', newDetailsText);

    const modelCodes = Array.from(new Set(updatedConfigs.map((c) => c.modelCode).filter(Boolean)));
    onFieldChange(instanceId, 'modelCodes', modelCodes);
  };

  // 计算全局已占用的 Model 数量
  const getGlobalModelCount = () => {
    return selectedItems
      .filter((item) => item.templateName.includes('Item_Coverpage'))
      .reduce((sum, item) => sum + (item.modelConfigs?.length || 0), 0);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {templates.map((tpl) => {
          const matchingItems = selectedItems.filter(
            (item) => item.templateName.endsWith(tpl) || item.templateName === tpl
          );

          const isSelected = matchingItems.length > 0;

          return (
            <div key={tpl} className="flex flex-col space-y-4">
              {!isSelected ? (
                /* 未选中状态卡片 */
                <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm hover:border-blue-300 hover:shadow transition-all">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={false}
                        onChange={(e) => {
                          if (e.target.checked) onAddItem(tpl);
                        }}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="font-semibold text-slate-800 text-sm">{tpl}</span>
                    </label>
                  </div>
                </div>
              ) : (
                /* 已选中状态卡片 */
                matchingItems.map((item, index) => {
                  const isNilaiTambahan = tpl.includes('NilaiTambahan');
                  const isItemCover = tpl.includes('Item_Coverpage');
                  const configs: ModelConfig[] = item.modelConfigs || [];

                  return (
                    <div
                      key={item.instanceId}
                      className="border border-blue-500 ring-1 ring-blue-500/20 rounded-xl p-5 bg-white shadow-md relative space-y-4"
                    >
                      {/* Header 区域 */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={true}
                            onChange={() => onRemoveItem(item.instanceId)}
                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                          />
                          <h3 className="font-bold text-slate-800 text-sm">
                            {tpl} {matchingItems.length > 1 ? `#${index + 1}` : ''}
                          </h3>
                        </div>

                        <button
                          type="button"
                          onClick={() => onAddItem(tpl)}
                          className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium px-2.5 py-1 rounded-md transition-colors"
                        >
                          + Add Page
                        </button>
                      </div>

                      {/* 表单主体 */}
                      <div className="space-y-4">
                        {isNilaiTambahan && (
                          <>
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Customer Name
                              </label>
                              <input
                                type="text"
                                value={item.data['customername'] || ''}
                                onChange={(e) =>
                                  onFieldChange(item.instanceId, 'customername', e.target.value)
                                }
                                placeholder="e.g. TESTING SDN BHD"
                                className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Nilai Tambahan Content
                              </label>
                              <textarea
                                rows={4}
                                value={item.data['nilaitambahancontent'] || ''}
                                onChange={(e) =>
                                  onFieldChange(
                                    item.instanceId,
                                    'nilaitambahancontent',
                                    e.target.value
                                  )
                                }
                                placeholder="Enter nilai tambahan details..."
                                className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                              />
                            </div>
                          </>
                        )}

                        {isItemCover && (
                          <div className="space-y-4">
                            <div className="flex justify-between items-center pt-1">
                              <span className="text-xs font-bold text-slate-700">
                                Model Configurations
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const totalCount = getGlobalModelCount();
                                  const nextLabel = String.fromCharCode(65 + totalCount);
                                  const defaultModel = printerModels[0]?.model_code || '';
                                  const newConfigs: ModelConfig[] = [
                                    ...configs,
                                    {
                                      id: Date.now().toString(),
                                      itemLabel: nextLabel,
                                      modelCode: defaultModel,
                                      units: 1,
                                      finisher: 'NONE',
                                    },
                                  ];
                                  handleUpdateConfigs(item.instanceId, newConfigs);
                                }}
                                className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-200 font-medium px-2.5 py-1 rounded-md hover:bg-emerald-100 transition-colors"
                              >
                                + Add Model
                              </button>
                            </div>

                            {configs.map((cfg, cfgIdx) => (
                              <div
                                key={cfg.id || cfgIdx}
                                className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-3 relative"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                    Item {cfg.itemLabel}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = configs.filter((_, idx) => idx !== cfgIdx);
                                      handleUpdateConfigs(item.instanceId, updated);
                                    }}
                                    className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                                  >
                                    Delete
                                  </button>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                                      Model Code
                                    </label>
                                    <select
                                      value={cfg.modelCode}
                                      onChange={(e) => {
                                        const updated = configs.map((c, i) =>
                                          i === cfgIdx ? { ...c, modelCode: e.target.value } : c
                                        );
                                        handleUpdateConfigs(item.instanceId, updated);
                                      }}
                                      className="w-full text-xs border border-slate-300 rounded-md p-1.5 bg-white outline-none focus:border-blue-500"
                                    >
                                      {printerModels.length === 0 ? (
                                        <option value={cfg.modelCode}>
                                          {cfg.modelCode || 'Loading models...'}
                                        </option>
                                      ) : (
                                        printerModels.map((m) => (
                                          <option key={m.id || m.model_code} value={m.model_code}>
                                            {m.series_name} ({m.model_code})
                                          </option>
                                        ))
                                      )}
                                    </select>
                                  </div>

                                  <div>
                                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                                      Units
                                    </label>
                                    <input
                                      type="number"
                                      min={1}
                                      value={cfg.units}
                                      onChange={(e) => {
                                        const val = parseInt(e.target.value) || 1;
                                        const updated = configs.map((c, i) =>
                                          i === cfgIdx ? { ...c, units: val } : c
                                        );
                                        handleUpdateConfigs(item.instanceId, updated);
                                      }}
                                      className="w-full text-xs border border-slate-300 rounded-md p-1.5 bg-white outline-none focus:border-blue-500"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                                    Finisher Option
                                  </label>
                                  <select
                                    value={cfg.finisher}
                                    onChange={(e) => {
                                      const updated = configs.map((c, i) =>
                                        i === cfgIdx
                                          ? { ...c, finisher: e.target.value as any }
                                          : c
                                      );
                                      handleUpdateConfigs(item.instanceId, updated);
                                    }}
                                    className="w-full text-xs border border-slate-300 rounded-md p-1.5 bg-white outline-none focus:border-blue-500"
                                  >
                                    <option value="NONE">Without Finisher</option>
                                    <option value="INNER">INNER Finisher</option>
                                    <option value="EXTERNAL STAPLE">
                                      EXTERNAL STAPLE Finisher
                                    </option>
                                    <option value="BOOKLET">BOOKLET Finisher</option>
                                  </select>
                                </div>
                              </div>
                            ))}

                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Generated Text (modeldetails)
                              </label>
                              <textarea
                                rows={6}
                                value={item.data['modeldetails'] || ''}
                                onChange={(e) =>
                                  onFieldChange(item.instanceId, 'modeldetails', e.target.value)
                                }
                                placeholder="Click + Add Model above to generate details..."
                                className="w-full text-xs font-mono border border-slate-300 rounded-lg p-3 outline-none focus:border-blue-500 bg-slate-50 leading-relaxed"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}