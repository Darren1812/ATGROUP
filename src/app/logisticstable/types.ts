export interface OcrItem {
  description: string;
  status: string;
}

export interface PendingTaskDraft {
  from: string;
  companyName: string;
  location: string;
  phoneNumber: string;
  department: string;
  picDeliver: string;
  scheduledTime: string | null;
  status: string;
  items: OcrItem[];
}

export interface ColumnDef {
  key: string;
  label: string;
  icon: any;
  width: number;
}

export interface Column extends ColumnDef {
  visible: boolean;
}

export interface DocStatusEntry {
  install: boolean;
  do: boolean;
  complete: boolean;
}
