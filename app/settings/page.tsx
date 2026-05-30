// app/settings/page.tsx

"use client";

import { useState, useCallback, useMemo, memo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAsyncStore } from "@/hooks/useAsyncStore";
import { useWeekInfo } from "@/hooks/useSchedule";
import { asyncStore } from "@/lib/asyncStore";
import { Button, Chip } from "@heroui/react";

// ─── Секция ────────────────────────────────────────────────────────────────

const Section = memo(({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-2">
    <span className="text-lg text-center font-medium text-gray-400 uppercase tracking-wide">
      {title}
    </span>
    <div className="bg-white rounded-3xl overflow-hidden">
      {children}
    </div>
  </div>
));
Section.displayName = "Section";

// ─── Строка настройки ──────────────────────────────────────────────────────

interface SettingsRowProps {
  label: string;
  sub?: string;
  onClick?: () => void;
  right?: React.ReactNode;
  destructive?: boolean;
}

const SettingsRow = memo(({ label, sub, onClick, right, destructive }: SettingsRowProps) => (
  <button
    onClick={onClick}
    disabled={!onClick}
    className={`
      w-full flex items-center rounded-3xl justify-between gap-3
      p-4 border-b border-gray-50 last:border-0
      active:bg-gray-50 transition-colors text-left
      disabled:pointer-events-none
    `}
  >
    <div className="flex flex-col gap-0.5 flex-1">
      <span className={`text-base font-medium ${destructive ? "text-danger" : "text-black"}`}>
        {label}
      </span>
      {sub && <span className="text-sm text-gray-400">{sub}</span>}
    </div>
    {right ?? (
      onClick && (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6 4L10 8L6 12" stroke="#D1D5DB" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    )}
  </button>
));
SettingsRow.displayName = "SettingsRow";

// ─── Модалка подтверждения сброса ─────────────────────────────────────────

interface ConfirmResetModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmResetModal = memo(({ onConfirm, onCancel }: ConfirmResetModalProps) => (
  <div className="fixed inset-0 z-[60] flex items-end justify-center">
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
    <div className="relative bg-white rounded-t-3xl w-full max-w-lg p-6 flex flex-col gap-2">
      <div className="flex flex-col gap-1.5 text-center">
        <h2 className="text-[18px] font-bold text-black">Сбросить данные?</h2>
        <p className="text-[14px] text-gray-400 leading-snug">
          Все задачи, дисциплины и расписание будут удалены. Это действие нельзя отменить.
        </p>
      </div>
      <Button
        onClick={onConfirm}
        variant="danger"
        className="w-full"
      >
        Сбросить всё
      </Button>
      <Button
        onClick={onCancel}
        variant="tertiary"
        className="w-full"
      >
        Отменить
      </Button>
    </div>
  </div>
));
ConfirmResetModal.displayName = "ConfirmResetModal";

// ─── Страница ──────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const router = useRouter();
  const { data, isLoading } = useAsyncStore();
  const weekInfo = useWeekInfo();
  const [isPending, startTransition] = useTransition();
  const [showResetModal, setShowResetModal] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  const navigate = useCallback((path: string) => {
    startTransition(() => router.push(path));
  }, [router]);

  // ── Семестр ───────────────────────────────────────────────────────────

  const semesterLabel = useMemo(() => {
    if (!data) return "—";
    const start = new Date(data.semester.startDate);
    const months = ["янв.", "февр.", "мар.", "апр.", "мая", "июн.",
                    "июл.", "авг.", "сент.", "окт.", "нояб.", "дек."];
    return `${start.getDate()} ${months[start.getMonth()]} ${start.getFullYear()} · ${data.semester.weeks} нед.`;
  }, [data]);

  // ── Экспорт ───────────────────────────────────────────────────────────

  const handleExport = useCallback(async () => {
    const json = await asyncStore.exportData();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vuz-tasks-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // ── Импорт ────────────────────────────────────────────────────────────

  const handleImport = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setImportError(null);
      setImportSuccess(false);

      try {
        const text = await file.text();
        await asyncStore.importData(text);
        setImportSuccess(true);
        setTimeout(() => setImportSuccess(false), 3000);
      } catch (err) {
        setImportError(err instanceof Error ? err.message : "Ошибка импорта");
        setTimeout(() => setImportError(null), 4000);
      }
    };
    input.click();
  }, []);

  // ── Сброс ─────────────────────────────────────────────────────────────

  const handleReset = useCallback(async () => {
    await asyncStore.reset();
    setShowResetModal(false);
  }, []);

  return (
    <div className="flex flex-col min-h-screen">

      <main className="flex-1 pb-24 flex flex-col gap-4">

        {/* ── Семестр ─────────────────────────────────────────────── */}
        <Section title="Семестр">
          <SettingsRow
            label="Параметры семестра"
            sub={isLoading ? "Загрузка..." : semesterLabel}
            onClick={() => navigate("/settings/semester")}
          />
          {weekInfo && (
            <SettingsRow
              label="Текущая неделя"
              right={
                <Chip variant="soft" size="lg" color={weekInfo.isEven ? "accent" : "warning"}>
                  {weekInfo.weekLabel}
                </Chip>
              }
            />
          )}
        </Section>

        {/* ── Дисциплины ────────────────────────────────────────────── */}
        <Section title="Дисциплины">
          <SettingsRow
            label="Управление дисциплинами"
            sub={
              isLoading
                ? "Загрузка..."
                : `${data?.subjects.length ?? 0} дисциплин`
            }
            onClick={() => navigate("/settings/subjects")}
          />
          <SettingsRow
            label="Добавить дисциплину"
            onClick={() => navigate("/settings/subjects/new")}
          />
        </Section>

        {/* ── Данные ──────────────────────────────────────────────── */}
        <Section title="Данные">
          <SettingsRow
            label="Экспорт"
            sub="Скачать резервную копию JSON"
            onClick={handleExport}
            right={
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 3V12M9 12L5.5 8.5M9 12L12.5 8.5" stroke="#9CA3AF" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 14H15" stroke="#9CA3AF" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
            }
          />
          <SettingsRow
            label="Импорт"
            sub={
              importSuccess ? "✓ Данные загружены" :
              importError   ? `Ошибка: ${importError}` :
              "Загрузить из JSON файла"
            }
            onClick={handleImport}
            right={
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 15V6M9 6L5.5 9.5M9 6L12.5 9.5" stroke="#9CA3AF" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 4H15" stroke="#9CA3AF" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
            }
          />
          <SettingsRow
            label="Сбросить все данные"
            sub="Удалить задачи, дисциплины и расписание"
            onClick={() => setShowResetModal(true)}
            destructive
          />
        </Section>

        {/* ── О приложении ────────────────────────────────────────── */}
        {/* <Section title="О приложении">
          <SettingsRow
            label="ВУЗадачи - Трекер задач для студентов"
            sub="Отслеживайте свои учебные задачи эффективно"
            right={
              <span className="text-[12px] text-gray-300 font-medium">v1.1</span>
            }
          />
        </Section> */}

      </main>

      {/* Модалка сброса */}
      {showResetModal && (
        <ConfirmResetModal
          onConfirm={handleReset}
          onCancel={() => setShowResetModal(false)}
        />
      )}
    </div>
  );
}