// app/settings/subjects/page.tsx

"use client";

import { memo, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAsyncStore } from "@/hooks/useAsyncStore";
import { Subject, ScheduleRule } from "@/types";
import { Button, IconChevronLeft } from "@heroui/react";

// ─── Константы ─────────────────────────────────────────────────────────────

const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

const AVATAR_COLORS = [
  { bg: "bg-accent/5", text: "text-accent" },
  { bg: "bg-success/5", text: "text-success" },
  { bg: "bg-warning/5", text: "text-warning" },
  { bg: "bg-danger/5", text: "text-danger" },
];

const DAY_COLORS: Record<string, { bg: string; text: string; dots: string }> = {
  "Еженедельно": { bg: "bg-accent/15", text: "text-accent", dots: "bg-accent" },
  "Чёт":         { bg: "bg-success/15", text: "text-success", dots: "bg-success" },
  "Нечёт":       { bg: "bg-warning/15", text: "text-warning", dots: "bg-warning" },
  "Кастом":      { bg: "bg-danger/15", text: "text-danger", dots: "bg-danger" },
};

// ─── Утилиты ───────────────────────────────────────────────────────────────

function getActiveDays(rules: ScheduleRule[]): Map<number, string> {
  const map = new Map<number, string>();
  const priority: Record<string, number> = {
    "Еженедельно": 3, "Чёт": 2, "Нечёт": 2, "Кастом": 1,
  };
  for (const rule of rules) {
    if (rule.type === "Кастом") continue;
    const current = map.get(rule.dayOfWeek);
    if (!current || (priority[rule.type] ?? 0) > (priority[current] ?? 0)) {
      map.set(rule.dayOfWeek, rule.type);
    }
  }
  return map;
}

function getSubjectInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

function getLessonsCount(rules: ScheduleRule[]): string {
  const weeklyCount = rules
    .filter(r => r.type !== "Кастом")
    .reduce((sum, r) => sum + r.lesson.length, 0);
  const customCount = rules.filter(r => r.type === "Кастом").length;
  const parts = [];
  if (weeklyCount > 0) parts.push(`${weeklyCount} ${weeklyCount === 1 ? "пара" : weeklyCount < 5 ? "пары" : "пар"} в нед.`);
  if (customCount > 0) parts.push(`${customCount} кастом${customCount === 1 ? "" : "а"}${customCount > 1 ? "ов" : ""}`);
  if (parts.length === 0) return "Расписание не добавлено";
  return parts.join(" • ");
}

// ─── Карточка ──────────────────────────────────────────────────────────────

interface SubjectCardProps {
  subject: Subject;
  colorIdx: number;
  onEdit: (id: string) => void;
}

const SubjectCard = memo(({ subject, colorIdx, onEdit }: SubjectCardProps) => {
  const avatarColor = AVATAR_COLORS[colorIdx % AVATAR_COLORS.length];
  const activeDays = getActiveDays(subject.rules);
  const lessonsLabel = getLessonsCount(subject.rules);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onEdit(subject.id)}
      onKeyDown={e => e.key === "Enter" && onEdit(subject.id)}
      className="bg-white rounded-3xl p-4 flex flex-col gap-3 active:scale-[0.98] transition-transform cursor-pointer"
    >
      {/* Аватар + название */}
      <div className="flex items-center gap-3">
        <div
          className={`w-11 h-11 rounded-2xl flex items-center justify-center text-2xl font-bold shrink-0 ${avatarColor.bg} ${avatarColor.text}`}
        >
          {getSubjectInitial(subject.name)}
        </div>
        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          <p className="text-base font-medium text-black leading-4 line-clamp-2">
            {subject.name}
          </p>
          <p className="text-sm text-gray-400">{lessonsLabel}</p>
        </div>
      </div>

      {/* Дни */}
      <div className="flex gap-1.5">
        {DAYS.map((day, i) => {
          const dayNum = i + 1;
          const ruleType = activeDays.get(dayNum);
          const colors = ruleType ? DAY_COLORS[ruleType] : null;
          const lessonDots = Array.from({ length: 6 }, (_, li) =>
            subject.rules.some(r => {
              if (r.type === "Кастом") return false;
              return r.dayOfWeek === dayNum && r.lesson.includes(li + 1);
            })
          );

          return (
            <div key={dayNum} className="flex-1 flex flex-col items-center gap-0.5">
              <div
                className={`h-8 rounded-xl flex items-center justify-center w-full ${colors ? colors.bg : "bg-gray-100"} ${colors?.text} font-medium text-xs`}
              >
                <span
                  style={colors ? { color: colors.text } : { color: "#D1D5DB" }}
                >
                  {day}
                </span>
              </div>
              <div className="flex gap-0.5 items-center justify-center">
                {lessonDots.map((active, j) => (
                  <div
                    key={j}
                    className={`size-1 rounded-full ${active ? (colors ? colors.dots : "bg-gray-400") : "bg-gray-200"}`}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
SubjectCard.displayName = "SubjectCard";

// ─── Скелетон ──────────────────────────────────────────────────────────────

const SubjectsSkeleton = memo(() => (
  <div className="flex flex-col gap-2">
    {[1, 2, 3].map(i => (
      <div key={i} className="bg-white rounded-3xl p-4 animate-pulse flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gray-100" />
          <div className="flex flex-col gap-1.5 flex-1">
            <div className="h-4 w-3/4 bg-gray-200 rounded-full" />
            <div className="h-3 w-1/3 bg-gray-100 rounded-full" />
          </div>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: 6 }).map((_, j) => (
            <div key={j} className="flex-1 h-8 bg-gray-100 rounded-xl" />
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

  return (
    <div className="flex flex-col min-h-screen">

      {/* Фиксированная кнопка назад */}
      <Button variant="tertiary" className="fixed" onPress={handleBack}>
        <IconChevronLeft className="size-4" />
        Назад
      </Button>

      {/* Фиксированная кнопка добавить */}
      <Button
        variant="primary"
        className="fixed right-4"
        onPress={() => navigate("/settings/subjects/new")}
        isDisabled={isPending}
      >
        Добавить
      </Button>

      {/* Заголовок */}
      <h1 className="text-2xl font-medium text-center mt-12 mb-4">Дисциплины</h1>

      {/* Контент */}
      <div className="flex flex-col gap-2 pb-10">

        {isLoading && <SubjectsSkeleton />}

        {!isLoading && (!data?.subjects || data.subjects.length === 0) && (
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <div className="w-16 h-16 rounded-3xl bg-white flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect x="4" y="3" width="20" height="22" rx="3" stroke="#E5E7EB" strokeWidth="1.5"/>
                <path d="M9 9H19M9 14H15" stroke="#E5E7EB" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <p className="font-semibold text-black">Нет дисциплин</p>
              <p className="text-gray-400 text-sm leading-snug">
                Добавьте предметы чтобы создавать задачи по расписанию
              </p>
            </div>
            <Button
              variant="primary"
              onPress={() => navigate("/settings/subjects/new")}
            >
              Добавить дисциплину
            </Button>
          </div>
        )}

        {!isLoading && data?.subjects && data.subjects.length > 0 &&
          data.subjects.map((subject, idx) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              colorIdx={idx}
              onEdit={handleEdit}
            />
          ))
        }

      </div>
    </div>
  );
}