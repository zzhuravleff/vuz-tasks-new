// lib/asyncStore.ts

import { AppData, Task, Subject, Semester } from "@/types";
import { computeAndSortTasks } from "@/lib/scheduleUtils";

// ─── Константы ─────────────────────────────────────────────────────────────

const STORAGE_KEY = "vuz-tasks";

const DEFAULT_DATA: AppData = {
  semester: {
    startDate: "2026-02-09",
    weeks: 16,
  },
  subjects: [],
  tasks: [],
  version: Date.now(),
};

// ─── Типы ──────────────────────────────────────────────────────────────────

type Listener = (data: AppData) => void;

// ─── AsyncStore ────────────────────────────────────────────────────────────

class AsyncStore {
  private cache: AppData | null = null;
  private listeners: Set<Listener> = new Set();
  private loadPromise: Promise<AppData> | null = null;

  // ── Загрузка ─────────────────────────────────────────────────────────────

  async load(): Promise<AppData> {
    // Возвращаем кэш мгновенно
    if (this.cache) return this.cache;

    // Дедуплицируем параллельные вызовы
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = this.loadFromStorage();
    const data = await this.loadPromise;
    this.loadPromise = null;

    return data;
  }

  private async loadFromStorage(): Promise<AppData> {
    try {
      // Имитируем асинхронность — не блокируем рендер
      await microtask();

      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        this.cache = DEFAULT_DATA;
        return this.cache;
      }

      const parsed = JSON.parse(raw) as AppData;
      this.cache = parsed;
      return this.cache;
    } catch {
      this.cache = DEFAULT_DATA;
      return this.cache;
    }
  }

  // ── Сохранение ───────────────────────────────────────────────────────────

  private async save(data: AppData): Promise<void> {
    const updated: AppData = { ...data, version: Date.now() };
    this.cache = updated;

    await microtask();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    this.notify(updated);
  }

  // ── Pub/Sub ───────────────────────────────────────────────────────────────

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(data: AppData): void {
    this.listeners.forEach((listener) => listener(data));
  }

  // ── Геттеры ───────────────────────────────────────────────────────────────

  getCache(): AppData | null {
    return this.cache;
  }

  async getData(): Promise<AppData> {
    return this.load();
  }

  async getTasks() {
    const data = await this.load();
    return computeAndSortTasks(data.tasks);
  }

  async getTaskById(id: string) {
    const data = await this.load();
    const task = data.tasks.find((t) => t.id === id);
    if (!task) return null;

    const { computeTask } = await import("@/lib/scheduleUtils");
    return computeTask(task);
  }

  async getSubjects(): Promise<Subject[]> {
    const data = await this.load();
    return data.subjects;
  }

  async getSemester(): Promise<Semester> {
    const data = await this.load();
    return data.semester;
  }

  // ── Задачи ────────────────────────────────────────────────────────────────

  async addTask(task: Task): Promise<void> {
    const data = await this.load();
    await this.save({
      ...data,
      tasks: [...data.tasks, task],
    });
  }

  async updateTask(updated: Task): Promise<void> {
    const data = await this.load();
    await this.save({
      ...data,
      tasks: data.tasks.map((t) => (t.id === updated.id ? updated : t)),
    });
  }

  async completeTask(id: string): Promise<void> {
    const data = await this.load();
    await this.save({
      ...data,
      tasks: data.tasks.map((t) =>
        t.id === id ? { ...t, status: "completed" } : t
      ),
    });
  }

  async cancelTask(id: string): Promise<void> {
    const data = await this.load();
    await this.save({
      ...data,
      tasks: data.tasks.map((t) =>
        t.id === id ? { ...t, status: "cancelled" } : t
      ),
    });
  }

  async deleteTask(id: string): Promise<void> {
    const data = await this.load();
    await this.save({
      ...data,
      tasks: data.tasks.filter((t) => t.id !== id),
    });
  }

  // ── Предметы ──────────────────────────────────────────────────────────────

  async addSubject(subject: Subject): Promise<void> {
    const data = await this.load();
    await this.save({
      ...data,
      subjects: [...data.subjects, subject],
    });
  }

  async updateSubject(updated: Subject): Promise<void> {
    const data = await this.load();
    await this.save({
      ...data,
      subjects: data.subjects.map((s) =>
        s.id === updated.id ? updated : s
      ),
    });
  }

  async deleteSubject(id: string): Promise<void> {
    const data = await this.load();
    await this.save({
      ...data,
      subjects: data.subjects.filter((s) => s.id !== id),
      // Удаляем задачи привязанные к предмету
      tasks: data.tasks.filter(
        (t) => t.type !== "По расписанию" || t.subjectId !== id
      ),
    });
  }

  // ── Семестр ───────────────────────────────────────────────────────────────

  async updateSemester(semester: Semester): Promise<void> {
    const data = await this.load();
    await this.save({ ...data, semester });
  }

  // ── Импорт / Экспорт ──────────────────────────────────────────────────────

  async exportData(): Promise<string> {
    const data = await this.load();
    return JSON.stringify(data, null, 2);
  }

  async importData(json: string): Promise<void> {
    try {
      const parsed = JSON.parse(json) as AppData;
      // Минимальная валидация
      if (!parsed.semester || !Array.isArray(parsed.subjects) || !Array.isArray(parsed.tasks)) {
        throw new Error("Невалидный формат данных");
      }
      this.cache = null; // сбрасываем кэш
      await this.save(parsed);
    } catch (e) {
      throw new Error(`Ошибка импорта: ${e instanceof Error ? e.message : "неизвестная ошибка"}`);
    }
  }

  // ── Сброс ─────────────────────────────────────────────────────────────────

  async reset(): Promise<void> {
    this.cache = null;
    localStorage.removeItem(STORAGE_KEY);
    await this.save(DEFAULT_DATA);
  }
}

// ─── Вспомогательные функции ───────────────────────────────────────────────

/** Уступает управление event loop — не блокируем рендер */
function microtask(): Promise<void> {
  return new Promise((resolve) => queueMicrotask(resolve));
}

// ─── Синглтон ──────────────────────────────────────────────────────────────

export const asyncStore = new AsyncStore();