"use client";

import { CompanyViewProps } from "../../../types";
import BrochureTemplateBoard from "../../BrochureTemplateBoard";

const TEMPLATE_ORDER: Record<string, number> = {
  NilaiTambahan: 1,
  Item_Coverpage: 2,
  SLA: 3,
};

const DISPLAY_NAMES: Record<string, string> = {
  NilaiTambahan: "Brochure",
  Item_Coverpage: "Item",
  SLA: "SLA & Gantt",
};

export default function ArenaCanonBrochureView(props: CompanyViewProps) {
  return (
    <BrochureTemplateBoard
      {...props}
      title='ARENA — Canon Brochure'
      subtitle='Choose which pages to include in this tender bundle.'
      templateOrder={TEMPLATE_ORDER}
      getDisplayName={(tpl) => {
        for (const [key, label] of Object.entries(DISPLAY_NAMES)) {
          if (tpl.includes(key)) return label;
        }
        return tpl;
      }}
    />
  );
}