/**
 * Group entity - AI-generated grouping of related posts
 */
export interface Group {
  id: string;
  name: string;
  description: string | null;
  postCount: number;
  createdAt: number;
}

/**
 * Input for creating a group
 */
export interface CreateGroupInput {
  name: string;
  description?: string;
}

/**
 * Input for updating a group
 */
export interface UpdateGroupInput {
  name?: string;
  description?: string;
  postCount?: number;
}
