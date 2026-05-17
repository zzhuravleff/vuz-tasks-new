// types/index.ts

// ─── Семестр ───────────────────────────────────────────────────────────────

export interface Semester {
  startDate: string; // "YYYY-MM-DD"
  weeks: number;
}

// ─── Расписание ────────────────────────────────────────────────────────────

export type WeekType = "Еженедельно" | "Чёт" | "Нечёт";
export type RuleType = WeekType | "Кастом";

export interface BaseRule {
  id: string;
  lesson: number[]; // номера пар [1-6]
}

export interface WeeklyRule extends BaseRule {
  type: WeekType;
  dayOfWeek: number; // 1-7 (пн-вс)
}

export interface CustomRule extends BaseRule {
  type: "Кастом";
  date: string; // "YYYY-MM-DD"
}

export type ScheduleRule = WeeklyRule | CustomRule;

export interface Subject {
  id: string;
  name: string;
  rules: ScheduleRule[];
}

// ─── Расписание звонков ────────────────────────────────────────────────────

export interface LessonTime {
  start: string; // "HH:MM"
  end: string;   // "HH:MM"
}

export const LESSON_TIMES: Record<number, LessonTime> = {
  1: { start: "09:00", end: "10:30" },
  2: { start: "10:40", end: "12:10" },
  3: { start: "12:40", end: "14:10" },
  4: { start: "14:20", end: "15:50" },
  5: { start: "16:20", end: "17:50" },
  6: { start: "18:00", end: "19:30" },
};

// ─── Задачи ────────────────────────────────────────────────────────────────

export type TaskStatus = "active" | "completed" | "overdue";
export type TaskType = "Кастомная" | "По расписанию";

interface BaseTask {
  id: string;
  description?: string;
  status: "active" | "completed"; // overdue вычисляется, не хранится
  createdAt: string; // ISO datetime
}

export interface CustomTask extends BaseTask {
  type: "Кастомная";
  title: string;
  deadline: string; // ISO datetime
}

export interface ScheduleTask extends BaseTask {
  type: "По расписанию";
  subjectId: string;
  ruleId: string;
  lessonDate: string;   // "YYYY-MM-DD"
  lessonNumber: number; // 1-6
}

export type Task = CustomTask | ScheduleTask;

// ─── Корневые данные ───────────────────────────────────────────────────────

export interface AppData {
  semester: Semester;
  subjects: Subject[];
  tasks: Task[];
  version: number;
}

// ─── Утилитарные типы ──────────────────────────────────────────────────────

// Задача с вычисленным статусом (используется в UI)
export type ComputedTask = Task & {
  computedStatus: TaskStatus;
  deadline: string; // ISO datetime — для обоих типов задач
};

// Пара в расписании (для отображения и выбора в форме)
export interface LessonSlot {
  subjectId: string;
  subjectName: string;
  ruleId: string;
  lessonDate: string;   // "YYYY-MM-DD"
  lessonNumber: number; // 1-6
  lessonTime: LessonTime;
}