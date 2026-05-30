export default function Loading() {
  return (
    <div className="flex flex-col min-h-screen">

      <main className="flex-1 pb-24 flex flex-col gap-4 animate-pulse">

        {/* Section */}
        <div className="flex flex-col gap-2">
          <div className="h-3 w-24 bg-gray-200 rounded ml-1" />

          <div className="bg-white rounded-3xl overflow-hidden">
            <div className="px-4 py-4 border-b border-gray-50">
              <div className="h-4 w-40 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-28 bg-gray-100 rounded" />
            </div>

            <div className="px-4 py-4">
              <div className="h-4 w-32 bg-gray-200 rounded" />
            </div>
          </div>
        </div>

        {/* Section */}
        <div className="flex flex-col gap-2">
          <div className="h-3 w-24 bg-gray-200 rounded ml-1" />

          <div className="bg-white rounded-3xl overflow-hidden">
            <div className="px-4 py-4 border-b border-gray-50">
              <div className="h-4 w-44 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-24 bg-gray-100 rounded" />
            </div>

            <div className="px-4 py-4">
              <div className="h-4 w-36 bg-gray-200 rounded" />
            </div>
          </div>
        </div>

        {/* Section */}
        <div className="flex flex-col gap-2">
          <div className="h-3 w-20 bg-gray-200 rounded ml-1" />

          <div className="bg-white rounded-3xl overflow-hidden">
            <div className="px-4 py-4 border-b border-gray-50">
              <div className="h-4 w-28 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-44 bg-gray-100 rounded" />
            </div>

            <div className="px-4 py-4 border-b border-gray-50">
              <div className="h-4 w-28 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-40 bg-gray-100 rounded" />
            </div>

            <div className="px-4 py-4">
              <div className="h-4 w-40 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-52 bg-gray-100 rounded" />
            </div>
          </div>
        </div>

        {/* App info */}
        <div className="flex flex-col gap-2">
          <div className="h-3 w-28 bg-gray-200 rounded ml-1" />

          <div className="bg-white rounded-3xl overflow-hidden px-4 py-4">
            <div className="h-4 w-56 bg-gray-200 rounded mb-2" />
            <div className="h-3 w-44 bg-gray-100 rounded" />
          </div>
        </div>

      </main>
    </div>
  );
}