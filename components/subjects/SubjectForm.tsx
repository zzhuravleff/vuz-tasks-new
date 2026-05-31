// app/settings/subjects/_components/SubjectForm.tsx

"use client";

import { useState, useCallback, useTransition, memo } from "react";
import { useRouter } from "next/navigation";
import { Subject, ScheduleRule, WeeklyRule, CustomRule } from "@/types";
import { asyncStore } from "@/lib/asyncStore";
import {
  Button,
  Chip,
  Input,
  IconChevronLeft,
} from "@heroui/react";

// ─── Константы ─────────────────────────────────────────────────────────────

const DAYS_SHORT = ["", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const DAYS = [
  { value: 1, label: "Пн" },
  { value: 2, label: "Вт" },
  { value: 3, label: "Ср" },
  { value: 4, label: "Чт" },
  { value: 5, label: "Пт" },
  { value: 6, label: "Сб" },
];

const WEEK_TYPES = [
  { value: "Еженедельно", label: "Еженед.", color: "accent"   },
  { value: "Нечёт",       label: "Нечёт",   color: "warning"  },
  { value: "Чёт",         label: "Чёт",     color: "success"  },
  { value: "Кастом",      label: "Кастом",  color: "danger"   },
] as const;

type WeekTypeValue = "Еженедельно" | "Нечёт" | "Чёт" | "Кастом";

const RULE_CHIP_COLOR: Record<string, "default" | "accent" | "warning" | "success" | "danger"> = {
  "Еженедельно": "accent",
  "Нечёт":       "warning",
  "Чёт":         "success",
  "Кастом":      "danger",
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

const RuleRow = memo(({ rule, onDelete }: {
  rule: ScheduleRule;
  onDelete: (id: string) => void;
}) => (
  <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
    <Chip
      color={RULE_CHIP_COLOR[rule.type] ?? "default"}
      variant="soft"
      size="sm"
      className="shrink-0"
    >
      {rule.type}
    </Chip>
    <span className="text-sm text-black flex-1">{ruleLabel(rule)}</span>
    <Button
      isIconOnly
      size="sm"
      variant="danger-soft"
      onPress={() => onDelete(rule.id)}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path
          d="M2.5 3.5H11.5M5 3.5V2.5H9V3.5M4.5 3.5V11C4.5 11.3 4.7 11.5 5 11.5H9C9.3 11.5 9.5 11.3 9.5 11V3.5"
          stroke="currentColor" strokeWidth="1.25"
          strokeLinecap="round" strokeLinejoin="round"
        />
      </svg>
    </Button>
  </div>
));
RuleRow.displayName = "RuleRow";

// ─── Сегментед контрол (кнопки-переключатели) ─────────────────────────────

interface SegmentedProps<T extends string> {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  multi?: boolean;
  selectedMulti?: T[];
  onToggleMulti?: (v: T) => void;
}

function Segmented<T extends string>({
  options, value, onChange, multi, selectedMulti = [], onToggleMulti,
}: SegmentedProps<T>) {
  return (
    <div className="flex gap-1 flex-wrap">
      {options.map(opt => {
        const isActive = multi
          ? selectedMulti.includes(opt.value)
          : value === opt.value;

        return (
          <Button
            key={opt.value}
            size="sm"
            variant={isActive ? "primary" : "secondary"}
            onPress={() => multi ? onToggleMulti?.(opt.value) : onChange(opt.value)}
          >
            {opt.label}
          </Button>
        );
      })}
    </div>
  );
}

// ─── Форма добавления правила ──────────────────────────────────────────────

interface AddRuleFormProps {
  onAdd: (rules: ScheduleRule[]) => void;
}

const LESSON_OPTIONS = [1, 2, 3, 4, 5, 6].map(l => ({
  value: String(l) as string,
  label: String(l),
}));

const DAY_OPTIONS = DAYS.map(d => ({
  value: String(d.value) as string,
  label: d.label,
}));

const AddRuleForm = memo(({ onAdd }: AddRuleFormProps) => {
  const [weekType, setWeekType] = useState<WeekTypeValue>("Еженедельно");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [selectedLessons, setSelectedLessons] = useState<number[]>([]);
  const [customDate, setCustomDate] = useState("");

  const toggleDay = useCallback((v: string) => {
    const num = Number(v);
    setSelectedDays(prev =>
      prev.includes(num) ? prev.filter(d => d !== num) : [...prev, num]
    );
  }, []);

  const toggleLesson = useCallback((v: string) => {
    const num = Number(v);
    setSelectedLessons(prev =>
      prev.includes(num) ? prev.filter(l => l !== num) : [...prev, num].sort((a, b) => a - b)
    );
  }, []);

  const canAdd = selectedLessons.length > 0 &&
    (weekType === "Кастом" ? customDate.length > 0 : selectedDays.length > 0);

  const handleAdd = useCallback(() => {
    if (!canAdd) return;
    const newRules: ScheduleRule[] = [];

    if (weekType === "Кастом") {
      newRules.push({
        id: crypto.randomUUID(),
        type: "Кастом",
        date: customDate,
        lesson: selectedLessons,
      } as CustomRule);
    } else {
      selectedDays.forEach(day => {
        newRules.push({
          id: crypto.randomUUID(),
          type: weekType,
          dayOfWeek: day,
          lesson: selectedLessons,
        } as WeeklyRule);
      });
    }

    onAdd(newRules);
    setSelectedDays([]);
    setSelectedLessons([]);
    setCustomDate("");
  }, [canAdd, weekType, customDate, selectedDays, selectedLessons, onAdd]);

  return (
    <div className="bg-white rounded-2xl p-4 flex flex-col gap-4">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
        Добавить занятие
      </span>

      {/* Тип недели */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-gray-400">Повторение</span>
        <Segmented
          options={WEEK_TYPES}
          value={weekType}
          onChange={(v) => { setWeekType(v); setSelectedDays([]); }}
        />
      </div>

      {/* Дата или дни */}
      {weekType === "Кастом" ? (
        <Input
          type="date"
          value={customDate}
          onChange={e => setCustomDate(e.target.value)}
          variant="secondary"
        />
      ) : (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-gray-400">День недели</span>
          <Segmented
            options={DAY_OPTIONS}
            value=""
            onChange={() => {}}
            multi
            selectedMulti={selectedDays.map(String)}
            onToggleMulti={toggleDay}
          />
        </div>
      )}

      {/* Пары */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-gray-400">Пара</span>
        <Segmented
          options={LESSON_OPTIONS}
          value=""
          onChange={() => {}}
          multi
          selectedMulti={selectedLessons.map(String)}
          onToggleMulti={toggleLesson}
        />
      </div>

      <Button
        variant="primary"
        onPress={handleAdd}
        isDisabled={!canAdd}
        className="w-full"
      >
        Добавить
      </Button>
    </div>
  );
});
AddRuleForm.displayName = "AddRuleForm";

// ─── Главная форма ─────────────────────────────────────────────────────────

interface SubjectFormProps {
  mode: "new" | "edit";
  initial?: Subject;
}

export function SubjectForm({ mode, initial }: SubjectFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [name, setName] = useState(initial?.name ?? "");
  const [rules, setRules] = useState<ScheduleRule[]>(initial?.rules ?? []);
  const [isDirty, setIsDirty] = useState(false);

  const isValid = name.trim().length > 0;

  const handleNameChange = useCallback((v: string) => {
    setName(v);
    setIsDirty(true);
  }, []);

  const handleAddRules = useCallback((newRules: ScheduleRule[]) => {
    setRules(prev => [...prev, ...newRules]);
    setIsDirty(true);
  }, []);

  const handleDeleteRule = useCallback((id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
    setIsDirty(true);
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
        await asyncStore.updateSubject({ ...initial, name: name.trim(), rules });
      }
      setIsDirty(false);
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

  return (
    <div className="flex flex-col min-h-screen">

      {/* Кнопка назад */}
      <Button
        variant="tertiary"
        className="fixed"
        onPress={() => startTransition(() => router.back())}
      >
        <IconChevronLeft className="size-4" />
        Назад
      </Button>

      {/* Кнопка сохранить — только когда isDirty */}
      {isDirty && isValid && (
        <Button
          variant="primary"
          className="fixed right-4"
          onPress={handleSave}
          isDisabled={isSaving || isPending}
        >
          {isSaving ? "..." : "Сохранить"}
        </Button>
      )}

      {/* Заголовок */}
      <h1 className="text-2xl font-medium text-center mt-12 mb-4">
        {mode === "new" ? "Новая дисциплина" : "Редактировать"}
      </h1>

      <div className="flex flex-col gap-4 pb-10">

        {/* Название */}
        <Input
          placeholder="Например: Математический анализ"
          value={name}
          onChange={e => handleNameChange(e.target.value)}
          autoFocus={mode === "new"}
          variant="secondary"
        />

        {/* Список правил */}
        {rules.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">
              Расписание
            </span>
            <div className="bg-white rounded-2xl px-4">
              {rules.map(rule => (
                <RuleRow
                  key={rule.id}
                  rule={rule}
                  onDelete={handleDeleteRule}
                />
              ))}
            </div>
          </div>
        )}

        {/* Форма добавления */}
        <AddRuleForm onAdd={handleAddRules} />

        {/* Удалить */}
        {mode === "edit" && (
          <Button
            variant="danger-soft"
            onPress={handleDelete}
            isDisabled={isDeleting || isPending}
            className="w-full"
          >
            {isDeleting ? "Удаление..." : "Удалить дисциплину"}
          </Button>
        )}

      </div>
    </div>
  );
}