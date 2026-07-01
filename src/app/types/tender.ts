/**
 * Shared types for the Tender dashboard.
 * Mirrors marketingdepart.DTOs.MasterDatabase.MdTableDto exactly
 * (camelCase, as serialized by System.Text.Json's default web options).
 *
 * If you add a column to MdTableDto on the backend, add it here too —
 * everything else (utils, api, UI) reads from this single source of truth.
 */

export type ResultStatus = "Win" | "Lose" | "Pending" | "Not Participate";

export interface TenderRow {
  id: number;
  tenderNo: string;
  endUser: string | null;
  state: string | null;
  area: string | null;
  marketing: string | null;
  sales: string | null;
  tenderCategory: string | null;
  existingVendor: string | null;
  existingBrand: string | null;
  existingQuantity: number | null;
  contractDuration: string | null;
  contractEndDate: string | null;
  expectedTenderOpenDate: string | null;
  tenderOpenDate: string | null;
  specsRequirement: string | null;
  budget: number | null;
  proposedBrand: string | null;
  resultStatus: ResultStatus | string | null;
  awardedVendor: string | null;
  awardedBrand: string | null;
  awardedAmount: number | null;
  /** Serialized by PercentageJsonConverter as e.g. "-9.90%" */
  awardedVariance: string | null;
}

export interface Filters {
  year: string;
  state: string;
  marketing: string;
  sales: string;
  brand: string;
}

export interface DrawerState {
  title: string;
  rows: TenderRow[];
}