# AI Workflow Architecture
# AI Social Media Story Studio

**Version:** 1.0.0
**Last Updated:** 2026-07-01

---

## Overview

The AI workflow is a multi-stage pipeline that processes user-uploaded images and stories to generate platform-optimized social media content. The pipeline is designed for reliability, observability, and cost efficiency.

---

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AI GENERATION PIPELINE                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  Step 1 │───▶│  Step 2 │───▶│  Step 3 │───▶│  Step 4 │───▶│  Step 5 │───▶│  Step 6 │
│  Image  │    │  Story  │    │ Compare │    │ Enhance │    │Generate │    │  Score  │
│ Analysis│    │ Analysis│    │  Match  │    │ Images  │    │ Content │    │ Content │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
     │              │              │              │              │              │
     ▼              ▼              ▼              ▼              ▼              ▼
  GPT-4V        GPT-4          GPT-4      Sharp + DALL-E    GPT-4          GPT-4
  Vision                                                  (per platform)
```

---

## Step 1: Image Analysis

### Purpose
Analyze each uploaded image to extract semantic content, quality metrics, and brand elements.

### OpenAI Model
- **Model**: `gpt-4-vision-preview`
- **Max Tokens**: 2000 per image
- **Temperature**: 0.3 (deterministic analysis)

### Input
- Image URL (from R2 storage)
- Optional: Brand kit context

### Output Schema

```typescript
interface ImageAnalysis {
  // Subject detection
  subjects: {
    people: {
      count: number;
      descriptions: string[];
      ages: ('child' | 'teen' | 'adult' | 'senior')[];
      expressions: string[];
      activities: string[];
    };
    animals: string[];
    objects: string[];
    text: string[]; // OCR results
    logos: string[];
    landmarks: string[];
  };

  // Scene analysis
  scene: {
    setting: 'indoor' | 'outdoor';
    locationType: string;
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' | 'unknown';
    weather: string | null;
    season: string | null;
  };

  // Visual attributes
  visual: {
    dominantColors: string[]; // Hex codes
    colorPalette: string[];
    lighting: 'natural' | 'artificial' | 'mixed' | 'dramatic';
    mood: string;
    style: string;
  };

  // Quality assessment
  quality: {
    overall: number; // 0-1
    sharpness: number;
    exposure: number;
    noise: number;
    composition: number;
    issues: string[];
  };

  // Brand relevance
  brand: {
    colorsMatch: boolean;
    logoVisible: boolean;
    onBrand: boolean;
    suggestions: string[];
  };

  // Recommendations
  recommendations: {
    isPrimary: boolean;
    ranking: number;
    bestPlatforms: string[];
    suggestedCrops: {
      platform: string;
      aspectRatio: string;
      crop: { x: number; y: number; width: number; height: number };
    }[];
    enhancementNeeded: boolean;
    enhancementSuggestions: string[];
  };

  // Narrative
  narrative: {
    summary: string;
    emotionalTone: string;
    storyContribution: string;
  };
}
```

### Prompt Template

```typescript
const IMAGE_ANALYSIS_PROMPT = `
You are an expert image analyst for social media content creation. Analyze this image thoroughly.

${brandContext ? `BRAND CONTEXT:
Business: ${brandContext.businessName}
Brand Colors: ${brandContext.colors.join(', ')}
Target Audience: ${brandContext.targetAudience}
Voice: ${brandContext.voice}
` : ''}

Analyze the image and provide a detailed JSON response with the following structure:

1. SUBJECTS: Identify all people, animals, objects, text (OCR), logos, and landmarks
2. SCENE: Determine indoor/outdoor, location type, time of day, weather, season
3. VISUAL: Extract dominant colors (hex), lighting type, mood, and style
4. QUALITY: Rate overall quality, sharpness, exposure, noise, composition (0-1 scale)
5. BRAND: Assess brand alignment if context provided
6. RECOMMENDATIONS: Suggest if this should be primary image, rank quality, best platforms, crop suggestions
7. NARRATIVE: Summarize what story this image tells

Be specific and detailed. Quality scores should be honest - flag real issues.

Respond with ONLY valid JSON matching the ImageAnalysis schema.
`;
```

---

## Step 2: Story Analysis

### Purpose
Analyze the user-written story to extract meaning, emotion, and engagement opportunities.

### OpenAI Model
- **Model**: `gpt-4-turbo`
- **Max Tokens**: 1500
- **Temperature**: 0.3

### Input
- User's story text
- Optional: Brand kit context
- Optional: Template context

### Output Schema

```typescript
interface StoryAnalysis {
  // Core message
  core: {
    mainMessage: string;
    subMessages: string[];
    theme: string;
    purpose: 'inform' | 'entertain' | 'inspire' | 'promote' | 'educate' | 'celebrate';
  };

