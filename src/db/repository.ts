import { addDays, format, parseISO, isBefore, differenceInCalendarDays } from 'date-fns';
import { getDb, cryptoRandomId } from './schema';
import {
  Category,
  Goal,
  NoteItem,
  OccurrenceStatus,
  OccurrenceWithTask,
  PeriodStats,
  Priority,
  Recurrence,
  ReminderConfig,
  TaskDefinition,
} from '@/types';

const ISO_DATE = 'yyyy-MM-dd';
const OCCURRENCE_WINDOW_DAYS = 90; // how far ahead we materialize occurrences

// ---------- Categories ----------

export function listCategories(): Category[] {
  const db = getDb();
  return db.getAllSync<Category>('SELECT * FROM categories ORDER BY name');
}

export function createCategory(name: string, icon: string, color: string): Category {
  const db = getDb();
  const id = cryptoRandomId();
  const createdAt = new Date().toISOString();
  db.runSync('INSERT INTO categories (id, name, icon, color, createdAt) VALUES (?, ?, ?, ?, ?)', [
    id,
    name,
    icon,
    color,
    createdAt,
  ]);
  return { id, name, icon, color, createdAt };
}

export function deleteCategory(id: string) {
  getDb().runSync('DELETE FROM categories WHERE id = ?', [id]);
}

// ---------- Goals ----------

export function listGoals(): Goal[] {
  return getDb().getAllSync<Goal>('SELECT * FROM goals WHERE active = 1 ORDER BY createdAt DESC');
}

export function createGoal(name: string, description: string): Goal {
  const db = getDb();
  const id = cryptoRandomId();
  const createdAt = new Date().toISOString();
  db.runSync('INSERT INTO goals (id, name, description, createdAt, active) VALUES (?, ?, ?, ?, 1)', [
    id,
    name,
    description,
    createdAt,
  ]);
  return { id, name, description, createdAt, active: true };
}

// ---------- Tasks ----------

export interface CreateTaskInput {
  title: string;
  description: string;
  categoryId: string;
  goalId: string | null;
  priority: Priority;
  startDate: string;
  startTime: string;
  durationMinutes: number | null;
  recurrence: Recurrence;
  reminder: ReminderConfig;
}

export function createTask(input: CreateTaskInput): TaskDefinition {
  const db = getDb();
  const id = cryptoRandomId();
  const now = new Date().toISOString();

  db.runSync(
    `INSERT INTO tasks
      (id, title, description, categoryId, goalId, priority, startDate, startTime,
       durationMinutes, recurrenceType, recurrenceDaysOfWeek, recurrenceEndDate,
       reminderEnabled, reminderRepetitions, reminderIntervalMinutes, createdAt, updatedAt, active)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)`,
    [
      id,
      input.title,
      input.description,
      input.categoryId,
      input.goalId,
      input.priority,
      input.startDate,
      input.startTime,
      input.durationMinutes,
      input.recurrence.type,
      input.recurrence.daysOfWeek ? JSON.stringify(input.recurrence.daysOfWeek) : null,
      input.recurrence.endDate ?? null,
      input.reminder.enabled ? 1 : 0,
      input.reminder.repetitions,
      input.reminder.intervalMinutes,
      now,
      now,
    ]
  );

  const task: TaskDefinition = {
    id,
    title: input.title,
    description: input.description,
    categoryId: input.categoryId,
    goalId: input.goalId,
    priority: input.priority,
    startDate: input.startDate,
    startTime: input.startTime,
    durationMinutes: input.durationMinutes,
    recurrence: input.recurrence,
    reminder: input.reminder,
    createdAt: now,
    updatedAt: now,
    active: true,
  };

  generateOccurrencesForTask(task);
  return task;
}

export function getTask(taskId: string): TaskDefinition | null {
  const db = getDb();
  const row = db.getFirstSync<any>('SELECT * FROM tasks WHERE id = ?', [taskId]);
  if (!row) return null;
  return rowToTask(row);
}

export function listActiveTasks(): TaskDefinition[] {
  const db = getDb();
  const rows = db.getAllSync<any>('SELECT * FROM tasks WHERE active = 1 ORDER BY startDate DESC');
  return rows.map(rowToTask);
}

