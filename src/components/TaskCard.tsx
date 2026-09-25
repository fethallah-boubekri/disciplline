import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme/colors';
import { OccurrenceWithTask } from '@/types';

interface Props {
  occurrence: OccurrenceWithTask;
  onPress?: () => void;
  onToggleComplete?: () => void;
}

const statusMeta: Record<string, { icon: string; color: string }> = {
  completed: { icon: '✓', color: colors.success },
  missed: { icon: '✕', color: colors.danger },
  pending: { icon: '○', color: colors.warning },
  snoozed: { icon: '⏰', color: colors.textSecondary },
};

export function TaskCard({ occurrence, onPress, onToggleComplete }: Props) {
  const meta = statusMeta[occurrence.status] ?? statusMeta.pending;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={[styles.categoryDot, { backgroundColor: occurrence.categoryColor }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.time}>{occurrence.scheduledTime}</Text>
        <Text style={styles.title} numberOfLines={1}>
          {occurrence.title}
        </Text>
        <Text style={styles.category}>{occurrence.categoryName}</Text>
      </View>
      <Pressable
        onPress={onToggleComplete}
        hitSlop={10}
        style={[styles.statusBadge, { borderColor: meta.color }]}
      >
        <Text style={{ color: meta.color, fontWeight: '700' }}>{meta.icon}</Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    padding: spacing(3),
    marginBottom: spacing(2),
    gap: spacing(3),
  },
  categoryDot: { width: 8, height: 8, borderRadius: 4 },
  time: { ...typography.caption, color: colors.textSecondary },
  title: { ...typography.h3, color: colors.textPrimary, marginTop: 2 },
  category: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
