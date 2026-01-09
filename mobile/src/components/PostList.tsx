/**
 * PostList component - displays the collection of saved posts
 */
import React, { useCallback, memo, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { Post } from '../models/post';
import { AIResult } from '../models/ai-result';
import { PostCard } from './PostCard';

/**
 * Props for PostList
 */
interface PostListProps {
  posts: Post[];
  isLoading: boolean;
  onRefresh: () => void;
  onDelete: (id: string) => void;
  /** AI results keyed by post ID */
  aiResults?: Record<string, AIResult>;
  /** Search query for highlighting */
  searchQuery?: string;
  /** Whether to show skeleton loading */
  showSkeleton?: boolean;
}

/**
 * Empty state component
 */
const EmptyState = memo(function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📱</Text>
      <Text style={styles.emptyTitle}>No saved posts yet</Text>
      <Text style={styles.emptyDescription}>
        Share a Xiaohongshu post link to start building your collection
      </Text>
    </View>
  );
});

/**
 * Skeleton loading item
 */
const SkeletonItem = memo(function SkeletonItem() {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.skeletonContainer}>
      <View style={styles.skeletonContent}>
        <View style={styles.skeletonHeader}>
          <Animated.View style={[styles.skeletonTitle, { opacity }]} />
          <Animated.View style={[styles.skeletonBadge, { opacity }]} />
        </View>
        <Animated.View style={[styles.skeletonLabels, { opacity }]} />
        <Animated.View style={[styles.skeletonUrl, { opacity }]} />
        <Animated.View style={[styles.skeletonTimestamp, { opacity }]} />
      </View>
    </View>
  );
});

/**
 * Loading skeleton list
 */
const SkeletonList = memo(function SkeletonList() {
  return (
    <View>
      {[1, 2, 3, 4, 5].map((i) => (
        <SkeletonItem key={i} />
      ))}
    </View>
  );
});

/**
 * PostList component
 */
function PostListComponent({
  posts,
  isLoading,
  onRefresh,
  onDelete,
  aiResults = {},
  searchQuery,
  showSkeleton = true,
}: PostListProps) {
  const handlePostPress = useCallback((post: Post) => {
    router.push(`/post/${post.id}`);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Post }) => {
      const aiResult = aiResults[item.id];
      return (
        <PostCard
          post={item}
          onPress={() => handlePostPress(item)}
          onDelete={() => onDelete(item.id)}
          labels={aiResult?.labels}
          searchQuery={searchQuery}
          hasAIAnalysis={!!aiResult}
        />
      );
    },
    [handlePostPress, onDelete, aiResults, searchQuery]
  );

  const keyExtractor = useCallback((item: Post) => item.id, []);

  // Optimization: getItemLayout for fixed-height items
  const getItemLayout = useCallback(
    (_data: Post[] | null | undefined, index: number) => ({
      length: 88, // Approximate height of PostCard
      offset: 88 * index,
      index,
    }),
    []
  );

  // Show skeleton on initial load
  if (isLoading && posts.length === 0 && showSkeleton) {
    return <SkeletonList />;
  }

  return (
    <FlatList
      data={posts}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      contentContainerStyle={posts.length === 0 ? styles.emptyList : undefined}
      ListEmptyComponent={EmptyState}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={onRefresh}
          tintColor="#FF2442"
          colors={['#FF2442']}
        />
      }
      showsVerticalScrollIndicator={false}
      // Performance optimizations
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={10}
      initialNumToRender={15}
      updateCellsBatchingPeriod={50}
    />
  );
}

/**
 * Memoized PostList for performance
 */
export const PostList = memo(PostListComponent);

const styles = StyleSheet.create({
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Skeleton styles
  skeletonContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  skeletonContent: {
    flex: 1,
  },
  skeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  skeletonTitle: {
    height: 16,
    width: '60%',
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
  skeletonBadge: {
    height: 16,
    width: 50,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
  skeletonLabels: {
    height: 14,
    width: '40%',
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonUrl: {
    height: 12,
    width: '80%',
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 6,
  },
  skeletonTimestamp: {
    height: 11,
    width: '30%',
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
});
