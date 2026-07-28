import Link from "next/link";

export default function AdminHome() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      <div className="mt-6 flex gap-4">
        <Link href="/admin/categories" className="text-blue-600 hover:underline">
          Manage Topic Categories
        </Link>
        <Link href="/admin/answer-pool" className="text-blue-600 hover:underline">
          Manage Answer Pool
        </Link>
        <Link href="/admin/questions" className="text-blue-600 hover:underline">
          Manage Questions
        </Link>
      </div>
    </div>
  );
}