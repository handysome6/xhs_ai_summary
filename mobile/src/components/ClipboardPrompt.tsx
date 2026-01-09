/**
 * ClipboardPrompt component - modal for clipboard URL detection
 * Shows detected XHS links with option to add to library or dismiss
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';
import { CLIPBOARD_CONFIG } from '../utils/constants';

/**
 * Props for ClipboardPrompt
 */
export interface ClipboardPromptProps {
  /**
   * Whether prompt is visible
   */
  visible: boolean;

  /**
   * Detected URL to display
   */
  url: string;

  /**
   * Whether device is offline
   */
  isOffline: boolean;

  /**
   * Callback when user taps "Add to Library"
   */
  onAdd: () => void;

  /**
   * Callback when user dismisses the prompt
   */
  onDismiss: () => void;
}

/**
 * ClipboardPrompt component
 */
export function ClipboardPrompt({
  visible,
  url,
  isOffline,
  onAdd,
  onDismiss,
}: ClipboardPromptProps) {
  const [slideAnim] = useState(new Animated.Value(Dimensions.get('window').height));
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
          tension: 65,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: Dimensions.get('window').height,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  /**
   * Truncate URL for display
   */
  const displayUrl = url.length > CLIPBOARD_CONFIG.PREVIEW_MAX_LENGTH
    ? `${url.slice(0, CLIPBOARD_CONFIG.PREVIEW_MAX_LENGTH)}...`
    : url;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={styles.modalContainer}
          >
            <Animated.View
              style={[
                styles.modal,
                {
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.icon}>🔗</Text>
                <Text style={styles.title}>Found a share link</Text>
              </View>

              {/* URL Preview */}
              <View style={styles.urlContainer}>
                <Text style={styles.urlLabel}>Link:</Text>
                <Text style={styles.url} numberOfLines={2}>
                  {displayUrl}
                </Text>
              </View>

              {/* Offline indicator */}
              {isOffline && (
                <View style={styles.offlineIndicator}>
                  <Text style={styles.offlineIcon}>📡</Text>
                  <Text style={styles.offlineText}>
                    Offline - will sync when connected
                  </Text>
                </View>
              )}

              {/* Action buttons */}
              <View style={styles.actions}>
                <Pressable
                  style={[styles.button, styles.dismissButton]}
                  onPress={onDismiss}
                  android_ripple={{ color: '#E0E0E0' }}
                >
                  <Text style={styles.dismissButtonText}>Dismiss</Text>
                </Pressable>

                <Pressable
                  style={[styles.button, styles.addButton]}
                  onPress={onAdd}
                  android_ripple={{ color: '#1976D2' }}
                >
                  <Text style={styles.addButtonText}>
                    Add to Library
                  </Text>
                </Pressable>
              </View>
            </Animated.View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 28,
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
  },
  urlContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  urlLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#757575',
    marginBottom: 4,
  },
  url: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 20,
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderRadius: 6,
    padding: 10,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
  },
  offlineIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  offlineText: {
    fontSize: 12,
    color: '#E65100',
    fontWeight: '500',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissButton: {
    backgroundColor: '#F5F5F5',
  },
  dismissButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#616161',
  },
  addButton: {
    backgroundColor: '#2196F3',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
