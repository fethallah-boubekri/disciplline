import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';
import { colors, spacing, typography, radius } from '@/theme/colors';
import { ProgressRing } from '@/components/ProgressRing';
import { TaskCard } from '@/components/TaskCard';
import {
  completeOccurrence,
  getOccurrencesForDate,
  getStreaks,
  reconcile,
  uncompleteOccurrence,
} from '@/db/repository';
import { OccurrenceWithTask } from '@/types';

export function HomeScreen({ navigation }: any) {
  const [occurrences, setOccurrences] = useState<OccurrenceWithTask[]>([]);
  const [streak, setStreak] = useState(0);

  const load = useCallback(() => {
    reconcile();
    const today = format(new Date(), 'yyyy-MM-dd');
    setOccurrences(getOccurrencesForDate(today));
    setStreak(getStreaks().current);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const completed = occurrences.filter((o) => o.status === 'completed').length;
  const total = occurrences.length;
  const percent = total === 0 ? 0 : (completed / total) * 100;
  const remaining = occurrences.filter((o) => o.status === 'pending' || o.status === 'snoozed');

  const toggle = (o: OccurrenceWithTask) => {
    if (o.status === 'completed') uncompleteOccurrence(o.id);
    else completeOccurrence(o.id);
    load();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting()}</Text>
          <Text style={styles.date}>{format(new Date(), 'EEEE, MMMM d')}</Text>
        </View>
        <Pressable onPress={() => navigation.navigate('Settings')} hitSlop={12}>
          <Text style={{ color: colors.textSecondary, fontSize: 20 }}>⚙</Text>
        </Pressable>
      </View>

      <View style={styles.summaryRow}>
        <ProgressRing percent={percent} centerText={`${completed}/${total}`} label="Today" />
        <View style={styles.summaryStats}>
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>{remaining.length}</Text>
            <Text style={styles.statLabel}>Remaining</Text>
          </View>
          <View style={styles.statBlock}>
            <Text style={[styles.statValue, { color: colors.warning }]}>🔥 {streak}</Text>
            <Text style={styles.statLabel}>Day streak</Text>
          </View>
        </View>
      </View>

      {remaining.length > 0 && (
        <View style={styles.stillToDo}>
          <Text style={styles.sectionLabel}>STILL TO DO · {remaining.length} tasks remaining</Text>
        </View>
      )}

      <Text style={styles.sectionLabel}>TODAY'S SCHEDULE</Text>
      <FlatList
        data={occurrences}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ paddingBottom: spacing(20) }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No tasks scheduled today.</Text>
            <Pressable style={styles.emptyCta} onPress={() => navigation.navigate('TaskForm')}>
              <Text style={{ color: colors.bg, fontWeight: '700' }}>+ Add Task</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <TaskCard
            occurrence={item}
            onPress={() => navigation.navigate('TaskDetail', { taskId: item.taskId })}
            onToggleComplete={() => toggle(item)}
          />
        )}
      />

      <Pressable style={styles.fab} onPress={() => navigation.navigate('TaskForm')}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 18) return 'Good Afternoon';
  return 'Good Evening';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing(4), paddingTop: spacing(12) },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing(5) },
  greeting: { ...typography.title, color: colors.textPrimary },
  date: { ...typography.body, color: colors.textSecondary, marginTop: 2 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing(5) },
  summaryStats: { marginLeft: spacing(6), gap: spacing(4) },
  statBlock: {},
  statValue: { ...typography.h2, color: colors.textPrimary },
  statLabel: { ...typography.caption, color: colors.textSecondary },
  stillToDo: { marginBottom: spacing(2) },
  sectionLabel: { ...typography.caption, color: colors.textMuted, marginBottom: spacing(2), letterSpacing: 0.5 },
  empty: { alignItems: 'center', paddingVertical: spacing(10), gap: spacing(3) },
  emptyText: { color: colors.textSecondary },
  emptyCta: { backgroundColor: colors.accent, paddingHorizontal: spacing(4), paddingVertical: spacing(2), borderRadius: radius.pill },
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
    shadowColor: colors.accent,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  fabText: { color: '#fff', fontSize: 28, marginTop: -2 },
});