function rowToTask(row: any): TaskDefinition {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    categoryId: row.categoryId,
    goalId: row.goalId,
    priority: row.priority,
    startDate: row.startDate,
    startTime: row.startTime,
    durationMinutes: row.durationMinutes,
    recurrence: {
      type: row.recurrenceType,
      daysOfWeek: row.recurrenceDaysOfWeek ? JSON.parse(row.recurrenceDaysOfWeek) : undefined,
      endDate: row.recurrenceEndDate,
    },
    reminder: {
      enabled: !!row.reminderEnabled,
      repetitions: row.reminderRepetitions,
      intervalMinutes: row.reminderIntervalMinutes,
    },
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    active: !!row.active,
  };
}

// Deletion / editing scope, per spec section 30-31.
export type EditScope = 'occurrence' | 'future' | 'series';

export function deleteTask(taskId: string, scope: EditScope, fromDate?: string) {
  const db = getDb();
  if (scope === 'series') {
    db.runSync('DELETE FROM tasks WHERE id = ?', [taskId]);
    db.runSync('DELETE FROM occurrences WHERE taskId = ?', [taskId]);
  } else if (scope === 'future' && fromDate) {
    db.runSync('DELETE FROM occurrences WHERE taskId = ? AND scheduledDate >= ?', [taskId, fromDate]);
  } else if (scope === 'occurrence' && fromDate) {
    db.runSync('DELETE FROM occurrences WHERE taskId = ? AND scheduledDate = ?', [taskId, fromDate]);
  }
}

// ---------- Occurrence generation ----------

function matchesRecurrence(recurrence: Recurrence, date: Date, startDate: Date): boolean {
  if (recurrence.endDate && isBefore(parseISO(recurrence.endDate), date)) return false;
  if (isBefore(date, startDate)) return false;

  switch (recurrence.type) {
    case 'once':
      return format(date, ISO_DATE) === format(startDate, ISO_DATE);
    case 'daily':
      return true;
    case 'weekly':
    case 'custom':
      return (recurrence.daysOfWeek ?? []).includes(date.getDay());
    default:
      return false;
  }
}

export function generateOccurrencesForTask(task: TaskDefinition, windowDays = OCCURRENCE_WINDOW_DAYS) {
  const db = getDb();
  const start = parseISO(task.startDate);
  const today = new Date();
  const rangeStart = isBefore(start, today) ? start : start;

  for (let i = 0; i <= windowDays; i++) {
    const date = addDays(rangeStart, i);
    if (!matchesRecurrence(task.recurrence, date, start)) continue;

    const scheduledDate = format(date, ISO_DATE);
    const existing = db.getFirstSync<{ id: string }>(
      'SELECT id FROM occurrences WHERE taskId = ? AND scheduledDate = ?',
      [task.id, scheduledDate]
    );
    if (existing) continue;

    db.runSync(
      `INSERT INTO occurrences (id, taskId, scheduledDate, scheduledTime, status)
       VALUES (?, ?, ?, ?, 'pending')`,
      [cryptoRandomId(), task.id, scheduledDate, task.startTime]
    );
  }
}

/** Call on app start / on Today screen focus: extends the occurrence window
 *  for active recurring tasks and flips overdue pending occurrences to 'missed'. */
export function reconcile() {
  const db = getDb();
  const tasks = listActiveTasks();
  for (const t of tasks) {
    if (t.recurrence.type !== 'once') generateOccurrencesForTask(t);
  }

  const now = new Date();
  const nowDate = format(now, ISO_DATE);
  const nowTime = format(now, 'HH:mm');

  db.runSync(
    `UPDATE occurrences
     SET status = 'missed', missedAt = ?
     WHERE status = 'pending'
       AND (scheduledDate < ? OR (scheduledDate = ? AND scheduledTime < ?))`,
    [now.toISOString(), nowDate, nowDate, nowTime]
  );
}

// ---------- Occurrence queries ----------

