// app/settings/subjects/_components/SubjectWizard.tsx

"use client";

import { useState, useCallback, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Subject, ScheduleRule } from "@/types";
import { asyncStore } from "@/lib/asyncStore";
import { useAsyncStore } from "@/hooks/useAsyncStore";
import { WeekPreview } from "@/components/subjects/WeekPreview";
import { RuleBottomSheet } from "@/components/subjects/RuleBottomSheet";

interface SubjectWizardProps {
  mode: "new" | "edit";
  initial?: Subject;
}

const DAYS_SHORT = ["", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function ruleLabel(rule: ScheduleRule): string {
  if (rule.type === "Кастом") {
    const d = new Date(rule.date);
    const months = ["янв.", "февр.", "мар.", "апр.", "мая", "июн.",
                    "июл.", "авг.", "сент.", "окт.", "нояб.", "дек."];
    return `${d.getDate()} ${months[d.getMonth()]} · ${rule.lesson.join(", ")} пара`;
  }
  const day = DAYS_SHORT[rule.dayOfWeek];
  const type = rule.type === "Еженедельно" ? "" : ` · ${rule.type}`;
  return `${day}${type} · ${rule.lesson.join(", ")} пара`;
}

const RULE_COLORS: Record<string, { bg: string; text: string }> = {
  "Еженедельно": { bg: "#F3F4F6", text: "#374151" },
  "Чёт":         { bg: "#DBEAFE", text: "#1D4ED8" },
  "Нечёт":       { bg: "#FED7AA", text: "#C2410C" },
  "Кастом":      { bg: "#EDE9FE", text: "#6D28D9" },
};

// ─── Шаги визарда ──────────────────────────────────────────────────────────

type WizardStep = "name" | "schedule" | "confirm";

const STEPS: { key: WizardStep; label: string }[] = [
  { key: "name",     label: "Название" },
  { key: "schedule", label: "Расписание" },
  { key: "confirm",  label: "Готово" },
];

export function SubjectWizard({ mode, initial }: SubjectWizardProps) {
  const router = useRouter();
  const { data } = useAsyncStore();
  const [isPending, startTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);

  const [step, setStep] = useState<WizardStep>("name");
  const [name, setName] = useState(initial?.name ?? "");
  const [rules, setRules] = useState<ScheduleRule[]>(initial?.rules ?? []);
  const [sheetOpen, setSheetOpen] = useState(false);

  const stepIdx = STEPS.findIndex(s => s.key === step);

  const handleBack = useCallback(() => {
    if (step === "name") {
      startTransition(() => router.back());
    } else if (step === "schedule") {
      setStep("name");
    } else {
      setStep("schedule");
    }
  }, [step, router]);

  const handleNext = useCallback(() => {
    if (step === "name") setStep("schedule");
    else if (step === "schedule") setStep("confirm");
  }, [step]);

  const handleAddRules = useCallback((newRules: ScheduleRule[]) => {
    setRules(prev => [...prev, ...newRules]);
  }, []);

  const handleDeleteRule = useCallback((id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
  }, []);

  const handleSave = useCallback(async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      if (mode === "new") {
        await asyncStore.addSubject({
          id: crypto.randomUUID(),
          name: name.trim(),
          rules,
        });
      } else if (initial) {
        await asyncStore.updateSubject({
          ...initial,
          name: name.trim(),
          rules,
        });
      }
      startTransition(() => router.back());
    } finally {
      setIsSaving(false);
    }
  }, [mode, name, rules, initial, router]);

  const semester = data?.semester ?? { startDate: new Date().toISOString().slice(0, 10), weeks: 16 };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">

      {/* Шапка */}
      <div className="flex items-center justify-between px-4 pt-6 pb-2">
        <button
          onClick={handleBack}
          className="w-9 h-9 rounded-2xl bg-white flex items-center justify-center active:scale-95 transition-transform shadow-sm"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9L11 14" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <h1 className="text-[17px] font-bold text-gray-900">
          {mode === "new" ? "Новый предмет" : "Редактировать"}
        </h1>

        <div className="w-9" />
      </div>

      {/* Прогресс */}
      <div className="flex items-center gap-1 px-4 pt-2 pb-4">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center gap-1 flex-1">
            <div className="flex flex-col items-center gap-1 flex-1">
              <div
                className="h-1.5 w-full rounded-full transition-all duration-300"
                style={{
                  background: i < stepIdx ? "#6B7280" : i === stepIdx ? "#111827" : "#E5E7EB"
                }}
              />
              <span className={`text-[10px] font-medium ${
                i === stepIdx ? "text-gray-900" : "text-gray-400"
              }`}>
                {s.label}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1 px-4 pb-32 flex flex-col gap-4">

        {/* ШАГ 1 — Название */}
        {step === "name" && (
          <div className="flex flex-col gap-3">
            <p className="text-[22px] font-bold text-gray-900 leading-snug">
              Как называется предмет?
            </p>
            <p className="text-[14px] text-gray-400">
              Введите полное название дисциплины
            </p>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Например: Математический анализ"
              autoFocus
              className="w-full bg-white rounded-2xl px-4 py-4 text-[16px] text-gray-900 font-medium outline-none border-2 border-transparent focus:border-gray-200 transition-colors placeholder:text-gray-300 mt-2"
            />
          </div>
        )}

        {/* ШАГ 2 — Расписание */}
        {step === "schedule" && (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-[22px] font-bold text-gray-900 leading-snug">
                Когда проходит предмет?
              </p>
              <p className="text-[14px] text-gray-400 mt-1">
                Добавьте правила расписания
              </p>
            </div>

            {/* Список правил */}
            {rules.length > 0 && (
              <div className="bg-white rounded-3xl overflow-hidden">
                {rules.map((rule) => {
                  const colors = RULE_COLORS[rule.type] ?? RULE_COLORS["Еженедельно"];
                  return (
                    <div
                      key={rule.id}
                      className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0"
                    >
                      <span
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                        style={{ background: colors.bg, color: colors.text }}
                      >
                        {rule.type}
                      </span>
                      <span className="text-[13px] text-gray-700 font-medium flex-1">
                        {ruleLabel(rule)}
                      </span>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center active:bg-red-50 transition-colors shrink-0"
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M2.5 3.5H11.5M5 3.5V2.5H9V3.5M4.5 3.5V11C4.5 11.3 4.7 11.5 5 11.5H9C9.3 11.5 9.5 11.3 9.5 11V3.5"
                            stroke="#EF4444" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Кнопка добавить правило */}
            <button
              onClick={() => setSheetOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-dashed border-gray-200 text-gray-500 text-[14px] font-medium active:bg-gray-50 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
              </svg>
              Добавить правило
            </button>

            {/* Превью недели */}
            <WeekPreview rules={rules} semester={semester} />
          </div>
        )}

        {/* ШАГ 3 — Подтверждение */}
        {step === "confirm" && (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-[22px] font-bold text-gray-900 leading-snug">
                Всё верно?
              </p>
              <p className="text-[14px] text-gray-400 mt-1">
                Проверьте данные перед сохранением
              </p>
            </div>

            {/* Итоговая карточка */}
            <div className="bg-white rounded-3xl overflow-hidden">
              <div className="px-4 py-4 border-b border-gray-50">
                <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide mb-1">
                  Название
                </p>
                <p className="text-[16px] font-semibold text-gray-900">{name}</p>
              </div>

              <div className="px-4 py-4">
                <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide mb-2">
                  Расписание
                </p>
                {rules.length === 0 ? (
                  <p className="text-[14px] text-gray-300">Без расписания</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {rules.map(rule => {
                      const colors = RULE_COLORS[rule.type] ?? RULE_COLORS["Еженедельно"];
                      return (
                        <div key={rule.id} className="flex items-center gap-2">
                          <span
                            className="text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                            style={{ background: colors.bg, color: colors.text }}
                          >
                            {rule.type}
                          </span>
                          <span className="text-[13px] text-gray-700">{ruleLabel(rule)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Превью */}
            <WeekPreview rules={rules} semester={semester} />
          </div>
        )}

      </div>

      {/* Нижняя кнопка */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-8 pt-3 bg-gray-50/80 backdrop-blur-sm">
        {step !== "confirm" ? (
          <button
            onClick={handleNext}
            disabled={step === "name" && !name.trim()}
            className="w-full py-4 rounded-2xl bg-gray-900 text-white text-[15px] font-semibold active:scale-[0.98] transition-all disabled:opacity-30 disabled:pointer-events-none"
          >
            Далее
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={isSaving || isPending}
            className="w-full py-4 rounded-2xl bg-gray-900 text-white text-[15px] font-semibold active:scale-[0.98] transition-all disabled:opacity-40"
          >
            {isSaving ? "Сохранение..." : mode === "new" ? "Добавить предмет" : "Сохранить изменения"}
          </button>
        )}
      </div>

      {/* Bottom Sheet */}
      <RuleBottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onAdd={handleAddRules}
      />
    </div>
  );
}