// app/settings/subjects/new/page.tsx
// app/settings/subjects/[id]/page.tsx — один компонент для обоих случаев

// Сначала создадим общий компонент формы предмета:
// app/settings/subjects/_components/SubjectForm.tsx

"use client";

import { useState, useCallback, useTransition, memo } from "react";
import { useRouter } from "next/navigation";
import { Subject, ScheduleRule, WeeklyRule, CustomRule } from "@/types";
import { asyncStore } from "@/lib/asyncStore";

// ─── Константы ─────────────────────────────────────────────────────────────

const DAYS = [
  { value: 1, label: "Пн" },
  { value: 2, label: "Вт" },
  { value: 3, label: "Ср" },
  { value: 4, label: "Чт" },
  { value: 5, label: "Пт" },
  { value: 6, label: "Сб" },
  { value: 7, label: "Вс" },
];

const LESSONS = [1, 2, 3, 4, 5, 6];

const WEEK_TYPES = [
  { value: "Еженедельно", label: "Каждую неделю", color: "bg-gray-100 text-gray-600" },
  { value: "Чёт",         label: "Чётные",         color: "bg-blue-50 text-blue-600" },
  { value: "Нечёт",       label: "Нечётные",       color: "bg-orange-50 text-orange-600" },
  { value: "Кастом",      label: "Конкретная дата", color: "bg-purple-50 text-purple-600" },
] as const;

const inputClass = `
  w-full bg-gray-50 rounded-2xl px-4 py-3.5
  text-[15px] text-black font-medium
  outline-none border-2 border-transparent
  focus:border-gray-200 focus:bg-white transition-all
  placeholder:text-gray-300
`;

// ─── Вспомогательные компоненты ────────────────────────────────────────────

