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
  emptyTitle?: string;
  emptyDescription?: string;
  subjectMap?: Record<string, string>; // subjectId -> subjectName
}

export const TaskList = memo(({
  tasks,
  isLoading = false,
  emptyTitle,
  emptyDescription,
  subjectMap = {},
}: TaskListProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleAddTask = () => {
    startTransition(() => router.push("/tasks/new"));
  };

  if (isLoading) return <TaskSkeleton count={4} />;

  if (tasks.length === 0) {
    return (
      <EmptyState
        title={emptyTitle ?? "Задач нет"}
        description={emptyDescription ?? "Добавьте первую задачу"}
        action={{ label: "Создать задачу", onClick: handleAddTask }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {tasks.map((task) => (
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