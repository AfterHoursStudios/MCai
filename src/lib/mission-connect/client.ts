/**
 * Mission Connect Client
 *
 * Fetches stories and photos from the Mission Connect system
 * URL pattern: https://mc.ultimatemission.org/client/{clientKey}
 */

import { JSDOM } from 'jsdom';

const BASE_URL = 'https://mc.ultimatemission.org';

// Available clients (from Mission Connect dashboard)
export const MC_CLIENTS = [
  { id: '9f4f613a6bdcc883', name: 'Ultimate Mission' },
  { id: 'jd8fjHkdjsdkj4k3', name: 'Gospel Outreach' },
  { id: 'sg27sox9e7djs92', name: 'Jesus 4 Asia' },
  { id: 'ncm8397ddkc62hdiz', name: 'In His Service' },
  { id: 'jdkcue348fk28fkej', name: 'Pr. Bharti N. India' },
] as const;

export interface MCClient {
  id: string;
  name: string;
}

export interface WorkerGroup {
  id: string;
  name: string;
  url: string;
}

/**
 * Get all available clients
 */
export function getClients(): MCClient[] {
  return [...MC_CLIENTS];
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
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  const groups: WorkerGroup[] = [];
  const links = doc.querySelectorAll('a[href*="/client/group/"]');

  links.forEach((link) => {
    const href = link.getAttribute('href');
    const name = link.textContent?.trim();

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
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  const stories: StoryData[] = [];

  // Parse report cards - each contains date, worker, stories, and photos
  const reportCards = doc.querySelectorAll('.reportCard');

  reportCards.forEach((card, cardIndex) => {
    // Get date and worker from card header
    const dateEl = card.querySelector('.cardTitle');
    const workerEl = card.querySelector('.cardMeta');
    const dateText = dateEl?.textContent?.trim() || '';
    const workerName = workerEl?.textContent?.trim() || 'Unknown Worker';

    // Get all photos for this report card
    const photoEls = card.querySelectorAll('.photoCell img');
    const photos: StoryPhoto[] = [];
    photoEls.forEach((img) => {
      const src = img.getAttribute('src');
      if (src && src.includes('report-photo')) {
        photos.push({
          url: src,
          rating: 3,
        });
      }
    });

    // Get all story blocks within this card
    const storyBlocks = card.querySelectorAll('.storyBlock');

    storyBlocks.forEach((block, blockIndex) => {
      const storyText = block.querySelector('.storyText');
      const content = storyText?.textContent?.trim() || '';
      const starsEl = block.querySelector('.stars');
      const rating = starsEl ? (starsEl.querySelectorAll('.on').length || 1) : 1;
      const storyId = block.getAttribute('data-story-id') || `${cardIndex}-${blockIndex}`;

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
 * Parse star rating from text
 */
function parseRating(text: string): number {
  const stars = (text.match(/★/g) || []).length;
  return Math.min(3, Math.max(1, stars || 1));
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