  // Emotional analysis
  emotion: {
    primaryTone: string;
    secondaryTones: string[];
    sentiment: number; // -1 to 1
    emotionalArc: string;
  };

  // Audience
  audience: {
    primary: string;
    secondary: string[];
    demographicHints: string[];
  };

  // Narrative elements
  narrative: {
    structure: 'chronological' | 'thematic' | 'problem-solution' | 'story' | 'list';
    keyEvents: string[];
    characters: string[];
    conflict: string | null;
    resolution: string | null;
    callToAction: string | null;
  };

  // Content quality
  quality: {
    clarity: number; // 0-1
    completeness: number;
    engagement: number;
    authenticity: number;
  };

  // Improvement suggestions
  improvements: {
    missingDetails: string[];
    engagementOpportunities: string[];
    clarificationNeeded: string[];
    strengthsToEmphasize: string[];
  };

  // Enhanced version
  enhanced: {
    version: string;
    changes: string[];
  };

  // Metrics
  metrics: {
    wordCount: number;
    sentenceCount: number;
    readingLevel: string;
    estimatedReadTime: number; // seconds
  };
}
```

### Prompt Template

```typescript
const STORY_ANALYSIS_PROMPT = `
You are an expert content strategist specializing in viral social media content. Analyze this story.

STORY:
"""
${story}
"""

${brandContext ? `BRAND CONTEXT:
Business: ${brandContext.businessName}
Voice: ${brandContext.voice}
Mission: ${brandContext.mission}
Target Audience: ${brandContext.targetAudience}
` : ''}

${templateContext ? `TEMPLATE CONTEXT:
Industry: ${templateContext.industry}
Tone: ${templateContext.tone}
` : ''}

Analyze thoroughly and provide:

1. CORE MESSAGE: What is the main point? Sub-messages? Theme? Purpose?
2. EMOTION: Primary emotional tone, sentiment (-1 to 1), emotional arc
3. AUDIENCE: Who should this reach? Demographics?
4. NARRATIVE: Structure, key events, characters, conflict, resolution
5. QUALITY: Rate clarity, completeness, engagement, authenticity (0-1)
6. IMPROVEMENTS: What's missing? What could boost engagement?
7. ENHANCED VERSION: Rewrite to be more engaging while preserving authenticity
8. METRICS: Word count, sentence count, reading level, read time

The enhanced version should:
- Preserve all factual content
- Maintain the authentic voice
- Improve clarity and flow
- Add emotional hooks where appropriate
- NOT fabricate or exaggerate

Respond with ONLY valid JSON matching the StoryAnalysis schema.
`;
```

---

## Step 3: Consistency Check

### Purpose
Verify that the story and images tell a coherent narrative. Flag inconsistencies.

### OpenAI Model
- **Model**: `gpt-4-turbo`
- **Max Tokens**: 1000
- **Temperature**: 0.2

### Input
- Image analysis results (from Step 1)
- Story analysis results (from Step 2)

### Output Schema

```typescript
interface ConsistencyCheck {
  // Overall assessment
  consistent: boolean;
  confidenceScore: number; // 0-1

  // Matches found
  matches: {
    category: string;
    storyElement: string;
    imageEvidence: string;
    imageIndex: number;
    strength: 'strong' | 'moderate' | 'weak';
  }[];

  // Inconsistencies found
  inconsistencies: {
    severity: 'critical' | 'warning' | 'info';
    description: string;
    storyMention: string;
    imageContradiction: string;
    suggestion: string;
  }[];

  // Missing elements
  missing: {
    mentionedInStory: string[];
    notSeenInImages: string[];
    recommendation: string;
  };

