/**
 * AI Analysis service - communicates with backend analyze API
 */
import { xhsApi, AnalyzeRequest, AnalyzeResponse } from './api-client';
import {
  createAIResult,
  getAIResultByPostId,
} from '../db/repositories/ai-result-repository';
import {
  getOrCreateGroup,
  incrementGroupPostCount,
} from '../db/repositories/group-repository';
import { getContentByPostId } from '../db/repositories/content-repository';
import { getMediaCountByPostId } from '../db/repositories/media-repository';
import { getPostById } from '../db/repositories/post-repository';
import { AIResult } from '../models/ai-result';

/**
 * Analysis result
 */
export interface AnalysisServiceResult {
  success: boolean;
  aiResult: AIResult | null;
  errorMessage: string | null;
}

/**
 * Analyze a post with AI
 */
export async function analyzePost(postId: string): Promise<AnalysisServiceResult> {
  try {
    // Check if already analyzed
    const existing = await getAIResultByPostId(postId);
    if (existing) {
      return {
        success: true,
        aiResult: existing,
        errorMessage: null,
      };
    }

    // Get post content
    const post = await getPostById(postId);
    const content = await getContentByPostId(postId);
    const mediaCount = await getMediaCountByPostId(postId);

    if (!content) {
      return {
        success: false,
        aiResult: null,
        errorMessage: 'No content available for analysis',
      };
    }

    // Call analyze API
    const response = await xhsApi.analyze({
      title: post?.title ?? null,
      text: content.text,
      mediaCount,
    });

    if (!response.success || !response.data) {
      return {
        success: false,
        aiResult: null,
        errorMessage: 'Analysis API returned no data',
      };
    }

    // Handle group suggestion
    let groupId: string | null = null;
    if (response.data.suggestedGroupName) {
      const group = await getOrCreateGroup(response.data.suggestedGroupName);
      groupId = group.id;
      await incrementGroupPostCount(group.id);
    }

    // Create AI result record
    const aiResult = await createAIResult({
      postId,
      labels: response.data.labels,
      summary: response.data.summary,
      groupId,
      contentType: response.data.contentType as AIResult['contentType'],
      modelVersion: response.data.modelVersion,
    });

    return {
      success: true,
      aiResult,
      errorMessage: null,
    };
  } catch (error) {
    console.error('AI analysis failed:', error);
    return {
      success: false,
      aiResult: null,
      errorMessage: error instanceof Error ? error.message : 'Analysis failed',
    };
  }
}

/**
 * Re-analyze a post (overwrites existing)
 */
export async function reanalyzePost(postId: string): Promise<AnalysisServiceResult> {
  // Note: In production, you might want to delete the existing result first
  // For now, this will return the existing result
  return analyzePost(postId);
}
