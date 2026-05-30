// lib/scheduleUtils.ts

import {
  Semester,
  Subject,
  ScheduleRule,
  LessonSlot,
  LessonTime,
  LESSON_TIMES,
  Task,
  CustomTask,
  ScheduleTask,
  ComputedTask,
} from "@/types";

// ─── Чётность недели ───────────────────────────────────────────────────────

/**
 * Возвращает номер недели семестра (1-based) для указанной даты.
 * Неделя считается с понедельника startDate.
 */
export function getWeekNumber(date: Date, semester: Semester): number {
  const start = new Date(semester.startDate);
  start.setHours(0, 0, 0, 0);

  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return Math.floor(diffDays / 7) + 1;
}

/** Чётная ли неделя семестра для указанной даты */
export function isEvenWeek(date: Date, semester: Semester): boolean {
  return getWeekNumber(date, semester) % 2 === 0;
}

// ─── Проверка правила ──────────────────────────────────────────────────────

/**
 * Проверяет, попадает ли указанная дата под правило расписания.
 * dayOfWeek в данных: 1=пн, 6=сб; в JS Date: 0=вс, 1=пн, 6=сб
 */
export function ruleMatchesDate(
  rule: ScheduleRule,
  date: Date,
  semester: Semester
): boolean {
  if (rule.type === "Кастом") {
    const ruleDate = new Date(rule.date);
    return (
      ruleDate.getFullYear() === date.getFullYear() &&
      ruleDate.getMonth() === date.getMonth() &&
      ruleDate.getDate() === date.getDate()
    );
  }

  // Для недельных правил сначала проверяем день недели
  const jsDay = date.getDay(); // 0=вс
  const appDay = jsDay === 0 ? 7 : jsDay; // приводим к 1=пн, 7=вс
  if (rule.dayOfWeek !== appDay) return false;

  if (rule.type === "Еженедельно") return true;

  const even = isEvenWeek(date, semester);
  if (rule.type === "Чёт") return even;
  if (rule.type === "Нечёт") return !even;

  return false;
}

// ─── Дедлайн пары ──────────────────────────────────────────────────────────

/**
 * Возвращает ISO datetime начала пары для указанной даты и номера пары.
 */
export function getLessonDeadline(lessonDate: string, lessonNumber: number): string {
  const time = LESSON_TIMES[lessonNumber];
  if (!time) throw new Error(`Неизвестный номер пары: ${lessonNumber}`);

  const [hours, minutes] = time.start.split(":").map(Number);
  const date = new Date(lessonDate);
  date.setHours(hours, minutes, 0, 0);

  return date.toISOString();
}

// ─── Генерация слотов ──────────────────────────────────────────────────────

/**
 * Возвращает все пары дисциплины в диапазоне дат [from, to].
 */
export function getLessonSlots(
  subject: Subject,
  from: Date,
  to: Date,
  semester: Semester
): LessonSlot[] {
  const slots: LessonSlot[] = [];

  const current = new Date(from);
  current.setHours(0, 0, 0, 0);

  const end = new Date(to);
  end.setHours(23, 59, 59, 999);

  while (current <= end) {
    for (const rule of subject.rules) {
      if (!ruleMatchesDate(rule, current, semester)) continue;

      for (const lessonNumber of rule.lesson) {
        slots.push({
          subjectId: subject.id,
          subjectName: subject.name,
          ruleId: rule.id,
          lessonDate: formatDateToISO(current),
          lessonNumber,
          lessonTime: LESSON_TIMES[lessonNumber],
        });
      }
    }

    current.setDate(current.getDate() + 1);
  }

  // Сортируем по дате и номеру пары
  return slots.sort((a, b) => {
    const dateDiff = a.lessonDate.localeCompare(b.lessonDate);
    return dateDiff !== 0 ? dateDiff : a.lessonNumber - b.lessonNumber;
  });
}

/**
 * Возвращает ближайшие N пар для всех дисциплин начиная с указанной даты.
 */
export function getUpcomingLessonSlots(
  subjects: Subject[],
  from: Date,
  semester: Semester,
  limit = 30
): LessonSlot[] {
  // Берём диапазон в 60 дней — покрывает конец семестра
  const to = new Date(from);
  to.setDate(to.getDate() + 60);

  const slots = subjects.flatMap((subject) =>
    getLessonSlots(subject, from, to, semester)
  );

  return slots
    .sort((a, b) => {
      const dateDiff = a.lessonDate.localeCompare(b.lessonDate);
      return dateDiff !== 0 ? dateDiff : a.lessonNumber - b.lessonNumber;
    })
    .slice(0, limit);
}

// ─── Вычисление статуса задачи ─────────────────────────────────────────────

/**
 * Вычисляет реальный статус задачи с учётом текущего времени.
 * overdue не хранится в JSON — определяется здесь.
 */
export function computeTaskStatus(
  task: Task
): "active" | "completed" | "overdue" {
  if (task.status === "completed") {
    return task.status;
  }

  const deadline =
    task.type === "Кастомная"
      ? task.deadline
      : getLessonDeadline(task.lessonDate, task.lessonNumber);

  const isOverdue = new Date(deadline) < new Date();
  return isOverdue ? "overdue" : "active";
}

/**
 * Обогащает задачу вычисленным статусом и единым дедлайном.
 */
export function computeTask(task: Task): ComputedTask {
  const deadline =
    task.type === "Кастомная"
      ? task.deadline
      : getLessonDeadline(task.lessonDate, task.lessonNumber);

  return {
    ...task,
    deadline,
    computedStatus: computeTaskStatus(task),
  };
}

/**
 * Обогащает массив задач и сортирует: сначала active/overdue по дедлайну,
 * потом completed.
 */
export function computeAndSortTasks(tasks: Task[]): ComputedTask[] {
  const computed = tasks.map(computeTask);

  const active = computed
    .filter((t) => t.computedStatus === "active" || t.computedStatus === "overdue")
    .sort((a, b) => a.deadline.localeCompare(b.deadline));

  const done = computed
    .filter((t) => t.computedStatus === "completed")
    .sort((a, b) => b.deadline.localeCompare(a.deadline));

  return [...active, ...done];
}

// ─── Утилиты дат ───────────────────────────────────────────────────────────

/** "YYYY-MM-DD" из объекта Date */
export function formatDateToISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Отображаемая дата: "15 апр. 2026" */
export function formatDateDisplay(date: string): string {
  const d = new Date(date);
  const months = [
    "янв.", "февр.", "мар.", "апр.", "мая", "июн.",
    "июл.", "авг.", "сент.", "окт.", "нояб.", "дек.",
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/** Отображаемое время: "09:00" */
export function formatTimeDisplay(date: string): string {
  const d = new Date(date);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Проверяет, сегодняшняя ли дата */
export function isToday(date: string): boolean {
  const d = new Date(date);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

/** Проверяет, завтрашняя ли дата */
export function isTomorrow(date: string): boolean {
  const d = new Date(date);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return (
    d.getFullYear() === tomorrow.getFullYear() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getDate() === tomorrow.getDate()
  );
}

/**
 * Человекочитаемый дедлайн:
 * "Сегодня, 14:20" / "Завтра, 09:00" / "15 апр., 14:20"
 */
export function formatDeadline(deadline: string): string {
  if (isToday(deadline)) return `Сегодня, ${formatTimeDisplay(deadline)}`;
  if (isTomorrow(deadline)) return `Завтра, ${formatTimeDisplay(deadline)}`;
  return `${formatDateDisplay(deadline)}, ${formatTimeDisplay(deadline)}`;
}