  // User notification
  notification: {
    shouldNotify: boolean;
    message: string;
    suggestions: string[];
  };
}
```

### Prompt Template

```typescript
const CONSISTENCY_CHECK_PROMPT = `
You are a content consistency reviewer. Compare the story against the image analyses.

STORY ANALYSIS:
${JSON.stringify(storyAnalysis, null, 2)}

IMAGE ANALYSES:
${JSON.stringify(imageAnalyses, null, 2)}

Your task:
1. Find MATCHES between story elements and image evidence
2. Identify INCONSISTENCIES (things mentioned that contradict images)
3. Note MISSING elements (story mentions things not visible in images)
4. Determine if user should be NOTIFIED of issues

IMPORTANT:
- Minor inconsistencies (weather, time) are warnings, not critical
- Critical inconsistencies are factual contradictions (wrong people, wrong event)
- Be helpful, not pedantic
- Suggest solutions, not just problems

Respond with ONLY valid JSON matching the ConsistencyCheck schema.
`;
```

---

## Step 4: Image Enhancement

### Purpose
Enhance images for optimal social media presentation without altering authenticity.

### Processing Pipeline

```
Original Image
      │
      ▼
┌─────────────────┐
│  Sharp Analysis │  ← Get metadata, quality metrics
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Auto-Enhance   │  ← Exposure, contrast, sharpness
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Color Correct  │  ← White balance, vibrance
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Noise Reduce   │  ← Smart denoising
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Face Enhance   │  ← Subtle face enhancement (optional)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Platform Crops │  ← Generate crops for each platform
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Optimize       │  ← WebP conversion, compression
└────────┬────────┘
         │
         ▼
Enhanced Images + Crops
```

### Sharp Enhancement Settings

```typescript
interface EnhancementSettings {
  // Auto levels
  normalize: boolean;

  // Exposure
  brightness: number; // -1 to 1

  // Contrast
  contrast: number; // 0.5 to 2

  // Sharpness
  sharpen: {
    sigma: number;
    flat: number;
    jagged: number;
  };

  // Color
  saturation: number; // 0 to 2

  // Noise
  median: number;

  // Output
  format: 'webp' | 'jpeg';
  quality: number; // 1-100
}

