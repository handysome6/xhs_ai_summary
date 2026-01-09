/**
 * ShareConfirmation component - toast/modal for share results
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { ShareResult } from '../services/share-handler';

/**
 * Props for ShareConfirmation
 */
interface ShareConfirmationProps {
  result: ShareResult | null;
  onDismiss: () => void;
  duration?: number;
}

/**
 * ShareConfirmation component
 */
export function ShareConfirmation({
  result,
  onDismiss,
  duration = 3000,
}: ShareConfirmationProps) {
  const [translateY] = useState(new Animated.Value(-100));
  const [opacity] = useState(new Animated.Value(0));

  useEffect(() => {
    if (result) {
      // Animate in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss
      const timer = setTimeout(() => {
        dismiss();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [result]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!result) return null;

  const getContent = () => {
    if (!result.success) {
      return {
        icon: '❌',
        title: 'Failed to save',
        message: result.errorMessage || 'Unknown error',
        backgroundColor: '#FFEBEE',
        borderColor: '#F44336',
      };
    }

    if (result.isDuplicate) {
      return {
        icon: '📋',
        title: 'Already saved',
        message: 'This post is already in your collection',
        backgroundColor: '#FFF3E0',
        borderColor: '#FF9800',
      };
    }

    return {
      icon: '✓',
      title: 'Post saved',
      message: 'The post has been added to your collection',
      backgroundColor: '#E8F5E9',
      borderColor: '#4CAF50',
    };
  };

  const content = getContent();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
          backgroundColor: content.backgroundColor,
          borderLeftColor: content.borderColor,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={dismiss}
        activeOpacity={0.9}
      >
        <Text style={styles.icon}>{content.icon}</Text>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{content.title}</Text>
          <Text style={styles.message} numberOfLines={2}>
            {content.message}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 2,
  },
  message: {
    fontSize: 12,
    color: '#616161',
  },
});
