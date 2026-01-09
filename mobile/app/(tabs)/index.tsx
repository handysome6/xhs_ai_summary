import { useEffect, useCallback, useState } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, Text } from 'react-native';
import { router } from 'expo-router';
import { PostList } from '../../src/components/PostList';
import { GroupGrid } from '../../src/components/GroupSelector';
import { usePosts } from '../../src/stores/post-store';
import { getAllGroups } from '../../src/db/repositories/group-repository';
import { getAIResultByPostId } from '../../src/db/repositories/ai-result-repository';
import { Group } from '../../src/models/group';
import { AIResult } from '../../src/models/ai-result';

type ViewMode = 'list' | 'groups';

/**
 * Home/Collection Screen
 * Displays the user's saved XHS posts with list/groups view toggle
 */
export default function HomeScreen() {
  const { posts, isLoading, error, loadPosts, refreshPosts, removePost } =
    usePosts();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [groups, setGroups] = useState<Group[]>([]);
  const [aiResults, setAIResults] = useState<Record<string, AIResult>>({});

  // Load posts and groups on mount
  useEffect(() => {
    loadPosts();
    loadGroups();
  }, [loadPosts]);

  // Load AI results when posts change
  useEffect(() => {
    loadAIResults();
  }, [posts]);

  const loadGroups = useCallback(async () => {
    try {
      const loadedGroups = await getAllGroups();
      setGroups(loadedGroups);
    } catch (error) {
      console.error('Failed to load groups:', error);
    }
  }, []);

  const loadAIResults = useCallback(async () => {
    try {
      const results: Record<string, AIResult> = {};
      for (const post of posts) {
        const aiResult = await getAIResultByPostId(post.id);
        if (aiResult) {
          results[post.id] = aiResult;
        }
      }
      setAIResults(results);
    } catch (error) {
      console.error('Failed to load AI results:', error);
    }
  }, [posts]);

  // Handle refresh for both modes
  const handleRefresh = useCallback(async () => {
    await refreshPosts();
    await loadGroups();
  }, [refreshPosts, loadGroups]);

  // Handle delete with confirmation
  const handleDelete = useCallback(
    (id: string) => {
      Alert.alert(
        'Delete Post',
        'Are you sure you want to delete this post? This will also remove all downloaded media.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              await removePost(id);
              await loadGroups(); // Refresh groups after delete
            },
          },
        ]
      );
    },
    [removePost, loadGroups]
  );

  // Handle group selection
  const handleSelectGroup = useCallback((groupId: string) => {
    // Navigate to search with group filter
    router.push({
      pathname: '/search',
      params: { groupId },
    } as any);
  }, []);

  return (
    <View style={styles.container}>
      {/* View Mode Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            viewMode === 'list' && styles.toggleButtonActive,
          ]}
          onPress={() => setViewMode('list')}
        >
          <Text
            style={[
              styles.toggleText,
              viewMode === 'list' && styles.toggleTextActive,
            ]}
          >
            List
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            viewMode === 'groups' && styles.toggleButtonActive,
          ]}
          onPress={() => setViewMode('groups')}
        >
          <Text
            style={[
              styles.toggleText,
              viewMode === 'groups' && styles.toggleTextActive,
            ]}
          >
            Groups
          </Text>
          {groups.length > 0 && (
            <View style={styles.groupCount}>
              <Text style={styles.groupCountText}>{groups.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Content based on view mode */}
      {viewMode === 'list' ? (
        <PostList
          posts={posts}
          isLoading={isLoading}
          onRefresh={handleRefresh}
          onDelete={handleDelete}
          aiResults={aiResults}
        />
      ) : (
        <GroupGrid
          groups={groups}
          onSelectGroup={handleSelectGroup}
          style={styles.groupGrid}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    gap: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#FF2442',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#757575',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  groupCount: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  groupCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  groupGrid: {
    flex: 1,
  },
});