const DEFAULT_ENHANCEMENTS: EnhancementSettings = {
  normalize: true,
  brightness: 0,
  contrast: 1.1,
  sharpen: { sigma: 1, flat: 1, jagged: 2 },
  saturation: 1.1,
  median: 0,
  format: 'webp',
  quality: 85
};
```

### Platform Crop Specifications

```typescript
const PLATFORM_CROPS = {
  instagram: {
    square: { width: 1080, height: 1080, ratio: '1:1' },
    portrait: { width: 1080, height: 1350, ratio: '4:5' },
    landscape: { width: 1080, height: 566, ratio: '1.91:1' },
    story: { width: 1080, height: 1920, ratio: '9:16' }
  },
  facebook: {
    feed: { width: 1200, height: 630, ratio: '1.91:1' },
    square: { width: 1080, height: 1080, ratio: '1:1' },
    story: { width: 1080, height: 1920, ratio: '9:16' }
  },
  linkedin: {
    feed: { width: 1200, height: 627, ratio: '1.91:1' },
    square: { width: 1080, height: 1080, ratio: '1:1' }
  },
  twitter: {
    single: { width: 1200, height: 675, ratio: '16:9' },
    twoImages: { width: 700, height: 800, ratio: '7:8' }
  },
  pinterest: {
    pin: { width: 1000, height: 1500, ratio: '2:3' }
  },
  tiktok: {
    video: { width: 1080, height: 1920, ratio: '9:16' }
  }
};
```

---

## Step 5: Content Generation

### Purpose
Generate platform-specific social media content using the analyzed story and images.

### OpenAI Model
- **Model**: `gpt-4-turbo`
- **Max Tokens**: 4000 (batch all platforms)
- **Temperature**: 0.7 (creative but consistent)

### Copywriting Frameworks

```typescript
const FRAMEWORKS = {
  AIDA: {
    name: 'Attention-Interest-Desire-Action',
    structure: ['Hook that grabs attention', 'Build interest with benefits', 'Create desire with emotion', 'Clear call to action'],
    bestFor: ['promotions', 'product launches', 'sales']
  },
  PAS: {
    name: 'Problem-Agitation-Solution',
    structure: ['Identify the problem', 'Agitate the pain point', 'Present the solution'],
    bestFor: ['services', 'problem-solving content', 'testimonials']
  },
  StoryBrand: {
    name: 'StoryBrand Framework',
    structure: ['Character has a problem', 'Meets a guide', 'Who gives them a plan', 'Calls them to action', 'Helps them avoid failure', 'And ends in success'],
    bestFor: ['brand stories', 'case studies', 'transformations']
  },
  BAB: {
    name: 'Before-After-Bridge',
    structure: ['Describe the before state', 'Paint the after picture', 'Bridge with your solution'],
    bestFor: ['before/after content', 'results', 'transformations']
  },
  HerosJourney: {
    name: "Hero's Journey",
    structure: ['Ordinary world', 'Call to adventure', 'Challenges faced', 'Transformation', 'Return with the prize'],
    bestFor: ['personal stories', 'milestones', 'achievements']
  },
  CuriosityGap: {
    name: 'Curiosity Gap',
    structure: ['Hint at something interesting', 'Create an open loop', 'Promise resolution'],
    bestFor: ['engagement bait', 'teasers', 'series content']
  },
  EmotionalStorytelling: {
    name: 'Emotional Storytelling',
    structure: ['Emotional hook', 'Relatable situation', 'Emotional peak', 'Resolution with meaning'],
    bestFor: ['personal content', 'community building', 'emotional connections']
  }
};
```

### Platform-Specific Rules

```typescript
const PLATFORM_RULES = {
  instagram: {
    maxLength: 2200,
    optimalLength: 150,
    hashtagLimit: 30,
    hashtagStrategy: 'mix of popular, niche, branded',
    emojiUsage: 'encouraged',
    style: 'visual-first, conversational, lifestyle',
    cta: 'engagement-focused (comment, save, share)',
    hooks: ['Question', 'Bold statement', 'Story opener', 'Statistic']
  },
  facebook: {
    maxLength: 63206,
    optimalLength: 80,
    hashtagLimit: 3,
    hashtagStrategy: 'minimal, only branded or trending',
    emojiUsage: 'moderate',
    style: 'community-focused, shareable, discussion-starter',
    cta: 'share, react, comment',
    hooks: ['Nostalgia', 'Family', 'Community', 'Milestone']
  },
  linkedin: {
    maxLength: 3000,
    optimalLength: 150,
    hashtagLimit: 5,
    hashtagStrategy: 'professional, industry-specific',
    emojiUsage: 'minimal',
    style: 'professional, value-driven, thought leadership',
    cta: 'connect, follow, engage professionally',
    hooks: ['Lesson learned', 'Contrarian take', 'Career insight', 'Industry trend']
  },
  tiktok: {
    maxLength: 2200,
    optimalLength: 150,
    hashtagLimit: 5,
    hashtagStrategy: 'trending + niche',
    emojiUsage: 'heavy',
    style: 'casual, trendy, hook-first, fast-paced',
    cta: 'follow for more, comment, duet',
    hooks: ['POV:', 'Wait for it...', 'Story time:', 'Things that...']
  },
  x: {
    maxLength: 280,
    optimalLength: 100,
    hashtagLimit: 2,
    hashtagStrategy: 'trending only',
    emojiUsage: 'minimal',
    style: 'concise, witty, conversational, timely',
    cta: 'retweet, quote tweet, reply',
    hooks: ['Hot take:', 'Unpopular opinion:', 'Thread:', 'PSA:']
  },
  threads: {
    maxLength: 500,
    optimalLength: 200,
    hashtagLimit: 0,
    hashtagStrategy: 'none',
    emojiUsage: 'moderate',
    style: 'conversational, authentic, text-first',
    cta: 'reply, repost',
    hooks: ['Observation:', 'Question for you:', 'Something I noticed:']
  },
  pinterest: {
    maxLength: 500,
    optimalLength: 200,
    hashtagLimit: 20,
    hashtagStrategy: 'descriptive, searchable',
    emojiUsage: 'minimal',
    style: 'inspirational, actionable, keyword-rich',
    cta: 'save, click through',
    hooks: ['How to...', 'X ways to...', 'Ideas for...', 'Guide to...']
  },
  google_business: {
    maxLength: 1500,
    optimalLength: 300,
    hashtagLimit: 0,
    hashtagStrategy: 'none',
    emojiUsage: 'minimal',
    style: 'professional, local, informative',
    cta: 'visit, call, book',
    hooks: ['Update:', 'Now available:', 'Meet our team:', 'Customer story:']
  },
  youtube_community: {
    maxLength: 5000,
    optimalLength: 500,
    hashtagLimit: 3,
    hashtagStrategy: 'video-related',
    emojiUsage: 'moderate',
    style: 'community-building, behind-the-scenes, polls',
    cta: 'comment, subscribe, watch',
    hooks: ['BTS:', 'Question:', 'Coming soon:', 'Poll:']
  }
};
```

### Generation Prompt Template

```typescript
const CONTENT_GENERATION_PROMPT = `
You are an expert social media content creator who specializes in viral content. Create platform-optimized posts.

CONTEXT:
Story: ${enhancedStory}
Story Analysis: ${JSON.stringify(storyAnalysis)}
Image Analysis: ${JSON.stringify(imageAnalysis)}
${brandKit ? `Brand Kit: ${JSON.stringify(brandKit)}` : ''}
${template ? `Template: ${JSON.stringify(template)}` : ''}

PLATFORMS TO GENERATE:
${platforms.join(', ')}

CONTENT TYPES:
${contentTypes.join(', ')}

For EACH platform, generate:
1. HOOK - Attention-grabbing first line (platform-specific style)
2. CAPTION - Full post content (within character limits)
3. CTA - Clear call to action
4. HASHTAGS - Platform-appropriate hashtags

Generate 4 versions for each platform:
- With emojis + Long version
- With emojis + Short version
- Without emojis + Long version
- Without emojis + Short version

COPYWRITING FRAMEWORKS TO USE:
- Primary: ${primaryFramework}
- Secondary: ${secondaryFrameworks.join(', ')}

RULES:
1. NEVER fabricate facts not in the original story
2. NEVER make false claims or exaggerations
3. Preserve the authentic voice
4. Optimize for each platform's culture
5. Make content shareable and engaging
6. Include relevant platform-specific elements

Respond with ONLY valid JSON matching the GeneratedContent schema.
`;
```

### Generated Content Schema

```typescript
interface GeneratedContent {
  platforms: {
    [platform: string]: {
      posts: {
        hasEmojis: boolean;
        isShort: boolean;
        hook: string;
        caption: string;
        cta: string;
        hashtags: string[];
        characterCount: number;
        framework: string;
      }[];

      // Extended content (if requested)
      carousel?: {
        slides: { text: string; position: number }[];
        coverText: string;
      };

      article?: {
        title: string;
        introduction: string;
        body: string;
        conclusion: string;
        seoKeywords: string[];
      };

      storySlides?: {
        slides: { text: string; position: number }[];
      };
    };
  };

