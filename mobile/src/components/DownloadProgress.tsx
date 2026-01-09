/**
 * DownloadProgress component - displays download progress bar and status
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { PostDownloadStatus } from '../models/post';

/**
 * Status display configuration
 */
const STATUS_CONFIG: Record<
  PostDownloadStatus,
  { label: string; color: string; showProgress: boolean }
> = {
  pending: { label: 'Waiting...', color: '#9E9E9E', showProgress: false },
  downloading: { label: 'Downloading', color: '#2196F3', showProgress: true },
  completed: { label: 'Downloaded', color: '#4CAF50', showProgress: false },
  partial: { label: 'Partially Downloaded', color: '#FF9800', showProgress: false },
  failed: { label: 'Download Failed', color: '#F44336', showProgress: false },
};

/**
 * Props for DownloadProgress
 */
interface DownloadProgressProps {
  status: PostDownloadStatus;
  progress: number;
  onRetry?: () => void;
}

/**
 * DownloadProgress component
 */
export function DownloadProgress({
  status,
  progress,
  onRetry,
}: DownloadProgressProps) {
  const config = STATUS_CONFIG[status];
  const progressPercent = Math.round(progress * 100);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.statusDot, { backgroundColor: config.color }]} />
        <Text style={[styles.statusText, { color: config.color }]}>
          {config.label}
          {config.showProgress && ` (${progressPercent}%)`}
        </Text>

        {(status === 'failed' || status === 'partial') && onRetry && (
          <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>

      {config.showProgress && (
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              { width: `${progressPercent}%`, backgroundColor: config.color },
            ]}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#FF2442',
    borderRadius: 4,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
});
