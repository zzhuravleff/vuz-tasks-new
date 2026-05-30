// lib/petUtils.ts

import { ComputedTask } from "@/types";

// ─── Типы ──────────────────────────────────────────────────────────────────

export type PetState = "happy" | "neutral" | "sad" | "sick";

export interface PetStatus {
  health: number;      // 0–100
  state: PetState;
  label: string;
  hint: string;        // подсказка что сделать
  color: string;       // цвет бара
}

// ─── Формула ───────────────────────────────────────────────────────────────

export function calcPetHealth(tasks: ComputedTask[]): number {
  const total = tasks.length;
  if (total === 0) return 65;

  const completed = tasks.filter(t => t.computedStatus === "completed").length;
  const overdue   = tasks.filter(t => t.computedStatus === "overdue").length;
  const active    = tasks.filter(t => t.computedStatus === "active").length;

  const compRate  = completed / total;
  const overRate  = overdue / total;
  const burden    = Math.min(active / 10, 1);

  const raw = compRate * 80 - overRate * 50 - burden * 20 + 20;
  return Math.round(Math.max(0, Math.min(100, raw)));
}

export function getPetStatus(tasks: ComputedTask[]): PetStatus {
  const health = calcPetHealth(tasks);
  const total  = tasks.length;
  const overdue = tasks.filter(t => t.computedStatus === "overdue").length;
  const active  = tasks.filter(t => t.computedStatus === "active").length;

  if (health >= 75) return {
    health, state: "happy",
    label: "Счастливый",
    color: "#639922",
    hint: total === 0
      ? "Пока задач нет — питомец отдыхает!"
      : "Всё отлично. Так держать!",
  };

  if (health >= 50) return {
    health, state: "neutral",
    label: "Нейтральный",
    color: "#378ADD",
    hint: overdue > 0
      ? `Есть ${overdue} просроченных — постарайся закрыть их`
      : `${active} активных задач — не забывай про них`,
  };

  if (health >= 25) return {
    health, state: "sad",
    label: "Грустный",
    color: "#BA7517",
    hint: overdue > 0
      ? `${overdue} просроченных задач расстраивают питомца`
      : "Слишком много задач накопилось — попробуй разгрузиться",
  };

  return {
    health, state: "sick",
    label: "Больной",
    color: "#A32D2D",
    hint: `Питомцу плохо — закрой хотя бы часть из ${overdue} просроченных задач`,
  };
}