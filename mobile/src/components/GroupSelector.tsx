/**
 * GroupSelector component - displays groups for filtering/browsing
 */
import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ViewStyle,
} from 'react-native';
import { Group } from '../models/group';

/**
 * Props for GroupSelector
 */
interface GroupSelectorProps {
  /** List of groups to display */
  groups: Group[];
  /** Currently selected group ID (null for all posts) */
  selectedGroupId: string | null;
  /** Callback when a group is selected */
  onSelectGroup: (groupId: string | null) => void;
  /** Container style */
  style?: ViewStyle;
  /** Display mode */
  mode?: 'horizontal' | 'vertical';
  /** Show "All Posts" option */
  showAllOption?: boolean;
}

/**
 * Single group item
 */
interface GroupItemProps {
  group: Group | null;
  isSelected: boolean;
  onPress: () => void;
  mode: 'horizontal' | 'vertical';
}

function GroupItem({ group, isSelected, onPress, mode }: GroupItemProps) {
  const isAll = group === null;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        mode === 'horizontal' ? styles.horizontalItem : styles.verticalItem,
        isSelected && styles.selectedItem,
      ]}
      activeOpacity={0.7}
    >
      <View style={styles.itemContent}>
        <Text
          style={[
            styles.groupName,
            isSelected && styles.selectedText,
          ]}
          numberOfLines={1}
        >
          {isAll ? 'All Posts' : group.name}
        </Text>
        {!isAll && group.description && mode === 'vertical' && (
          <Text
            style={[
              styles.groupDescription,
              isSelected && styles.selectedDescription,
            ]}
            numberOfLines={1}
          >
            {group.description}
          </Text>
        )}
      </View>
      <View style={[styles.countBadge, isSelected && styles.selectedCountBadge]}>
        <Text style={[styles.countText, isSelected && styles.selectedCountText]}>
          {isAll ? 'All' : group.postCount}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

/**
 * GroupSelector component
 */
function GroupSelectorComponent({
  groups,
  selectedGroupId,
  onSelectGroup,
  style,
  mode = 'horizontal',
  showAllOption = true,
}: GroupSelectorProps) {
  // Create data array with optional "All" item
  const data: (Group | null)[] = showAllOption ? [null, ...groups] : groups;

  const renderItem = ({ item }: { item: Group | null }) => (
    <GroupItem
      group={item}
      isSelected={item === null ? selectedGroupId === null : item.id === selectedGroupId}
      onPress={() => onSelectGroup(item?.id ?? null)}
      mode={mode}
    />
  );

  if (groups.length === 0 && !showAllOption) {
    return (
      <View style={[styles.emptyContainer, style]}>
        <Text style={styles.emptyText}>No groups yet</Text>
        <Text style={styles.emptySubtext}>
          AI will create groups as you save more posts
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item?.id ?? 'all'}
        horizontal={mode === 'horizontal'}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          mode === 'horizontal' ? styles.horizontalList : styles.verticalList
        }
      />
    </View>
  );
}

/**
 * Memoized GroupSelector
 */
export const GroupSelector = memo(GroupSelectorComponent);

/**
 * Group grid for home screen display
 */
interface GroupGridProps {
  groups: Group[];
  onSelectGroup: (groupId: string) => void;
  style?: ViewStyle;
}

function GroupGridComponent({ groups, onSelectGroup, style }: GroupGridProps) {
  if (groups.length === 0) {
    return (
      <View style={[styles.gridEmptyContainer, style]}>
        <Text style={styles.gridEmptyTitle}>No Groups Yet</Text>
        <Text style={styles.gridEmptyText}>
          Save some posts and AI will automatically organize them into groups
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.gridContainer, style]}>
      {groups.map((group) => (
        <TouchableOpacity
          key={group.id}
          style={styles.gridItem}
          onPress={() => onSelectGroup(group.id)}
          activeOpacity={0.7}
        >
          <Text style={styles.gridItemName} numberOfLines={2}>
            {group.name}
          </Text>
          {group.description && (
            <Text style={styles.gridItemDescription} numberOfLines={2}>
              {group.description}
            </Text>
          )}
          <View style={styles.gridItemFooter}>
            <Text style={styles.gridItemCount}>
              {group.postCount} {group.postCount === 1 ? 'post' : 'posts'}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export const GroupGrid = memo(GroupGridComponent);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
  },
  horizontalList: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  verticalList: {
    paddingVertical: 8,
  },
  horizontalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  verticalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectedItem: {
    backgroundColor: '#FF2442',
  },
  itemContent: {
    flex: 1,
  },
  groupName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212121',
  },
  selectedText: {
    color: '#FFFFFF',
  },
  groupDescription: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  selectedDescription: {
    color: '#FFCDD2',
  },
  countBadge: {
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  selectedCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  countText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#616161',
  },
  selectedCountText: {
    color: '#FFFFFF',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#9E9E9E',
    textAlign: 'center',
  },
  // Grid styles
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 8,
  },
  gridItem: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 100,
    justifyContent: 'space-between',
  },
  gridItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  gridItemDescription: {
    fontSize: 12,
    color: '#757575',
    flex: 1,
  },
  gridItemFooter: {
    marginTop: 8,
  },
  gridItemCount: {
    fontSize: 11,
    color: '#9E9E9E',
  },
  gridEmptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  gridEmptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#757575',
    marginBottom: 8,
  },
  gridEmptyText: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
    lineHeight: 20,
  },
});
