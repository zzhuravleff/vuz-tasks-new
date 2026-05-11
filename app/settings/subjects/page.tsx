// app/settings/subjects/page.tsx

"use client";

import { memo, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAsyncStore } from "@/hooks/useAsyncStore";
import { asyncStore } from "@/lib/asyncStore";
import { Subject } from "@/types";

// ─── Типы правил для отображения ───────────────────────────────────────────

const DAYS = ["", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function ruleLabel(rule: Subject["rules"][number]): string {
  if (rule.type === "Кастом") {
    const d = new Date(rule.date);
    const months = ["янв.", "февр.", "мар.", "апр.", "мая", "июн.",
                    "июл.", "авг.", "сент.", "окт.", "нояб.", "дек."];
    return `${d.getDate()} ${months[d.getMonth()]} · ${rule.lesson.join(", ")} пара`;
  }

  const day = DAYS[rule.dayOfWeek];
  const lessons = rule.lesson.join(", ");
  const type = rule.type === "Еженедельно" ? "" : ` · ${rule.type}`;
  return `${day}${type} · ${lessons} пара`;
}

// ─── Карточка предмета ─────────────────────────────────────────────────────

interface SubjectCardProps {
  subject: Subject;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const SubjectCard = memo(({ subject, onEdit, onDelete }: SubjectCardProps) => (
  <div className="bg-white rounded-3xl overflow-hidden">

    {/* Шапка */}
    <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-50">
      <p className="text-[15px] font-semibold text-gray-900 flex-1 leading-snug pr-2">
        {subject.name}
      </p>
      <div className="flex items-center gap-1">
        {/* Редактировать */}
        <button
          onClick={() => onEdit(subject.id)}
          className="w-8 h-8 rounded-xl flex items-center justify-center active:bg-gray-100 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M11.5 2.5L13.5 4.5L5 13H3V11L11.5 2.5Z"
              stroke="#9CA3AF" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
        </button>
        {/* Удалить */}
        <button
          onClick={() => onDelete(subject.id)}
          className="w-8 h-8 rounded-xl flex items-center justify-center active:bg-red-50 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M3 4.5H13M6 4.5V3H10V4.5M5.5 4.5V12.5C5.5 13 5.8 13.5 6.5 13.5H9.5C10.2 13.5 10.5 13 10.5 12.5V4.5"
              stroke="#EF4444" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>

    {/* Правила */}
    {subject.rules.length === 0 ? (
      <div className="px-4 py-3">
        <span className="text-[13px] text-gray-300">Нет правил расписания</span>
      </div>
    ) : (
      <div className="flex flex-col">
        {subject.rules.map((rule) => (
          <div
            key={rule.id}
            className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-50 last:border-0"
          >
            {/* Тип */}
            <span className={`
              text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0
              ${rule.type === "Еженедельно" ? "bg-gray-100 text-gray-500" :
                rule.type === "Чёт"         ? "bg-blue-50 text-blue-600" :
                rule.type === "Нечёт"       ? "bg-orange-50 text-orange-600" :
                                              "bg-purple-50 text-purple-600"}
            `}>
              {rule.type}
            </span>
            <span className="text-[13px] text-gray-600 font-medium">
              {ruleLabel(rule)}
            </span>
          </div>
        ))}
      </div>
    )}
  </div>
));
SubjectCard.displayName = "SubjectCard";

// ─── Скелетон ──────────────────────────────────────────────────────────────

const SubjectsSkeleton = memo(() => (
  <div className="flex flex-col gap-2">
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-white rounded-3xl p-4 animate-pulse flex flex-col gap-3">
        <div className="h-5 w-2/3 bg-gray-200 rounded-full" />
        <div className="h-4 w-1/2 bg-gray-100 rounded-full" />
        <div className="h-4 w-1/3 bg-gray-100 rounded-full" />
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
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <h1 className="text-[17px] font-bold text-gray-900">Предметы</h1>

        {/* Добавить */}
        <button
          onClick={() => navigate("/settings/subjects/new")}
          disabled={isPending}
          className="w-9 h-9 rounded-2xl bg-gray-900 flex items-center justify-center active:scale-95 transition-transform shadow-sm"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 4V14M4 9H14" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <main className="flex-1 px-4 pb-10 flex flex-col gap-2">

        {isLoading && <SubjectsSkeleton />}

        {!isLoading && data?.subjects.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <div className="w-16 h-16 rounded-3xl bg-white flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect x="6" y="4" width="20" height="24" rx="3" stroke="#E5E7EB" strokeWidth="1.5" />
                <path d="M11 11H21M11 16H17" stroke="#E5E7EB" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div className="flex flex-col items-center gap-1">
              <p className="text-gray-900 font-semibold text-base">Нет предметов</p>
              <p className="text-gray-400 text-sm">Добавьте первый предмет</p>
            </div>
            <button
              onClick={() => navigate("/settings/subjects/new")}
              className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-2xl active:scale-95 transition-transform"
            >
              Добавить предмет
            </button>
          </div>
        )}

        {!isLoading && data?.subjects.map((subject) => (
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