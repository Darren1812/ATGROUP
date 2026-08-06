export interface PrinterModel {
  id: number;
  model_code: string;
  series_name: string;
  series_number: string;
  duty_type: string;
  is_color: boolean;
  ppm: number;
  functions: string;
}

export interface ModelConfig {
  id: string; // 前端使用的唯一 key (例如 Date.now().toString())
  itemLabel: string; // 例如: "A", "B", "C"
  modelCode: string; // 选择的型号 model_code
  units: number; // 数量 (如 7)
  finisher: 'INNER' | 'EXTERNAL STAPLE' | 'BOOKLET' | 'NONE'; // Finisher 选项
}

export interface SelectedTemplateItem {
  instanceId: string;
  templateName: string;
  data: Record<string, string>;
  modelCode?: string; // 单选或兼容性字段
  modelCodes?: string[]; // 收集到的 ModelCode 数组，供 C# 后端使用
  modelConfigs?: ModelConfig[]; // Coverpage 的多型号配置列表
}

export interface CompanyViewProps {
  templates: string[];
  selectedItems: SelectedTemplateItem[];
  onAddItem: (templateName: string) => void;
  onRemoveItem: (instanceId: string) => void;
  // 将 value 类型改为 any，使其既能接收普通字符串，也能接收 ModelConfig[] 数组
  onFieldChange: (instanceId: string, fieldKey: string, value: any) => void;
}