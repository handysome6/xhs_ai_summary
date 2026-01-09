/**
 * AIResult entity - AI-generated analysis for a post
 */
export interface AIResult {
  id: string;
  postId: string;
  labels: string[];
  summary: string;
  groupId: string | null;
  contentType: ContentType | null;
  modelVersion: string;
  analyzedAt: number;
}

export type ContentType =
  | 'tutorial'
  | 'review'
  | 'lifestyle'
  | 'travel'
  | 'food'
  | 'fashion'
  | 'other';

/**
 * Input for creating AI result
 */
export interface CreateAIResultInput {
  postId: string;
  labels: string[];
  summary: string;
  groupId?: string;
  contentType?: ContentType;
  modelVersion: string;
}

/**
 * Response from analyze API
 */
export interface AnalysisResult {
  labels: string[];
  summary: string;
  contentType?: ContentType;
  suggestedGroupId?: string;
  suggestedGroupName?: string;
  modelVersion: string;
}
