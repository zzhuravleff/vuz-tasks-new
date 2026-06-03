// app/tasks/new/page.tsx

"use client";

import { useState, useCallback, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAsyncStore } from "@/hooks/useAsyncStore";
import { asyncStore } from "@/lib/asyncStore";
import { formatDateDisplay, getLessonSlots } from "@/lib/scheduleUtils";
import { LESSON_TIMES, CustomTask, ScheduleTask, LessonSlot } from "@/types";
import { TaskSkeleton } from "@/components/tasks/TaskSkeleton";
import {
  Button, Input, TextArea, Tabs, Label,
  IconChevronLeft, Description, Header,
  Select, ListBox,
} from "@heroui/react";

// ─── Форма кастомной задачи ────────────────────────────────────────────────

interface CustomFormProps {
  onSubmit: (task: CustomTask) => void;
  isSubmitting: boolean;
}

const CustomForm = ({ onSubmit, isSubmitting }: CustomFormProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");

  const isValid = title.trim().length > 0 && deadline.length > 0;

  const handleSubmit = useCallback(() => {
    if (!isValid) return;
    onSubmit({
      id: crypto.randomUUID(),
      type: "Кастомная",
      title: title.trim(),
      description: description.trim() || undefined,
      deadline: new Date(deadline).toISOString(),
      status: "active",
      createdAt: new Date().toISOString(),
    });
  }, [title, description, deadline, isValid, onSubmit]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Label>Название</Label>
        <Input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Что нужно сделать?"
          variant="secondary"
          autoFocus
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label>Описание</Label>
        <TextArea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Подробности (необязательно)"
          variant="secondary"
          rows={3}
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label>Дедлайн</Label>
        <Input
          type="datetime-local"
          value={deadline}
          onChange={e => setDeadline(e.target.value)}
          variant="secondary"
        />
      </div>

      <Button
        variant="primary"
        className="w-full"
        onPress={handleSubmit}
        isDisabled={!isValid || isSubmitting}
      >
        {isSubmitting ? "Сохранение..." : "Создать задачу"}
      </Button>
    </div>
  );
};

// ─── Форма задачи по расписанию ────────────────────────────────────────────

interface ScheduleFormProps {
  onSubmit: (task: ScheduleTask) => void;
  isSubmitting: boolean;
}

