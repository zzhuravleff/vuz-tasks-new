// components/tasks/TaskSkeleton.tsx

"use client";

import { memo } from "react";

interface TaskSkeletonProps {
  count?: number;
}

const SkeletonCard = memo(() => (
  <div className="bg-white rounded-3xl p-4 animate-pulse">
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 flex flex-col gap-2">
        {/* Тип задачи */}
        <div className="h-3.5 w-24 bg-gray-100 rounded-full" />
        {/* Заголовок */}
        <div className="h-5 w-3/4 bg-gray-200 rounded-full" />
        {/* Описание */}
        <div className="h-3.5 w-1/2 bg-gray-100 rounded-full" />
      </div>
    </div>
  </div>
));
SkeletonCard.displayName = "SkeletonCard";

export const TaskSkeleton = memo(({ count = 4 }: TaskSkeletonProps) => (
  <div className="flex flex-col gap-2">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
));

TaskSkeleton.displayName = "TaskSkeleton";