// components/tasks/TaskCard.tsx

"use client";

import { memo, useCallback, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ComputedTask, TaskStatus } from "@/types";
import { formatDeadline } from "@/lib/scheduleUtils";
import { asyncStore } from "@/lib/asyncStore";

// ─── Конфиг статусов ───────────────────────────────────────────────────────

const STATUS_CONFIG = {
  active: {
    label: "Активна",
    color: "text-blue-600",
    bg: "bg-blue-50",
    icon: (
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <circle cx="6" cy="6" r="5" stroke="#2563EB" strokeWidth="1.5" />
        <circle cx="6" cy="6" r="2" fill="#2563EB" />
      </svg>
    ),
  },
  overdue: {
    label: "Просрочена",
    color: "text-red-600",
    bg: "bg-red-50",
    icon: (
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <circle cx="6" cy="6" r="5" stroke="#DC2626" strokeWidth="1.5" />
        <path d="M6 3.5V6.5" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="6" cy="8.5" r="0.75" fill="#DC2626" />
      </svg>
    ),
  },
  completed: {
    label: "Выполнена",
    color: "text-green-600",
    bg: "bg-green-50",
    icon: (
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <circle cx="6" cy="6" r="5" stroke="#16A34A" strokeWidth="1.5" />
        <path d="M3.5 6L5.5 8L8.5 4" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  cancelled: {
    label: "Отменена",
    color: "text-gray-400",
    bg: "bg-gray-100",
    icon: (
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <circle cx="6" cy="6" r="5" stroke="#9CA3AF" strokeWidth="1.5" />
        <path d="M4 4L8 8M8 4L4 8" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
} satisfies Record<TaskStatus, { label: string; color: string; bg: string; icon: React.ReactNode }>;

// ─── Бедж статуса ──────────────────────────────────────────────────────────

export const StatusBadge = memo(({ status }: { status: TaskStatus }) => {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`
      inline-flex items-center gap-1 px-2 py-0.5
      rounded-full text-[11px] font-semibold
      ${config.bg} ${config.color}
    `}>
      {config.icon}
      {config.label}
    </span>
  );
});
StatusBadge.displayName = "StatusBadge";

// ─── Иконка типа задачи ────────────────────────────────────────────────────

const TaskTypeIcon = memo(({ type }: { type: ComputedTask["type"] }) => {
  if (type === "По расписанию") {
    return (
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <rect x="1.5" y="2.5" width="10" height="9" rx="1.75" stroke="#9CA3AF" strokeWidth="1.25" />
        <path d="M4.5 1.5V3.5M8.5 1.5V3.5" stroke="#9CA3AF" strokeWidth="1.25" strokeLinecap="round" />
        <path d="M1.5 5.5H11.5" stroke="#9CA3AF" strokeWidth="1.25" />
      </svg>
    );
  }
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <rect x="2" y="2" width="9" height="9" rx="1.75" stroke="#9CA3AF" strokeWidth="1.25" />
      <path d="M4.5 6.5L6 8L8.5 5" stroke="#9CA3AF" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
});
TaskTypeIcon.displayName = "TaskTypeIcon";

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
        absolute inset-0 rounded-3xl bg-green-500
        flex items-center px-5
        transition-opacity duration-150
        ${offset > 20 ? "opacity-100" : "opacity-0"}
      `}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M4 11L9 16L18 6" stroke="white" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Фон свайпа влево — удалить */}
      <div className={`
        absolute inset-0 rounded-3xl bg-red-500
        flex items-center justify-end px-5
        transition-opacity duration-150
        ${offset < -20 ? "opacity-100" : "opacity-0"}
      `}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M6 6L16 16M16 6L6 16" stroke="white" strokeWidth="2.25" strokeLinecap="round" />
        </svg>
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

  if (isDeleted) {
    return (
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: 0, opacity: 0 }}
      />
    );
  }

  const isInactive =
    task.computedStatus === "completed" ||
    task.computedStatus === "cancelled";

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
        className="w-full rounded-3xl bg-white p-4 cursor-pointer active:scale-[0.98] transition-transform"
      >
        <div className="flex flex-col gap-2.5">

          {/* Верхняя строка: тип + статус */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-gray-400">
              <TaskTypeIcon type={task.type} />
              <span className="text-[11px] font-medium">
                {task.type === "По расписанию" && subjectName
                  ? subjectName
                  : "Задача"}
              </span>
            </div>
            <StatusBadge status={task.computedStatus} />
          </div>

          {/* Заголовок */}
          <p className={`
            text-[15px] font-semibold text-gray-900 leading-snug line-clamp-2
            ${isInactive ? "line-through text-gray-400" : ""}
          `}>
            {task.title}
          </p>

          {/* Описание */}
          {task.description && (
            <p className="text-[13px] text-gray-400 leading-snug line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Дедлайн */}
          <div className="flex items-center gap-1.5 pt-0.5 border-t border-gray-50">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <circle cx="6.5" cy="6.5" r="5.25" stroke="#D1D5DB" strokeWidth="1.25" />
              <path
                d="M6.5 4V6.5L8.5 8"
                stroke="#D1D5DB"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className={`text-[12px] font-medium ${
              task.computedStatus === "overdue"
                ? "text-red-400"
                : "text-gray-400"
            }`}>
              {formatDeadline(task.deadline)}
            </span>
          </div>

        </div>
      </div>
    </SwipeWrapper>
  );
});

TaskCard.displayName = "TaskCard";