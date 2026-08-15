const quantityFormatter = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 6 });
const dateTimeFormatter = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'short',
});

export function formatQuantity(value: number): string {
  return quantityFormatter.format(value);
}

export function formatDateTime(value: string | null): string {
  if (!value) return '—';
  return dateTimeFormatter.format(new Date(value));
}