const OCCURRENCE_JOIN = `
  SELECT o.*, t.title as title, t.categoryId as categoryId, t.priority as priority,
         t.durationMinutes as durationMinutes, c.name as categoryName, c.color as categoryColor
  FROM occurrences o
  JOIN tasks t ON t.id = o.taskId
  JOIN categories c ON c.id = t.categoryId
`;

export function getOccurrencesForDate(date: string): OccurrenceWithTask[] {
  const db = getDb();
  return db.getAllSync<OccurrenceWithTask>(
    `${OCCURRENCE_JOIN} WHERE o.scheduledDate = ? ORDER BY o.scheduledTime ASC`,
    [date]
  );
}

export function getOccurrencesInRange(startDate: string, endDate: string): OccurrenceWithTask[] {
  const db = getDb();
  return db.getAllSync<OccurrenceWithTask>(
    `${OCCURRENCE_JOIN} WHERE o.scheduledDate BETWEEN ? AND ? ORDER BY o.scheduledDate ASC, o.scheduledTime ASC`,
    [startDate, endDate]
  );
}

export function getOccurrencesForTask(taskId: string): OccurrenceWithTask[] {
  const db = getDb();
  return db.getAllSync<OccurrenceWithTask>(
    `${OCCURRENCE_JOIN} WHERE o.taskId = ? ORDER BY o.scheduledDate DESC`,
    [taskId]
  );
}

export function completeOccurrence(occurrenceId: string, result?: string, note?: string) {
  const db = getDb();
  db.runSync(
    `UPDATE occurrences SET status = 'completed', completedAt = ?, result = ?, note = ?
     WHERE id = ?`,
    [new Date().toISOString(), result ?? null, note ?? null, occurrenceId]
  );
}

export function uncompleteOccurrence(occurrenceId: string) {
  getDb().runSync(
    `UPDATE occurrences SET status = 'pending', completedAt = NULL WHERE id = ?`,
    [occurrenceId]
  );
}

export function snoozeOccurrence(occurrenceId: string, minutes: number) {
  const snoozedUntil = new Date(Date.now() + minutes * 60_000).toISOString();
  getDb().runSync(
    `UPDATE occurrences SET status = 'snoozed', snoozedUntil = ? WHERE id = ?`,
    [snoozedUntil, occurrenceId]
  );
}

// ---------- Stats ----------

export function getPeriodStats(startDate: string, endDate: string, opts?: { categoryId?: string; taskId?: string }): PeriodStats {
  const db = getDb();
  let where = 'o.scheduledDate BETWEEN ? AND ?';
  const params: any[] = [startDate, endDate];
  if (opts?.categoryId) {
    where += ' AND t.categoryId = ?';
    params.push(opts.categoryId);
  }
  if (opts?.taskId) {
    where += ' AND o.taskId = ?';
    params.push(opts.taskId);
  }

  const rows = db.getAllSync<{ status: OccurrenceStatus; n: number }>(
    `SELECT o.status as status, COUNT(*) as n FROM occurrences o
     JOIN tasks t ON t.id = o.taskId
     WHERE ${where} GROUP BY o.status`,
    params
  );

  let completed = 0;
  let missed = 0;
  let pending = 0;
  for (const r of rows) {
    if (r.status === 'completed') completed = r.n;
    else if (r.status === 'missed') missed = r.n;
    else pending += r.n; // pending + snoozed count as still-due
  }
  const totalDue = completed + missed + pending;
  const executionRate = totalDue === 0 ? 0 : Math.round((completed / totalDue) * 100);

  return { totalDue, completed, missed, pending, executionRate };
}

/** Daily series for the completed/missed/execution-rate graphs (section 19-21). */
export function getDailySeries(startDate: string, endDate: string) {
  const db = getDb();
  const rows = db.getAllSync<{ scheduledDate: string; status: OccurrenceStatus; n: number }>(
    `SELECT scheduledDate, status, COUNT(*) as n FROM occurrences
     WHERE scheduledDate BETWEEN ? AND ?
     GROUP BY scheduledDate, status
     ORDER BY scheduledDate ASC`,
    [startDate, endDate]
  );

  const byDate: Record<string, { completed: number; missed: number; pending: number }> = {};
  for (const r of rows) {
    byDate[r.scheduledDate] ??= { completed: 0, missed: 0, pending: 0 };
    if (r.status === 'completed') byDate[r.scheduledDate].completed = r.n;
    else if (r.status === 'missed') byDate[r.scheduledDate].missed = r.n;
    else byDate[r.scheduledDate].pending += r.n;
  }
  return byDate;
}

