import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Post } from '../../src/models/post';
import { Group } from '../../src/models/group';
import {
  searchPosts,
  filterByLabel,
  filterByContentType,
  filterByGroup,
  SearchResult,
} from '../../src/db/repositories/search-repository';
import { getAllLabels } from '../../src/db/repositories/ai-result-repository';
import { getAllGroups } from '../../src/db/repositories/group-repository';
import { PostCard } from '../../src/components/PostCard';
import { usePostStore } from '../../src/stores/post-store';

/**
 * Content type configuration
 */
const CONTENT_TYPES = [
  { value: 'tutorial', label: 'Tutorial', icon: '📚' },
  { value: 'review', label: 'Review', icon: '⭐' },
  { value: 'lifestyle', label: 'Lifestyle', icon: '✨' },
  { value: 'travel', label: 'Travel', icon: '✈️' },
  { value: 'food', label: 'Food', icon: '🍜' },
  { value: 'fashion', label: 'Fashion', icon: '👗' },
  { value: 'other', label: 'Other', icon: '📝' },
] as const;

/**
 * Filter mode
 */
type FilterMode = 'search' | 'label' | 'type' | 'group';

/**
 * Search & Filter Screen
 */
export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('search');
  const [results, setResults] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [labels, setLabels] = useState<string[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const removePost = usePostStore((state) => state.removePost);

  // Load labels and groups
  useEffect(() => {
    async function loadFilters() {
      const [allLabels, allGroups] = await Promise.all([
        getAllLabels(),
        getAllGroups(),
      ]);
      setLabels(allLabels);
      setGroups(allGroups);
    }
    loadFilters();
  }, []);

  // Perform search
  const performSearch = useCallback(async () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const searchResults = await searchPosts(query);
      setResults(searchResults.map((r) => r.post));
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  // Search on query change (debounced)
  useEffect(() => {
    if (filterMode !== 'search') return;

    const timer = setTimeout(performSearch, 300);
    return () => clearTimeout(timer);
  }, [query, filterMode, performSearch]);

  // Apply filter
  const applyFilter = useCallback(
    async (mode: FilterMode, value: string) => {
      setFilterMode(mode);
      setSelectedFilter(value);
      setIsLoading(true);

      try {
        let posts: Post[] = [];

        switch (mode) {
          case 'label':
            posts = await filterByLabel(value);
            break;
          case 'type':
            posts = await filterByContentType(value);
            break;
          case 'group':
            posts = await filterByGroup(value);
            break;
        }

        setResults(posts);
      } catch (error) {
        console.error('Filter failed:', error);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Clear filter
  const clearFilter = useCallback(() => {
    setFilterMode('search');
    setSelectedFilter(null);
    setQuery('');
    setResults([]);
  }, []);

  // Handle post press
  const handlePostPress = useCallback((post: Post) => {
    router.push(`/post/${post.id}`);
  }, []);

  // Handle post delete
  const handleDelete = useCallback(
    async (id: string) => {
      await removePost(id);
      setResults((prev) => prev.filter((p) => p.id !== id));
    },
    [removePost]
  );

  // Render filter chips
  const renderFilterSection = () => (
    <View style={styles.filterSection}>
      {/* Labels */}
      {labels.length > 0 && (
        <View style={styles.filterGroup}>
          <Text style={styles.filterTitle}>Labels</Text>
          <FlatList
            horizontal
            data={labels}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  selectedFilter === item && styles.filterChipActive,
                ]}
                onPress={() =>
                  selectedFilter === item
                    ? clearFilter()
                    : applyFilter('label', item)
                }
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedFilter === item && styles.filterChipTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Content Types */}
      <View style={styles.filterGroup}>
        <Text style={styles.filterTitle}>Content Type</Text>
        <FlatList
          horizontal
          data={CONTENT_TYPES}
          keyExtractor={(item) => item.value}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedFilter === item.value && styles.filterChipActive,
              ]}
              onPress={() =>
                selectedFilter === item.value
                  ? clearFilter()
                  : applyFilter('type', item.value)
              }
            >
              <Text style={styles.filterChipIcon}>{item.icon}</Text>
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilter === item.value && styles.filterChipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Groups */}
      {groups.length > 0 && (
        <View style={styles.filterGroup}>
          <Text style={styles.filterTitle}>Groups</Text>
          <FlatList
            horizontal
            data={groups}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  selectedFilter === item.id && styles.filterChipActive,
                ]}
                onPress={() =>
                  selectedFilter === item.id
                    ? clearFilter()
                    : applyFilter('group', item.id)
                }
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedFilter === item.id && styles.filterChipTextActive,
                  ]}
                >
                  {item.name} ({item.postCount})
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );

  // Render results
  const renderResults = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF2442" />
        </View>
      );
    }

    if (results.length === 0) {
      if (query.trim() || selectedFilter) {
        return (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No posts found</Text>
          </View>
        );
      }
      return null;
    }

    return (
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onPress={() => handlePostPress(item)}
            onDelete={() => handleDelete(item.id)}
          />
        )}
        contentContainerStyle={styles.resultsList}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search posts..."
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            setFilterMode('search');
            setSelectedFilter(null);
          }}
          returnKeyType="search"
          onSubmitEditing={performSearch}
        />
        {(query || selectedFilter) && (
          <TouchableOpacity onPress={clearFilter} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips */}
      {!query && renderFilterSection()}

      {/* Active Filter Badge */}
      {selectedFilter && (
        <View style={styles.activeFilterBadge}>
          <Text style={styles.activeFilterText}>
            Filtering by: {selectedFilter}
          </Text>
          <TouchableOpacity onPress={clearFilter}>
            <Text style={styles.clearFilterText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Results */}
      {renderResults()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#212121',
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    fontSize: 18,
    color: '#9E9E9E',
  },
  filterSection: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  filterGroup: {
    marginBottom: 12,
  },
  filterTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#757575',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterChipActive: {
    backgroundColor: '#FF2442',
    borderColor: '#FF2442',
  },
  filterChipIcon: {
    marginRight: 4,
  },
  filterChipText: {
    fontSize: 13,
    color: '#424242',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  activeFilterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFEBEE',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  activeFilterText: {
    fontSize: 13,
    color: '#FF2442',
  },
  clearFilterText: {
    fontSize: 13,
    color: '#FF2442',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9E9E9E',
  },
  resultsList: {
    paddingBottom: 20,
  },
});