  // Cross-platform content
  extended?: {
    blogArticle?: string;
    newsletter?: string;
    pressRelease?: string;
    emailVersion?: string;
    podcastTalkingPoints?: string[];
    videoScript?: string;
    voiceoverScript?: string;
  };
}
```

---

## Step 6: Content Scoring

### Purpose
Score generated content on multiple dimensions and provide improvement suggestions.

### OpenAI Model
- **Model**: `gpt-4-turbo`
- **Max Tokens**: 2000
- **Temperature**: 0.2 (consistent scoring)

### Scoring Dimensions

```typescript
interface ContentScores {
  virality: {
    score: number; // 0-100
    factors: {
      shareability: number;
      emotionalTrigger: number;
      uniqueness: number;
      timing: number;
      trendAlignment: number;
    };
    explanation: string;
  };

  emotion: {
    score: number;
    factors: {
      emotionalResonance: number;
      relatability: number;
      authenticity: number;
      storyConnection: number;
    };
    explanation: string;
  };

  engagement: {
    score: number;
    factors: {
      hookStrength: number;
      ctaClarity: number;
      conversationStarter: number;
      saveWorthy: number;
    };
    explanation: string;
  };

  readability: {
    score: number;
    factors: {
      clarity: number;
      conciseness: number;
      scanability: number;
      gradeLevel: number;
    };
    explanation: string;
  };

  storytelling: {
    score: number;
    factors: {
      narrativeArc: number;
      characterDevelopment: number;
      conflict: number;
      resolution: number;
    };
    explanation: string;
  };

