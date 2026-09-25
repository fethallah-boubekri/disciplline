import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, typography, radius } from '@/theme/colors';
import { createGoal, listGoals } from '@/db/repository';
import { Goal } from '@/types';

export function GoalsScreen() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useFocusEffect(useCallback(() => { setGoals(listGoals()); }, []));

  const save = () => {
    if (!name.trim()) return;
    createGoal(name.trim(), description.trim());
    setName('');
    setDescription('');
    setShowForm(false);
    setGoals(listGoals());
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Goals</Text>
        <Pressable onPress={() => setShowForm(true)}>
          <Text style={{ color: colors.accent, fontWeight: '700' }}>+ New</Text>
        </Pressable>
      </View>
      <FlatList
        data={goals}
        keyExtractor={(g) => g.id}
        ListEmptyComponent={<Text style={styles.empty}>No goals yet — create one to link tasks to it.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.goalName}>{item.name}</Text>
            {!!item.description && <Text style={styles.goalDesc}>{item.description}</Text>}
          </View>
        )}
      />

      <Modal visible={showForm} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New Goal</Text>
            <TextInput placeholder="e.g. Finish L3 successfully" placeholderTextColor={colors.textMuted} value={name} onChangeText={setName} style={styles.input} />
            <TextInput placeholder="Description (optional)" placeholderTextColor={colors.textMuted} value={description} onChangeText={setDescription} style={[styles.input, { height: 70, marginTop: spacing(3) }]} multiline />
            <View style={{ flexDirection: 'row', gap: spacing(3), marginTop: spacing(4) }}>
              <Pressable style={styles.cancelBtn} onPress={() => setShowForm(false)}>
                <Text style={{ color: colors.textSecondary }}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.saveBtn} onPress={save}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing(4), paddingTop: spacing(12) },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing(4) },
  header: { ...typography.title, color: colors.textPrimary },
  empty: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing(10) },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radius.md, padding: spacing(3), marginBottom: spacing(2) },
  goalName: { ...typography.h3, color: colors.textPrimary },
  goalDesc: { ...typography.body, color: colors.textSecondary, marginTop: 4 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  modalCard: { width: '85%', backgroundColor: colors.bgElevated, borderRadius: radius.lg, padding: spacing(5), borderWidth: 1, borderColor: colors.cardBorder },
  modalTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing(3) },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radius.md, color: colors.textPrimary, padding: spacing(3) },
  cancelBtn: { flex: 1, alignItems: 'center', paddingVertical: spacing(3) },
  saveBtn: { flex: 1, alignItems: 'center', paddingVertical: spacing(3), backgroundColor: colors.accent, borderRadius: radius.md },
});
