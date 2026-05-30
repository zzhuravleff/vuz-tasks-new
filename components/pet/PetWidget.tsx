// components/pet/PetWidget.tsx

"use client";

import { memo, useMemo, useEffect, useRef } from "react";
import { ComputedTask } from "@/types";
import { getPetStatus, PetState } from "@/lib/petUtils";
import { PetCanvas } from "@/components/pet/PetCanvas";
import { Chip, InfoIcon, ProgressCircle } from "@heroui/react";

// ─── Конфиг цветов ─────────────────────────────────────────────────────────

const STATE_COLORS: Record<PetState, {
  bg: string; color: "success" | "accent" | "warning" | "danger";
}> = {
  happy:   { bg: "#F2FBEA", color: "success" },
  neutral: { bg: "#E6F1FB", color: "accent" },
  sad:     { bg: "#FAEEDA", color: "warning" },
  sick:    { bg: "#FCEBEB", color: "danger" },
};

// ─── Круговой прогресс (для мини) ──────────────────────────────────────────

const Arc = memo(({ pct, color, size }: { pct: number; color: string; size: number }) => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2, cy = size / 2;
    const r = size * 0.38, lw = size * 0.09;

    ctx.strokeStyle = "rgba(0,0,0,0.08)";
    ctx.lineWidth = lw;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI * 0.75, Math.PI * 0.25);
    ctx.stroke();

    if (pct > 0) {
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.arc(cx, cy, r, -Math.PI * 0.75, -Math.PI * 0.75 + Math.PI * 1.5 * pct);
      ctx.stroke();
    }

    ctx.fillStyle = color;
    ctx.font = `600 ${size * 0.26}px -apple-system, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(Math.round(pct * 100).toString(), cx, cy + size * 0.04);
  }, [pct, color, size]);

  return <canvas ref={ref} style={{ width: size, height: size }} aria-hidden />;
});
Arc.displayName = "Arc";

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
      <div
        className="flex items-center justify-between px-4 py-3 rounded-3xl"
        style={{ background: colors.bg }}
      >
        <PetCanvas state={status.state} size={56} />
        <Arc pct={status.health / 100} color={colors.color} size={56} />
        <ProgressCircle aria-label="Progress" value={status.health} color={colors.color} size="lg">
            <ProgressCircle.Track>
                <ProgressCircle.TrackCircle />
                <ProgressCircle.FillCircle />
            </ProgressCircle.Track>
        </ProgressCircle>
      </div>
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
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.08)" }}>
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out bg-${colors.color}`}
            style={{ width: `${status.health}%`}}
          />
        </div>
      </div>

      {/* Подсказка */}
      <div className="flex items-center gap-1">
        <InfoIcon className={`text-${colors.color}`} />
        <p className="text-[12px] leading-snug text-gray-400">
          {status.hint}
        </p>
      </div>
    </div>
  );
});

PetWidget.displayName = "PetWidget";