export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(dateStr: string, locale: string = 'vi'): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (locale === 'en') {
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Converts an ISO date string (yyyy-MM-dd from <input type="date">) to
 * locale display format: dd/MM/yyyy for Vietnamese, MM/dd/yyyy for English.
 */
export function formatDateFilter(isoDate: string, locale: string = 'vi'): string {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  if (!year || !month || !day) return isoDate;
  return locale === 'en' ? `${month}/${day}/${year}` : `${day}/${month}/${year}`;
}

type UrgencyLevel = 'normal' | 'warning' | 'urgent';

const TERMINAL_STATUSES = ['Done', 'Cancelled'];

export function getTimeUrgency(createdAt: string, status: string): UrgencyLevel {
  if (TERMINAL_STATUSES.includes(status)) return 'normal';
  const hours = (Date.now() - new Date(createdAt).getTime()) / 3600000;
  if (hours >= 24) return 'urgent';
  if (hours >= 4) return 'warning';
  return 'normal';
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}
