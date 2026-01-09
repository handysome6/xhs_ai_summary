/**
 * LabelChips component - displays AI-generated labels as chips
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

/**
 * Props for LabelChips
 */
interface LabelChipsProps {
  labels: string[];
  onLabelPress?: (label: string) => void;
  maxDisplay?: number;
}

/**
 * LabelChips component
 */
export function LabelChips({
  labels,
  onLabelPress,
  maxDisplay = 5,
}: LabelChipsProps) {
  if (labels.length === 0) {
    return null;
  }

  const displayLabels = labels.slice(0, maxDisplay);
  const remainingCount = labels.length - maxDisplay;

  return (
    <View style={styles.container}>
      {displayLabels.map((label, index) => (
        <TouchableOpacity
          key={`${label}-${index}`}
          style={styles.chip}
          onPress={() => onLabelPress?.(label)}
          disabled={!onLabelPress}
          activeOpacity={onLabelPress ? 0.7 : 1}
        >
          <Text style={styles.chipText}>{label}</Text>
        </TouchableOpacity>
      ))}

      {remainingCount > 0 && (
        <View style={[styles.chip, styles.moreChip]}>
          <Text style={[styles.chipText, styles.moreText]}>
            +{remainingCount}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  chipText: {
    fontSize: 12,
    color: '#FF2442',
    fontWeight: '500',
  },
  moreChip: {
    backgroundColor: '#F5F5F5',
  },
  moreText: {
    color: '#757575',
  },
});
