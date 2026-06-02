// components/tasks/TaskList.tsx

"use client";

import { memo, useMemo } from "react";
import { ComputedTask } from "@/types";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskSkeleton } from "@/components/tasks/TaskSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

interface TaskListProps {
  tasks: ComputedTask[];
  isLoading?: boolean;
  subjectMap?: Record<string, string>;
}

export const TaskList = memo(({
  tasks,
  isLoading = false,
  subjectMap = {},
}: TaskListProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Просроченные — только в течение 36 часов
  const visibleTasks = useMemo(() => {
    const now = Date.now();
    const oneDayMs = 36 * 60 * 60 * 1000;

    return tasks.filter(task => {
      if (task.computedStatus === "overdue") {
        const overdueMs = now - new Date(task.deadline).getTime();
        return overdueMs <= oneDayMs;
      }
      return true;
    });
  }, [tasks]);

  if (isLoading) return <TaskSkeleton count={4} />;

  if (visibleTasks.length === 0) {
    return (
      <EmptyState
        title="Всё сделано!"
        description="Нет активных задач"
        action={{
          label: "Создать задачу",
          onClick: () => startTransition(() => router.push("/tasks/new")),
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      {visibleTasks.map(task => (
        <TaskCard
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
  );
});

TaskList.displayName = "TaskList";