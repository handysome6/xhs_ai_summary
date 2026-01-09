/**
 * AISummary component - displays AI-generated summary and analysis
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AIResult, ContentType } from '../models/ai-result';
import { LabelChips } from './LabelChips';

/**
 * Content type display configuration
 */
const CONTENT_TYPE_CONFIG: Record<
  ContentType,
  { label: string; color: string; icon: string }
> = {
  tutorial: { label: 'Tutorial', color: '#4CAF50', icon: '📚' },
  review: { label: 'Review', color: '#2196F3', icon: '⭐' },
  lifestyle: { label: 'Lifestyle', color: '#9C27B0', icon: '✨' },
  travel: { label: 'Travel', color: '#00BCD4', icon: '✈️' },
  food: { label: 'Food', color: '#FF9800', icon: '🍜' },
  fashion: { label: 'Fashion', color: '#E91E63', icon: '👗' },
  other: { label: 'Other', color: '#607D8B', icon: '📝' },
};

/**
 * Props for AISummary
 */
interface AISummaryProps {
  aiResult: AIResult;
  onLabelPress?: (label: string) => void;
}

/**
 * AISummary component
 */
export function AISummary({ aiResult, onLabelPress }: AISummaryProps) {
  const contentTypeConfig = aiResult.contentType
    ? CONTENT_TYPE_CONFIG[aiResult.contentType]
    : null;

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AI Analysis</Text>
        <Text style={styles.date}>
          Analyzed {formatDate(aiResult.analyzedAt)}
        </Text>
      </View>

      {/* Content Type Badge */}
      {contentTypeConfig && (
        <View
          style={[
            styles.typeBadge,
            { backgroundColor: contentTypeConfig.color + '20' },
          ]}
        >
          <Text style={styles.typeIcon}>{contentTypeConfig.icon}</Text>
          <Text style={[styles.typeText, { color: contentTypeConfig.color }]}>
            {contentTypeConfig.label}
          </Text>
        </View>
      )}

      {/* Summary */}
      {aiResult.summary && (
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryLabel}>Summary</Text>
          <Text style={styles.summaryText}>{aiResult.summary}</Text>
        </View>
      )}

      {/* Labels */}
      {aiResult.labels.length > 0 && (
        <View style={styles.labelsContainer}>
          <Text style={styles.labelsLabel}>Tags</Text>
          <LabelChips
            labels={aiResult.labels}
            onLabelPress={onLabelPress}
          />
        </View>
      )}

      {/* Model info */}
      <Text style={styles.modelInfo}>Model: {aiResult.modelVersion}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
  },
  date: {
    fontSize: 11,
    color: '#9E9E9E',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  typeIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  summaryContainer: {
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9E9E9E',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryText: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 20,
  },
  labelsContainer: {
    marginBottom: 8,
  },
  labelsLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9E9E9E',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modelInfo: {
    fontSize: 10,
    color: '#BDBDBD',
    marginTop: 8,
  },
});
