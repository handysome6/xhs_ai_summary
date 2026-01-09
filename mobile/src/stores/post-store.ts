/**
 * Post store - Zustand store for posts state management
 */
import { create } from 'zustand';
import { Post, PostDownloadStatus } from '../models/post';
import {
  getAllPosts,
  getPostById,
  deletePost as deletePostFromDb,
  updatePostStatus,
} from '../db/repositories/post-repository';

/**
 * Post store state
 */
interface PostState {
  posts: Post[];
  isLoading: boolean;
  error: string | null;
  selectedPostId: string | null;
}

/**
 * Post store actions
 */
interface PostActions {
  loadPosts: () => Promise<void>;
  refreshPosts: () => Promise<void>;
  addPost: (post: Post) => void;
  updatePost: (id: string, updates: Partial<Post>) => void;
  removePost: (id: string) => Promise<boolean>;
  setSelectedPost: (id: string | null) => void;
  getPost: (id: string) => Post | undefined;
  clearError: () => void;
}

/**
 * Combined post store type
 */
type PostStore = PostState & PostActions;

/**
 * Create post store
 */
export const usePostStore = create<PostStore>((set, get) => ({
  // Initial state
  posts: [],
  isLoading: false,
  error: null,
  selectedPostId: null,

  // Load posts from database
  loadPosts: async () => {
    if (get().isLoading) return;

    set({ isLoading: true, error: null });

    try {
      const posts = await getAllPosts();
      set({ posts, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load posts',
        isLoading: false,
      });
    }
  },

  // Refresh posts (same as load but always fetches)
  refreshPosts: async () => {
    set({ error: null });

    try {
      const posts = await getAllPosts();
      set({ posts });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to refresh posts',
      });
    }
  },

  // Add a new post to state
  addPost: (post: Post) => {
    set((state) => ({
      posts: [post, ...state.posts],
    }));
  },

  // Update post in state
  updatePost: (id: string, updates: Partial<Post>) => {
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === id ? { ...post, ...updates } : post
      ),
    }));
  },

  // Remove post from database and state
  removePost: async (id: string) => {
    try {
      const success = await deletePostFromDb(id);
      if (success) {
        set((state) => ({
          posts: state.posts.filter((post) => post.id !== id),
          selectedPostId:
            state.selectedPostId === id ? null : state.selectedPostId,
        }));
      }
      return success;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete post',
      });
      return false;
    }
  },

  // Set selected post
  setSelectedPost: (id: string | null) => {
    set({ selectedPostId: id });
  },

  // Get post by ID
  getPost: (id: string) => {
    return get().posts.find((post) => post.id === id);
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));

/**
 * Hook for posts list
 */
export function usePosts() {
  const posts = usePostStore((state) => state.posts);
  const isLoading = usePostStore((state) => state.isLoading);
  const error = usePostStore((state) => state.error);
  const loadPosts = usePostStore((state) => state.loadPosts);
  const refreshPosts = usePostStore((state) => state.refreshPosts);
  const removePost = usePostStore((state) => state.removePost);

  return {
    posts,
    isLoading,
    error,
    loadPosts,
    refreshPosts,
    removePost,
  };
}

/**
 * Hook for single post
 */
export function usePost(id: string) {
  const post = usePostStore((state) => state.posts.find((p) => p.id === id));
  const updatePost = usePostStore((state) => state.updatePost);
  const removePost = usePostStore((state) => state.removePost);

  return {
    post,
    updatePost: (updates: Partial<Post>) => updatePost(id, updates),
    removePost: () => removePost(id),
  };
}
