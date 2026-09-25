import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';
import { colors, spacing, typography, radius } from '@/theme/colors';
import { createNote, deleteNote, listNotes, updateNote } from '@/db/repository';
import { NoteItem } from '@/types';

export function NotesScreen() {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<NoteItem | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const load = () => setNotes(listNotes());
  useFocusEffect(useCallback(() => { load(); }, []));

  const filtered = notes.filter(
    (n) => n.title.toLowerCase().includes(query.toLowerCase()) || n.content.toLowerCase().includes(query.toLowerCase())
  );

  const openNew = () => { setEditing({ id: '', title: '', content: '', createdAt: '', updatedAt: '' }); setTitle(''); setContent(''); };
  const openEdit = (n: NoteItem) => { setEditing(n); setTitle(n.title); setContent(n.content); };

  const save = () => {
    if (!editing) return;
    if (editing.id) updateNote(editing.id, title.trim() || 'Untitled', content);
    else createNote(title.trim() || 'Untitled', content);
    setEditing(null);
    load();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Notes</Text>
      <TextInput
        placeholder="Search notes..."
        placeholderTextColor={colors.textMuted}
        value={query}
        onChangeText={setQuery}
        style={styles.search}
      />
      <FlatList
        data={filtered}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ paddingBottom: spacing(20) }}
        ListEmptyComponent={<Text style={styles.empty}>No notes yet.</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => openEdit(item)}>
            <Text style={styles.noteTitle}>{item.title}</Text>
            <Text style={styles.notePreview} numberOfLines={2}>{item.content}</Text>
            <Text style={styles.noteDate}>{format(new Date(item.updatedAt), 'MMM d, HH:mm')}</Text>
          </Pressable>
        )}
      />
      <Pressable style={styles.fab} onPress={openNew}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      <Modal visible={!!editing} animationType="slide">
        <View style={styles.modalContainer}>
          <TextInput
            placeholder="Title"
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
            style={styles.modalTitleInput}
          />
          <TextInput
            placeholder="Write your note..."
            placeholderTextColor={colors.textMuted}
            value={content}
            onChangeText={setContent}
            style={styles.modalContentInput}
            multiline
          />
          <View style={styles.modalActions}>
            {editing?.id ? (
              <Pressable
                onPress={() => { deleteNote(editing.id); setEditing(null); load(); }}
                style={styles.deleteBtn}
              >
                <Text style={{ color: colors.danger }}>Delete</Text>
              </Pressable>
            ) : <View />}
            <View style={{ flexDirection: 'row', gap: spacing(3) }}>
              <Pressable onPress={() => setEditing(null)} style={styles.cancelBtn}>
                <Text style={{ color: colors.textSecondary }}>Cancel</Text>
              </Pressable>
              <Pressable onPress={save} style={styles.saveBtn}>
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
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing(4), paddingTop: spacing(12) },
  header: { ...typography.title, color: colors.textPrimary, marginBottom: spacing(4) },
  search: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radius.md, paddingHorizontal: spacing(4), paddingVertical: spacing(3), color: colors.textPrimary, marginBottom: spacing(4) },
  empty: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing(10) },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radius.md, padding: spacing(3), marginBottom: spacing(2) },
  noteTitle: { ...typography.h3, color: colors.textPrimary },
  notePreview: { ...typography.body, color: colors.textSecondary, marginTop: 4 },
  noteDate: { ...typography.caption, color: colors.textMuted, marginTop: spacing(2) },
  fab: { position: 'absolute', right: spacing(5), bottom: spacing(8), width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  fabText: { color: '#fff', fontSize: 28, marginTop: -2 },
  modalContainer: { flex: 1, backgroundColor: colors.bg, padding: spacing(4), paddingTop: spacing(12) },
  modalTitleInput: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing(3) },
  modalContentInput: { flex: 1, ...typography.body, color: colors.textPrimary, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing(3) },
  deleteBtn: { paddingVertical: spacing(3) },
  cancelBtn: { paddingVertical: spacing(3), paddingHorizontal: spacing(4) },
  saveBtn: { backgroundColor: colors.accent, paddingVertical: spacing(3), paddingHorizontal: spacing(5), borderRadius: radius.md },
});
