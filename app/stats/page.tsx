// app/stats/page.tsx

"use client";

import { useMemo, useState, memo, useCallback } from "react";
import { useAsyncStore } from "@/hooks/useAsyncStore";
import { useTasks } from "@/hooks/useAsyncStore";
import { useWeekInfo } from "@/hooks/useSchedule";
import { TaskList } from "@/components/tasks/TaskList";
import { ComputedTask } from "@/types";
import { Chip, Label, ProgressBar, Tabs } from "@heroui/react";
import { PetWidget } from "@/components/pet/PetWidget";
import { ArchiveTaskCard } from "@/components/tasks/ArchiveTaskCard";

// ─── Типы ──────────────────────────────────────────────────────────────────

type ArchiveTab = "all" | "completed" | "overdue";

// ─── Карточка цифры ────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number | string;
  sub?: string;
  accent?: "green" | "red" | "gray" | "blue";
}

const StatCard = memo(({ label, value, sub, accent = "gray" }: StatCardProps) => {
  const accentClass = {
    green: "text-success",
    red: "text-danger",
    gray: "text-black",
    blue: "text-accent",
  }[accent];

  return (
    <div className="bg-white rounded-3xl p-4 flex flex-col gap-1">
      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
        {label}
      </span>
      <span className={`text-2xl font-bold leading-none ${accentClass}`}>
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
  color: "accent" | "success" | "danger";
}

const ProgressBarUI = memo(({ label, value, total, color }: ProgressBarProps) => {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <ProgressBar aria-label="Bar" color={color} value={pct}>
      <Label className="text-base font-medium">{label}</Label>
      <ProgressBar.Output className="text-base font-bold" />
      <ProgressBar.Track>
        <ProgressBar.Fill />
      </ProgressBar.Track>
    </ProgressBar>
  );
});
ProgressBarUI.displayName = "ProgressBarUI";

// ─── Статистика по дисплинам ───────────────────────────────────────────────

interface SubjectStatRowProps {
  name: string;
  total: number;
  completed: number;
  overdue: number;
}

const SubjectStatRow = memo(({ name, total, completed }: SubjectStatRowProps) => {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  return (
    <ProgressBar aria-label="Bar" color="default" value={pct}>
      <Label className="text-base font-medium">{name}</Label>
      <ProgressBar.Output className="text-base font-bold">{`${completed}/${total}`}</ProgressBar.Output>
      <ProgressBar.Track>
        <ProgressBar.Fill />
      </ProgressBar.Track>
    </ProgressBar>
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
  const [archiveTab, setArchiveTab] = useState<ArchiveTab>("all");

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

  // ── Статистика по дисциплинам ────────────────────────────────────────────

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

  const archiveTasks = useMemo(() => {
    const filtered =
      archiveTab === "all"
        ? tasks.filter(
            t =>
              t.computedStatus === "completed" ||
              t.computedStatus === "overdue"
          )
        : tasks.filter(t => t.computedStatus === archiveTab);

    return [...filtered].sort((a, b) => {
      const getSortTime = (task: ComputedTask) => {
        if (task.computedStatus === "completed" && task.completedAt) {
          return new Date(task.completedAt).getTime();
        }

        return new Date(task.deadline).getTime();
      };

      return getSortTime(b) - getSortTime(a);
    });
  }, [tasks, archiveTab]);

  const archiveCounts = useMemo(() => ({
    all:       tasks.filter(t => t.computedStatus === "completed" || t.computedStatus === "overdue").length,
    completed: tasks.filter(t => t.computedStatus === "completed").length,
    overdue:   tasks.filter(t => t.computedStatus === "overdue").length,
  }), [tasks]);

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 pb-24 flex flex-col gap-4">

        <PetWidget tasks={tasks} />

        {/* ── Цифры ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-2">
          {semesterProgress && (
              <StatCard
                label="Неделя"
                value={`${semesterProgress.current}/${semesterProgress.total}`}
                sub={`${weekInfo?.isEven ? "(чётная)" : "(нечётная)"}`}
                accent="blue"
              />
          )}
          <StatCard
            label="Активных"
            value={`${stats.active}`}
            sub="сейчас в работе"
            accent="gray"
          />
        </div>

        {/* ── Прогресс семестра ──────────────────────────────────────── */}
        {semesterProgress && (
          <div className="flex flex-col items-center gap-2">
            <span className="text-lg text-center font-medium text-gray-400 uppercase tracking-wide w-full">
              Прогресс семестра
            </span>
            <div className="bg-white rounded-3xl p-4 flex flex-col gap-3 w-full">
              <ProgressBarUI
                label={`Выполнено задач (${stats.completed}/${stats.total})`}
                value={stats.completed}
                total={stats.total}
                color="success"
              />
              {stats.overdue > 0 && (
                <ProgressBarUI
                  label={`Просрочено (${stats.overdue})`}
                  value={stats.overdue}
                  total={stats.total}
                  color="danger"
                />
              )}
            </div>
          </div>
        )}

        {/* ── По дисциплинам ───────────────────────────────────────────── */}
        {subjectStats.length > 0 && (
          <div className="flex flex-col items-center gap-2">
            <span className="text-lg text-center font-medium text-gray-400 uppercase tracking-wide w-full">
              По дисциплинам
            </span>
            <div className="bg-white rounded-3xl p-4 flex flex-col gap-3 w-full">
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

        {/* ── Архив ─────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <span className="text-lg text-center font-medium text-gray-400 uppercase tracking-wide w-full">
            Архив задач
          </span>

          <Tabs
            onSelectionChange={t => setArchiveTab(t as ArchiveTab)}
            className="w-full"
          >
            <Tabs.ListContainer>
              <Tabs.List>
                <Tabs.Tab id="all">
                  Все{/*  · {archiveCounts.all} */}
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="completed">
                  Выполнено{/*  · {archiveCounts.completed} */}
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="overdue">
                  Просрочено{/*  · {archiveCounts.overdue} */}
                  <Tabs.Indicator />
                </Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>
          </Tabs>

          {archiveTasks.length === 0 ? (
            <p className="text-center text-gray-400 py-8">Список пуст</p>
          ) : (
            <div className="flex flex-col gap-2">
              {archiveTasks.map(task => (
                <ArchiveTaskCard
                  key={task.id}
                  task={task}
                  subjectName={
                    task.type === "По расписанию"
                      ? subjectMap[task.subjectId]
                      : undefined
                  }
                />
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}