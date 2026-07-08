/**
 * Content Generation API
 *
 * GET /api/generate - Fetch clients
 * GET /api/generate?clientKey=xxx - Fetch regions for a client
 * POST /api/generate - Generate social media content from a story
 */

import { NextRequest, NextResponse } from 'next/server';
import { getClients } from '@/lib/mission-connect/clients';
import { fetchWorkerGroups, fetchStories, sanitizeStoryForAI } from '@/lib/mission-connect/client';
import { generateSocialContent } from '@/lib/ai/generate-content';
import { enhanceImages } from '@/lib/cloudinary/enhance';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientKey = searchParams.get('clientKey');

  try {
    // If no clientKey, return list of clients
    if (!clientKey) {
      const clients = getClients();
      return NextResponse.json({ clients });
    }

    // If clientKey provided, return groups for that client
    const groups = await fetchWorkerGroups(clientKey);
    return NextResponse.json({ groups });
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      clientKey,
      groupId,
      storyIndex,
      platforms = ['instagram', 'facebook', 'linkedin']
    } = body;

    if (!clientKey || !groupId) {
      return NextResponse.json(
        { error: 'clientKey and groupId are required' },
        { status: 400 }
      );
    }

    // Fetch stories from the group
    const stories = await fetchStories(clientKey, groupId, { withPhotosOnly: true });

    if (stories.length === 0) {
      return NextResponse.json({ error: 'No stories with photos found' }, { status: 404 });
    }

    // Select story (random if not specified)
    const index = storyIndex ?? Math.floor(Math.random() * stories.length);
    const story = stories[index];

    // Get group info
    const groups = await fetchWorkerGroups(clientKey);
    const group = groups.find(g => g.id === groupId);

    // Sanitize story for AI (remove patient info)
    const sanitizedContent = sanitizeStoryForAI(story);

    // Generate content
    const generated = await generateSocialContent({
      story: sanitizedContent,
      workerName: story.workerName,
      location: group?.name || 'Community',
      photoCount: story.photos.length,
      platforms,
    });

    // Get original photo URLs and create enhanced versions
    const originalPhotos = story.photos.map(p => p.url);
    const enhancedPhotos = enhanceImages(originalPhotos);

    return NextResponse.json({
      success: true,
      story: {
        id: story.id,
        date: story.date,
        workerName: story.workerName,
        photoCount: story.photos.length,
        location: group?.name,
      },
      photos: {
        original: originalPhotos,
        enhanced: enhancedPhotos,
      },
      generated,
    });

  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}
