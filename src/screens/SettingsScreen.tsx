import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Share } from 'react-native';
import { colors, spacing, typography, radius } from '@/theme/colors';
import { exportAllData } from '@/db/repository';

export function SettingsScreen({ navigation }: any) {
  const onExport = async () => {
    const data = exportAllData();
    await Share.share({ message: JSON.stringify(data, null, 2), title: 'discipline-backup.json' });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing(4), paddingTop: spacing(12) }}>
      <Text style={styles.header}>Settings</Text>

      <Section title="Goals">
        <Row label="Manage goals" onPress={() => navigation.navigate('Goals')} />
      </Section>

      <Section title="Data">
        <Row label="Export data (JSON)" onPress={onExport} />
        <Row label="Import data" onPress={() => {}} note="Coming soon" />
        <Row label="Reset all data" destructive onPress={() => {}} note="Coming soon" />
      </Section>

      <Section title="About">
        <Text style={styles.aboutText}>
          Discipline · offline-first personal execution tracker. Built with Expo + SQLite.
        </Text>
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: spacing(6) }}>
      <Text style={styles.sectionLabel}>{title.toUpperCase()}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function Row({ label, onPress, destructive, note }: { label: string; onPress: () => void; destructive?: boolean; note?: string }) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Text style={[styles.rowLabel, destructive && { color: colors.danger }]}>{label}</Text>
      {note && <Text style={styles.rowNote}>{note}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { ...typography.title, color: colors.textPrimary, marginBottom: spacing(5) },
  sectionLabel: { ...typography.caption, color: colors.textMuted, marginBottom: spacing(2) },
  card: { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing(4), paddingVertical: spacing(3.5), borderBottomWidth: 1, borderColor: colors.cardBorder },
  rowLabel: { ...typography.body, color: colors.textPrimary },
  rowNote: { ...typography.caption, color: colors.textMuted },
  aboutText: { ...typography.body, color: colors.textSecondary, lineHeight: 20 },
});
