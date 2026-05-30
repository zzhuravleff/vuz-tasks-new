// components/subjects/WeekPreview.tsx

"use client";

import { memo, useMemo } from "react";
import { ScheduleRule, Semester, LESSON_TIMES } from "@/types";
import { ruleMatchesDate, getWeekNumber } from "@/lib/scheduleUtils";

interface WeekPreviewProps {
  rules: ScheduleRule[];
  semester: Semester;
}

const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const LESSONS_COUNT = 6;

// Получаем даты текущей недели (пн–вс)
function getCurrentWeekDates(): Date[] {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

const RULE_TYPE_COLOR: Record<string, { bg: string; text: string }> = {
  "Еженедельно": { bg: "#E5E7EB", text: "#374151" },
  "Чёт":        { bg: "#DBEAFE", text: "#1D4ED8" },
  "Нечёт":      { bg: "#FED7AA", text: "#C2410C" },
  "Кастом":     { bg: "#EDE9FE", text: "#6D28D9" },
};

export const WeekPreview = memo(({ rules, semester }: WeekPreviewProps) => {
  const weekDates = useMemo(() => getCurrentWeekDates(), []);

  // Для каждого дня недели — какие пары есть
  const schedule = useMemo(() => {
    return weekDates.map((date) => {
      const lessons: { lesson: number; rule: ScheduleRule }[] = [];
      for (const rule of rules) {
        if (!ruleMatchesDate(rule, date, semester)) continue;
        for (const lesson of rule.lesson) {
          lessons.push({ lesson, rule });
        }
      }
      return lessons.sort((a, b) => a.lesson - b.lesson);
    });
  }, [rules, semester, weekDates]);

  const hasAnyLesson = schedule.some(day => day.length > 0);
  const weekNum = getWeekNumber(new Date(), semester);
  const isEven = weekNum % 2 === 0;

  if (rules.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide">
          Превью — {weekNum} неделя ({isEven ? "чётная" : "нечётная"})
        </span>
      </div>

      {!hasAnyLesson ? (
        <div className="bg-white rounded-2xl px-4 py-3">
          <p className="text-[13px] text-gray-300 text-center">
            На этой неделе пар нет
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden">
          {weekDates.map((date, dayIdx) => {
            const lessons = schedule[dayIdx];
            if (lessons.length === 0) return null;
            const isToday = date.toDateString() === new Date().toDateString();

            return (
              <div
                key={dayIdx}
                className="flex items-start gap-3 px-4 py-2.5 border-b border-gray-50 last:border-0"
              >
                {/* День */}
                <div className={`
                  flex flex-col items-center shrink-0 w-8
                  ${isToday ? "text-blue-500" : "text-gray-400"}
                `}>
                  <span className="text-[11px] font-semibold uppercase">
                    {DAYS[dayIdx]}
                  </span>
                  <span className={`
                    text-[13px] font-bold w-6 h-6 flex items-center justify-center rounded-full
                    ${isToday ? "bg-blue-500 text-white" : ""}
                  `}>
                    {date.getDate()}
                  </span>
                </div>

                {/* Пары */}
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {lessons.map(({ lesson, rule }, i) => {
                    const time = LESSON_TIMES[lesson];
                    const colors = RULE_TYPE_COLOR[rule.type] ?? RULE_TYPE_COLOR["Еженедельно"];
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-1 px-2 py-1 rounded-xl"
                        style={{ background: colors.bg }}
                      >
                        <span className="text-[12px] font-semibold" style={{ color: colors.text }}>
                          {lesson}
                        </span>
                        <span className="text-[11px]" style={{ color: colors.text, opacity: 0.7 }}>
                          {time.start}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
WeekPreview.displayName = "WeekPreview";