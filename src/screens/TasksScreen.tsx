import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, typography, radius } from '@/theme/colors';
import { listActiveTasks, listCategories } from '@/db/repository';
import { Category, TaskDefinition } from '@/types';

export function TasksScreen({ navigation }: any) {
  const [tasks, setTasks] = useState<TaskDefinition[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      setTasks(listActiveTasks());
      setCategories(listCategories());
    }, [])
  );

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? '';
  const categoryColor = (id: string) => categories.find((c) => c.id === id)?.color ?? colors.textMuted;

  const filtered = tasks.filter(
    (t) =>
      t.title.toLowerCase().includes(query.toLowerCase()) ||
      t.description.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Tasks</Text>

      <TextInput
        placeholder="Search tasks, notes, results..."
        placeholderTextColor={colors.textMuted}
        value={query}
        onChangeText={setQuery}
        style={styles.search}
      />

      <FlatList
        data={filtered}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ paddingBottom: spacing(20) }}
        ListEmptyComponent={<Text style={styles.empty}>No tasks yet. Tap + to create one.</Text>}
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => navigation.navigate('TaskDetail', { taskId: item.id })}
          >
            <View style={[styles.dot, { backgroundColor: categoryColor(item.categoryId) }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.meta}>
                {categoryName(item.categoryId)} · {recurrenceLabel(item)} · {item.startTime}
              </Text>
            </View>
            <Text style={[styles.priority, priorityColor(item.priority)]}>{item.priority}</Text>
          </Pressable>
        )}
      />

      <Pressable style={styles.fab} onPress={() => navigation.navigate('TaskForm')}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

function recurrenceLabel(t: TaskDefinition) {
  switch (t.recurrence.type) {
    case 'once':
      return 'One-time';
    case 'daily':
      return 'Every day';
    case 'weekly':
    case 'custom':
      return (t.recurrence.daysOfWeek ?? []).map((d) => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join('/');
    default:
      return '';
  }
}

function priorityColor(p: string) {
  if (p === 'high') return { color: colors.priorityHigh };
  if (p === 'low') return { color: colors.priorityLow };
  return { color: colors.priorityMedium };
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing(4), paddingTop: spacing(12) },
  header: { ...typography.title, color: colors.textPrimary, marginBottom: spacing(4) },
  search: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3),
    color: colors.textPrimary,
    marginBottom: spacing(4),
  },
  row: {
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
  dot: { width: 8, height: 8, borderRadius: 4 },
  title: { ...typography.h3, color: colors.textPrimary },
  meta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  priority: { ...typography.caption, textTransform: 'uppercase' },
  empty: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing(10) },
  fab: {
    position: 'absolute',
    right: spacing(5),
    bottom: spacing(8),
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: { color: '#fff', fontSize: 28, marginTop: -2 },
});
