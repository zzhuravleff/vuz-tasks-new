// app/settings/subjects/page.tsx

"use client";

import { memo, useCallback, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAsyncStore } from "@/hooks/useAsyncStore";
import { asyncStore } from "@/lib/asyncStore";
import { Subject, ScheduleRule } from "@/types";
import { TaskSkeleton } from "@/components/tasks/TaskSkeleton";

// ─── Константы ─────────────────────────────────────────────────────────────

const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const RULE_COLORS: Record<string, { bg: string; text: string }> = {
  "Еженедельно": { bg: "#E5E7EB", text: "#374151" },
  "Чёт":         { bg: "#DBEAFE", text: "#1D4ED8" },
  "Нечёт":       { bg: "#FED7AA", text: "#C2410C" },
  "Кастом":      { bg: "#EDE9FE", text: "#6D28D9" },
};

// ─── Мини-превью недели ────────────────────────────────────────────────────

interface DaySlot {
  lesson: number;
  type: string;
}

function getRulesForDay(rules: ScheduleRule[], dayOfWeek: number): DaySlot[] {
  const slots: DaySlot[] = [];
  for (const rule of rules) {
    if (rule.type === "Кастом") continue; // кастом не показываем в сетке
    if (rule.dayOfWeek === dayOfWeek) {
      for (const lesson of rule.lesson) {
        slots.push({ lesson, type: rule.type });
      }
    }
  }
  return slots.sort((a, b) => a.lesson - b.lesson);
}

function hasCustomRules(rules: ScheduleRule[]): boolean {
  return rules.some(r => r.type === "Кастом");
}