const ScheduleForm = ({ onSubmit, isSubmitting }: ScheduleFormProps) => {
  const { data, isLoading } = useAsyncStore();
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<LessonSlot | null>(null);
  const [description, setDescription] = useState("");

  const subjectSlots = useMemo(() => {
    if (!data || !selectedSubjectId) return [];
    const subject = data.subjects.find(s => s.id === selectedSubjectId);
    if (!subject) return [];

    const now = new Date();

    // Начало семестра
    const semesterStart = new Date(data.semester.startDate);

    // Конец семестра
    const semesterEnd = new Date(data.semester.startDate);
    semesterEnd.setDate(semesterEnd.getDate() + data.semester.weeks * 7 - 1);

    // from = сегодня или начало семестра (что позже)
    const from = now > semesterStart ? now : semesterStart;

    // to = через 60 дней или конец семестра (что раньше)
    const maxTo = new Date(now);
    maxTo.setDate(maxTo.getDate() + 60);
    const to = maxTo < semesterEnd ? maxTo : semesterEnd;

    // Если семестр уже закончился или ещё не начался — нет пар
    if (from > to) return [];

    return getLessonSlots(subject, from, to, data.semester) as LessonSlot[];
  }, [data, selectedSubjectId]);

  const slotsByDate = useMemo(() => {
    const map = new Map<string, LessonSlot[]>();
    for (const slot of subjectSlots) {
      const existing = map.get(slot.lessonDate) ?? [];
      map.set(slot.lessonDate, [...existing, slot]);
    }
    return map;
  }, [subjectSlots]);

  const handleSubjectChange = useCallback((id: string) => {
    setSelectedSubjectId(id);
    setSelectedSlot(null);
  }, []);

  const isValid = selectedSlot !== null;

  const handleSubmit = useCallback(() => {
    if (!isValid || !selectedSlot) return;
    onSubmit({
      id: crypto.randomUUID(),
      type: "По расписанию",
      description: description.trim() || undefined,
      subjectId: selectedSlot.subjectId,
      ruleId: selectedSlot.ruleId,
      lessonDate: selectedSlot.lessonDate,
      lessonNumber: selectedSlot.lessonNumber,
      status: "active",
      createdAt: new Date().toISOString(),
    });
  }, [isValid, selectedSlot, description, onSubmit]);

  if (isLoading) return <TaskSkeleton count={2} />;

  if (!data?.subjects.length) {
    return (
      <div className="bg-white rounded-3xl p-6 text-center flex flex-col gap-1">
        <p className="text-gray-400 text-[14px]">Нет дисциплин</p>
        <p className="text-gray-300 text-[13px]">Добавьте дисциплины в настройках</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">

      <div className="flex flex-col gap-1">
        <Label>Описание</Label>
        <TextArea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Подробности (необязательно)"
          variant="secondary"
          rows={3}
        />
      </div>

      {/* Выбор дисциплины */}
      <div className="flex flex-col gap-1">
        <Label>Дисциплина</Label>
        <Select
          selectedKey={selectedSubjectId}
          onSelectionChange={key => handleSubjectChange(key as string)}
          placeholder="Выберите дисциплину"
          variant="secondary"
          aria-label="Выбирите дисциплину"
        >
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {data.subjects.map(subject => (
                <ListBox.Item key={subject.id} id={subject.id} textValue={subject.name}>
                  <Label>{subject.name}</Label>
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      </div>

      {/* Выбор пары — появляется после выбора дисциплины */}
      {selectedSubjectId && (
        <div className="flex flex-col gap-1">
          <Label>Пара</Label>
          {subjectSlots.length === 0 ? (
            <p className="text-[14px] text-gray-400 px-1">Нет предстоящих пар</p>
          ) : (
            <Select
              variant="secondary"
              aria-label="Выберите пару"
              selectedKey={
                selectedSlot
                  ? `${selectedSlot.lessonDate}-lesson-${selectedSlot.lessonNumber}`
                  : null
              }
              onSelectionChange={key => {
                if (!key) { setSelectedSlot(null); return; }
                const str = key as string;
                const sepIdx = str.indexOf("-lesson-");
                const date = str.slice(0, sepIdx);
                const num = Number(str.slice(sepIdx + 8));
                const slot = subjectSlots.find(
                  s => s.lessonDate === date && s.lessonNumber === num
                ) ?? null;
                setSelectedSlot(slot);
              }}
              placeholder="Выберите пару"
            >
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {Array.from(slotsByDate.entries()).map(([date, slots]) => (
                    <ListBox.Section key={date}>
                      <Header>{formatDateDisplay(date)}</Header>
                      {slots.map(slot => {
                        const time = LESSON_TIMES[slot.lessonNumber];
                        const key = `${slot.lessonDate}-lesson-${slot.lessonNumber}`;
                        return (
                          <ListBox.Item key={key} id={key} textValue={`${slot.lessonNumber} пара ${time.start} – ${time.end}`}>
                            <Label>{slot.lessonNumber} пара</Label>
                            <Description>{time.start} – {time.end}</Description>
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                        );
                      })}
                    </ListBox.Section>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          )}
        </div>
      )}

      <Button
        variant="primary"
        className="w-full"
        onPress={handleSubmit}
        isDisabled={!isValid || isSubmitting}
      >
        {isSubmitting ? "Сохранение..." : "Создать задачу"}
      </Button>
    </div>
  );
};

// ─── Страница ──────────────────────────────────────────────────────────────

export default function NewTaskPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleBack = useCallback(() => {
    startTransition(() => router.back());
  }, [router]);

  const handleSubmit = useCallback(async (task: CustomTask | ScheduleTask) => {
    setIsSubmitting(true);
    try {
      await asyncStore.addTask(task);
      startTransition(() => router.back());
    } finally {
      setIsSubmitting(false);
    }
  }, [router]);

  return (
    <div className="flex flex-col min-h-screen">

      {/* Шапка — как у семестра */}
      <Button
        variant="tertiary"
        className="fixed z-10"
        onPress={handleBack}
      >
        <IconChevronLeft className="size-4" />
        Назад
      </Button>

      <h1 className="text-2xl font-medium text-center mt-12 mb-4">
        Новая задача
      </h1>

      <div className="flex flex-col gap-4 pb-10">

        {/* Tabs вместо самописного TabSwitcher */}
        <Tabs
          onSelectionChange={tab => {
            // сбрасываем форму при смене вкладки через key на формах
          }}
          className="w-full"
        >
          <Tabs.ListContainer>
            <Tabs.List>
              <Tabs.Tab id="Кастомная">
                Кастомная
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="По расписанию">
                По расписанию
                <Tabs.Indicator />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>

          <Tabs.Panel id="Кастомная" className="p-0">
            <div className="pt-4">
              <CustomForm
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
              />
            </div>
          </Tabs.Panel>

          <Tabs.Panel id="По расписанию"className="p-0">
            <div className="pt-4">
              <ScheduleForm
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
              />
            </div>
          </Tabs.Panel>
        </Tabs>

      </div>
    </div>
  );
}