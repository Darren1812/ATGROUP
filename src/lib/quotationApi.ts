const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export type QuotationGenerateDto = {
  template: "ATP_RENT" | "ATP_PURCHASE" | "ARENA_RENT" | "ARENA_PURCHASE" | "SKYACTIVE_RENT" | "SKYACTIVE_PURCHASE" | "ASN_RENT" | "ASN_PURCHASE" | "ALLTIME_RENT" | "ALLTIME_PURCHASE" | "ATPKL_RENT" | "ATPKL_PURCHASE" | "GC_RENT" | "GC_PURCHASE" | "ATPLAN_COPY_RENT" | "ATPLAN_COPY_PURCHASE" | "ATPLAN_SDN_RENT" | "ATPLAN_SDN_PURCHASE";
  customerName: string;
  address: string;
  attention: string | null;
  tel: string | null;
  ref: string;
  date: string;
  salesPerson: string;
  items: { inventoryId: number; qty: number; months: string }[];
};

async function readFileResponse(response: Response, fallbackName: string, action: string) {
  if (!response.ok) {
    let message = `${action} failed (${response.status}).`;
    try {
      const body = await response.json();
      message = body.message ?? body.title ?? message;
    } catch {
      // Keep the HTTP status message when the server does not return JSON.
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  if (blob.type.includes("json")) {
    let message = `The server did not return a file for ${action.toLowerCase()}.`;
    try {
      const result = JSON.parse(await blob.text());
      message = result.message ?? message;
    } catch { /* Use the default response when the body is not valid JSON. */ }
    throw new Error(message);
  }

  const disposition = response.headers.get("content-disposition") ?? "";
  const encodedName = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const plainName = disposition.match(/filename="?([^";]+)"?/i)?.[1];
  const fileName = encodedName
    ? decodeURIComponent(encodedName)
    : plainName || fallbackName;

  return { blob, fileName };
}

async function postQuotation(url: string, dto: QuotationGenerateDto, fallbackName: string, action: string) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  return readFileResponse(response, fallbackName, action);
}

function safeReference(ref: string) {
  return ref.replace(/[\\/:*?"<>|]/g, "_");
}

export function previewQuotation(dto: QuotationGenerateDto) {
  return postQuotation(`${API_URL}/api/quotation/preview`, dto, `Quotation_${safeReference(dto.ref)}.pdf`, "Preview");
}

export function generateQuotation(dto: QuotationGenerateDto, format: "pdf" | "docx") {
  const extension = format === "docx" ? "docx" : "pdf";
  return postQuotation(
    `${API_URL}/api/quotation/generate?format=${format}`,
    dto,
    `Quotation_${safeReference(dto.ref)}.${extension}`,
    `Quotation export (${extension.toUpperCase()})`
  );
}
