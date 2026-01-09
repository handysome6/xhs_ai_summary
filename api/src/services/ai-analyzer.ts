/**
 * AI Analyzer service
 * Uses Claude API for content analysis, labeling, and summarization
 */
import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config';

/**
 * Analysis input
 */
export interface AnalysisInput {
  title: string | null;
  text: string;
  mediaCount: number;
}

/**
 * Analysis result
 */
export interface AnalysisResult {
  labels: string[];
  summary: string;
  contentType: string | null;
  suggestedGroupId: string | null;
  suggestedGroupName: string | null;
  modelVersion: string;
}

/**
 * Content types
 */
const CONTENT_TYPES = [
  'tutorial',
  'review',
  'lifestyle',
  'travel',
  'food',
  'fashion',
  'other',
] as const;

/**
 * System prompt for analysis
 */
const SYSTEM_PROMPT = `You are an AI assistant that analyzes social media content from Xiaohongshu (Little Red Book).
Your task is to analyze the content and provide:
1. Labels: Generate 3-5 relevant tags/labels for the content in Chinese or English as appropriate
2. Summary: Write a concise 1-2 sentence summary of the content
3. Content Type: Categorize as one of: tutorial, review, lifestyle, travel, food, fashion, or other
4. Group Suggestion: Suggest a group name this content could belong to (for organizing similar content)

Respond in JSON format only.`;

/**
 * Create Anthropic client
 */
function getClient(): Anthropic {
  if (!config.anthropicApiKey) {
    throw new Error('Anthropic API key not configured');
  }
  return new Anthropic({ apiKey: config.anthropicApiKey });
}

/**
 * Analyze content using Claude
 */
export async function analyzeContent(
  input: AnalysisInput
): Promise<AnalysisResult> {
  const client = getClient();

  const userMessage = `Analyze the following Xiaohongshu post:

Title: ${input.title || 'No title'}
Content: ${input.text}
Media count: ${input.mediaCount} items

Please provide your analysis in the following JSON format:
{
  "labels": ["label1", "label2", "label3"],
  "summary": "A brief summary of the content",
  "contentType": "one of: tutorial, review, lifestyle, travel, food, fashion, other",
  "suggestedGroupName": "A suggested group name for similar content"
}`;

  try {
    const response = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    // Extract text content
    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in response');
    }

    // Parse JSON from response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate and normalize
    const labels = Array.isArray(parsed.labels)
      ? parsed.labels.slice(0, 10)
      : [];

    const contentType = CONTENT_TYPES.includes(parsed.contentType)
      ? parsed.contentType
      : 'other';

    return {
      labels,
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
      contentType,
      suggestedGroupId: null, // Will be resolved by caller
      suggestedGroupName:
        typeof parsed.suggestedGroupName === 'string'
          ? parsed.suggestedGroupName
          : null,
      modelVersion: response.model,
    };
  } catch (error) {
    console.error('AI analysis failed:', error);

    // Return fallback result
    return {
      labels: [],
      summary: 'Analysis unavailable',
      contentType: 'other',
      suggestedGroupId: null,
      suggestedGroupName: null,
      modelVersion: 'fallback',
    };
  }
}

/**
 * Batch analyze multiple posts
 */
export async function analyzeContentBatch(
  inputs: AnalysisInput[]
): Promise<AnalysisResult[]> {
  // Process sequentially to avoid rate limits
  const results: AnalysisResult[] = [];

  for (const input of inputs) {
    try {
      const result = await analyzeContent(input);
      results.push(result);
    } catch (error) {
      console.error('Batch analysis item failed:', error);
      results.push({
        labels: [],
        summary: 'Analysis failed',
        contentType: 'other',
        suggestedGroupId: null,
        suggestedGroupName: null,
        modelVersion: 'error',
      });
    }

    // Add small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return results;
}
