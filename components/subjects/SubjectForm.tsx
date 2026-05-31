// app/settings/subjects/_components/SubjectForm.tsx

"use client";

import { useState, useCallback, useTransition, memo } from "react";
import { useRouter } from "next/navigation";
import { Subject, ScheduleRule, WeeklyRule, CustomRule } from "@/types";
import { asyncStore } from "@/lib/asyncStore";
import { useAsyncStore } from "@/hooks/useAsyncStore";
import { RuleBottomSheet } from "@/components/subjects/RuleBottomSheet";

// ─── Константы ─────────────────────────────────────────────────────────────

const DAYS_SHORT = ["", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const RULE_COLORS: Record<string, { bg: string; text: string }> = {
  "Еженедельно": { bg: "#F3F4F6", text: "#374151" },
  "Чёт":         { bg: "#DBEAFE", text: "#1D4ED8" },
  "Нечёт":       { bg: "#FED7AA", text: "#C2410C" },
  "Кастом":      { bg: "#EDE9FE", text: "#6D28D9" },
};

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

// ─── Строка правила ────────────────────────────────────────────────────────

const RuleRow = memo(({ rule, onDelete }: { rule: ScheduleRule; onDelete: (id: string) => void }) => {
  const colors = RULE_COLORS[rule.type] ?? RULE_COLORS["Еженедельно"];
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
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
        onClick={() => onDelete(rule.id)}
        className="w-7 h-7 rounded-lg flex items-center justify-center active:bg-red-50 transition-colors shrink-0"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2.5 3.5H11.5M5 3.5V2.5H9V3.5M4.5 3.5V11C4.5 11.3 4.7 11.5 5 11.5H9C9.3 11.5 9.5 11.3 9.5 11V3.5"
            stroke="#EF4444" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
});
RuleRow.displayName = "RuleRow";

// ─── Форма ─────────────────────────────────────────────────────────────────

interface SubjectFormProps {
  mode: "new" | "edit";
  initial?: Subject;
}

export function SubjectForm({ mode, initial }: SubjectFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const [name, setName] = useState(initial?.name ?? "");
  const [rules, setRules] = useState<ScheduleRule[]>(initial?.rules ?? []);

  const isValid = name.trim().length > 0;

  const handleAddRules = useCallback((newRules: ScheduleRule[]) => {
    setRules(prev => [...prev, ...newRules]);
  }, []);

  const handleDeleteRule = useCallback((id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
  }, []);

  const handleSave = useCallback(async () => {
    if (!isValid) return;
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
  }, [isValid, mode, name, rules, initial, router]);

  const handleDelete = useCallback(async () => {
    if (!initial) return;
    setIsDeleting(true);
    try {
      await asyncStore.deleteSubject(initial.id);
      startTransition(() => router.back());
    } finally {
      setIsDeleting(false);
    }
  }, [initial, router]);

  const handleBack = useCallback(() => {
    startTransition(() => router.back());
  }, [router]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">

      {/* Шапка */}
      <div className="flex items-center justify-between px-4 pt-6 pb-4">
        <button
          onClick={handleBack}
          className="w-9 h-9 rounded-2xl bg-white flex items-center justify-center active:scale-95 transition-transform shadow-sm"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9L11 14" stroke="#111827" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <h1 className="text-[17px] font-bold text-gray-900">
          {mode === "new" ? "Новая дисциплина" : "Редактировать"}
        </h1>

        <button
          onClick={handleSave}
          disabled={!isValid || isSaving || isPending}
          className="px-3.5 py-1.5 rounded-xl bg-gray-900 text-white text-[13px] font-semibold active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
        >
          {isSaving ? "..." : "Готово"}
        </button>
      </div>

      <div className="flex-1 px-4 pb-10 flex flex-col gap-3">

        {/* Название */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide px-1">
            Название
          </span>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Например: Математический анализ"
            autoFocus={mode === "new"}
            className="w-full bg-white rounded-2xl px-4 py-3.5 text-[15px] text-gray-900 font-medium outline-none border-2 border-transparent focus:border-gray-200 transition-colors placeholder:text-gray-300"
          />
        </div>

        {/* Расписание */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide">
              Расписание
            </span>
            <button
              onClick={() => setSheetOpen(true)}
              className="text-[13px] font-semibold text-gray-900 active:opacity-60 transition-opacity"
            >
              + Добавить
            </button>
          </div>

          {rules.length === 0 ? (
            <button
              onClick={() => setSheetOpen(true)}
              className="bg-white rounded-2xl px-4 py-5 flex flex-col items-center gap-1.5 active:bg-gray-50 transition-colors w-full border-2 border-dashed border-gray-100"
            >
              <span className="text-[14px] font-medium text-gray-300">
                Нет правил расписания
              </span>
              <span className="text-[12px] text-gray-400">
                Нажмите чтобы добавить
              </span>
            </button>
          ) : (
            <div className="bg-white rounded-2xl overflow-hidden">
              {rules.map(rule => (
                <RuleRow
                  key={rule.id}
                  rule={rule}
                  onDelete={handleDeleteRule}
                />
              ))}
            </div>
          )}
        </div>

        {/* Удалить — только в режиме редактирования */}
        {mode === "edit" && (
          <button
            onClick={handleDelete}
            disabled={isDeleting || isPending}
            className="w-full py-3.5 rounded-2xl bg-red-50 text-red-500 text-[15px] font-semibold active:scale-[0.98] transition-all disabled:opacity-40 mt-2"
          >
            {isDeleting ? "Удаление..." : "Удалить дисциплину"}
          </button>
        )}

      </div>

      <RuleBottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onAdd={handleAddRules}
      />
    </div>
  );
}