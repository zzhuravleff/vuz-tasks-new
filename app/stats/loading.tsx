// app/stats/loading.tsx

"use client";

import { Skeleton } from "@heroui/react";

export default function Loading() {
  return (
    <div className="flex flex-col min-h-screen">

      <main className="flex-1 pb-24 flex flex-col gap-3">

        {/* Pet */}
        <Skeleton className="rounded-3xl h-52 w-full" />

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="rounded-3xl h-24 w-full" />
          <Skeleton className="rounded-3xl h-24 w-full" />
          <Skeleton className="rounded-3xl h-24 w-full" />
          <Skeleton className="rounded-3xl h-24 w-full" />
        </div>

        {/* Progress */}
        <Skeleton className="rounded-3xl h-40 w-full" />

        {/* Tabs */}
        <Skeleton className="rounded-2xl h-14 w-full" />

        {/* Tasks */}
        <div className="flex flex-col gap-2">
          <Skeleton className="rounded-3xl h-24 w-full" />
          <Skeleton className="rounded-3xl h-24 w-full" />
          <Skeleton className="rounded-3xl h-24 w-full" />
        </div>

      </main>

    </div>
  );
}