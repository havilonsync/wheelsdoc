"use client"

import { useActionState } from "react"
import Link from "next/link"
import { signupAction } from "@/app/actions/auth"

type State = { error?: string } | undefined

const ORG_TYPES = [
  { value: "CARRIER", label: "Carrier / Trucking Company" },
  { value: "SHIPPER", label: "Shipper" },
  { value: "BROKER", label: "Freight Broker" },
  { value: "FACTORING_COMPANY", label: "Factoring Company" },
  { value: "RECEIVER", label: "Receiver / Consignee" },
  { value: "LOGISTICS", label: "Logistics Provider" },
]

export default function SignupPage() {
  const [state, formAction, pending] = useActionState<State, FormData>(
    signupAction,
    undefined
  )

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1E3A5F] mb-2">Create your account</h1>
      <p className="text-gray-500 text-sm mb-6">
        Start managing freight documentation for free
      </p>

      {state?.error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Full name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent transition"
            placeholder="John Smith"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Work email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent transition"
            placeholder="you@company.com"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent transition"
            placeholder="Min. 8 characters"
          />
        </div>

        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Your Organization
          </p>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="orgName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Company name
              </label>
              <input
                id="orgName"
                name="orgName"
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent transition"
                placeholder="Acme Trucking LLC"
              />
            </div>

            <div>
              <label
                htmlFor="orgType"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Organization type
              </label>
              <select
                id="orgType"
                name="orgType"
                required
                defaultValue=""
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent transition bg-white"
              >
                <option value="" disabled>
                  Select type…
                </option>
                {ORG_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full py-2.5 px-4 bg-[#F59E0B] text-white rounded-lg text-sm font-semibold hover:bg-amber-500 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {pending && (
            <svg
              className="animate-spin w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          )}
          {pending ? "Creating account…" : "Create free account"}
        </button>

        <p className="text-xs text-gray-400 text-center">
          By signing up you agree to our Terms of Service and Privacy Policy.
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-[#1E3A5F] font-semibold hover:text-[#162d4a] transition"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
