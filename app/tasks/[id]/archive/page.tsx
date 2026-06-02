// app/tasks/[id]/archive/page.tsx

"use client";

import { useEffect, useState, useCallback, useMemo, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAsyncStore } from "@/hooks/useAsyncStore";
import { asyncStore } from "@/lib/asyncStore";
import { computeTask } from "@/lib/scheduleUtils";
import { ComputedTask, LESSON_TIMES } from "@/types";
import { formatDeadline, formatDateDisplay } from "@/lib/scheduleUtils";
import { Button, Chip, IconChevronLeft } from "@heroui/react";

const InfoRow = ({ icon, label, value, bg }: {
  icon: React.ReactNode; label: string; value: string; bg: string;
}) => (
  <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
    <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
      {icon}
    </div>
    <div className="flex flex-col gap-0.5 flex-1">
      <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">{label}</span>
      <span className="text-[14px] text-black font-medium">{value}</span>
    </div>
  </div>
);

export default function ArchiveTaskPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data } = useAsyncStore();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [task, setTask] = useState<ComputedTask | null>(null);

  useEffect(() => {
    asyncStore.getData().then(d => {
      const found = d.tasks.find(t => t.id === id);
      setTask(found ? computeTask(found) : null);
    });
  }, [id]);

  // Обновляем задачу при изменении store (после выполнения)
  useEffect(() => {
    const unsub = asyncStore.subscribe(d => {
      const found = d.tasks.find(t => t.id === id);
      if (found) setTask(computeTask(found));
    });
    return unsub;
  }, [id]);

  const subjectName = useMemo(() => {
    if (!task || task.type !== "По расписанию" || !data) return null;
    return data.subjects.find(s => s.id === task.subjectId)?.name ?? null;
  }, [task, data]);

  const lessonTime = useMemo(() => {
    if (!task || task.type !== "По расписанию") return null;
    const time = LESSON_TIMES[task.lessonNumber];
    return `${task.lessonNumber} пара · ${time.start} – ${time.end}`;
  }, [task]);

  const completionInfo = useMemo(() => {
    if (!task) return null;

    // Для выполненных — фактическое время
    if (task.completedAt) {
      const completed = new Date(task.completedAt);
      const dead = new Date(task.deadline);
      const inTime = completed <= dead;
      const months = ["янв.", "февр.", "мар.", "апр.", "мая", "июн.",
                      "июл.", "авг.", "сент.", "окт.", "нояб.", "дек."];
      const h = String(completed.getHours()).padStart(2, "0");
      const m = String(completed.getMinutes()).padStart(2, "0");
      return {
        label: `${completed.getDate()} ${months[completed.getMonth()]} ${completed.getFullYear()}, ${h}:${m}`,
        inTime,
        isCompleted: true,
      };
    }
    return null;
  }, [task]);

  const handleComplete = useCallback(async () => {
    setIsCompleting(true);
    try {
      await asyncStore.completeTask(id);
    } finally {
      setIsCompleting(false);
    }
  }, [id]);

  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      await asyncStore.deleteTask(id);
      startTransition(() => router.back());
    } finally {
      setIsDeleting(false);
    }
  }, [id, router]);

  if (!task) return (
    <div className="flex flex-col min-h-screen items-center justify-center gap-3">
      <p className="text-gray-400">Задача не найдена</p>
      <button onClick={() => router.back()} className="text-black font-semibold">Назад</button>
    </div>
  );

  const isOverdue = task.computedStatus === "overdue";
  const isCompleted = task.computedStatus === "completed";

  return (
    <div className="flex flex-col min-h-screen">
      <Button
        variant="tertiary"
        className="fixed"
        onPress={() => startTransition(() => router.back())}
      >
        <IconChevronLeft className="size-4" />
        Назад
      </Button>

      <h1 className="text-2xl font-medium text-center mt-12 pb-2">Задача</h1>

      <div className="flex flex-col gap-3 pb-10">

        {/* Основная карточка */}
        <div className={`bg-white rounded-3xl p-4 flex flex-col gap-3 ${isOverdue ? "border-2 border-danger/16" : ""}`}>
          <div className="w-full flex gap-2 justify-start">
            <Chip color="danger" size="lg" variant="soft" className={`${task.computedStatus === "overdue" ? "" : "hidden"}`}>
              Просрочено
            </Chip>
            <Chip size="lg" color="default" variant="soft">
              {task.type === "По расписанию" ? "По расписанию" : "Кастомная задача"}
            </Chip>
          </div>

          <p className="text-[20px] font-semibold text-black leading-snug">
            {task.type === "По расписанию" ? subjectName : task.title}
          </p>

          {task.description && (
            <>
              <div className="border-t border-gray-50" />
              <p className="text-[14px] text-gray-500 leading-relaxed">
                {task.description}
              </p>
            </>
          )}
        </div>

        {/* Инфо */}
        <div className="bg-white rounded-3xl px-4 py-1">
          <InfoRow
            icon={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6.5" stroke="#9CA3AF" strokeWidth="1.25"/>
                <path d="M8 5V8.5L10 10" stroke="#9CA3AF" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
            label="Дедлайн"
            value={formatDeadline(task.deadline)}
            bg="bg-gray-100"
          />

          {/* Время выполнения — для всех у кого есть completedAt */}
          {completionInfo && (
            <InfoRow
              icon={
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M2.5 8L6 11.5L13.5 4.5"
                    stroke={completionInfo.inTime ? "#16A34A" : "#CA8A04"}
                    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                  />
                </svg>
              }
              label={completionInfo.inTime ? "Выполнено в срок" : "Выполнено с опозданием"}
              value={completionInfo.label}
              bg={completionInfo.inTime ? "bg-success/15" : "bg-warning/15"}
            />
          )}

          {task.type === "По расписанию" && subjectName && (
            <InfoRow
              icon={
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="3" width="12" height="11" rx="2" stroke="#9CA3AF" strokeWidth="1.25"/>
                  <path d="M5 2V4M11 2V4" stroke="#9CA3AF" strokeWidth="1.25" strokeLinecap="round"/>
                  <path d="M2 6.5H14" stroke="#9CA3AF" strokeWidth="1.25"/>
                </svg>
              }
              label="Предмет"
              value={subjectName}
              bg="bg-gray-100"
            />
          )}

          {task.type === "По расписанию" && lessonTime && (
            <InfoRow
              icon={
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="4" width="12" height="9" rx="2" stroke="#9CA3AF" strokeWidth="1.25"/>
                  <path d="M5 2V5M11 2V5" stroke="#9CA3AF" strokeWidth="1.25" strokeLinecap="round"/>
                </svg>
              }
              label="Пара"
              value={lessonTime}
              bg="bg-gray-100"
            />
          )}

          <InfoRow
            icon={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2L9.8 6.2L14 6.9L11 9.8L11.7 14L8 11.9L4.3 14L5 9.8L2 6.9L6.2 6.2L8 2Z"
                  stroke="#9CA3AF" strokeWidth="1.25" strokeLinejoin="round"/>
              </svg>
            }
            label="Создана"
            value={formatDateDisplay(task.createdAt)}
            bg="bg-gray-100"
          />
        </div>

        {/* Выполнить — только для просроченных */}
        {isOverdue && (
          <Button
            variant="primary"
            className="w-full"
            onPress={handleComplete}
            isDisabled={isCompleting || isPending}
          >
            {isCompleting ? "..." : "Выполнить"}
          </Button>
        )}

        <Button
          variant="danger-soft"
          className="w-full"
          onPress={handleDelete}
          isDisabled={isDeleting || isPending}
        >
          Удалить задачу
        </Button>

      </div>
    </div>
  );
};