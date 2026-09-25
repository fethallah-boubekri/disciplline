import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, typography, radius } from '@/theme/colors';
import {
  completeOccurrence,
  deleteTask,
  getOccurrencesForTask,
  getStreaks,
  getTask,
} from '@/db/repository';
import { OccurrenceWithTask, TaskDefinition } from '@/types';

export function TaskDetailScreen({ route, navigation }: any) {
  const { taskId } = route.params;
  const [task, setTask] = useState<TaskDefinition | null>(null);
  const [occurrences, setOccurrences] = useState<OccurrenceWithTask[]>([]);
  const [streaks, setStreaks] = useState({ current: 0, longest: 0 });
  const [resultModal, setResultModal] = useState<OccurrenceWithTask | null>(null);
  const [resultText, setResultText] = useState('');

  useFocusEffect(
    useCallback(() => {
      setTask(getTask(taskId));
      setOccurrences(getOccurrencesForTask(taskId));
      setStreaks(getStreaks(taskId));
    }, [taskId])
  );

  if (!task) return null;

  const completed = occurrences.filter((o) => o.status === 'completed').length;
  const missed = occurrences.filter((o) => o.status === 'missed').length;
  const rate = occurrences.length === 0 ? 0 : Math.round((completed / occurrences.length) * 100);

  const confirmComplete = (o: OccurrenceWithTask) => {
    setResultModal(o);
    setResultText(o.result ?? '');
  };

  const saveResult = () => {
    if (!resultModal) return;
    completeOccurrence(resultModal.id, resultText.trim() || undefined);
    setResultModal(null);
    setOccurrences(getOccurrencesForTask(taskId));
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>{task.title}</Text>
        <Pressable
          onPress={() => {
            deleteTask(task.id, 'series');
            navigation.goBack();
          }}
        >
          <Text style={{ color: colors.danger }}>Delete</Text>
        </Pressable>
      </View>
      {!!task.description && <Text style={styles.description}>{task.description}</Text>}

      <View style={styles.statsGrid}>
        <Stat label="Occurrences" value={occurrences.length} />
        <Stat label="Completed" value={completed} color={colors.success} />
        <Stat label="Missed" value={missed} color={colors.danger} />
        <Stat label="Rate" value={`${rate}%`} />
        <Stat label="Streak" value={`🔥 ${streaks.current}`} />
        <Stat label="Best" value={`🏆 ${streaks.longest}`} />
      </View>

      <Text style={styles.sectionLabel}>HISTORY</Text>
      <FlatList
        data={occurrences}
        keyExtractor={(o) => o.id}
        renderItem={({ item }) => (
          <Pressable
            style={styles.historyRow}
            onPress={() => item.status !== 'completed' && confirmComplete(item)}
          >
            <Text style={styles.historyDate}>{item.scheduledDate}</Text>
            <Text
              style={{
                color: item.status === 'completed' ? colors.success : item.status === 'missed' ? colors.danger : colors.textSecondary,
              }}
            >
              {item.status === 'completed' ? '✓' : item.status === 'missed' ? '✕' : '○'} {item.status}
            </Text>
          </Pressable>
        )}
      />

      <Modal visible={!!resultModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Mark as done</Text>
            <TextInput
              placeholder="What happened? (optional)"
              placeholderTextColor={colors.textMuted}
              value={resultText}
              onChangeText={setResultText}
              style={styles.modalInput}
              multiline
            />
            <View style={{ flexDirection: 'row', gap: spacing(3), marginTop: spacing(3) }}>
              <Pressable style={styles.modalCancel} onPress={() => setResultModal(null)}>
                <Text style={{ color: colors.textSecondary }}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalSave} onPress={saveResult}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Done</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Stat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, color ? { color } : null]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing(4), paddingTop: spacing(12) },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  header: { ...typography.title, color: colors.textPrimary, flex: 1 },
  description: { ...typography.body, color: colors.textSecondary, marginTop: spacing(2) },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(3), marginVertical: spacing(5) },
  statBox: { width: '30%', backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing(3), alignItems: 'center' },
  statValue: { ...typography.h3, color: colors.textPrimary },
  statLabel: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  sectionLabel: { ...typography.caption, color: colors.textMuted, marginBottom: spacing(2) },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing(2.5), borderBottomWidth: 1, borderColor: colors.cardBorder },
  historyDate: { color: colors.textPrimary },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  modalCard: { width: '85%', backgroundColor: colors.bgElevated, borderRadius: radius.lg, padding: spacing(5), borderWidth: 1, borderColor: colors.cardBorder },
  modalTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing(3) },
  modalInput: { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder, color: colors.textPrimary, padding: spacing(3), minHeight: 70 },
  modalCancel: { flex: 1, alignItems: 'center', paddingVertical: spacing(3) },
  modalSave: { flex: 1, alignItems: 'center', paddingVertical: spacing(3), backgroundColor: colors.accent, borderRadius: radius.md },
});