const Field = memo(({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide px-1">
      {label}
    </span>
    {children}
  </div>
));
Field.displayName = "Field";

// Сетка кнопок-пилюль (дни, пары)
interface PillGridProps {
  items: { value: number; label: string }[];
  selected: number[];
  onToggle: (v: number) => void;
}

const PillGrid = memo(({ items, selected, onToggle }: PillGridProps) => (
  <div className="flex flex-wrap gap-2">
    {items.map(({ value, label }) => {
      const active = selected.includes(value);
      return (
        <button
          key={value}
          onClick={() => onToggle(value)}
          className={`
            px-3.5 py-2 rounded-xl text-[13px] font-semibold
            transition-all duration-150 active:scale-95
            ${active ? "bg-black text-white" : "bg-gray-100 text-gray-500"}
          `}
        >
          {label}
        </button>
      );
    })}
  </div>
));
PillGrid.displayName = "PillGrid";

// ─── Форма добавления правила ──────────────────────────────────────────────

interface AddRuleFormProps {
  onAdd: (rule: ScheduleRule) => void;
  onCancel: () => void;
}

const AddRuleForm = memo(({ onAdd, onCancel }: AddRuleFormProps) => {
  const [ruleType, setRuleType] = useState<"Еженедельно" | "Чёт" | "Нечёт" | "Кастом">("Еженедельно");
  const [dayOfWeek, setDayOfWeek] = useState<number[]>([]);
  const [lessons, setLessons] = useState<number[]>([]);
  const [customDate, setCustomDate] = useState("");

  const toggleDay = useCallback((v: number) => {
    setDayOfWeek((prev) =>
      prev.includes(v) ? prev.filter((d) => d !== v) : [...prev, v]
    );
  }, []);

  const toggleLesson = useCallback((v: number) => {
    setLessons((prev) =>
      prev.includes(v) ? prev.filter((l) => l !== v) : [...prev, v].sort((a, b) => a - b)
    );
  }, []);

  const isValid =
    lessons.length > 0 &&
    (ruleType === "Кастом" ? customDate.length > 0 : dayOfWeek.length > 0);

  const handleAdd = useCallback(() => {
    if (!isValid) return;

    if (ruleType === "Кастом") {
      const rule: CustomRule = {
        id: crypto.randomUUID(),
        type: "Кастом",
        date: customDate,
        lesson: lessons,
      };
      onAdd(rule);
    } else {
      // Создаём отдельное правило для каждого выбранного дня
      dayOfWeek.forEach((day) => {
        const rule: WeeklyRule = {
          id: crypto.randomUUID(),
          type: ruleType,
          dayOfWeek: day,
          lesson: lessons,
        };
        onAdd(rule);
      });
    }
  }, [isValid, ruleType, customDate, dayOfWeek, lessons, onAdd]);

  return (
    <div className="bg-gray-50 rounded-3xl p-4 flex flex-col gap-4 border-2 border-gray-100">

      {/* Тип недели */}
      <Field label="Повторение">
        <div className="flex flex-wrap gap-2">
          {WEEK_TYPES.map(({ value, label, color }) => (
            <button
              key={value}
              onClick={() => setRuleType(value)}
              className={`
                px-3.5 py-2 rounded-xl text-[13px] font-semibold
                transition-all duration-150 active:scale-95
                ${ruleType === value ? color + " ring-2 ring-offset-1 ring-gray-200" : "bg-white text-gray-400"}
              `}
            >
              {label}
            </button>
          ))}
        </div>
      </Field>

      {/* День недели или дата */}
      {ruleType === "Кастом" ? (
        <Field label="Дата">
          <input
            type="date"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
            className={inputClass}
          />
        </Field>
      ) : (
        <Field label="День недели">
          <PillGrid
            items={DAYS}
            selected={dayOfWeek}
            onToggle={toggleDay}
          />
        </Field>
      )}

      {/* Номера пар */}
      <Field label="Пары">
        <PillGrid
          items={LESSONS.map((l) => ({ value: l, label: `${l}` }))}
          selected={lessons}
          onToggle={toggleLesson}
        />
      </Field>

      {/* Кнопки */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={onCancel}
          className="flex-1 py-3 rounded-2xl bg-white text-gray-500 text-[14px] font-semibold active:scale-[0.98] transition-transform"
        >
          Отмена
        </button>
        <button
          onClick={handleAdd}
          disabled={!isValid}
          className="flex-1 py-3 rounded-2xl bg-black text-white text-[14px] font-semibold active:scale-[0.98] transition-transform disabled:opacity-30 disabled:pointer-events-none"
        >
          Добавить
        </button>
      </div>
    </div>
  );
});
AddRuleForm.displayName = "AddRuleForm";

// ─── Карточка правила ──────────────────────────────────────────────────────

const DAYS_SHORT = ["", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function ruleLabel(rule: ScheduleRule): string {
  if (rule.type === "Кастом") {
    const d = new Date(rule.date);
    const months = ["янв.", "февр.", "мар.", "апр.", "мая", "июн.",
                    "июл.", "авг.", "сент.", "окт.", "нояб.", "дек."];
    return `${d.getDate()} ${months[d.getMonth()]} · ${rule.lesson.join(", ")} пара`;
  }
  const day = DAYS_SHORT[rule.dayOfWeek];
  const lessons = rule.lesson.join(", ");
  const type = rule.type === "Еженедельно" ? "" : ` · ${rule.type}`;
  return `${day}${type} · ${lessons} пара`;
}

interface RuleCardProps {
  rule: ScheduleRule;
  onDelete: (id: string) => void;
}

const RuleCard = memo(({ rule, onDelete }: RuleCardProps) => {
  const typeColor =
    rule.type === "Еженедельно" ? "bg-gray-100 text-gray-500" :
    rule.type === "Чёт"         ? "bg-blue-50 text-blue-600" :
    rule.type === "Нечёт"       ? "bg-orange-50 text-orange-600" :
                                  "bg-purple-50 text-purple-600";

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${typeColor}`}>
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
            stroke="#EF4444" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
});
RuleCard.displayName = "RuleCard";

// ─── Главный компонент формы предмета ─────────────────────────────────────

interface SubjectFormProps {
  initial?: Subject;
  mode: "new" | "edit";
}

export function SubjectForm({ initial, mode }: SubjectFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState(initial?.name ?? "");
  const [rules, setRules] = useState<ScheduleRule[]>(initial?.rules ?? []);
  const [showAddRule, setShowAddRule] = useState(false);

  const isValid = name.trim().length > 0;

  const handleAddRule = useCallback((rule: ScheduleRule) => {
    setRules((prev) => [...prev, rule]);
    setShowAddRule(false);
  }, []);

  const handleDeleteRule = useCallback((id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const handleSave = useCallback(async () => {
    if (!isValid) return;
    setIsSaving(true);

    try {
      if (mode === "new") {
        const subject: Subject = {
          id: crypto.randomUUID(),
          name: name.trim(),
          rules,
        };
        await asyncStore.addSubject(subject);
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
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <h1 className="text-[17px] font-bold text-black">
          {mode === "new" ? "Новый предмет" : "Редактировать"}
        </h1>

        <button
          onClick={handleSave}
          disabled={!isValid || isSaving || isPending}
          className="px-3.5 py-1.5 rounded-xl bg-black text-white text-[13px] font-semibold active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
        >
          {isSaving ? "..." : "Готово"}
        </button>
      </div>

      <div className="flex-1 px-4 pb-10 flex flex-col gap-4">

        {/* Название */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide px-1">
            Название
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Например: Математический анализ"
            autoFocus={mode === "new"}
            className={inputClass}
          />
        </div>

        {/* Правила расписания */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide">
              Расписание
            </span>
            {!showAddRule && (
              <button
                onClick={() => setShowAddRule(true)}
                className="text-[13px] font-semibold text-black active:opacity-60 transition-opacity"
              >
                + Добавить
              </button>
            )}
          </div>

          {/* Форма добавления правила */}
          {showAddRule && (
            <AddRuleForm
              onAdd={handleAddRule}
              onCancel={() => setShowAddRule(false)}
            />
          )}

          {/* Список правил */}
          {rules.length > 0 ? (
            <div className="bg-white rounded-3xl overflow-hidden">
              {rules.map((rule) => (
                <RuleCard
                  key={rule.id}
                  rule={rule}
                  onDelete={handleDeleteRule}
                />
              ))}
            </div>
          ) : !showAddRule ? (
            <button
              onClick={() => setShowAddRule(true)}
              className="bg-white rounded-3xl px-4 py-5 flex flex-col items-center gap-2 active:bg-gray-50 transition-colors w-full"
            >
              <span className="text-gray-300 text-[13px]">Нет правил расписания</span>
              <span className="text-gray-400 text-[13px] font-semibold">Нажмите чтобы добавить</span>
            </button>
          ) : null}
        </div>

      </div>
    </div>
  );
}