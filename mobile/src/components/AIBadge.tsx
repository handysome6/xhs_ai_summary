/**
 * AIBadge component - visual indicator for AI-generated content
 */
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

/**
 * Props for AIBadge
 */
interface AIBadgeProps {
  /** Badge size variant */
  size?: 'small' | 'medium' | 'large';
  /** Additional container style */
  style?: ViewStyle;
  /** Show text label */
  showLabel?: boolean;
}

/**
 * Size configurations
 */
const SIZES = {
  small: {
    iconSize: 12,
    fontSize: 9,
    paddingH: 4,
    paddingV: 2,
    gap: 2,
  },
  medium: {
    iconSize: 14,
    fontSize: 10,
    paddingH: 6,
    paddingV: 3,
    gap: 3,
  },
  large: {
    iconSize: 16,
    fontSize: 12,
    paddingH: 8,
    paddingV: 4,
    gap: 4,
  },
};

/**
 * AIBadge component
 * Displays a badge indicating AI-generated content
 */
export function AIBadge({
  size = 'medium',
  style,
  showLabel = true,
}: AIBadgeProps) {
  const config = SIZES[size];

  return (
    <View
      style={[
        styles.container,
        {
          paddingHorizontal: config.paddingH,
          paddingVertical: config.paddingV,
          gap: config.gap,
        },
        style,
      ]}
    >
      <Text style={[styles.icon, { fontSize: config.iconSize }]}>AI</Text>
      {showLabel && (
        <Text style={[styles.label, { fontSize: config.fontSize }]}>
          Generated
        </Text>
      )}
    </View>
  );
}

/**
 * AIBadge for indicating analysis status
 */
export function AIAnalyzedBadge({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.analyzedContainer, style]}>
      <Text style={styles.analyzedIcon}>AI</Text>
      <Text style={styles.analyzedText}>Analyzed</Text>
    </View>
  );
}

/**
 * AIBadge for inline text display
 */
export function AIInlineBadge({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.inlineContainer, style]}>
      <Text style={styles.inlineText}>AI</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#81C784',
  },
  icon: {
    fontWeight: '700',
    color: '#2E7D32',
  },
  label: {
    fontWeight: '500',
    color: '#388E3C',
  },
  analyzedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E5F5',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
    borderWidth: 1,
    borderColor: '#BA68C8',
  },
  analyzedIcon: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7B1FA2',
  },
  analyzedText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#8E24AA',
  },
  inlineContainer: {
    backgroundColor: '#E3F2FD',
    borderRadius: 2,
    paddingHorizontal: 3,
    paddingVertical: 1,
    marginHorizontal: 2,
  },
  inlineText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#1976D2',
  },
});
