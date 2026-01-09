/**
 * MediaViewer component - displays images and videos from a post
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Media } from '../models/media';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const THUMBNAIL_SIZE = (SCREEN_WIDTH - 48) / 3;

/**
 * Props for MediaViewer
 */
interface MediaViewerProps {
  media: Media[];
}

/**
 * MediaViewer component
 */
export function MediaViewer({ media }: MediaViewerProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handlePress = useCallback((index: number) => {
    setSelectedIndex(index);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedIndex(null);
  }, []);

  const renderThumbnail = useCallback(
    ({ item, index }: { item: Media; index: number }) => {
      const source = item.localPath
        ? { uri: item.localPath }
        : { uri: item.remoteUrl };

      const isVideo = item.type === 'video';
      const isPending = item.downloadStatus === 'pending';
      const isFailed = item.downloadStatus === 'failed';

      return (
        <TouchableOpacity
          onPress={() => handlePress(index)}
          style={styles.thumbnailContainer}
          activeOpacity={0.8}
        >
          <Image source={source} style={styles.thumbnail} />

          {isVideo && (
            <View style={styles.videoOverlay}>
              <Text style={styles.videoIcon}>▶</Text>
            </View>
          )}

          {isPending && (
            <View style={styles.pendingOverlay}>
              <Text style={styles.pendingText}>...</Text>
            </View>
          )}

          {isFailed && (
            <View style={styles.failedOverlay}>
              <Text style={styles.failedText}>!</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [handlePress]
  );

  const keyExtractor = useCallback((item: Media) => item.id, []);

  if (media.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No media available</Text>
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={media}
        renderItem={renderThumbnail}
        keyExtractor={keyExtractor}
        numColumns={3}
        contentContainerStyle={styles.grid}
        scrollEnabled={false}
      />

      <Modal
        visible={selectedIndex !== null}
        animationType="fade"
        transparent
        onRequestClose={handleClose}
      >
        <SafeAreaView style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
          >
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>

          {selectedIndex !== null && media[selectedIndex] && (
            <View style={styles.fullImageContainer}>
              <Image
                source={{
                  uri:
                    media[selectedIndex].localPath ||
                    media[selectedIndex].remoteUrl,
                }}
                style={styles.fullImage}
                resizeMode="contain"
              />

              <View style={styles.paginationContainer}>
                <Text style={styles.paginationText}>
                  {selectedIndex + 1} / {media.length}
                </Text>
              </View>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  grid: {
    padding: 12,
  },
  thumbnailContainer: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#E0E0E0',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoIcon: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  pendingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingText: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  failedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(244,67,54,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  failedText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9E9E9E',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  fullImageContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  fullImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  paginationText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
});
