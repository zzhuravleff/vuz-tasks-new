// components/pet/PetWidget.tsx

"use client";

import { memo, useMemo, useEffect, useRef } from "react";
import { ComputedTask } from "@/types";
import { getPetStatus, PetState } from "@/lib/petUtils";
import { PetCanvas } from "@/components/pet/PetCanvas";
import { Chip, InfoIcon, ProgressBar } from "@heroui/react";

// ─── Конфиг цветов ─────────────────────────────────────────────────────────

const STATE_COLORS: Record<PetState, {
  bg: string; color: "success" | "accent" | "warning" | "danger";
}> = {
  happy:   { bg: "#F2FBEA", color: "success" },
  neutral: { bg: "#E6F1FB", color: "accent" },
  sad:     { bg: "#FAEEDA", color: "warning" },
  sick:    { bg: "#FCEBEB", color: "danger" },
};


// ─── Props ─────────────────────────────────────────────────────────────────

interface PetWidgetProps {
  tasks: ComputedTask[];
  mini?: boolean;
}

// ─── PetWidget ─────────────────────────────────────────────────────────────

export const PetWidget = memo(({ tasks, mini = false }: PetWidgetProps) => {
  const status = useMemo(() => getPetStatus(tasks), [tasks]);
  const colors = STATE_COLORS[status.state];

  // ── Мини — питомец + круговой прогресс ───────────────────────────────
  if (mini) {
    return (
      // <PetCanvas state={status.state} size={24} />
      <PetCanvas state={status.state} size={24} mini />
    );
  }

  // ── Полная версия для статистики ──────────────────────────────────────
  return (
    <div
      className="rounded-3xl p-4 flex flex-col items-center gap-4 bg-white"
    >
      {/* Питомец + бейдж */}
      <Chip
          variant="soft"
          size="lg"
          color={colors.color}
          className="-mb-4"
        >
          {status.label}
        </Chip>
      <div className="relative">
        <PetCanvas state={status.state} size={120} />
      </div>

      {/* Бар здоровья */}
      <div className="w-full flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-medium">
            Здоровье питомца
          </span>
          <span className={`text-[13px] font-bold text-${colors.color}`}>
            {status.health} / 100
          </span>
        </div>
        <ProgressBar aria-label="Progress" className="" color={colors.color} value={status.health}>
          <ProgressBar.Track>
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>
      </div>

      {/* Подсказка */}
      <div className="flex gap-1">
        <InfoIcon className={`text-${colors.color}`} />
        <p className="text-[12px] leading-snug text-gray-400">
          {status.hint}
        </p>
      </div>
    </div>
  );
});

PetWidget.displayName = "PetWidget";