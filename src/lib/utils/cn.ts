/**
 * Classname utility for merging Tailwind CSS classes
 *
 * Uses clsx for conditional class joining and tailwind-merge
 * to handle Tailwind CSS class conflicts intelligently.
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge class names with Tailwind CSS conflict resolution
 *
 * @example
 * cn('px-2 py-1', 'px-4') // Returns 'py-1 px-4'
 * cn('text-red-500', condition && 'text-blue-500')
 * cn(['base-class', 'another'], { 'conditional': true })
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