  seo: {
    score: number;
    factors: {
      keywordUsage: number;
      hashtagRelevance: number;
      discoverability: number;
      platformOptimization: number;
    };
    explanation: string;
  };

  overall: {
    score: number;
    grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
    summary: string;
  };

  suggestions: {
    priority: 'high' | 'medium' | 'low';
    category: string;
    current: string;
    suggested: string;
    impact: string;
    potentialImprovement: number;
  }[];
}
```

### Scoring Prompt Template

```typescript
const SCORING_PROMPT = `
You are an expert social media analyst who predicts content performance. Score this content.

PLATFORM: ${platform}
CONTENT:
Hook: ${hook}
Caption: ${caption}
CTA: ${cta}
Hashtags: ${hashtags.join(', ')}

ORIGINAL STORY CONTEXT:
${storyContext}

Score on these dimensions (0-100):

1. VIRALITY: Will people share this?
   - Shareability, emotional trigger, uniqueness, timing, trend alignment

2. EMOTION: Does it make people feel something?
   - Emotional resonance, relatability, authenticity, story connection

3. ENGAGEMENT: Will people interact?
   - Hook strength, CTA clarity, conversation potential, save-worthiness

4. READABILITY: Is it easy to consume?
   - Clarity, conciseness, scanability, reading level

5. STORYTELLING: Is the narrative compelling?
   - Arc, characters, conflict, resolution

6. SEO: Is it discoverable?
   - Keywords, hashtags, platform optimization

THEN provide 3-5 specific suggestions to improve the score.
Each suggestion should include:
- Current state
- Suggested change
- Expected impact

Be honest and specific. A score of 70+ is good, 85+ is excellent, 95+ is exceptional.

Respond with ONLY valid JSON matching the ContentScores schema.
`;
```

---

## Pipeline Orchestration

### Job Queue Architecture

```typescript
// Generation job flow
interface GenerationJob {
  id: string;
  projectId: string;
  userId: string;
  organizationId: string;

  // Configuration
  platforms: Platform[];
  contentTypes: ContentType[];
  options: GenerationOptions;

  // State
  status: 'pending' | 'processing' | 'completed' | 'failed';
  currentStep: number;
  totalSteps: number;
  progress: number;

  // Results
  results?: {
    imageAnalyses: ImageAnalysis[];
    storyAnalysis: StoryAnalysis;
    consistencyCheck: ConsistencyCheck;
    enhancedImages: EnhancedImage[];
    generatedContent: GeneratedContent;
    scores: ContentScores[];
  };

  // Metrics
  tokensUsed: number;
  costCents: number;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}
```

### Worker Implementation

```typescript
// src/lib/queue/workers/generation.ts
import { Worker, Job } from 'bullmq';
import { db } from '@/lib/db';
import { analyzeImages } from '@/lib/ai/pipelines/analysis';
import { analyzeStory } from '@/lib/ai/pipelines/analysis';
import { checkConsistency } from '@/lib/ai/pipelines/analysis';
import { enhanceImages } from '@/lib/ai/pipelines/enhancement';
import { generateContent } from '@/lib/ai/pipelines/generation';
import { scoreContent } from '@/lib/ai/pipelines/scoring';