/** Current + longest streak of "perfect days" (all due occurrences completed). */
export function getStreaks(taskId?: string): { current: number; longest: number } {
  const db = getDb();
  const rows = taskId
    ? db.getAllSync<{ scheduledDate: string; status: OccurrenceStatus }>(
        `SELECT scheduledDate, status FROM occurrences WHERE taskId = ? AND scheduledDate <= ? ORDER BY scheduledDate ASC`,
        [taskId, format(new Date(), ISO_DATE)]
      )
    : db.getAllSync<{ scheduledDate: string; status: OccurrenceStatus }>(
        `SELECT scheduledDate, status FROM occurrences WHERE scheduledDate <= ? ORDER BY scheduledDate ASC`,
        [format(new Date(), ISO_DATE)]
      );

  const byDate = new Map<string, OccurrenceStatus[]>();
  for (const r of rows) {
    const arr = byDate.get(r.scheduledDate) ?? [];
    arr.push(r.status);
    byDate.set(r.scheduledDate, arr);
  }

  const dates = Array.from(byDate.keys()).sort();
  let current = 0;
  let longest = 0;
  let running = 0;
  let prevDate: Date | null = null;

  for (const d of dates) {
    const statuses = byDate.get(d)!;
    const isPerfect = statuses.every((s) => s === 'completed') && statuses.length > 0;
    const isConsecutive = prevDate ? differenceInCalendarDays(parseISO(d), prevDate) === 1 : true;

    if (isPerfect && isConsecutive) running += 1;
    else running = isPerfect ? 1 : 0;

    longest = Math.max(longest, running);
    prevDate = parseISO(d);
  }

  // Current streak = trailing run ending today/yesterday
  current = 0;
  for (let i = dates.length - 1; i >= 0; i--) {
    const statuses = byDate.get(dates[i])!;
    const isPerfect = statuses.every((s) => s === 'completed') && statuses.length > 0;
    if (!isPerfect) break;
    if (i < dates.length - 1) {
      const gap = differenceInCalendarDays(parseISO(dates[i + 1]), parseISO(dates[i]));
      if (gap !== 1) break;
    }
    current += 1;
  }

  return { current, longest };
}

// ---------- Notes ----------

export function listNotes(): NoteItem[] {
  return getDb().getAllSync<NoteItem>('SELECT * FROM notes ORDER BY updatedAt DESC');
}

export function createNote(title: string, content: string): NoteItem {
  const db = getDb();
  const id = cryptoRandomId();
  const now = new Date().toISOString();
  db.runSync('INSERT INTO notes (id, title, content, createdAt, updatedAt) VALUES (?,?,?,?,?)', [
    id,
    title,
    content,
    now,
    now,
  ]);
  return { id, title, content, createdAt: now, updatedAt: now };
}

export function updateNote(id: string, title: string, content: string) {
  getDb().runSync('UPDATE notes SET title = ?, content = ?, updatedAt = ? WHERE id = ?', [
    title,
    content,
    new Date().toISOString(),
    id,
  ]);
}

export function deleteNote(id: string) {
  getDb().runSync('DELETE FROM notes WHERE id = ?', [id]);
}

// ---------- Backup ----------

export function exportAllData() {
  const db = getDb();
  return {
    exportedAt: new Date().toISOString(),
    categories: db.getAllSync('SELECT * FROM categories'),
    goals: db.getAllSync('SELECT * FROM goals'),
    tasks: db.getAllSync('SELECT * FROM tasks'),
    occurrences: db.getAllSync('SELECT * FROM occurrences'),
    notes: db.getAllSync('SELECT * FROM notes'),
  };
}
