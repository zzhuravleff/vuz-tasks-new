// hooks/useSchedule.ts

import { useMemo } from "react";
import { LessonSlot, Subject, Semester } from "@/types";
import {
  getUpcomingLessonSlots,
  getLessonSlots,
  formatDateToISO,
  isToday,
  isTomorrow,
  formatDeadline,
  formatDateDisplay,
  formatTimeDisplay,
  getWeekNumber,
  isEvenWeek,
} from "@/lib/scheduleUtils";
import { useAsyncStore } from "@/hooks/useAsyncStore";

// ─── Хук для ближайших пар ─────────────────────────────────────────────────

interface UseUpcomingSlotsResult {
  slots: LessonSlot[];
  isLoading: boolean;
}

export function useUpcomingSlots(limit = 30): UseUpcomingSlotsResult {
  const { data, isLoading } = useAsyncStore();

  const slots = useMemo(() => {
    if (!data) return [];
    return getUpcomingLessonSlots(
      data.subjects,
      new Date(),
      data.semester,
      limit
    );
  }, [data, limit]);

  return { slots, isLoading };
}

// ─── Хук для пар конкретной дисциплины ─────────────────────────────────────

interface UseSubjectSlotsResult {
  slots: LessonSlot[];
  isLoading: boolean;
}

export function useSubjectSlots(
  subjectId: string,
  daysAhead = 60
): UseSubjectSlotsResult {
  const { data, isLoading } = useAsyncStore();

  const slots = useMemo(() => {
    if (!data) return [];

    const subject = data.subjects.find((s) => s.id === subjectId);
    if (!subject) return [];

    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + daysAhead);

    return getLessonSlots(subject, from, to, data.semester);
  }, [data, subjectId, daysAhead]);

  return { slots, isLoading };
}

// ─── Хук для пар на конкретный день ───────────────────────────────────────

interface UseDaySlotsResult {
  slots: LessonSlot[];
  isLoading: boolean;
}

export function useDaySlots(date: Date): UseDaySlotsResult {
  const { data, isLoading } = useAsyncStore();

  const slots = useMemo(() => {
    if (!data) return [];

    return data.subjects
      .flatMap((subject) =>
        getLessonSlots(subject, date, date, data.semester)
      )
      .sort((a, b) => a.lessonNumber - b.lessonNumber);
  }, [data, date]);

  return { slots, isLoading };
}

// ─── Хук для инфо о текущей неделе ────────────────────────────────────────

interface UseWeekInfoResult {
  weekNumber: number;
  isEven: boolean;
  weekLabel: string; // "1 неделя (нечётная)"
}

export function useWeekInfo(): UseWeekInfoResult | null {
  const { data } = useAsyncStore();

  return useMemo(() => {
    if (!data) return null;

    const now = new Date();
    const weekNumber = getWeekNumber(now, data.semester);
    const even = isEvenWeek(now, data.semester);

    return {
      weekNumber,
      isEven: even,
      weekLabel: `${weekNumber} неделя (${even ? "чётная" : "нечётная"})`,
    };
  }, [data]);
}

// ─── Реэкспорт утилит дат для удобства ────────────────────────────────────

export {
  formatDeadline,
  formatDateDisplay,
  formatTimeDisplay,
  isToday,
  isTomorrow,
  formatDateToISO,
};