// app/page.tsx

"use client";

import { useMemo } from "react";
import { useAsyncStore } from "@/hooks/useAsyncStore";
import { useTasks } from "@/hooks/useAsyncStore";
import { TaskList } from "@/components/tasks/TaskList";
import { PetWidget } from "@/components/pet/PetWidget";

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
    <div className="flex flex-col items-center gap-3 mb-24">

      <div className="px-4 pb-2">
        <PetWidget tasks={tasks} mini />
      </div>

      <main className="flex-1 w-full">
        <TaskList
          tasks={activeTasks}
          isLoading={isLoading}
          subjectMap={subjectMap}
          emptyTitle="Нет активных задач"
          emptyDescription="Добавьте первую задачу"
        />
      </main>
    </div>
  );
}