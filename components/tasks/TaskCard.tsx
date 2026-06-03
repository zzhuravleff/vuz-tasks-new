// components/tasks/TaskCard.tsx — только для главного экрана

"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ComputedTask } from "@/types";
import { formatDeadline } from "@/lib/scheduleUtils";
import { asyncStore } from "@/lib/asyncStore";
import { Chip } from "@heroui/react";
import { Check, Xmark } from "@gravity-ui/icons";

// ─── Свайп-обёртка ─────────────────────────────────────────────────────────

const SWIPE_THRESHOLD = 220; //72
const SWIPE_MAX = 220; //96

const SwipeWrapper = memo(({
  children, onComplete, onDelete, disabled,
}: {
  children: React.ReactNode;
  onComplete: () => void;
  onDelete: () => void;
  disabled: boolean;
}) => {
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
    if (currentX.current >= SWIPE_THRESHOLD) onComplete();
    else if (currentX.current <= -SWIPE_THRESHOLD) onDelete();
    setOffset(0);
  }, [disabled, onComplete, onDelete]);

  return (
    <div className="relative overflow-hidden rounded-3xl">
      <div className={`absolute inset-0 rounded-3xl bg-success flex items-center px-5 transition-opacity duration-150 ${offset > 20 ? "opacity-100" : "opacity-0"}`}>
        <Check className="size-8 text-white" />
      </div>
      <div className={`absolute inset-0 rounded-3xl bg-danger flex items-center justify-end px-5 transition-opacity duration-150 ${offset < -20 ? "opacity-100" : "opacity-0"}`}>
        <Xmark className="size-8 text-white" />
      </div>
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
  subjectName?: string;
}

export const TaskCard = memo(({ task, subjectName }: TaskCardProps) => {
  const router = useRouter();
  const [isDeleted, setIsDeleted] = useState(false);

  useEffect(() => {
    router.prefetch(`/tasks/${task.id}`);
  }, [router, task.id]);

  const handleTap = useCallback(() => {
    router.push(`/tasks/${task.id}`);
  }, [router, task.id]);

  const handleComplete = useCallback(async () => {
    if (task.computedStatus === "completed") return;
    await asyncStore.completeTask(task.id);
  }, [task.id, task.computedStatus]);

  const handleDelete = useCallback(async () => {
    setIsDeleted(true);
    setTimeout(() => asyncStore.deleteTask(task.id), 300);
  }, [task.id]);

  if (isDeleted) return null;

  const isOverdue = task.computedStatus === "overdue";
  const isSoon = task.computedStatus === "active" &&
    new Date(task.deadline).getTime() - Date.now() < 48 * 60 * 60 * 1000;

  const title = task.type === "По расписанию"
    ? (subjectName ?? "Дисциплина")
    : task.title;

  return (
    <SwipeWrapper
      onComplete={handleComplete}
      onDelete={handleDelete}
      disabled={task.computedStatus === "completed"}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={handleTap}
        onKeyDown={e => e.key === "Enter" && handleTap()}
        className={`
          w-full rounded-3xl bg-white p-3 cursor-pointer
          active:scale-[0.98] transition-transform flex flex-col gap-2
          ${isOverdue ? "border-2 border-danger/16" : ""}
        `}
      >
        {isSoon && (
          <div className="p-0 m-0">
            <Chip color="danger" variant="soft" size="lg">Скоро</Chip>
          </div>
        )}

        <span className={`font-medium text-xl line-clamp-2 leading-6 ${isOverdue ? "text-danger" : ""}`}>
          {title}
        </span>

        {task.description && (
          <span className="text-base text-gray-700 line-clamp-2">
            {task.description}
          </span>
        )}

        <div className="flex justify-between items-center">
          {!isOverdue ? (
            <div className="w-full flex justify-between">
              <div className="flex gap-1 flex-wrap">
                <Chip variant="soft" color="default" size="lg">{formatDeadline(task.deadline)}</Chip>
              </div>
              <Chip color={task.type === "По расписанию" ? "accent" : "warning"} size="lg" variant="soft">
                {task.type}
              </Chip>
            </div>
          ) : (
            <div />
          )}
          {isOverdue && (
            <Chip color="danger" size="lg" variant="soft">Просрочено</Chip>
          )}
        </div>
      </div>
    </SwipeWrapper>
  );
});

TaskCard.displayName = "TaskCard";