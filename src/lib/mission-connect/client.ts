/**
 * Mission Connect Client
 *
 * Fetches stories and photos from the Mission Connect system
 * URL pattern: https://mc.ultimatemission.org/client/{clientKey}
 */

import * as cheerio from 'cheerio';

// Re-export from clients.ts for backwards compatibility
export { MC_CLIENTS, getClients, type MCClient } from './clients';

const BASE_URL = 'https://mc.ultimatemission.org';

export interface WorkerGroup {
  id: string;
  name: string;
  url: string;
}

export interface StoryPhoto {
  url: string;
  rating: number;
}

export interface StoryData {
  id: string;
  date: Date;
  workerName: string;
  content: string;
  rating: number;
  photos: StoryPhoto[];
  condition?: string;
  patientInfo?: string;
}

/**
 * Fetch all worker groups for a client
 */
export async function fetchWorkerGroups(clientKey: string): Promise<WorkerGroup[]> {
  const url = `${BASE_URL}/client/${clientKey}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch worker groups: ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const groups: WorkerGroup[] = [];

  $('a[href*="/client/group/"]').each((_, element) => {
    const href = $(element).attr('href');
    const name = $(element).text().trim();

    if (href && name) {
      // Extract ID from URL like /client/group/9f4f613a6bdcc883/13
      const match = href.match(/\/client\/group\/[^/]+\/(\d+)/);
      if (match) {
        groups.push({
          id: match[1],
          name,
          url: `${BASE_URL}${href}`,
        });
      }
    }
  });

  return groups;
}

/**
 * Fetch stories from a worker group
 */
export async function fetchStories(
  clientKey: string,
  groupId: string,
  options?: { withPhotosOnly?: boolean }
): Promise<StoryData[]> {
  const url = `${BASE_URL}/client/group/${clientKey}/${groupId}?all=1`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch stories: ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const stories: StoryData[] = [];

  // Parse report cards - each contains date, worker, stories, and photos
  $('.reportCard').each((cardIndex, card) => {
    const $card = $(card);

    // Get date and worker from card header
    const dateText = $card.find('.cardTitle').text().trim();
    const workerName = $card.find('.cardMeta').text().trim() || 'Unknown Worker';

    // Get all photos for this report card
    const photos: StoryPhoto[] = [];
    $card.find('.photoCell img').each((_, img) => {
      const src = $(img).attr('src');
      if (src && src.includes('report-photo')) {
        photos.push({
          url: src,
          rating: 3,
        });
      }
    });

    // Get all story blocks within this card
    $card.find('.storyBlock').each((blockIndex, block) => {
      const $block = $(block);
      const content = $block.find('.storyText').text().trim();
      const rating = $block.find('.stars .on').length || 1;
      const storyId = $block.attr('data-story-id') || `${cardIndex}-${blockIndex}`;

      // Skip if no content
      if (!content) return;

      // Skip stories without photos if filter is enabled
      if (options?.withPhotosOnly && photos.length === 0) {
        return;
      }

      stories.push({
        id: `${groupId}-${storyId}`,
        date: dateText ? new Date(dateText) : new Date(),
        workerName,
        content,
        rating,
        photos, // All photos from the report card
      });
    });
  });

  return stories;
}

/**
 * Fetch a random story with photos
 */
export async function fetchRandomStoryWithPhotos(clientKey: string): Promise<{
  group: WorkerGroup;
  story: StoryData;
} | null> {
  // Get all groups
  const groups = await fetchWorkerGroups(clientKey);
  if (groups.length === 0) return null;

  // Shuffle groups and try each until we find a story with photos
  const shuffledGroups = [...groups].sort(() => Math.random() - 0.5);

  for (const group of shuffledGroups) {
    const stories = await fetchStories(clientKey, group.id, { withPhotosOnly: true });

    if (stories.length > 0) {
      // Pick random story
      const story = stories[Math.floor(Math.random() * stories.length)];
      return { group, story };
    }
  }

  return null;
}

/**
 * Clean story content for AI processing
 * Removes patient identifiable information
 */
export function sanitizeStoryForAI(story: StoryData): string {
  let content = story.content;

  // Remove common patient identifiers (names, ages with context)
  // Keep the story meaningful but privacy-safe
  content = content
    .replace(/\b(named?|called?)\s+[A-Z][a-z]+/gi, '')
    .replace(/\b\d{1,2}[-\s]?year[-\s]?old\b/gi, 'community member')
    .replace(/\bage[d]?\s*\d+/gi, '')
    .trim();

  return content;
}
