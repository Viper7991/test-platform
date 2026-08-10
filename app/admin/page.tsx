import Link from "next/link";

export default function AdminHome() {
  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-8">
          Admin Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/admin/categories"
            className="flex items-center justify-center p-8 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-blue-200 transition-all duration-200 group"
          >
            <span className="text-lg font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">
              Manage Topic Categories
            </span>
          </Link>

          <Link
            href="/admin/answer-pool"
            className="flex items-center justify-center p-8 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-blue-200 transition-all duration-200 group"
          >
            <span className="text-lg font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">
              Manage Answer Pool
            </span>
          </Link>

          <Link
            href="/admin/questions"
            className="flex items-center justify-center p-8 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-blue-200 transition-all duration-200 group"
          >
            <span className="text-lg font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">
              Manage Questions
            </span>
          </Link>

          <Link
            href="/admin/reports"
            className="flex items-center justify-center p-8 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-blue-200 transition-all duration-200 group"
          >
            <span className="text-lg font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">
              Reported Questions
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}