import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { hasAdminSession } from '@/lib/auth-sessions';
import type { PortfolioSourceType } from '@/lib/portfolio-content';

type PortfolioToneStyle =
  | 'Cinematic'
  | 'Luxury'
  | 'Minimal'
  | 'Dark'
  | 'Emotional'
  | 'Corporate'
  | 'Futuristic'
  | 'Documentary'
  | 'Islamic'
  | 'Humanitarian';

type PortfolioAiField =
  | 'all'
  | 'title'
  | 'description'
  | 'tags'
  | 'seoTitle'
  | 'seoDescription'
  | 'challenge'
  | 'solution'
  | 'toolsUsed'
  | 'result'
  | 'typeLabel'
  | 'formatLabel'
  | 'category'
  | 'aspectRatio';

type PortfolioAiRequest = {
  categories?: string[];
  currentContent?: {
    category?: string;
    description?: string;
    formatLabel?: string;
    tags?: string[];
    title?: string;
    typeLabel?: string;
  };
  imageUrl?: string;
  managerType?: PortfolioSourceType;
  targetField?: PortfolioAiField;
  tone?: PortfolioToneStyle;
  youtubeUrl?: string;
};

const toneStyles: PortfolioToneStyle[] = [
  'Cinematic',
  'Luxury',
  'Minimal',
  'Dark',
  'Emotional',
  'Corporate',
  'Futuristic',
  'Documentary',
  'Islamic',
  'Humanitarian',
];

const fieldLabels: Record<PortfolioAiField, string> = {
  all: 'all fields',
  title: 'title only',
  description: 'description only',
  tags: 'tags only',
  seoTitle: 'SEO title only',
  seoDescription: 'SEO description only',
  challenge: 'challenge only',
  solution: 'solution only',
  toolsUsed: 'tools used only',
  result: 'result only',
  typeLabel: 'visual type label only',
  formatLabel: 'format / deliverable label only',
  category: 'suggested category only',
  aspectRatio: 'aspect ratio only',
};

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
}

function asTone(value: unknown): PortfolioToneStyle {
  return toneStyles.includes(value as PortfolioToneStyle)
    ? (value as PortfolioToneStyle)
    : 'Cinematic';
}

function asTargetField(value: unknown): PortfolioAiField {
  return Object.keys(fieldLabels).includes(String(value))
    ? (value as PortfolioAiField)
    : 'all';
}

function cleanStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter(item => typeof item === 'string').map(item => item.trim()).filter(Boolean)
    : [];
}

function getSchema() {
  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      title: { type: 'string' },
      description: { type: 'string' },
      tags: {
        type: 'array',
        items: { type: 'string' },
        minItems: 5,
        maxItems: 9,
      },
      seoTitle: { type: 'string' },
      seoDescription: { type: 'string' },
      challenge: { type: 'string' },
      solution: { type: 'string' },
      toolsUsed: { type: 'string' },
      result: { type: 'string' },
      typeLabel: { type: 'string' },
      formatLabel: { type: 'string' },
      suggestedCategory: { type: 'string' },
      aspectRatio: { type: 'string' },
      visualRead: {
        type: 'object',
        additionalProperties: false,
        properties: {
          subject: { type: 'string' },
          lighting: { type: 'string' },
          mood: { type: 'string' },
          composition: { type: 'string' },
          colorGrade: { type: 'string' },
          genre: { type: 'string' },
          atmosphere: { type: 'string' },
        },
        required: [
          'subject',
          'lighting',
          'mood',
          'composition',
          'colorGrade',
          'genre',
          'atmosphere',
        ],
      },
    },
    required: [
      'title',
      'description',
      'tags',
      'seoTitle',
      'seoDescription',
      'challenge',
      'solution',
      'toolsUsed',
      'result',
      'typeLabel',
      'formatLabel',
      'suggestedCategory',
      'aspectRatio',
      'visualRead',
    ],
  };
}

