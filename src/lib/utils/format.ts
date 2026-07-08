/**
 * Formatting utilities for dates, numbers, and strings
 */

import { formatDistanceToNow, format } from 'date-fns';

/**
 * Format a date relative to now (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

/**
 * Format a date in a standard format
 */
export function formatDate(
  date: Date | string,
  formatStr: string = 'MMM d, yyyy'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, formatStr);
}

/**
 * Format a date with time
 */
export function formatDateTime(date: Date | string): string {
  return formatDate(date, 'MMM d, yyyy h:mm a');
}

/**
 * Format a number with commas (e.g., 1,234,567)
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Format a number as currency
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD'
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format cents to dollars
 */
export function formatCents(cents: number): string {
  return formatCurrency(cents / 100);
}

/**
 * Format bytes to human readable size
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format a percentage (e.g., 0.85 -> "85%")
 */
export function formatPercent(value: number, decimals: number = 0): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Truncate a string with ellipsis
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length).trim() + '...';
}

/**
 * Capitalize the first letter of a string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Convert a string to title case
 */
export function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Generate a URL-friendly slug from a string
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Format reading time from seconds
 */
export function formatReadingTime(seconds: number): string {
  if (seconds < 60) return 'less than a minute';
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} min read`;
}

/**
 * Format word count
 */
export function formatWordCount(count: number): string {
  if (count === 1) return '1 word';
  return `${formatNumber(count)} words`;
}

/**
 * Format character count with platform limit
 */
export function formatCharacterCount(
  count: number,
  limit?: number
): string {
  if (limit) {
    return `${formatNumber(count)}/${formatNumber(limit)}`;
  }
  return formatNumber(count);
}

/**
 * Get initials from a name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Format platform name for display
 */
export function formatPlatformName(platform: string): string {
  const names: Record<string, string> = {
    INSTAGRAM: 'Instagram',
    FACEBOOK: 'Facebook',
    LINKEDIN: 'LinkedIn',
    TIKTOK: 'TikTok',
    X: 'X',
    THREADS: 'Threads',
    PINTEREST: 'Pinterest',
    GOOGLE_BUSINESS: 'Google Business',
    YOUTUBE_COMMUNITY: 'YouTube',
  };
  return names[platform] || titleCase(platform.replace(/_/g, ' '));
}

/**
 * Format content type for display
 */
export function formatContentType(type: string): string {
  const names: Record<string, string> = {
    POST: 'Post',
    STORY: 'Story',
    CAROUSEL: 'Carousel',
    REEL: 'Reel',
    ARTICLE: 'Article',
    BLOG: 'Blog',
    NEWSLETTER: 'Newsletter',
    PRESS_RELEASE: 'Press Release',
    EMAIL: 'Email',
    PODCAST_NOTES: 'Podcast Notes',
    VIDEO_SCRIPT: 'Video Script',
    VOICEOVER: 'Voiceover',
  };
  return names[type] || titleCase(type.replace(/_/g, ' '));
}

/**
 * Format plan name for display
 */
export function formatPlanName(plan: string): string {
  const names: Record<string, string> = {
    FREE: 'Free',
    STARTER: 'Starter',
    PRO: 'Pro',
    AGENCY: 'Agency',
    ENTERPRISE: 'Enterprise',
  };
  return names[plan] || titleCase(plan);
}

/**
 * Format member role for display
 */
export function formatMemberRole(role: string): string {
  const names: Record<string, string> = {
    OWNER: 'Owner',
    ADMIN: 'Admin',
    EDITOR: 'Editor',
    VIEWER: 'Viewer',
  };
  return names[role] || titleCase(role);
}
