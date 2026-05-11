// components/ui/EmptyState.tsx

"use client";

import { memo, useCallback } from "react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState = memo(({
  title = "Задач нет",
  description = "Добавьте первую задачу, чтобы начать",
  action,
}: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center">
    {/* Иконка */}
    <div className="w-16 h-16 rounded-3xl bg-gray-50 flex items-center justify-center">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="6" y="8" width="20" height="3" rx="1.5" fill="#E5E7EB" />
        <rect x="6" y="14.5" width="14" height="3" rx="1.5" fill="#E5E7EB" />
        <rect x="6" y="21" width="10" height="3" rx="1.5" fill="#E5E7EB" />
      </svg>
    </div>

    <div className="flex flex-col gap-1">
      <p className="text-gray-900 font-semibold text-base">{title}</p>
      <p className="text-gray-400 text-sm leading-snug">{description}</p>
    </div>

    {action && (
      <button
        onClick={action.onClick}
        className="mt-1 px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-2xl active:scale-95 transition-transform"
      >
        {action.label}
      </button>
    )}
  </div>
));

EmptyState.displayName = "EmptyState";