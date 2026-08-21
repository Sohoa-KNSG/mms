/**
 * MMS WMS - Centralized Date & Time Utility (UTC+7 / Asia/Ho_Chi_Minh)
 * Đảm bảo toàn bộ ứng dụng hiển thị và xử lý thời gian chuẩn Múi giờ Việt Nam (UTC+7)
 */

export const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';
export const VIETNAM_LOCALE = 'vi-VN';

/**
 * Format Ngày (DD/MM/YYYY) theo múi giờ UTC+7
 */
export function formatDate(dateInput?: string | Date | number | null, fallback = '—'): string {
  if (!dateInput) return fallback;
  try {
    const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return fallback;

    return new Intl.DateTimeFormat(VIETNAM_LOCALE, {
      timeZone: VIETNAM_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(d);
  } catch {
    return fallback;
  }
}

/**
 * Format Ngày & Giờ (DD/MM/YYYY HH:mm:ss) theo múi giờ UTC+7
 */
export function formatDateTime(dateInput?: string | Date | number | null, fallback = '—'): string {
  if (!dateInput) return fallback;
  try {
    const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return fallback;

    return new Intl.DateTimeFormat(VIETNAM_LOCALE, {
      timeZone: VIETNAM_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(d);
  } catch {
    return fallback;
  }
}

/**
 * Format Giờ (HH:mm:ss hoặc HH:mm) theo múi giờ UTC+7
 */
export function formatTime(dateInput?: string | Date | number | null, includeSeconds = true, fallback = '—'): string {
  if (!dateInput) return fallback;
  try {
    const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return fallback;

    return new Intl.DateTimeFormat(VIETNAM_LOCALE, {
      timeZone: VIETNAM_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      second: includeSeconds ? '2-digit' : undefined,
      hour12: false
    }).format(d);
  } catch {
    return fallback;
  }
}

/**
 * Lấy ngày hôm nay theo định dạng chuẩn YYYY-MM-DD (múi giờ UTC+7)
 * Dùng cho input type="date"
 */
export function getTodayUtc7String(offsetDays = 0): string {
  const d = new Date();
  if (offsetDays !== 0) {
    d.setDate(d.getDate() + offsetDays);
  }

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: VIETNAM_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(d);

  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;

  return `${year}-${month}-${day}`;
}

/**
 * Lấy chuỗi thời gian hiện tại YYYY-MM-DD HH:mm (múi giờ UTC+7)
 * Dùng cho input type="datetime-local" hoặc ghi log giao dịch
 */
export function getNowUtc7String(): string {
  const d = new Date();
  const dateStr = getTodayUtc7String();
  const timeStr = formatTime(d, true);
  return `${dateStr} ${timeStr}`;
}

/**
 * Format chuỗi ISO với offset +07:00 (VD: 2026-08-20T13:15:00+07:00)
 */
export function formatIsoUtc7(dateInput?: Date | string | number | null): string {
  const d = dateInput ? (typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput) : new Date();
  if (isNaN(d.getTime())) return '';

  const dateStr = getTodayUtc7String();
  const timeStr = formatTime(d, true);
  return `${dateStr}T${timeStr}+07:00`;
}

/**
 * Hiển thị khoảng cách thời gian thân thiện (Ví dụ: "Vừa xong", "5 phút trước", "2 giờ trước")
 */
export function formatRelativeTime(dateInput?: string | Date | number | null, fallback = '—'): string {
  if (!dateInput) return fallback;
  try {
    const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return fallback;

    const diffSeconds = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diffSeconds < 60) return 'Vừa xong';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} phút trước`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} giờ trước`;
    if (diffSeconds < 2592000) return `${Math.floor(diffSeconds / 86400)} ngày trước`;

    return formatDate(d);
  } catch {
    return fallback;
  }
}
