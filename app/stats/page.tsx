// app/stats/page.tsx

"use client";

import { useMemo, useState, memo, useCallback } from "react";
import { useAsyncStore } from "@/hooks/useAsyncStore";
import { useTasks } from "@/hooks/useAsyncStore";
import { useWeekInfo } from "@/hooks/useSchedule";
import { TaskList } from "@/components/tasks/TaskList";
import { PageHeader } from "@/components/ui/PageHeader";
import { ComputedTask } from "@/types";

// ─── Типы ──────────────────────────────────────────────────────────────────

type ArchiveTab = "completed" | "overdue";

// ─── Карточка цифры ────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number | string;
  sub?: string;
  accent?: "green" | "red" | "gray" | "blue";
}

const StatCard = memo(({ label, value, sub, accent = "gray" }: StatCardProps) => {
  const accentClass = {
    green: "text-green-600",
    red: "text-red-500",
    gray: "text-black",
    blue: "text-blue-600",
  }[accent];

  return (
    <div className="bg-white rounded-3xl p-4 flex flex-col gap-1">
      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
        {label}
      </span>
      <span className={`text-[28px] font-bold leading-none ${accentClass}`}>
        {value}
      </span>
      {sub && (
        <span className="text-[12px] text-gray-400 font-medium">{sub}</span>
      )}
    </div>
  );
});
StatCard.displayName = "StatCard";

// ─── Прогресс-бар ──────────────────────────────────────────────────────────

interface ProgressBarProps {
  label: string;
  value: number;
  total: number;
  color: string;
}

const ProgressBar = memo(({ label, value, total, color }: ProgressBarProps) => {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-gray-700">{label}</span>
        <span className="text-[13px] font-semibold text-gray-400">
          {value} · {pct}%
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
});
ProgressBar.displayName = "ProgressBar";

// ─── Статистика по предметам ───────────────────────────────────────────────

interface SubjectStatRowProps {
  name: string;
  total: number;
  completed: number;
  overdue: number;
}

