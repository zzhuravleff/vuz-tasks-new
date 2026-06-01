// app/settings/subjects/_components/SubjectForm.tsx

"use client";

import { useState, useCallback, useTransition, memo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Subject, ScheduleRule, WeeklyRule, CustomRule } from "@/types";
import { asyncStore } from "@/lib/asyncStore";
import {
  Button, Chip, Input, Label, Spinner, Tabs,
  ToggleButton, ToggleButtonGroup, ToggleButtonGroupSeparator,
  IconChevronLeft,
} from "@heroui/react";
import { TrashBin } from "@gravity-ui/icons";

// ─── Константы ─────────────────────────────────────────────────────────────

const DAYS = [
  { id: 1, short: "Пн", full: "Понедельник" },
  { id: 2, short: "Вт", full: "Вторник" },
  { id: 3, short: "Ср", full: "Среда" },
  { id: 4, short: "Чт", full: "Четверг" },
  { id: 5, short: "Пт", full: "Пятница" },
  { id: 6, short: "Сб", full: "Суббота" },
];

const PARS = [
  { id: 1, time: "9:00" },
  { id: 2, time: "10:40" },
  { id: 3, time: "12:40" },
  { id: 4, time: "14:20" },
  { id: 5, time: "16:20" },
  { id: 6, time: "18:00" },
];

const TAB_ITEMS = [
  { id: "Еженедельно", label: "Еженед." },
  { id: "Нечёт",       label: "Нечёт"   },
  { id: "Чёт",         label: "Чёт"     },
  { id: "Кастом",      label: "Кастом"  },
] as const;

type WeekTypeValue = "Еженедельно" | "Нечёт" | "Чёт" | "Кастом";

const RULE_CHIP_COLOR: Record<string, "default" | "accent" | "warning" | "success" | "danger"> = {
  "Еженедельно": "accent",
  "Нечёт":       "success",
  "Чёт":         "warning",
  "Кастом":      "danger",
};

// ─── Утилиты ───────────────────────────────────────────────────────────────

const ensureLessonArray = (lesson: number | number[]): number[] => {
  if (Array.isArray(lesson)) return lesson;
  if (typeof lesson === "number") return [lesson];
  return [];
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric", month: "short", year: "numeric",
  }).format(date);
};

// ─── Карточка правила ──────────────────────────────────────────────────────

