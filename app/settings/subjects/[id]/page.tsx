// app/settings/subjects/[id]/page.tsx

"use client";

import { useParams } from "next/navigation";
import { useAsyncStore } from "@/hooks/useAsyncStore";
import { SubjectForm } from "@/components/subjects/SubjectForm";
import { TaskSkeleton } from "@/components/tasks/TaskSkeleton";

export default function EditSubjectPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useAsyncStore();

  if (isLoading) {
    return (
      <div className="px-4 pt-20">
        <TaskSkeleton count={2} />
      </div>
    );
  }

  const subject = data?.subjects.find((s) => s.id === id);

  if (!subject) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400 text-[15px]">Предмет не найден</p>
      </div>
    );
  }

  return <SubjectForm mode="edit" initial={subject} />;
}