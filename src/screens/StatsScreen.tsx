import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { colors, spacing, typography, radius } from '@/theme/colors';
import { getDailySeries, getPeriodStats, getStreaks, listCategories } from '@/db/repository';
import { LineChart } from '@/components/LineChart';
import { Category, PeriodStats } from '@/types';

const RANGES = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '3M', days: 90 },
  { label: '6M', days: 182 },
];

export function StatsScreen() {
  const [rangeDays, setRangeDays] = useState(7);
  const [stats, setStats] = useState<PeriodStats>({ totalDue: 0, completed: 0, missed: 0, pending: 0, executionRate: 0 });
  const [streaks, setStreaks] = useState({ current: 0, longest: 0 });
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { startDate, endDate, dayList } = useMemo(() => {
    const end = new Date();
    const start = subDays(end, rangeDays - 1);
    return {
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd'),
      dayList: eachDayOfInterval({ start, end }).map((d) => format(d, 'yyyy-MM-dd')),
    };
  }, [rangeDays]);

  const load = useCallback(() => {
    setStats(getPeriodStats(startDate, endDate, selectedCategory ? { categoryId: selectedCategory } : undefined));
    setStreaks(getStreaks(selectedCategory ? undefined : undefined));
    setCategories(listCategories());
  }, [startDate, endDate, selectedCategory]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const series = useMemo(() => getDailySeries(startDate, endDate), [startDate, endDate, stats]);
  const completedSeries = dayList.map((d) => series[d]?.completed ?? 0);
  const missedSeries = dayList.map((d) => series[d]?.missed ?? 0);
  const executionSeries = dayList.map((d) => {
    const c = series[d]?.completed ?? 0;
    const m = series[d]?.missed ?? 0;
    const p = series[d]?.pending ?? 0;
    const due = c + m + p;
    return due === 0 ? 0 : Math.round((c / due) * 100);
  });
  const shortLabels = dayList.map((d) => format(new Date(d), rangeDays > 30 ? 'MMM d' : 'EEE'));
  const sparseLabels = shortLabels.map((l, i) => (dayList.length > 10 && i % Math.ceil(dayList.length / 6) !== 0 ? '' : l));

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing(4), paddingTop: spacing(12), paddingBottom: spacing(20) }}>
      <Text style={styles.header}>Stats</Text>

      <View style={styles.chipRow}>
        {RANGES.map((r) => (
          <Pressable key={r.label} onPress={() => setRangeDays(r.days)} style={[styles.chip, rangeDays === r.days && styles.chipActive]}>
            <Text style={[styles.chipText, rangeDays === r.days && styles.chipTextActive]}>{r.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.totalsGrid}>
        <Total label="Total Due" value={stats.totalDue} />
        <Total label="Completed" value={stats.completed} color={colors.success} />
        <Total label="Missed" value={stats.missed} color={colors.danger} />
        <Total label="Execution" value={`${stats.executionRate}%`} color={colors.accent} />
      </View>

      <View style={styles.totalsGrid}>
        <Total label="Current streak" value={`🔥 ${streaks.current}`} />
        <Total label="Best streak" value={`🏆 ${streaks.longest}`} />
      </View>

      <LineChart title="Completed Tasks" values={completedSeries} labels={sparseLabels} color={colors.chartCompleted} />
      <LineChart title="Missed Tasks" values={missedSeries} labels={sparseLabels} color={colors.chartMissed} />
      <LineChart title="Execution Rate" values={executionSeries} labels={sparseLabels} color={colors.chartExecution} maxOverride={100} />

      <Text style={styles.sectionLabel}>BY CATEGORY</Text>
      <View style={styles.chipRow}>
        <Pressable onPress={() => setSelectedCategory(null)} style={[styles.chip, !selectedCategory && styles.chipActive]}>
          <Text style={[styles.chipText, !selectedCategory && styles.chipTextActive]}>All</Text>
        </Pressable>
        {categories.map((c) => (
          <Pressable key={c.id} onPress={() => setSelectedCategory(c.id)} style={[styles.chip, selectedCategory === c.id && styles.chipActive]}>
            <Text style={[styles.chipText, selectedCategory === c.id && styles.chipTextActive]}>{c.name}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

function Total({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <View style={styles.totalBox}>
      <Text style={[styles.totalValue, color ? { color } : null]}>{value}</Text>
      <Text style={styles.totalLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { ...typography.title, color: colors.textPrimary, marginBottom: spacing(4) },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2), marginBottom: spacing(4) },
  chip: { paddingHorizontal: spacing(3), paddingVertical: spacing(2), borderRadius: radius.pill, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.card },
  chipActive: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  chipText: { color: colors.textSecondary, fontSize: 13 },
  chipTextActive: { color: colors.accent, fontWeight: '700' },
  totalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(3), marginBottom: spacing(4) },
  totalBox: { flexGrow: 1, minWidth: '22%', backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing(3), alignItems: 'center' },
  totalValue: { ...typography.h3, color: colors.textPrimary },
  totalLabel: { ...typography.caption, color: colors.textMuted, marginTop: 2, textAlign: 'center' },
  sectionLabel: { ...typography.caption, color: colors.textMuted, marginBottom: spacing(2) },
});
