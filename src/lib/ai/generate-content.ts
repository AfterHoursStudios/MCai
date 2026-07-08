/**
 * AI Content Generation
 *
 * Generates social media posts from Mission Connect stories
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface GeneratedContent {
  platform: string;
  hook: string;
  caption: string;
  hashtags: string[];
  hasEmojis: boolean;
  isShort: boolean;
  score: number;
}

export interface GenerationInput {
  story: string;
  workerName: string;
  location: string;
  photoCount: number;
  platforms: string[];
}

const PLATFORM_CONFIG: Record<string, { maxLength: number; style: string; hashtagCount: number }> = {
  instagram: { maxLength: 2200, style: 'visual, inspiring, heartfelt, no emojis', hashtagCount: 15 },
  facebook: { maxLength: 500, style: 'community-focused, shareable, warm, no emojis', hashtagCount: 3 },
  linkedin: { maxLength: 700, style: 'professional, impact-focused, mission-driven, no emojis', hashtagCount: 5 },
  x: { maxLength: 280, style: 'concise, punchy, engaging, no emojis', hashtagCount: 2 },
  threads: { maxLength: 500, style: 'conversational, authentic, no emojis', hashtagCount: 0 },
  youtube: { maxLength: 100, style: 'short, punchy, vertical video description for YouTube Shorts, no emojis', hashtagCount: 5 },
};

/**
 * Generate social media content for all requested platforms
 */
export async function generateSocialContent(input: GenerationInput): Promise<GeneratedContent[]> {
  const results: GeneratedContent[] = [];

  const systemPrompt = `You are an expert social media content creator for a Christian health mission organization called Ultimate Mission.

Your job is to transform health worker stories into inspiring, engaging social media posts that:
- Highlight the impact of community health work
- Show God's love through compassionate care
- Inspire donations and support
- NEVER include patient names, specific ages, or identifiable medical details
- Focus on transformation, hope, and community impact
- DO NOT use any emojis - keep the text clean and professional

The organization sends health workers to underserved communities worldwide to provide health education, counseling, and support.`;

  for (const platform of input.platforms) {
    const config = PLATFORM_CONFIG[platform] || PLATFORM_CONFIG.instagram;

    const userPrompt = `Create a ${platform} post from this health mission story:

LOCATION: ${input.location}
HEALTH WORKER: ${input.workerName}
STORY: ${input.story}
PHOTOS: ${input.photoCount} photo(s) will be attached

Requirements:
- Max ${config.maxLength} characters
- Style: ${config.style}
- Include ${config.hashtagCount} relevant hashtags
- Start with an attention-grabbing hook
- End with a call to action (support, pray, share)
- Protect patient privacy - no names or identifiable details

Return JSON:
{
  "hook": "attention-grabbing first line",
  "caption": "full post content including hook",
  "hashtags": ["tag1", "tag2"],
  "score": 85
}`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        results.push({
          platform,
          hook: parsed.hook || '',
          caption: parsed.caption || '',
          hashtags: parsed.hashtags || [],
          hasEmojis: /[\u{1F600}-\u{1F64F}]/u.test(parsed.caption || ''),
          isShort: (parsed.caption?.length || 0) < 200,
          score: parsed.score || 75,
        });
      }
    } catch (error) {
      console.error(`Error generating ${platform} content:`, error);
      // Add placeholder on error
      results.push({
        platform,
        hook: '',
        caption: `Error generating content for ${platform}`,
        hashtags: [],
        hasEmojis: false,
        isShort: true,
        score: 0,
      });
    }
  }

  return results;
}

/**
 * Generate content for a single platform with variations
 */
export async function generateWithVariations(
  input: GenerationInput,
  platform: string
): Promise<GeneratedContent[]> {
  const results: GeneratedContent[] = [];

  // Generate: with emojis + long, with emojis + short, no emojis + long
  const variations = [
    { emojis: true, short: false },
    { emojis: true, short: true },
    { emojis: false, short: false },
  ];

  for (const variation of variations) {
    const modified = {
      ...input,
      platforms: [platform],
    };

    const content = await generateSocialContent(modified);
    if (content[0]) {
      results.push({
        ...content[0],
        hasEmojis: variation.emojis,
        isShort: variation.short,
      });
    }
  }

  return results;
}
