// components/tasks/TaskCard.tsx

"use client";

import { memo, useCallback, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ComputedTask, TaskStatus } from "@/types";
import { formatDateDisplay, formatDeadline, formatTimeDisplay } from "@/lib/scheduleUtils";
import { asyncStore } from "@/lib/asyncStore";
import { Chip } from "@heroui/react";
import { Check, Xmark } from "@gravity-ui/icons";

// ─── Свайп-обёртка ─────────────────────────────────────────────────────────

const SWIPE_THRESHOLD = 72; // px до срабатывания действия
const SWIPE_MAX = 96;       // px максимальное смещение

interface SwipeAction {
  onComplete: () => void;
  onDelete: () => void;
}

const SwipeWrapper = memo(({
  children,
  onComplete,
  onDelete,
  disabled,
}: SwipeAction & { children: React.ReactNode; disabled: boolean }) => {
  const startX = useRef(0);
  const currentX = useRef(0);
  const isDragging = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    startX.current = e.touches[0].clientX;
    isDragging.current = true;
    setIsAnimating(false);
  }, [disabled]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current || disabled) return;
    const diff = e.touches[0].clientX - startX.current;
    currentX.current = diff;

    // Ограничиваем с резиновым эффектом
    const clamped = Math.max(-SWIPE_MAX, Math.min(SWIPE_MAX, diff));
    const rubber = clamped > 0
      ? Math.min(clamped, SWIPE_THRESHOLD + (clamped - SWIPE_THRESHOLD) * 0.3)
      : Math.max(clamped, -SWIPE_THRESHOLD + (clamped + SWIPE_THRESHOLD) * 0.3);

    setOffset(rubber);
  }, [disabled]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current || disabled) return;
    isDragging.current = false;
    setIsAnimating(true);

    if (currentX.current >= SWIPE_THRESHOLD) {
      onComplete();
    } else if (currentX.current <= -SWIPE_THRESHOLD) {
      onDelete();
    }

    setOffset(0);
  }, [disabled, onComplete, onDelete]);

  return (
    <div className="relative overflow-hidden rounded-3xl">
      {/* Фон свайпа вправо — выполнить */}
      <div className={`
        absolute inset-0 rounded-3xl bg-success
        flex items-center px-5
        transition-opacity duration-150
        ${offset > 20 ? "opacity-100" : "opacity-0"}
      `}>
        <Check className="size-8 text-white" />
      </div>

      {/* Фон свайпа влево — удалить */}
      <div className={`
        absolute inset-0 rounded-3xl bg-danger
        flex items-center justify-end px-5
        transition-opacity duration-150
        ${offset < -20 ? "opacity-100" : "opacity-0"}
      `}>
        <Xmark className="size-8 text-white" />
      </div>

      {/* Карточка */}
      <div
        ref={cardRef}
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

// ─── TaskCard ──────────────────────────────────────────────────────────────

interface TaskCardProps {
  task: ComputedTask;
  subjectName?: string; // передаётся снаружи для "По расписанию"
}

export const TaskCard = memo(({ task, subjectName }: TaskCardProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDone, setIsDone] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  const handleTap = useCallback(() => {
    startTransition(() => router.push(`/tasks/${task.id}`));
  }, [router, task.id]);

  const handleComplete = useCallback(async () => {
    if (task.computedStatus === "completed") return;
    setIsDone(true);
    await asyncStore.completeTask(task.id);
  }, [task.id, task.computedStatus]);

  const handleDelete = useCallback(async () => {
    setIsDeleted(true);
    // Небольшая задержка для анимации
    setTimeout(() => asyncStore.deleteTask(task.id), 300);
  }, [task.id]);

  const isSoon = task.computedStatus === "active" && (() => {
    const diff = new Date(task.deadline).getTime() - Date.now();
    return diff < 48 * 60 * 60 * 1000;
  })();

  if (isDeleted) {
    return (
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: 0, opacity: 0 }}
      />
    );
  }

  const isInactive =
    task.computedStatus === "completed"

  return (
    <SwipeWrapper
      onComplete={handleComplete}
      onDelete={handleDelete}
      disabled={isInactive || isPending}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={handleTap}
        onKeyDown={(e) => e.key === "Enter" && handleTap()}
        className={`w-full rounded-3xl bg-white p-3 cursor-pointer active:scale-[0.98] transition-transform ${task.computedStatus === "overdue" ? "border-danger/16 border-2" : ""}`}
      >
        <div className="flex flex-col gap-2">

          {isSoon && (
            <div className="p-0 m-0">
              <Chip color="danger" variant="soft" size="lg">Скоро</Chip>
            </div>
          )}

          <div className="flex justify-between">
            <span className="font-medium text-xl line-clamp-2 leading-6">
              {task.type === "По расписанию"
              ? (subjectName ?? "Предмет")
              : task.title}
            </span>
          </div>

          {task.description && (
            <div className="text-base font-regular text-gray-700 whitespace-pre-line line-clamp-2">
              {task.description}
            </div>
          )}

          {task.computedStatus !== "overdue" ? (
            <div className="flex justify-between">
              <div className="flex gap-1 flex-wrap">
                <Chip variant="soft" color="default" size="lg">{formatDeadline(task.deadline)}</Chip>
              </div>
              <Chip color={task.type === "По расписанию" ? "accent" : "warning"} size="lg" variant="soft">
                {task.type}
              </Chip>
            </div>
          ) : (
            <div className="flex justify-end">
              <Chip color="danger" size="lg" variant="soft">
                Просрочено
              </Chip>
            </div>
          )}

        </div>
      </div>
    </SwipeWrapper>
  );
});

TaskCard.displayName = "TaskCard";