const worker = new Worker('generation', async (job: Job<GenerationJob>) => {
  const { projectId, platforms, contentTypes, options } = job.data;

  try {
    // Step 1: Analyze Images (10-20%)
    await updateProgress(job, 'analyzing_images', 10);
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: { images: true, story: true, brandKit: true }
    });

    const imageAnalyses = await analyzeImages(
      project.images,
      project.brandKit
    );

    await db.image.updateMany({
      where: { projectId },
      data: imageAnalyses.map((analysis, i) => ({
        id: project.images[i].id,
        analysis
      }))
    });

    // Step 2: Analyze Story (20-35%)
    await updateProgress(job, 'analyzing_story', 25);
    const storyAnalysis = await analyzeStory(
      project.story.originalContent,
      project.brandKit
    );

    await db.story.update({
      where: { projectId },
      data: {
        analysis: storyAnalysis,
        enhancedContent: storyAnalysis.enhanced.version
      }
    });

    // Step 3: Consistency Check (35-40%)
    await updateProgress(job, 'checking_consistency', 38);
    const consistencyCheck = await checkConsistency(
      imageAnalyses,
      storyAnalysis
    );

    // If critical inconsistencies, notify but continue
    if (consistencyCheck.inconsistencies.some(i => i.severity === 'critical')) {
      await notifyUser(projectId, consistencyCheck.notification);
    }

    // Step 4: Enhance Images (40-60%)
    await updateProgress(job, 'enhancing_images', 45);
    const enhancedImages = options.enhanceImages
      ? await enhanceImages(project.images, imageAnalyses)
      : [];

    if (enhancedImages.length > 0) {
      await db.image.updateMany({
        where: { projectId },
        data: enhancedImages.map(img => ({
          id: img.originalId,
          enhancedUrl: img.url,
          enhancements: img.settings
        }))
      });
    }

    // Step 5: Generate Content (60-85%)
    await updateProgress(job, 'generating_content', 65);
    const generatedContent = await generateContent({
      story: storyAnalysis.enhanced.version,
      storyAnalysis,
      imageAnalyses,
      platforms,
      contentTypes,
      brandKit: project.brandKit
    });

    // Step 6: Score Content (85-100%)
    await updateProgress(job, 'scoring_content', 90);
    const scores = await scoreContent(generatedContent, storyAnalysis);

    // Save generated posts
    const generation = await db.generation.update({
      where: { id: job.data.id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        tokensUsed: calculateTokens(job),
        costCents: calculateCost(job)
      }
    });

    // Create generated posts
    for (const [platform, content] of Object.entries(generatedContent.platforms)) {
      for (const post of content.posts) {
        const created = await db.generatedPost.create({
          data: {
            generationId: generation.id,
            platform,
            contentType: 'post',
            hook: post.hook,
            caption: post.caption,
            cta: post.cta,
            hashtags: post.hashtags,
            hasEmojis: post.hasEmojis,
            isShortVersion: post.isShort,
            characterCount: post.characterCount
          }
        });

        const score = scores.find(s =>
          s.platform === platform &&
          s.hasEmojis === post.hasEmojis &&
          s.isShort === post.isShort
        );

        if (score) {
          await db.postScore.create({
            data: {
              postId: created.id,
              ...score
            }
          });
        }
      }
    }

    await updateProgress(job, 'completed', 100);

    // Send completion notification
    await sendCompletionEmail(projectId);

    return { success: true, generationId: generation.id };

  } catch (error) {
    await db.generation.update({
      where: { id: job.data.id },
      data: {
        status: 'failed',
        errorMessage: error.message
      }
    });

    throw error;
  }
}, {
  connection: redis,
  concurrency: 5
});
```

---

## Cost Optimization

### Token Estimation

```typescript
function estimateTokens(content: string): number {
  // Rough estimation: 1 token ≈ 4 characters
  return Math.ceil(content.length / 4);
}

function estimateImageTokens(width: number, height: number): number {
  // GPT-4V: ~85 tokens per 512x512 tile
  const tiles = Math.ceil(width / 512) * Math.ceil(height / 512);
  return tiles * 85;
}
```

### Cost per Generation

| Step | Model | Est. Tokens | Cost |
|------|-------|-------------|------|
| Image Analysis (5 images) | GPT-4V | 15,000 | $0.15 |
| Story Analysis | GPT-4 | 3,000 | $0.09 |
| Consistency Check | GPT-4 | 2,000 | $0.06 |
| Content Generation | GPT-4 | 8,000 | $0.24 |
| Scoring | GPT-4 | 4,000 | $0.12 |
| **Total** | | **32,000** | **~$0.66** |

### Caching Strategy

```typescript
// Cache identical image analyses
const cacheKey = `image:${imageHash}:${brandKitHash}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

// Cache generated content for same inputs
const contentKey = `content:${storyHash}:${imagesHash}:${platformsHash}`;
```

---

## Error Handling

### Retry Strategy

```typescript
const RETRY_CONFIG = {
  maxAttempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1000,
    maxDelay: 30000
  },
  retryableErrors: [
    'rate_limit_exceeded',
    'timeout',
    'service_unavailable'
  ]
};
```

### Fallback Behavior

1. **OpenAI Rate Limit**: Queue delay + exponential backoff
2. **OpenAI Timeout**: Retry with smaller batch
3. **OpenAI Error**: Log, notify, partial completion
4. **Storage Error**: Retry upload, fallback to original
5. **Database Error**: Transaction rollback, retry