const SubjectStatRow = memo(({ name, total, completed, overdue }: SubjectStatRowProps) => {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  return (
    <div className="flex flex-col gap-1.5 py-3 border-b border-gray-50 last:border-0">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[14px] font-medium text-gray-800 line-clamp-1 flex-1">
          {name}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {overdue > 0 && (
            <span className="text-[11px] font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
              {overdue} просроч.
            </span>
          )}
          <span className="text-[12px] font-semibold text-gray-400">
            {completed}/{total}
          </span>
        </div>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gray-800 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
});
SubjectStatRow.displayName = "SubjectStatRow";

// ─── Переключатель архива ──────────────────────────────────────────────────

interface ArchiveTabsProps {
  active: ArchiveTab;
  onChange: (tab: ArchiveTab) => void;
  counts: Record<ArchiveTab, number>;
}

const ARCHIVE_TABS: { key: ArchiveTab; label: string; color: string }[] = [
  { key: "completed", label: "Выполнены", color: "text-green-600" },
  { key: "overdue",   label: "Просрочены", color: "text-red-500" },
];

const ArchiveTabs = memo(({ active, onChange, counts }: ArchiveTabsProps) => (
  <div className="flex bg-gray-100 rounded-2xl p-1 gap-1">
    {ARCHIVE_TABS.map(({ key, label, color }) => (
      <button
        key={key}
        onClick={() => onChange(key)}
        className={`
          flex-1 py-2 px-1 rounded-xl text-[12px] font-semibold
          transition-all duration-200 active:scale-[0.97] flex flex-col items-center gap-0.5
          ${active === key ? "bg-white shadow-sm text-black" : "text-gray-400"}
        `}
      >
        <span>{label}</span>
        <span className={`text-[13px] font-bold ${active === key ? color : "text-gray-300"}`}>
          {counts[key]}
        </span>
      </button>
    ))}
  </div>
));
ArchiveTabs.displayName = "ArchiveTabs";

// ─── Страница ──────────────────────────────────────────────────────────────

export default function StatsPage() {
  const { data, isLoading } = useAsyncStore();
  const { tasks } = useTasks();
  const weekInfo = useWeekInfo();
  const [archiveTab, setArchiveTab] = useState<ArchiveTab>("completed");

  const handleArchiveTabChange = useCallback((tab: ArchiveTab) => {
    setArchiveTab(tab);
  }, []);

  // ── Общая статистика ───────────────────────────────────────────────────

  const stats = useMemo(() => {
    const total     = tasks.length;
    const completed = tasks.filter((t) => t.computedStatus === "completed").length;
    const overdue   = tasks.filter((t) => t.computedStatus === "overdue").length;
    const active    = tasks.filter((t) => t.computedStatus === "active").length;
    const done      = completed;
    const rate      = total === 0 ? 0 : Math.round((completed / total) * 100);

    return { total, completed, overdue, active, done, rate };
  }, [tasks]);

  // ── Прогресс семестра ──────────────────────────────────────────────────

  const semesterProgress = useMemo(() => {
    if (!data || !weekInfo) return null;
    const pct = Math.min(100, Math.round((weekInfo.weekNumber / data.semester.weeks) * 100));
    return { pct, current: weekInfo.weekNumber, total: data.semester.weeks };
  }, [data, weekInfo]);

  // ── Статистика по предметам ────────────────────────────────────────────

  const subjectStats = useMemo(() => {
    if (!data) return [];
    return data.subjects
      .map((subject) => {
        const subjectTasks = tasks.filter(
          (t) => t.type === "По расписанию" && t.subjectId === subject.id
        );
        return {
          id: subject.id,
          name: subject.name,
          total: subjectTasks.length,
          completed: subjectTasks.filter((t) => t.computedStatus === "completed").length,
          overdue: subjectTasks.filter((t) => t.computedStatus === "overdue").length,
        };
      })
      .filter((s) => s.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [data, tasks]);

  // ── subjectMap для TaskList ────────────────────────────────────────────

  const subjectMap = useMemo(() => {
    if (!data) return {};
    return Object.fromEntries(data.subjects.map((s) => [s.id, s.name]));
  }, [data]);

  // ── Архивные задачи ────────────────────────────────────────────────────

  const archiveTasks = useMemo((): ComputedTask[] => {
    return tasks.filter((t) => t.computedStatus === archiveTab);
  }, [tasks, archiveTab]);

  const archiveCounts = useMemo(() => ({
    completed: tasks.filter((t) => t.computedStatus === "completed").length,
    overdue:   tasks.filter((t) => t.computedStatus === "overdue").length,
  }), [tasks]);

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title="Статистика" showWeekInfo />

      <main className="flex-1 px-4 pb-24 flex flex-col gap-3">

        {/* ── Цифры ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-2">
          <StatCard
            label="Выполнено"
            value={stats.completed}
            sub={`из ${stats.total} задач`}
            accent="green"
          />
          <StatCard
            label="Процент выполнения"
            value={`${stats.rate}%`}
            sub="за семестр"
            accent="blue"
          />
          <StatCard
            label="Активных"
            value={stats.active}
            sub="сейчас в работе"
            accent="gray"
          />
          <StatCard
            label="Просрочено"
            value={stats.overdue}
            sub="требуют внимания"
            accent={stats.overdue > 0 ? "red" : "gray"}
          />
        </div>

        {/* ── Прогресс семестра ──────────────────────────────────────── */}
        {/*
        {semesterProgress && (
          <div className="bg-white rounded-3xl p-4 flex flex-col gap-3">
            <span className="text-[13px] font-semibold text-gray-400 uppercase tracking-wide">
              Прогресс семестра
            </span>
            <ProgressBar
              label={`Неделя ${semesterProgress.current} из ${semesterProgress.total}`}
              value={semesterProgress.current}
              total={semesterProgress.total}
              color="bg-black"
            />
            <ProgressBar
              label="Выполнено задач"
              value={stats.completed}
              total={stats.total}
              color="bg-green-500"
            />
            {stats.overdue > 0 && (
              <ProgressBar
                label="Просрочено"
                value={stats.overdue}
                total={stats.total}
                color="bg-red-400"
              />
            )}
          </div>
        )}
        */}

        {/* ── По предметам ───────────────────────────────────────────── */}
        {/*
        {subjectStats.length > 0 && (
          <div className="bg-white rounded-3xl px-4 py-3">
            <span className="text-[13px] font-semibold text-gray-400 uppercase tracking-wide">
              По предметам
            </span>
            <div className="mt-2">
              {subjectStats.map((s) => (
                <SubjectStatRow
                  key={s.id}
                  name={s.name}
                  total={s.total}
                  completed={s.completed}
                  overdue={s.overdue}
                />
              ))}
            </div>
          </div>
        )}
        */}

        {/* ── Архив ─────────────────────────────────────────────────── */}
        {/*
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold text-gray-400 uppercase tracking-wide px-1">
            Архив
          </span>
          <ArchiveTabs
            active={archiveTab}
            onChange={handleArchiveTabChange}
            counts={archiveCounts}
          />
          <TaskList
            tasks={archiveTasks}
            isLoading={isLoading}
            subjectMap={subjectMap}
            emptyTitle="Список пуст"
            emptyDescription={
              archiveTab === "completed" ? "Нет выполненных задач" :
              archiveTab === "overdue"   ? "Нет просроченных задач" :
                                          "Нет отменённых задач"
            }
          />
        </div>
        */}

      </main>
    </div>
  );
}