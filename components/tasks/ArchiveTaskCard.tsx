// components/tasks/ArchiveTaskCard.tsx

"use client";

import { memo, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ComputedTask } from "@/types";
import { formatDeadline } from "@/lib/scheduleUtils";
import { asyncStore } from "@/lib/asyncStore";
import { Chip } from "@heroui/react";
import { TrashBin } from "@gravity-ui/icons";

interface ArchiveTaskCardProps {
  task: ComputedTask;
  subjectName?: string;
}

function formatCompletedAt(completedAt: string, deadline: string): {
  label: string;
  color: "success" | "warning";
} {
  const completed = new Date(completedAt);
  const dead = new Date(deadline);
  const inTime = completed <= dead;

  const months = ["янв.", "февр.", "мар.", "апр.", "мая", "июн.",
                  "июл.", "авг.", "сент.", "окт.", "нояб.", "дек."];
  const h = String(completed.getHours()).padStart(2, "0");
  const m = String(completed.getMinutes()).padStart(2, "0");
  const label = `${completed.getDate()} ${months[completed.getMonth()]}, ${h}:${m}`;

  return { label, color: inTime ? "success" : "warning" };
}

export const ArchiveTaskCard = memo(({ task, subjectName }: ArchiveTaskCardProps) => {
  const router = useRouter();
  const [isDeleted, setIsDeleted] = useState(false);

  const handleTap = useCallback(() => {
    router.push(`/tasks/${task.id}/archive`);
  }, [router, task.id]);

  const handleDelete = useCallback(async () => {
    setIsDeleted(true);
    setTimeout(() => asyncStore.deleteTask(task.id), 300);
  }, [task.id]);

  if (isDeleted) return null;

  const isOverdue = task.computedStatus === "overdue";
  const isCompleted = task.computedStatus === "completed";

  const title = task.type === "По расписанию"
    ? (subjectName ?? "Дисциплина")
    : task.title;

  // Чип времени выполнения
  const completionChip = (() => {
    if (isCompleted && task.completedAt) {
      const { label, color } = formatCompletedAt(task.completedAt, task.deadline);
      return <Chip color={color} variant="soft" size="lg">{label}</Chip>;
    }
    if (isOverdue) {
      return <Chip color="danger" variant="soft" size="lg">Просрочено</Chip>;
    }
    return null;
  })();

  // Статус-чип
  const statusChip = isCompleted
    ? <Chip color="success" variant="soft" size="lg">Выполнено</Chip>
    : <Chip color="danger" variant="soft" size="lg">Просрочено</Chip>;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleTap}
      onKeyDown={e => e.key === "Enter" && handleTap()}
      className="w-full rounded-3xl bg-white p-3 cursor-pointer active:scale-[0.98] transition-transform flex flex-col gap-2"
    >
      {/* Заголовок + удаление */}
      <div className="flex items-start justify-between gap-2">
        <span className="font-medium text-xl line-clamp-2 leading-6 flex-1">
          {title}
        </span>
        <button
          onClick={e => { e.stopPropagation(); handleDelete(); }}
          className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center active:bg-red-50 transition-colors shrink-0 mt-0.5"
        >
          <TrashBin className="size-4 text-danger" />
        </button>
      </div>

      {/* Описание */}
      {task.description && (
        <span className="text-base text-gray-400 line-clamp-2">
          {task.description}
        </span>
      )}

      {/* Нижняя строка */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {completionChip}
        {statusChip}
      </div>
    </div>
  );
});

ArchiveTaskCard.displayName = "ArchiveTaskCard";