function getPrompt({
  categories,
  currentContent,
  managerType,
  targetField,
  tone,
  youtubeUrl,
}: Required<Pick<PortfolioAiRequest, 'categories' | 'currentContent' | 'managerType' | 'targetField' | 'tone'>> & {
  youtubeUrl: string;
}) {
  const categoryInstruction = categories.length
    ? `Choose suggestedCategory from this list when one fits: ${categories.join(', ')}.`
    : 'Create a natural suggestedCategory if none is provided.';

  return `
You are writing for Md Minhajul Hoque's premium creative portfolio.

Analyze the uploaded ${managerType === 'video' ? 'video thumbnail / visual frame' : 'graphic artwork'} like a senior creative director. Read subject, lighting, color grade, mood, realism, genre, composition, atmosphere, story tension, typography/poster language, and emotional intent.

Tone style: ${tone}
Requested generation scope: ${fieldLabels[targetField]}.
${categoryInstruction}
${youtubeUrl ? `Video URL context: ${youtubeUrl}` : ''}

Current draft context:
${JSON.stringify(currentContent, null, 2)}

Write like a high-end Behance case study, but keep every field practical for an admin portfolio item. Make it human and specific. Avoid generic AI phrases like "showcases", "captivating", "elevates", "stunning visuals", "seamless blend", "delves into", and "testament to". Do not over-explain. Do not use markdown.

Field rules:
- title: 4-10 words, premium and concrete, may use an em dash style title if it feels natural.
- description: 1-2 polished sentences with visual specificity.
- tags: lowercase practical tags, no hashtags, no duplicates.
- seoTitle: under 60 characters when possible.
- seoDescription: under 155 characters when possible.
- challenge/solution/result: one human sentence each, no corporate filler.
- toolsUsed: comma-separated tools or techniques. If unsure, infer tastefully from the visual and include Photoshop / color grading / compositing only when plausible.
- typeLabel: short label like Cinematic Poster, Social Creative, Thumbnail Design, Brand Visual, Motion Thumbnail.
- formatLabel: short deliverable like Poster Artwork, 16:9 Thumbnail, Social Campaign Visual, Square Creative.
- aspectRatio: infer as 1:1, 4:5, 16:9, 9:16, 3:4, A4, or custom if obvious.
- visualRead: concise image understanding notes for admin confidence.
`;
}

function parseOutputText(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return '';
  }

  const direct = (payload as { output_text?: unknown }).output_text;
  if (typeof direct === 'string') {
    return direct;
  }

  const output = (payload as { output?: unknown }).output;
  if (!Array.isArray(output)) {
    return '';
  }

  for (const item of output) {
    if (!item || typeof item !== 'object') {
      continue;
    }

    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) {
      continue;
    }

    for (const contentItem of content) {
      if (
        contentItem &&
        typeof contentItem === 'object' &&
        typeof (contentItem as { text?: unknown }).text === 'string'
      ) {
        return (contentItem as { text: string }).text;
      }
    }
  }

  return '';
}

export async function POST(request: NextRequest) {
  if (!hasAdminSession(request)) {
    return unauthorized();
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY is missing. Add it to the server environment to enable AI content generation.' },
      { status: 500 }
    );
  }

  try {
    const body = (await request.json()) as PortfolioAiRequest;
    const imageUrl = body.imageUrl?.trim();

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required.' }, { status: 400 });
    }

    const managerType: PortfolioSourceType =
      body.managerType === 'video' ? 'video' : 'graphic';
    const tone = asTone(body.tone);
    const targetField = asTargetField(body.targetField);
    const categories = cleanStringArray(body.categories);
    const currentContent = body.currentContent || {};
    const model = process.env.OPENAI_PORTFOLIO_MODEL || 'gpt-5.4-mini';

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: getPrompt({
                  categories,
                  currentContent,
                  managerType,
                  targetField,
                  tone,
                  youtubeUrl: body.youtubeUrl || '',
                }),
              },
              {
                type: 'input_image',
                image_url: imageUrl,
                detail: 'high',
              },
            ],
          },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'portfolio_ai_content',
            strict: true,
            schema: getSchema(),
          },
        },
      }),
    });

    const result = (await response.json()) as unknown;

    if (!response.ok) {
      const message =
        result &&
        typeof result === 'object' &&
        'error' in result &&
        typeof (result as { error?: { message?: unknown } }).error?.message === 'string'
          ? (result as { error: { message: string } }).error.message
          : 'AI content generation failed.';

      return NextResponse.json({ error: message }, { status: response.status });
    }

    const outputText = parseOutputText(result);
    const content = JSON.parse(outputText) as Record<string, unknown>;

    return NextResponse.json({ content, ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'AI content generation failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
