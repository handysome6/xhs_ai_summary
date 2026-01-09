import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import Constants from 'expo-constants';
import {
  getStorageUsed,
  clearAllMedia,
  formatFileSize,
} from '../../src/utils/file-manager';
import { getPostCount } from '../../src/db/repositories/post-repository';
import { getAllGroups } from '../../src/db/repositories/group-repository';
import { rebuildSearchIndex } from '../../src/db/repositories/search-repository';

/**
 * Settings Screen
 * App settings, storage usage, and about info
 */
export default function SettingsScreen() {
  const [storageUsed, setStorageUsed] = useState<number | null>(null);
  const [postCount, setPostCount] = useState<number>(0);
  const [groupCount, setGroupCount] = useState<number>(0);
  const [isClearing, setIsClearing] = useState(false);
  const [isRebuilding, setIsRebuilding] = useState(false);

  // Load stats
  const loadStats = useCallback(async () => {
    const [storage, posts, groups] = await Promise.all([
      getStorageUsed(),
      getPostCount(),
      getAllGroups(),
    ]);
    setStorageUsed(storage);
    setPostCount(posts);
    setGroupCount(groups.length);
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Clear media cache
  const handleClearMedia = useCallback(() => {
    Alert.alert(
      'Clear Media Cache',
      'This will delete all downloaded images and videos. The posts will remain but media will need to be re-downloaded.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setIsClearing(true);
            try {
              await clearAllMedia();
              await loadStats();
              Alert.alert('Success', 'Media cache cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear media cache');
            } finally {
              setIsClearing(false);
            }
          },
        },
      ]
    );
  }, [loadStats]);

  // Rebuild search index
  const handleRebuildIndex = useCallback(async () => {
    setIsRebuilding(true);
    try {
      const count = await rebuildSearchIndex();
      Alert.alert('Success', `Search index rebuilt with ${count} posts`);
    } catch (error) {
      Alert.alert('Error', 'Failed to rebuild search index');
    } finally {
      setIsRebuilding(false);
    }
  }, []);

  // Open GitHub
  const handleOpenGitHub = useCallback(() => {
    Linking.openURL('https://github.com');
  }, []);

  return (
    <ScrollView style={styles.container}>
      {/* Statistics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Statistics</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Saved Posts</Text>
          <Text style={styles.value}>{postCount}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Groups</Text>
          <Text style={styles.value}>{groupCount}</Text>
        </View>
      </View>

      {/* Storage */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Storage</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Media Cache</Text>
          <Text style={styles.value}>
            {storageUsed !== null ? formatFileSize(storageUsed) : 'Calculating...'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.button}
          onPress={handleClearMedia}
          disabled={isClearing}
        >
          {isClearing ? (
            <ActivityIndicator size="small" color="#FF2442" />
          ) : (
            <Text style={styles.buttonText}>Clear Media Cache</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Maintenance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Maintenance</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={handleRebuildIndex}
          disabled={isRebuilding}
        >
          {isRebuilding ? (
            <ActivityIndicator size="small" color="#FF2442" />
          ) : (
            <Text style={styles.buttonText}>Rebuild Search Index</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.row}>
          <Text style={styles.label}>App Version</Text>
          <Text style={styles.value}>
            {Constants.expoConfig?.version || '1.0.0'}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Build</Text>
          <Text style={styles.value}>
            {Constants.expoConfig?.extra?.buildNumber || '1'}
          </Text>
        </View>
      </View>

      {/* Links */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Links</Text>
        <TouchableOpacity style={styles.linkRow} onPress={handleOpenGitHub}>
          <Text style={styles.linkText}>View on GitHub</Text>
          <Text style={styles.linkArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Legal */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Legal</Text>
        <Text style={styles.legalText}>
          This app is for personal use only. All content from Xiaohongshu
          remains the property of its original creators. Please respect
          copyright and use responsibly.
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Made with AI-powered content organization
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#EEEEEE',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#757575',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 16,
    color: '#212121',
  },
  value: {
    fontSize: 16,
    color: '#757575',
  },
  button: {
    backgroundColor: '#FFEBEE',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FF2442',
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  linkText: {
    fontSize: 16,
    color: '#2196F3',
  },
  linkArrow: {
    fontSize: 20,
    color: '#BDBDBD',
  },
  legalText: {
    fontSize: 13,
    color: '#757575',
    lineHeight: 18,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#BDBDBD',
  },
});
