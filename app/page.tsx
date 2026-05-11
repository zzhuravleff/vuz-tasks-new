// app/page.tsx

"use client";

import { useMemo } from "react";
import { useAsyncStore } from "@/hooks/useAsyncStore";
import { useTasks } from "@/hooks/useAsyncStore";
import { TaskList } from "@/components/tasks/TaskList";
import { PageHeader } from "@/components/ui/PageHeader";

export default function HomePage() {
  const { data } = useAsyncStore();
  const { tasks, isLoading } = useTasks();

  // subjectId -> subjectName для передачи в TaskCard
  const subjectMap = useMemo(() => {
    if (!data) return {};
    return Object.fromEntries(
      data.subjects.map((s) => [s.id, s.name])
    );
  }, [data]);

  // Только активные и просроченные на главной
  const activeTasks = useMemo(
    () => tasks.filter((t) =>
      t.computedStatus === "active" || t.computedStatus === "overdue"
    ),
    [tasks]
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <PageHeader
        title="Задачи"
        showWeekInfo
      />

      <main className="flex-1 px-4 pb-28 pt-2">
        <TaskList
          tasks={activeTasks}
          isLoading={isLoading}
          subjectMap={subjectMap}
          emptyTitle="Так держать!"
          emptyDescription="Нет активных задач"
        />
      </main>
    </div>
  );
}