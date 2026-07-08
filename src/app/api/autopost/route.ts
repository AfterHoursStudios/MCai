/**
 * Auto-Post API
 *
 * Triggered by cron jobs to automatically post to social media
 *
 * Schedule (PST):
 * - Twitter: 9:00 AM (17:00 UTC)
 * - Facebook: 10:00 AM (18:00 UTC)
 * - LinkedIn: 11:30 AM (19:30 UTC)
 * - Instagram: 12:00 PM (20:00 UTC)
 * - Threads: 1:00 PM (21:00 UTC)
 *
 * Usage: POST /api/autopost?platform=twitter&secret=YOUR_CRON_SECRET
 */

import { NextRequest, NextResponse } from 'next/server';
import { getClients, fetchWorkerGroups, fetchStories, sanitizeStoryForAI } from '@/lib/mission-connect/client';
import { generateSocialContent } from '@/lib/ai/generate-content';
import { enhanceImages } from '@/lib/cloudinary/enhance';
import { postToTwitter } from '@/lib/social/twitter';
import { postToFacebook } from '@/lib/social/facebook';
import { postToLinkedIn } from '@/lib/social/linkedin';
import { postToInstagram } from '@/lib/social/instagram';
import { postToThreads } from '@/lib/social/threads';

// Verify cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get('platform');
  const secret = searchParams.get('secret');

  // Verify secret
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!platform || !['twitter', 'facebook', 'linkedin', 'instagram', 'threads'].includes(platform)) {
    return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
  }

  try {
    // 1. Randomly select a client
    const clients = getClients();
    const client = clients[Math.floor(Math.random() * clients.length)];

    // 2. Get regions for that client and randomly select one
    const groups = await fetchWorkerGroups(client.id);
    if (groups.length === 0) {
      return NextResponse.json({ error: 'No regions found' }, { status: 404 });
    }
    const group = groups[Math.floor(Math.random() * groups.length)];

    // 3. Get stories with photos and randomly select one
    const stories = await fetchStories(client.id, group.id, { withPhotosOnly: true });
    if (stories.length === 0) {
      return NextResponse.json({ error: 'No stories with photos found' }, { status: 404 });
    }
    const story = stories[Math.floor(Math.random() * stories.length)];

    // 4. Generate content for the specific platform
    const sanitizedContent = sanitizeStoryForAI(story);
    const generated = await generateSocialContent({
      story: sanitizedContent,
      workerName: story.workerName,
      location: group.name,
      photoCount: story.photos.length,
      platforms: [platform],
    });

    const post = generated[0];
    if (!post) {
      return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 });
    }

    // 5. Enhance the first photo
    const photoUrls = story.photos.map(p => p.url);
    const enhancedPhotos = enhanceImages(photoUrls);
    const imageUrl = enhancedPhotos[0] || photoUrls[0];

    // 6. Post to the platform
    const caption = `${post.caption}\n\n${post.hashtags.map(t => `#${t.replace('#', '')}`).join(' ')}`;

    let result;
    switch (platform) {
      case 'twitter':
        result = await postToTwitter(caption, imageUrl);
        break;
      case 'facebook':
        result = await postToFacebook(caption, imageUrl);
        break;
      case 'linkedin':
        result = await postToLinkedIn(caption, imageUrl);
        break;
      case 'instagram':
        result = await postToInstagram(caption, imageUrl);
        break;
      case 'threads':
        result = await postToThreads(caption, imageUrl);
        break;
    }

    return NextResponse.json({
      success: true,
      platform,
      client: client.name,
      region: group.name,
      worker: story.workerName,
      postId: result?.id,
    });

  } catch (error) {
    console.error('Auto-post error:', error);
    return NextResponse.json(
      { error: 'Failed to auto-post', details: String(error) },
      { status: 500 }
    );
  }
}

// GET: Check status
export async function GET() {
  return NextResponse.json({
    status: 'Auto-post API ready',
    schedule: {
      twitter: '9:00 AM PST (17:00 UTC)',
      facebook: '10:00 AM PST (18:00 UTC)',
      linkedin: '11:30 AM PST (19:30 UTC)',
      instagram: '12:00 PM PST (20:00 UTC)',
      threads: '1:00 PM PST (21:00 UTC)',
    },
  });
}
