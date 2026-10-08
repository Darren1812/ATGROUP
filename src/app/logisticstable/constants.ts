import {
  Package,
  Building2,
  MapPin,
  User,
  Clock,
  Phone,
  FileText,
  CircleDot,
  Settings,
} from "lucide-react";
import type { ColumnDef } from "./types";

export const API = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/Logistics`;
export const API2 = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/OCRAI`;

export const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; dot: string }
> = {
  AwaitingStock: {
    label: "Awaiting Stock",
    color: "text-orange-700",
    bg: "bg-orange-50 border-orange-200",
    dot: "bg-orange-500",
  },
  Waiting: {
    label: "Waiting",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    dot: "bg-amber-400",
  },
  Arrange: {
    label: "Arranging",
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
    dot: "bg-blue-500",
  },
  Assign: {
    label: "Assigned",
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
    dot: "bg-blue-500",
  },
  Complete: {
    label: "Complete",
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
    dot: "bg-red-500",
  },
};

export const COLUMN_DEFS: ColumnDef[] = [
  { key: "orderNumber", label: "ID", icon: null, width: 100 },
  { key: "createdAt", label: "At", icon: Clock, width: 100 },
  { key: "createdBy", label: "BY", icon: User, width: 60 },
  { key: "from", label: "From", icon: Building2, width: 160 },
  { key: "companyName", label: "Company Name", icon: Building2, width: 160 },
  { key: "location", label: "Location", icon: MapPin, width: 180 },
  { key: "phoneNumber", label: "Phone", icon: Phone, width: 100 },
  { key: "item", label: "Item", icon: Package, width: 300 },
  { key: "estimate", label: "Estimate", icon: Clock, width: 200 },
  { key: "schedule", label: "Schedule", icon: Clock, width: 200 },
  { key: "pic", label: "PIC", icon: User, width: 120 },
  { key: "status", label: "Status", icon: CircleDot, width: 150 },
 // { key: "doId", label: "DO ID", icon: FileText, width: 120 },
  { key: "documents", label: "Documents", icon: FileText, width: 140 },
  { key: "remark", label: "Remark", icon: FileText, width: 200 },
  { key: "action", label: "Action", icon: Settings, width: 100 },
];

export const PIC_OPTIONS_STATIC = ["Akmal", "Nahfiz", "Darwin", "Darren"];