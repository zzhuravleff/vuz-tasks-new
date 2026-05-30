export default function Loading() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="h-10 w-32 bg-gray-200 rounded-2xl" />

      <div className="bg-white rounded-3xl p-4 flex flex-col gap-3">
        <div className="h-6 w-40 bg-gray-200 rounded-xl" />
        <div className="h-20 w-full bg-gray-100 rounded-2xl" />
      </div>

      <div className="bg-white rounded-3xl p-4 flex flex-col gap-3">
        <div className="h-4 w-24 bg-gray-200 rounded-xl" />
        <div className="h-4 w-40 bg-gray-100 rounded-xl" />
      </div>
    </div>
  );
}