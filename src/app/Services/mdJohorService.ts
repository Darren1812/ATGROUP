export interface MdJohor {
  id: number;
  status?: string;
  endUser?: string;
  address?: string;
  area?: string;
  marketing?: string;
  accountManager?: string;
  existingVendorBrand?: string;
  nextActionMonth?: string;
  pic?: string;
  remarks?: string;
  estimateTenderOpen?: string; // use string for date fields in JSON
  contractEnd?: string;
  tenderOpenMonth?: string;
  tenderNo?: string;
  appStatus?: string;
  budget?: number;
  tenderSpecification?: string;
  machineType?: string;
  model?: string;
  existingQuantity?: number;
  rental?: number;
  bwCharge?: number;
  colorCharge?: number;
  durationMonth?: number;
  proposedModel?: string;
  configuration?: string;
  proposedQuantity?: number;
  proposedRental?: number;
  proposedBwCharge?: number;
  proposedColorCharge?: number;
  meterBudget?: number;
  durationMonths?: number;
  winingChance?: string;
  ranking?: number;
  awardedAmount?: number;
  awardedVariance?: number;
}

const API_URL = "https://localhost:7253/api/MdJohor";

// Get all records
export async function getMdJohorList(): Promise<MdJohor[]> {
  const res = await fetch(API_URL, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch MdJohor data");
  return res.json();
}
