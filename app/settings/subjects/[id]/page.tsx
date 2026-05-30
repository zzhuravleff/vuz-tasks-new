// app/settings/subjects/[id]/page.tsx
"use client";
import { useParams } from "next/navigation";
import { useAsyncStore } from "@/hooks/useAsyncStore";
import { SubjectWizard } from "@/components/subjects/SubjectWizard";
import { TaskSkeleton } from "@/components/tasks/TaskSkeleton";

export default function EditSubjectPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useAsyncStore();

  if (isLoading) return (
    <div className="px-4 pt-20"><TaskSkeleton count={2} /></div>
  );

  const subject = data?.subjects.find(s => s.id === id);
  if (!subject) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-400 text-[15px]">Диспциплина не найдена</p>
    </div>
  );

  return <SubjectWizard mode="edit" initial={subject} />;
}