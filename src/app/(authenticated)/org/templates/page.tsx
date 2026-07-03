import Link from "next/link"
import { FileText, ArrowLeft } from "lucide-react"

export default function TemplatesPage() {
  return (
    <div className="max-w-2xl mx-auto py-20 flex flex-col items-center text-center gap-6">
      <div className="w-16 h-16 rounded-2xl bg-[#1E3A5F]/10 flex items-center justify-center">
        <FileText className="w-8 h-8 text-[#1E3A5F]" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
        <p className="mt-2 text-gray-500">
          Reusable load templates are coming soon. You&apos;ll be able to save common
          routes and configurations to create loads faster.
        </p>
      </div>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>
    </div>
  )
}
