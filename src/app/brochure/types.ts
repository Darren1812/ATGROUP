export interface FolderTemplateGroup {
  folder: string;
  templates: string[];
}

export interface SelectedTemplateData {
  templateName: string;
  data: Record<string, string>;
}