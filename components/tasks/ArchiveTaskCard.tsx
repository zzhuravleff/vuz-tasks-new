// components/tasks/ArchiveTaskCard.tsx

"use client";

import { memo, useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ComputedTask } from "@/types";
import { asyncStore } from "@/lib/asyncStore";
import { Chip } from "@heroui/react";
import { Check, Xmark } from "@gravity-ui/icons";

// ─── Свайп-обёртка ─────────────────────────────────────────────────────────

const SWIPE_THRESHOLD = 72;
const SWIPE_MAX = 96;

const SwipeWrapper = memo(({
  children, onDelete, onComplete, canComplete,
}: {
  children: React.ReactNode;
  onDelete: () => void;
  onComplete?: () => void;
  canComplete: boolean;
}) => {
  const startX = useRef(0);
  const currentX = useRef(0);
  const isDragging = useRef(false);
  const [offset, setOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    isDragging.current = true;
    setIsAnimating(false);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const diff = e.touches[0].clientX - startX.current;
    currentX.current = diff;

    // Свайп вправо только если canComplete
    if (diff > 0 && !canComplete) return;

    const clamped = Math.max(-SWIPE_MAX, Math.min(SWIPE_MAX, diff));
    const rubber = clamped > 0
      ? Math.min(clamped, SWIPE_THRESHOLD + (clamped - SWIPE_THRESHOLD) * 0.3)
      : Math.max(clamped, -SWIPE_THRESHOLD + (clamped + SWIPE_THRESHOLD) * 0.3);
    setOffset(rubber);
  }, [canComplete]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    setIsAnimating(true);
    if (currentX.current >= SWIPE_THRESHOLD && canComplete) onComplete?.();
    else if (currentX.current <= -SWIPE_THRESHOLD) onDelete();
    setOffset(0);
  }, [canComplete, onComplete, onDelete]);

  return (
    <div className="relative overflow-hidden rounded-3xl">
      {/* Вправо — выполнить (только для просроченных) */}
      {canComplete && (
        <div className={`absolute inset-0 rounded-3xl bg-success flex items-center px-5 transition-opacity duration-150 ${offset > 20 ? "opacity-100" : "opacity-0"}`}>
          <Check className="size-8 text-white" />
        </div>
      )}
      {/* Влево — удалить */}
      <div className={`absolute inset-0 rounded-3xl bg-danger flex items-center justify-end px-5 transition-opacity duration-150 ${offset < -20 ? "opacity-100" : "opacity-0"}`}>
        <Xmark className="size-8 text-white" />
      </div>
      <div
        style={{
          transform: `translateX(${offset}px)`,
          transition: isAnimating ? "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)" : "none",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
});
SwipeWrapper.displayName = "SwipeWrapper";

// ─── Утилиты ───────────────────────────────────────────────────────────────

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

// ─── ArchiveTaskCard ────────────────────────────────────────────────────────

interface ArchiveTaskCardProps {
  task: ComputedTask;
  subjectName?: string;
}

export const ArchiveTaskCard = memo(({ task, subjectName }: ArchiveTaskCardProps) => {
  const router = useRouter();
  const [isDeleted, setIsDeleted] = useState(false);

  const isOverdue = task.computedStatus === "overdue";
  const isCompleted = task.computedStatus === "completed";

  const title = task.type === "По расписанию"
    ? (subjectName ?? "Дисциплина")
    : task.title;

  const handleTap = useCallback(() => {
    router.push(`/tasks/${task.id}/archive`);
  }, [router, task.id]);

  const handleDelete = useCallback(async () => {
    setIsDeleted(true);
    setTimeout(() => asyncStore.deleteTask(task.id), 300);
  }, [task.id]);

  const handleComplete = useCallback(async () => {
    await asyncStore.completeTask(task.id);
  }, [task.id]);

  if (isDeleted) return null;

  // Чип времени
  const timeChip = (() => {
    if (isCompleted && task.completedAt) {
      const { label, color } = formatCompletedAt(task.completedAt, task.deadline);
      return <Chip color={color} variant="soft" size="lg">Выполнено: {label}</Chip>;
    }
    return null;
  })();

  const statusChip = isCompleted
    // ? <Chip color="success" variant="soft" size="lg">Выполнено</Chip>
    ? null
    : <Chip color="danger" variant="soft" size="lg">Просрочено</Chip>;

  return (
    <SwipeWrapper
      onDelete={handleDelete}
      onComplete={handleComplete}
      canComplete={isOverdue}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={handleTap}
        onKeyDown={e => e.key === "Enter" && handleTap()}
        className="w-full rounded-3xl bg-white p-3 cursor-pointer active:scale-[0.98] transition-transform flex flex-col gap-2"
      >
        <span className="font-medium text-xl line-clamp-2 leading-6">
          {title}
        </span>

        {task.description && (
          <span className="text-base text-gray-400 line-clamp-2">
            {task.description}
          </span>
        )}

        <div className="flex items-center justify-between gap-2 flex-wrap">
          {timeChip}
          {statusChip}
        </div>
      </div>
    </SwipeWrapper>
  );
});

ArchiveTaskCard.displayName = "ArchiveTaskCard";