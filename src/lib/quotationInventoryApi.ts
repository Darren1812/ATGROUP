const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
const BASE = `${API}/api/quotation-inventory`;

export type QuotationInventory = {
  id: number;
  itemType: string | null;
  productCode: string | null;
  productName: string | null;
  listPrice: number | null;
  additionalInfo: string | null;
};

export type SaveDto = {
  itemType: string | null;
  productCode: string | null;
  productName: string | null;
  listPrice: number | null;
  additionalInfo: string | null;
};

export type ListResult = {
  total: number;
  page: number;
  pageSize: number;
  items: QuotationInventory[];
};

export type ImportResult = { inserted: number; updated: number; message: string };

export class ApiError extends Error {
  errors?: string[];
  constructor(message: string, errors?: string[]) {
    super(message);
    this.errors = errors;
  }
}

async function ensureOk(res: Response) {
  if (res.ok) return res;
  let body: any = null;
  try {
    body = await res.json();
  } catch {}
  const validation = body?.errors && !Array.isArray(body.errors)
    ? Object.values(body.errors).flat().map(String) // ASP.NET 校验错误是对象
    : body?.errors;
  throw new ApiError(body?.message ?? body?.title ?? `Request failed (${res.status}).`, validation);
}

export async function listTypes(): Promise<string[]> {
  const res = await ensureOk(await fetch(`${BASE}/types`, { cache: "no-store" }));
  return res.json();
}

export async function listInventory(params: {
  search?: string;
  type?: string;
  page: number;
  pageSize: number;
}): Promise<ListResult> {
  const q = new URLSearchParams();
  if (params.search) q.set("search", params.search);
  if (params.type) q.set("type", params.type);
  q.set("page", String(params.page));
  q.set("pageSize", String(params.pageSize));
  const res = await ensureOk(await fetch(`${BASE}?${q}`, { cache: "no-store" }));
  return res.json();
}

export async function createInventory(dto: SaveDto): Promise<QuotationInventory> {
  const res = await ensureOk(
    await fetch(BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dto),
    })
  );
  return res.json();
}

export async function updateInventory(id: number, dto: SaveDto): Promise<QuotationInventory> {
  const res = await ensureOk(
    await fetch(`${BASE}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dto),
    })
  );
  return res.json();
}

export async function deleteInventory(id: number): Promise<void> {
  await ensureOk(await fetch(`${BASE}/${id}`, { method: "DELETE" }));
}

export async function importInventory(file: File): Promise<ImportResult> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await ensureOk(await fetch(`${BASE}/import`, { method: "POST", body: fd }));
  return res.json();
}

export function exportUrl(type?: string): string {
  return type ? `${BASE}/export?type=${encodeURIComponent(type)}` : `${BASE}/export`;
}
