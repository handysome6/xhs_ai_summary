/**
 * PostCard component - displays a single post in the collection list
 */
import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import {
  Swipeable,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { Post, PostDownloadStatus } from '../models/post';
import { AIInlineBadge } from './AIBadge';

/**
 * Status badge colors
 */
const STATUS_COLORS: Record<PostDownloadStatus, string> = {
  pending: '#FFA500',
  downloading: '#2196F3',
  completed: '#4CAF50',
  partial: '#FF9800',
  failed: '#F44336',
};

/**
 * Status labels
 */
const STATUS_LABELS: Record<PostDownloadStatus, string> = {
  pending: 'Pending',
  downloading: 'Downloading',
  completed: 'Saved',
  partial: 'Partial',
  failed: 'Failed',
};

/**
 * Props for PostCard
 */
interface PostCardProps {
  post: Post;
  onPress: () => void;
  onDelete: () => void;
  /** AI-generated labels for the post */
  labels?: string[];
  /** Search query for highlighting */
  searchQuery?: string;
  /** Whether the post has AI analysis */
  hasAIAnalysis?: boolean;
}

/**
 * Format timestamp to readable date
 */
function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

/**
 * Truncate URL for display
 */
function truncateUrl(url: string, maxLength: number = 50): string {
  if (url.length <= maxLength) return url;
  return url.substring(0, maxLength - 3) + '...';
}

/**
 * Highlight matching text in search results
 */
function HighlightedText({
  text,
  query,
  style,
}: {
  text: string;
  query?: string;
  style?: object;
}) {
  if (!query || !query.trim()) {
    return <Text style={style}>{text}</Text>;
  }

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return (
    <Text style={style}>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <Text key={index} style={styles.highlight}>
            {part}
          </Text>
        ) : (
          part
        )
      )}
    </Text>
  );
}

/**
 * PostCard component
 */
function PostCardComponent({
  post,
  onPress,
  onDelete,
  labels,
  searchQuery,
  hasAIAnalysis,
}: PostCardProps) {
  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity onPress={onDelete} style={styles.deleteAction}>
        <Animated.Text
          style={[styles.deleteText, { transform: [{ scale }] }]}
        >
          Delete
        </Animated.Text>
      </TouchableOpacity>
    );
  };

  // Show max 3 labels in preview
  const previewLabels = labels?.slice(0, 3) || [];

  return (
    <GestureHandlerRootView>
      <Swipeable
        renderRightActions={renderRightActions}
        rightThreshold={40}
      >
        <TouchableOpacity
          onPress={onPress}
          style={styles.container}
          activeOpacity={0.7}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.titleRow}>
                {hasAIAnalysis && <AIInlineBadge style={styles.aiBadge} />}
                <HighlightedText
                  text={post.title || 'Untitled Post'}
                  query={searchQuery}
                  style={styles.title}
                />
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: STATUS_COLORS[post.downloadStatus] },
                ]}
              >
                <Text style={styles.statusText}>
                  {STATUS_LABELS[post.downloadStatus]}
                </Text>
              </View>
            </View>

            {previewLabels.length > 0 && (
              <View style={styles.labelsRow}>
                {previewLabels.map((label, index) => (
                  <View key={index} style={styles.labelChip}>
                    <HighlightedText
                      text={label}
                      query={searchQuery}
                      style={styles.labelText}
                    />
                  </View>
                ))}
                {labels && labels.length > 3 && (
                  <Text style={styles.moreLabels}>+{labels.length - 3}</Text>
                )}
              </View>
            )}

            <Text style={styles.url} numberOfLines={1}>
              {truncateUrl(post.url)}
            </Text>

            <Text style={styles.timestamp}>{formatDate(post.createdAt)}</Text>
          </View>

          <View style={styles.chevron}>
            <Text style={styles.chevronText}>›</Text>
          </View>
        </TouchableOpacity>
      </Swipeable>
    </GestureHandlerRootView>
  );
}

/**
 * Memoized PostCard for better performance
 */
export const PostCard = memo(PostCardComponent);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  aiBadge: {
    marginRight: 4,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  labelsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  labelChip: {
    backgroundColor: '#E3F2FD',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  labelText: {
    fontSize: 10,
    color: '#1976D2',
    fontWeight: '500',
  },
  moreLabels: {
    fontSize: 10,
    color: '#757575',
    fontStyle: 'italic',
  },
  url: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 11,
    color: '#9E9E9E',
  },
  chevron: {
    justifyContent: 'center',
    paddingLeft: 8,
  },
  chevronText: {
    fontSize: 24,
    color: '#BDBDBD',
  },
  deleteAction: {
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },
  deleteText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  highlight: {
    backgroundColor: '#FFF59D',
    color: '#212121',
  },
});
