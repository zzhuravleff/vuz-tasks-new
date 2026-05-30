// components/ui/EmptyState.tsx

"use client";

import { memo, useCallback } from "react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { TextAlignLeft } from "@gravity-ui/icons";
import { Button } from "@heroui/react";

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
    <TextAlignLeft className="size-10 text-black/10" />

    <div className="flex flex-col gap-1">
      <p className="text-black font-semibold text-base">{title}</p>
      <p className="text-gray-400 text-sm leading-snug">{description}</p>
    </div>

    {action && (
      <Button
        onClick={action.onClick}
      >
        {action.label}
      </Button>
    )}
  </div>
));

EmptyState.displayName = "EmptyState";