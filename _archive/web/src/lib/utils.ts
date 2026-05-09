import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount);
}

export function channelIcon(channel: string) {
  const map: Record<string, string> = {
    linkedin: '💼',
    instagram: '📸',
    facebook: '👥',
    tiktok: '🎵',
    x: '𝕏',
  };
  return map[channel] || '📱';
}

export function statusColor(status: string) {
  const map: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    upcoming: 'bg-blue-100 text-blue-800',
    completed: 'bg-gray-100 text-gray-800',
    archived: 'bg-gray-100 text-gray-500',
    draft: 'bg-yellow-100 text-yellow-800',
    paused: 'bg-orange-100 text-orange-800',
    scheduled: 'bg-purple-100 text-purple-800',
    pending: 'bg-amber-100 text-amber-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    published: 'bg-indigo-100 text-indigo-800',
  };
  return map[status] || 'bg-gray-100 text-gray-800';
}
