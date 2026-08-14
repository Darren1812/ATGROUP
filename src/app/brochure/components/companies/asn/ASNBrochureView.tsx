"use client";

import { CompanyViewProps } from "../../../types";
import BrochureTemplateBoard from "../../BrochureTemplateBoard";

const ALLOWED_TEMPLATES = [
  "ASN_NilaiTambahan_Coverpage.docx",
  "Item_Coverpage.docx",
  "SLA 2026.docx",
];

const TEMPLATE_ORDER: Record<string, number> = {
  NilaiTambahan: 1,
  Item_Coverpage: 2,
  SLA: 3,
};

const DISPLAY_NAMES: Record<string, string> = {
  "ASN_NilaiTambahan_Coverpage.docx": "ASN Canon Brochure",
  "Item_Coverpage.docx": "Item",
  "SLA 2026.docx": "SLA & Gantt",
};

export default function ASNBrochureView(props: CompanyViewProps) {
  return (
    <BrochureTemplateBoard
      {...props}
      title='ASN — Canon Brochure'
      subtitle='Choose which pages to include in this tender bundle.'
      allowedTemplates={ALLOWED_TEMPLATES}
      templateOrder={TEMPLATE_ORDER}
      getDisplayName={(tpl) => {
        const matchedKey = ALLOWED_TEMPLATES.find(
          (allowed) => tpl.endsWith(allowed) || tpl === allowed,
        );
        return (matchedKey && DISPLAY_NAMES[matchedKey]) || tpl;
      }}
    />
  );
}