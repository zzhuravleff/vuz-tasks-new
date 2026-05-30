import { TaskSkeleton } from "@/components/tasks/TaskSkeleton";

export default function Loading() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 animate-pulse">

      {/* Шапка */}
      <div className="flex items-center justify-between px-4 pt-6 pb-4">
        <div className="w-9 h-9 rounded-2xl bg-gray-200" />

        <div className="h-5 w-32 rounded-xl bg-gray-200" />

        <div className="w-9" />
      </div>

      <div className="flex-1 px-4 pb-10 flex flex-col gap-4">

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-2xl p-1 gap-1">
          <div className="flex-1 h-10 rounded-xl bg-white" />
          <div className="flex-1 h-10 rounded-xl bg-gray-200" />
        </div>

        {/* Form */}
        <div className="flex flex-col gap-4">

          {/* Название */}
          <div className="flex flex-col gap-2">
            <div className="h-3 w-24 rounded bg-gray-200 ml-1" />
            <div className="h-14 rounded-2xl bg-white" />
          </div>

          {/* Описание */}
          <div className="flex flex-col gap-2">
            <div className="h-3 w-28 rounded bg-gray-200 ml-1" />
            <div className="h-28 rounded-2xl bg-white" />
          </div>

          {/* Дедлайн */}
          <div className="flex flex-col gap-2">
            <div className="h-3 w-20 rounded bg-gray-200 ml-1" />
            <div className="h-14 rounded-2xl bg-white" />
          </div>

          {/* Кнопка */}
          <div className="h-14 rounded-2xl bg-gray-900/20 mt-2" />

        </div>

      </div>
    </div>
  );
}