const WeekMini = memo(({ rules }: { rules: ScheduleRule[] }) => {
  const grid = useMemo(() =>
    DAYS.map((_, i) => getRulesForDay(rules, i + 1)),
    [rules]
  );

  const hasAny = grid.some(d => d.length > 0);
  const hasCustom = hasCustomRules(rules);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1">
        {DAYS.map((day, i) => {
          const slots = grid[i];
          return (
            <div key={day} className="flex flex-col items-center gap-1 flex-1">
              <span className="text-[9px] font-medium text-gray-400 uppercase">
                {day}
              </span>
              <div className="flex flex-col gap-0.5 w-full">
                {slots.length === 0 ? (
                  <div className="h-5 rounded-md bg-gray-50" />
                ) : (
                  slots.map((slot, j) => {
                    const colors = RULE_COLORS[slot.type];
                    return (
                      <div
                        key={j}
                        className="rounded-md flex items-center justify-center"
                        style={{ background: colors.bg, height: 20 }}
                      >
                        <span
                          className="text-[10px] font-bold"
                          style={{ color: colors.text }}
                        >
                          {slot.lesson}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Легенда и кастомные даты */}
      {(hasAny || hasCustom) && (
        <div className="flex items-center gap-2 flex-wrap">
          {Object.entries(RULE_COLORS)
            .filter(([type]) => {
              if (type === "Кастом") return hasCustom;
              return grid.some(slots => slots.some(s => s.type === type));
            })
            .map(([type, colors]) => (
              <div key={type} className="flex items-center gap-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: colors.bg, border: `1px solid ${colors.text}33` }}
                />
                <span className="text-[10px] text-gray-400">{type}</span>
              </div>
            ))
          }
          {hasCustom && (
            <span className="text-[10px] text-purple-400">
              + разовые занятия
            </span>
          )}
        </div>
      )}

      {!hasAny && !hasCustom && (
        <p className="text-[11px] text-gray-300">Расписание не добавлено</p>
      )}
    </div>
  );
});
WeekMini.displayName = "WeekMini";

// ─── Карточка предмета ─────────────────────────────────────────────────────

interface SubjectCardProps {
  subject: Subject;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const SubjectCard = memo(({ subject, onEdit, onDelete }: SubjectCardProps) => (
  <div className="bg-white rounded-3xl p-4 flex flex-col gap-3">

    {/* Верхняя строка */}
    <div className="flex items-start justify-between gap-2">
      <p className="text-[15px] font-semibold text-gray-900 leading-snug flex-1">
        {subject.name}
      </p>
      <div className="flex items-center gap-1 shrink-0">
        {/* Редактировать */}
        <button
          onClick={() => onEdit(subject.id)}
          className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center active:bg-gray-100 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M10 2L12 4L4.5 11.5H2.5V9.5L10 2Z"
              stroke="#9CA3AF" strokeWidth="1.25"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        {/* Удалить */}
        <button
          onClick={() => onDelete(subject.id)}
          className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center active:bg-red-50 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 3.5H12M5 3.5V2.5H9V3.5M4.5 3.5V11C4.5 11.3 4.7 11.5 5 11.5H9C9.3 11.5 9.5 11.3 9.5 11V3.5"
              stroke="#EF4444" strokeWidth="1.25"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>

    {/* Разделитель */}
    <div className="h-px bg-gray-50" />

    {/* Мини-превью */}
    <WeekMini rules={subject.rules} />
  </div>
));
SubjectCard.displayName = "SubjectCard";

// ─── Скелетон ──────────────────────────────────────────────────────────────

const SubjectsSkeleton = memo(() => (
  <div className="flex flex-col gap-2">
    {[1, 2, 3].map(i => (
      <div key={i} className="bg-white rounded-3xl p-4 animate-pulse flex flex-col gap-3">
        <div className="h-5 w-2/3 bg-gray-200 rounded-full" />
        <div className="h-px bg-gray-50" />
        <div className="flex gap-1">
          {Array.from({ length: 7 }).map((_, j) => (
            <div key={j} className="flex-1 h-10 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>
    ))}
  </div>
));
SubjectsSkeleton.displayName = "SubjectsSkeleton";

// ─── Страница ──────────────────────────────────────────────────────────────

export default function SubjectsPage() {
  const router = useRouter();
  const { data, isLoading } = useAsyncStore();
  const [isPending, startTransition] = useTransition();

  const navigate = useCallback((path: string) => {
    startTransition(() => router.push(path));
  }, [router]);

  const handleBack = useCallback(() => {
    startTransition(() => router.back());
  }, [router]);

  const handleEdit = useCallback((id: string) => {
    navigate(`/settings/subjects/${id}`);
  }, [navigate]);

  const handleDelete = useCallback(async (id: string) => {
    await asyncStore.deleteSubject(id);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">

      {/* Шапка */}
      <div className="flex items-center justify-between px-4 pt-6 pb-4">
        <button
          onClick={handleBack}
          className="w-9 h-9 rounded-2xl bg-white flex items-center justify-center active:scale-95 transition-transform shadow-sm"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9L11 14" stroke="#111827" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <h1 className="text-[17px] font-bold text-gray-900">Дисциплины</h1>

        <button
          onClick={() => navigate("/settings/subjects/new")}
          disabled={isPending}
          className="w-9 h-9 rounded-2xl bg-gray-900 flex items-center justify-center active:scale-95 transition-transform"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3V13M3 8H13" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <main className="flex-1 px-4 pb-10 flex flex-col gap-2">

        {isLoading && <SubjectsSkeleton />}

        {!isLoading && data?.subjects.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <div className="w-16 h-16 rounded-3xl bg-white flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect x="4" y="3" width="20" height="22" rx="3" stroke="#E5E7EB" strokeWidth="1.5"/>
                <path d="M9 9H19M9 13H15" stroke="#E5E7EB" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <p className="text-gray-900 font-semibold">Нет дисциплин</p>
              <p className="text-gray-400 text-sm">Добавьте первый предмет</p>
            </div>
            <button
              onClick={() => navigate("/settings/subjects/new")}
              className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-2xl active:scale-95 transition-transform"
            >
              Добавить дисциплину
            </button>
          </div>
        )}

        {!isLoading && data?.subjects.map(subject => (
          <SubjectCard
            key={subject.id}
            subject={subject}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}

      </main>
    </div>
  );
}