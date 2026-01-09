import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Post } from '../../src/models/post';
import { Content } from '../../src/models/content';
import { Media } from '../../src/models/media';
import { AIResult } from '../../src/models/ai-result';
import { getPostById } from '../../src/db/repositories/post-repository';
import { getContentByPostId } from '../../src/db/repositories/content-repository';
import { getMediaByPostId } from '../../src/db/repositories/media-repository';
import { getAIResultByPostId } from '../../src/db/repositories/ai-result-repository';
import { DownloadProgress } from '../../src/components/DownloadProgress';
import { MediaViewer } from '../../src/components/MediaViewer';
import { AISummary } from '../../src/components/AISummary';
import {
  retryDownload,
  addProgressListener,
  queueDownload,
} from '../../src/services/download-manager';
import { usePostStore } from '../../src/stores/post-store';

/**
 * Post Detail Screen
 * Shows full content, media, and download status
 */
export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [content, setContent] = useState<Content | null>(null);
  const [media, setMedia] = useState<Media[]>([]);
  const [aiResult, setAIResult] = useState<AIResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const removePost = usePostStore((state) => state.removePost);

  // Load post data
  const loadData = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      const [postData, contentData, mediaData, aiData] = await Promise.all([
        getPostById(id),
        getContentByPostId(id),
        getMediaByPostId(id),
        getAIResultByPostId(id),
      ]);

      setPost(postData);
      setContent(contentData);
      setMedia(mediaData);
      setAIResult(aiData);
    } catch (error) {
      console.error('Failed to load post:', error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Listen for download progress
  useEffect(() => {
    if (!id) return;

    const unsubscribe = addProgressListener((postId, progress, status) => {
      if (postId === id) {
        setDownloadProgress(progress);
        // Refresh data when status changes
        if (status === 'completed' || status === 'partial' || status === 'failed') {
          loadData();
        }
      }
    });

    return unsubscribe;
  }, [id, loadData]);

  // Start download if pending
  useEffect(() => {
    if (post?.downloadStatus === 'pending') {
      queueDownload(post.id, 1); // High priority for currently viewed post
    }
  }, [post?.id, post?.downloadStatus]);

  // Handle retry
  const handleRetry = useCallback(async () => {
    if (!post) return;
    await retryDownload(post.id);
  }, [post]);

  // Handle delete
  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This will also remove all downloaded media.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (post) {
              await removePost(post.id);
              router.back();
            }
          },
        },
      ]
    );
  }, [post, removePost]);

  // Handle open in browser
  const handleOpenUrl = useCallback(() => {
    if (post?.url) {
      Linking.openURL(post.url);
    }
  }, [post?.url]);

  // Format date
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF2442" />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Post not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Download Status */}
      <View style={styles.section}>
        <DownloadProgress
          status={post.downloadStatus}
          progress={downloadProgress}
          onRetry={handleRetry}
        />
      </View>

      {/* Title */}
      <View style={styles.section}>
        <Text style={styles.title}>{post.title || 'Untitled Post'}</Text>
        <Text style={styles.timestamp}>Saved {formatDate(post.createdAt)}</Text>
      </View>

      {/* Content */}
      {content && (
        <View style={styles.section}>
          {content.authorName && (
            <Text style={styles.author}>By {content.authorName}</Text>
          )}

          <Text style={styles.text}>{content.text}</Text>

          {(content.likeCount !== null || content.viewCount !== null) && (
            <View style={styles.stats}>
              {content.likeCount !== null && (
                <Text style={styles.stat}>{content.likeCount} likes</Text>
              )}
              {content.viewCount !== null && (
                <Text style={styles.stat}>{content.viewCount} views</Text>
              )}
            </View>
          )}
        </View>
      )}

      {/* Media */}
      {media.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Media ({media.length})
          </Text>
          <MediaViewer media={media} />
        </View>
      )}

      {/* AI Analysis */}
      {aiResult && (
        <View style={styles.section}>
          <AISummary aiResult={aiResult} />
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleOpenUrl}
        >
          <Text style={styles.actionButtonText}>Open Original</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDelete}
        >
          <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
            Delete Post
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    fontSize: 16,
    color: '#9E9E9E',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  author: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FF2442',
    marginBottom: 8,
  },
  text: {
    fontSize: 15,
    color: '#424242',
    lineHeight: 22,
  },
  stats: {
    flexDirection: 'row',
    marginTop: 12,
  },
  stat: {
    fontSize: 12,
    color: '#9E9E9E',
    marginRight: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#616161',
    marginBottom: 8,
  },
  actions: {
    padding: 16,
    gap: 12,
  },
  actionButton: {
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#424242',
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
  },
  deleteButtonText: {
    color: '#F44336',
  },
  bottomPadding: {
    height: 40,
  },
});
