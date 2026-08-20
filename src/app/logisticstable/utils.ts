// 判断 scheduledAt 是否真的被设置过。
// 后端在没有排期时会用 DateTime.MinValue 兜底，序列化成 JSON 后是 "0001-01-01T00:00:00" 这种值，
// 不是空字符串/null，所以不能只判断真假值，要顺手把这个占位日期也当作"未设置"处理。
export function isScheduledSet(scheduledAt?: string | null): boolean {
  if (!scheduledAt) return false;
  return !scheduledAt.startsWith("0001-01-01");
}

// 统一计算某笔任务应该显示的状态：
// Complete/Assign/Arrange 由业务事实（有没有完成单、有没有指派 PIC、有没有排期）决定，优先级最高；
// 否则就照 creator 当初建单/后续手动更新的原始 status 来（AwaitingStock 或 Waiting）
export function computeDisplayStatus(t: any): string {
  if (t.hasComplete || t.status === "Complete") return "Complete";
  if (t.picDeliver && isScheduledSet(t.scheduledAt)) return "Assign";
  if (t.picDeliver) return "Arrange";
  if (t.status === "AwaitingStock") return "AwaitingStock";
  return "Waiting";
}

export function formatDate(dateString: string) {
  if (!dateString) return "";
  const d = new Date(dateString);
  return d.toISOString().slice(0, 16);
}

export function formatForInput(utcDateString: string | number | Date) {
  if (!utcDateString) return "";
  const date = new Date(utcDateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function getTodayMinString() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

export function mapUrl(value: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`;
}

export function formatDisplayValue(value: string): string {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) {
    try {
      const url = new URL(value);
      const queryParam =
        url.searchParams.get("query") || url.searchParams.get("q");
      if (queryParam) {
        return decodeURIComponent(queryParam);
      }
      return `${url.hostname}...`;
    } catch (e) {
      return value.length > 30 ? `${value.slice(0, 30)}...` : value;
    }
  }
  return value;
}