import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Switch } from 'react-native';
import { format, addDays } from 'date-fns';
import { colors, spacing, typography, radius } from '@/theme/colors';
import { createTask, listCategories, listGoals } from '@/db/repository';
import { Category, Goal, Priority, RecurrenceType } from '@/types';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const RECURRENCE_OPTIONS: { type: RecurrenceType; label: string }[] = [
  { type: 'once', label: 'Once' },
  { type: 'daily', label: 'Every day' },
  { type: 'weekly', label: 'Specific days' },
];
const PRIORITIES: Priority[] = ['low', 'medium', 'high'];

export function TaskFormScreen({ navigation }: any) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [goalId, setGoalId] = useState<string | null>(null);
  const [priority, setPriority] = useState<Priority>('medium');
  const [dateChoice, setDateChoice] = useState<'today' | 'tomorrow'>('today');
  const [time, setTime] = useState('18:00');
  const [duration, setDuration] = useState('');
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('once');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [repetitions, setRepetitions] = useState('4');
  const [interval, setInterval] = useState('3');

  useEffect(() => {
    const cats = listCategories();
    setCategories(cats);
    if (cats[0]) setCategoryId(cats[0].id);
    setGoals(listGoals());
  }, []);

  const toggleDay = (d: number) => {
    setDaysOfWeek((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));
  };

  const canSave = title.trim().length > 0 && categoryId && /^\d{2}:\d{2}$/.test(time);

  const save = () => {
    const startDate = format(dateChoice === 'today' ? new Date() : addDays(new Date(), 1), 'yyyy-MM-dd');
    createTask({
      title: title.trim(),
      description: description.trim(),
      categoryId,
      goalId,
      priority,
      startDate,
      startTime: time,
      durationMinutes: duration ? parseInt(duration, 10) : null,
      recurrence: { type: recurrenceType, daysOfWeek: recurrenceType === 'weekly' ? daysOfWeek : undefined, endDate: null },
      reminder: {
        enabled: reminderEnabled,
        repetitions: parseInt(repetitions, 10) || 1,
        intervalMinutes: parseInt(interval, 10) || 1,
      },
    });
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing(4), paddingBottom: spacing(20) }}>
      <Text style={styles.header}>New Task</Text>

      <Field label="Task name">
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Train Back"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
      </Field>

      <Field label="Description">
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Back workout focused on strength and hypertrophy."
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { height: 70 }]}
          multiline
        />
      </Field>

      <Field label="Category">
        <View style={styles.chipRow}>
          {categories.map((c) => (
            <Chip key={c.id} label={c.name} active={categoryId === c.id} onPress={() => setCategoryId(c.id)} />
          ))}
        </View>
      </Field>

      {goals.length > 0 && (
        <Field label="Goal (optional)">
          <View style={styles.chipRow}>
            <Chip label="None" active={goalId === null} onPress={() => setGoalId(null)} />
            {goals.map((g) => (
              <Chip key={g.id} label={g.name} active={goalId === g.id} onPress={() => setGoalId(g.id)} />
            ))}
          </View>
        </Field>
      )}

      <Field label="Date">
        <View style={styles.chipRow}>
          <Chip label="Today" active={dateChoice === 'today'} onPress={() => setDateChoice('today')} />
          <Chip label="Tomorrow" active={dateChoice === 'tomorrow'} onPress={() => setDateChoice('tomorrow')} />
        </View>
      </Field>

      <View style={styles.row2}>
        <Field label="Time" style={{ flex: 1 }}>
          <TextInput value={time} onChangeText={setTime} placeholder="18:00" placeholderTextColor={colors.textMuted} style={styles.input} />
        </Field>
        <Field label="Duration (min)" style={{ flex: 1 }}>
          <TextInput value={duration} onChangeText={setDuration} placeholder="90" placeholderTextColor={colors.textMuted} keyboardType="number-pad" style={styles.input} />
        </Field>
      </View>

      <Field label="Priority">
        <View style={styles.chipRow}>
          {PRIORITIES.map((p) => (
            <Chip key={p} label={p} active={priority === p} onPress={() => setPriority(p)} />
          ))}
        </View>
      </Field>

      <Field label="Recurrence">
        <View style={styles.chipRow}>
          {RECURRENCE_OPTIONS.map((r) => (
            <Chip key={r.type} label={r.label} active={recurrenceType === r.type} onPress={() => setRecurrenceType(r.type)} />
          ))}
        </View>
      </Field>

      {recurrenceType === 'weekly' && (
        <Field label="Repeat on">
          <View style={styles.chipRow}>
            {DAY_LABELS.map((label, i) => (
              <Chip key={i} label={label} active={daysOfWeek.includes(i)} onPress={() => toggleDay(i)} />
            ))}
          </View>
        </Field>
      )}

      <Field label="Reminder">
        <View style={styles.reminderRow}>
          <Text style={styles.body}>Enable alarm-style reminder</Text>
          <Switch value={reminderEnabled} onValueChange={setReminderEnabled} trackColor={{ true: colors.accent }} />
        </View>
        {reminderEnabled && (
          <View style={styles.row2}>
            <Field label="Repetitions" style={{ flex: 1 }}>
              <TextInput value={repetitions} onChangeText={setRepetitions} keyboardType="number-pad" style={styles.input} />
            </Field>
            <Field label="Interval (min)" style={{ flex: 1 }}>
              <TextInput value={interval} onChangeText={setInterval} keyboardType="number-pad" style={styles.input} />
            </Field>
          </View>
        )}
      </Field>

      <Pressable disabled={!canSave} onPress={save} style={[styles.saveBtn, !canSave && { opacity: 0.4 }]}>
        <Text style={styles.saveText}>Save Task</Text>
      </Pressable>
    </ScrollView>
  );
}

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: any }) {
  return (
    <View style={[{ marginBottom: spacing(4) }, style]}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { ...typography.title, color: colors.textPrimary, marginBottom: spacing(5) },
  label: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing(1.5), textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(2.5),
    color: colors.textPrimary,
  },
  row2: { flexDirection: 'row', gap: spacing(3) },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2) },
  chip: {
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(2),
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
  },
  chipActive: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  chipText: { color: colors.textSecondary, fontSize: 13 },
  chipTextActive: { color: colors.accent, fontWeight: '700' },
  reminderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing(2) },
  body: { ...typography.body, color: colors.textPrimary },
  saveBtn: { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: spacing(4), alignItems: 'center', marginTop: spacing(4) },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