interface RuleCardProps {
  rule: ScheduleRule;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

const RuleCard = memo(({ rule, onDelete, isDeleting }: RuleCardProps) => {
  const lessons = ensureLessonArray(rule.lesson).sort((a, b) => a - b);
  const chipColor = RULE_CHIP_COLOR[rule.type] ?? "default";

  const title = rule.type !== "Кастом"
    ? DAYS.find(d => d.id === rule.dayOfWeek)?.full ?? ""
    : formatDate(rule.date);

  return (
    <div className="relative flex flex-col gap-2 p-3 bg-white rounded-3xl">
      {isDeleting && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-3xl">
          <Spinner size="lg" />
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xl font-medium">{title}</span>
        <div className="flex items-center gap-2">
          <Chip size="lg" variant="soft" color={chipColor}>
            {rule.type}
          </Chip>
          <Button
            isIconOnly
            size="sm"
            variant="danger-soft"
            onPress={() => onDelete(rule.id)}
          >
            <TrashBin className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {lessons.map(l => (
          <Chip key={l} size="lg">{l} пара</Chip>
        ))}
      </div>
    </div>
  );
});
RuleCard.displayName = "RuleCard";

// ─── Форма добавления правила ──────────────────────────────────────────────

interface AddRuleFormProps {
  onAdd: (rule: ScheduleRule) => void;
}

const AddRuleForm = memo(({ onAdd }: AddRuleFormProps) => {
  const [weekType, setWeekType] = useState<WeekTypeValue>("Еженедельно");
  const [day, setDay] = useState<Set<string>>(new Set());
  const [lessons, setLessons] = useState<Set<string>>(new Set());
  const [customDate, setCustomDate] = useState("");

  const canAdd = lessons.size > 0 &&
    (weekType === "Кастом" ? customDate.length > 0 : day.size > 0);

  const handleAdd = useCallback(() => {
    if (!canAdd) return;
    const lessonArr = Array.from(lessons).map(Number).sort((a, b) => a - b);

    if (weekType === "Кастом") {
      onAdd({
        id: crypto.randomUUID(),
        type: "Кастом",
        date: customDate,
        lesson: lessonArr,
      } as CustomRule);
    } else {
      // Для каждого выбранного дня создаём отдельное правило
      Array.from(day).forEach(d => {
        onAdd({
          id: crypto.randomUUID(),
          type: weekType,
          dayOfWeek: Number(d),
          lesson: lessonArr,
        } as WeeklyRule);
      });
    }

    setDay(new Set());
    setLessons(new Set());
    setCustomDate("");
  }, [canAdd, weekType, customDate, day, lessons, onAdd]);

  return (
    <div className="flex flex-col gap-2 bg-white p-3 rounded-3xl">

      {/* Вкладки типа */}
      <Tabs
        onSelectionChange={t => setWeekType(t as WeekTypeValue)}
        className="w-full"
      >
        <Tabs.ListContainer>
          <Tabs.List>
            {TAB_ITEMS.map(tab => (
              <Tabs.Tab key={tab.id} id={tab.id}>
                {tab.label}
                <Tabs.Indicator />
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>

      {weekType !== "Кастом" ? (
        <>
          {/* Дни недели — множественный выбор */}
          <ToggleButtonGroup
            className="w-full"
            selectedKeys={day}
            onSelectionChange={keys =>
              setDay(new Set(Array.from(keys).map(String)))
            }
          >
            {DAYS.map((d, i) => (
              <ToggleButton key={d.id} id={String(d.id)} className="flex-1">
                {i !== 0 && <ToggleButtonGroupSeparator />}
                {d.short}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </>
      ) : (
        <div className="flex flex-col gap-1">
          <Label>Дата пары</Label>
          <Input
            type="date"
            value={customDate}
            onChange={e => setCustomDate(e.target.value)}
            variant="secondary"
          />
        </div>
      )}

      {/* Пары */}
      <ToggleButtonGroup
        className="w-full"
        selectionMode="multiple"
        selectedKeys={lessons}
        onSelectionChange={keys =>
          setLessons(new Set(Array.from(keys).map(String)))
        }
      >
        {PARS.map((par, i) => (
          <ToggleButton key={par.id} id={String(par.id)} className="flex-1">
            {i !== 0 && <ToggleButtonGroupSeparator />}
            {par.id}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <Button
        className="w-full"
        isDisabled={!canAdd}
        onPress={handleAdd}
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
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);

  const [name, setName] = useState(initial?.name ?? "");
  const [rules, setRules] = useState<ScheduleRule[]>(initial?.rules ?? []);
  const [isDirty, setIsDirty] = useState(false);

  // Сортировка правил: сначала по дню недели, потом кастом по дате
  const sortedRules = [...rules].sort((a, b) => {
    if (a.type === "Кастом" && b.type !== "Кастом") return 1;
    if (a.type !== "Кастом" && b.type === "Кастом") return -1;
    if (a.type !== "Кастом" && b.type !== "Кастом") {
      return (a.dayOfWeek ?? 0) - (b.dayOfWeek ?? 0);
    }
    if (a.type === "Кастом" && b.type === "Кастом") {
      return a.date.localeCompare(b.date);
    }
    return 0;
  });

  const isValid = name.trim().length > 0;

  const handleAddRule = useCallback((rule: ScheduleRule) => {
    setRules(prev => [...prev, rule]);
    setIsDirty(true);
  }, []);

  const handleDeleteRule = useCallback((id: string) => {
    setDeletingRuleId(id);
    setTimeout(() => {
      setRules(prev => prev.filter(r => r.id !== id));
      setDeletingRuleId(null);
      setIsDirty(true);
    }, 200);
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
    <div className="flex flex-col gap-4 w-full pb-8">

      {/* Назад */}
      <Button
        variant="tertiary"
        className="fixed"
        onPress={() => startTransition(() => router.back())}
      >
        <IconChevronLeft className="size-4" />
        Назад
      </Button>

      {/* Сохранить — только когда isDirty */}
      {isDirty && isValid && (
        <Button
          variant="primary"
          className="fixed right-4"
          onPress={handleSave}
          isDisabled={isSaving || isPending}
        >
          {isSaving ? <Spinner size="sm" color="current" /> : "Сохранить"}
        </Button>
      )}

      {/* Название */}
      <h1 className="text-2xl font-medium text-center mt-12">
        {mode === "new" ? "Новая дисциплина" : initial?.name}
      </h1>

      {/* Поле названия */}
      <div className="flex flex-col gap-1">
        <Label>Название</Label>
        <Input
          value={name}
          onChange={e => { setName(e.target.value); setIsDirty(true); }}
          placeholder="Например: Математический анализ"
          autoFocus={mode === "new"}
          variant="secondary"
        />
      </div>

      {/* Список правил */}
      {rules.length === 0 && (
        <p className="text-center text-gray-400">Пока пары не добавлены...</p>
      )}

      <div className="flex flex-col gap-2">
        {sortedRules.map(rule => (
          <RuleCard
            key={rule.id}
            rule={rule}
            onDelete={handleDeleteRule}
            isDeleting={deletingRuleId === rule.id}
          />
        ))}
      </div>

      {/* Форма добавления */}
      <AddRuleForm onAdd={handleAddRule} />

      {/* Удалить дисциплину */}
      {mode === "edit" && (
        <Button
          variant="danger-soft"
          className="w-full"
          onPress={handleDelete}
          isDisabled={isDeleting}
        >
          {isDeleting ? <Spinner size="sm" color="current" /> : "Удалить дисциплину"}
        </Button>
      )}

    </div>
  );
}