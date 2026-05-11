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
      {/* Статус */}
      <div className="h-7 w-7 rounded-full bg-gray-100 shrink-0 mt-0.5" />
    </div>
    {/* Дедлайн */}
    <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-1.5">
      <div className="h-3 w-3 rounded-full bg-gray-100" />
      <div className="h-3.5 w-32 bg-gray-100 rounded-full" />
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