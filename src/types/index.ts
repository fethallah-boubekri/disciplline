export type Priority = 'low' | 'medium' | 'high';

export type RecurrenceType = 'once' | 'daily' | 'weekly' | 'custom';

// daysOfWeek: 0 = Sunday ... 6 = Saturday
export interface Recurrence {
  type: RecurrenceType;
  daysOfWeek?: number[];
  endDate?: string | null; // ISO date, null = never
}

export interface ReminderConfig {
  enabled: boolean;
  repetitions: number; // how many times the reminder fires
  intervalMinutes: number; // gap between repetitions
}

export interface TaskDefinition {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  goalId: string | null;
  priority: Priority;
  startDate: string; // ISO date of first occurrence
  startTime: string; // "HH:mm"
  durationMinutes: number | null;
  recurrence: Recurrence;
  reminder: ReminderConfig;
  createdAt: string;
  updatedAt: string;
  active: boolean;
}

export type OccurrenceStatus = 'pending' | 'completed' | 'missed' | 'snoozed';

export interface TaskOccurrence {
  id: string;
  taskId: string;
  scheduledDate: string; // ISO date
  scheduledTime: string; // "HH:mm"
  status: OccurrenceStatus;
  completedAt: string | null;
  missedAt: string | null;
  snoozedUntil: string | null;
  result: string | null;
  note: string | null;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  active: boolean;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// Joined view used by the UI (occurrence + its parent task's display info)
export interface OccurrenceWithTask extends TaskOccurrence {
  title: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  priority: Priority;
  durationMinutes: number | null;
}

export interface PeriodStats {
  totalDue: number;
  completed: number;
  missed: number;
  pending: number;
  executionRate: number; // 0-100
}
