import Link from "next/link"

const FEATURES = [
  {
    icon: "📋",
    title: "Load Passport",
    description:
      "Every load gets a complete digital passport — all docs, GPS events, signatures, and communications in one place.",
  },
  {
    icon: "📸",
    title: "Document Capture",
    description:
      "Drivers capture BOLs, PODs, scale tickets, and lumper receipts right from their phone with GPS-stamped timestamps.",
  },
  {
    icon: "⚖️",
    title: "Reconciliation Engine",
    description:
      "Automatically cross-check agreed rates against actual charges, flagging detention, lumper, and accessorial discrepancies.",
  },
  {
    icon: "💸",
    title: "Factoring Readiness",
    description:
      "One-click factoring packet generation — pre-verified docs, correct invoice amounts, ready to submit in seconds.",
  },
]

const ROLES = [
  {
    id: "carrier",
    label: "Carrier",
    color: "text-[#1E3A5F]",
    description:
      "Manage your entire fleet's documentation from dispatch to payment. Stop chasing drivers for docs. Get paid faster.",
    bullets: [
      "Real-time load status dashboard",
      "Automated detention tracking",
      "Factoring packet in one click",
      "QuickBooks integration",
    ],
  },
  {
    id: "driver",
    label: "Driver",
    color: "text-[#10B981]",
    description:
      "A simple mobile interface for capturing proof of delivery and staying on top of your assigned loads.",
    bullets: [
      "Camera upload for BOL & POD",
      "Digital signature capture",
      "GPS event logging",
      "Instant notification to dispatch",
    ],
  },
  {
    id: "broker",
    label: "Broker",
    color: "text-[#F59E0B]",
    description:
      "Full visibility into your carrier's load progress. Access docs the moment they're uploaded.",
    bullets: [
      "Live load tracking",
      "Document access & verification",
      "Rate confirmation management",
      "Dispute resolution tools",
    ],
  },
  {
    id: "factoring",
    label: "Factoring Company",
    color: "text-purple-600",
    description:
      "Receive complete, pre-verified factoring packets with all required documents already assembled.",
    bullets: [
      "Pre-assembled doc packets",
      "OCR-verified BOL amounts",
      "Digital invoice delivery",
      "Carrier performance history",
    ],
  },
]

const PLANS = [
  {
    name: "Free Driver",
    price: "$0",
    period: "forever",
    description: "For independent owner-operators just getting started",
    features: [
      "5 loads per month",
      "Document capture",
      "GPS event logging",
      "Basic BOL",
    ],
    cta: "Get Started Free",
    highlighted: false,
  },
  {
    name: "Owner-Operator",
    price: "$29",
    period: "per month",
    description: "For solo operators who want every dollar captured",
    features: [
      "Unlimited loads",
      "Detention tracking",
      "Factoring packets",
      "Invoice generation",
      "Email & SMS alerts",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Small Carrier",
    price: "$99",
    period: "per month",
    description: "For carriers with a small fleet and dispatcher",
    features: [
      "Everything in Owner-Operator",
      "Up to 10 drivers",
      "Dispatcher portal",
      "Team management",
      "QuickBooks sync",
      "Priority support",
    ],
    cta: "Start Free Trial",
    highlighted: false,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-100 sticky top-0 bg-white z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#1E3A5F] flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-5 h-5 text-[#F59E0B]"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <span className="text-lg font-bold text-[#1E3A5F]">WheelsDoc</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <a href="#features" className="hover:text-gray-900 transition">
              Features
            </a>
            <a href="#roles" className="hover:text-gray-900 transition">
              Who It&apos;s For
            </a>
            <a href="#pricing" className="hover:text-gray-900 transition">
              Pricing
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-gray-600 hover:text-gray-900 transition font-medium"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-sm px-4 py-2 bg-[#1E3A5F] text-white rounded-lg font-semibold hover:bg-[#162d4a] transition"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      <section className="bg-gradient-to-br from-[#1E3A5F] to-[#162d4a] text-white py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block mb-6 px-3 py-1 rounded-full bg-[#F59E0B]/20 text-[#F59E0B] text-sm font-semibold">
            Built for the freight industry
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Every Load.
            <br />
            Every Document.
            <br />
            <span className="text-[#F59E0B]">Every Dollar.</span>
          </h1>
          <p className="text-xl text-blue-200 mb-10 max-w-2xl mx-auto">
            WheelsDoc digitizes the entire freight documentation lifecycle — from
            rate confirmation to factoring packet — so carriers stop losing money
            to missing docs and disputed invoices.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="px-8 py-4 bg-[#F59E0B] text-white rounded-xl text-base font-bold hover:bg-amber-500 transition shadow-lg"
            >
              Get Started Free
            </Link>
            <a
              href="#features"
              className="px-8 py-4 border border-white/30 text-white rounded-xl text-base font-semibold hover:bg-white/10 transition"
            >
              See How It Works
            </a>
          </div>
          <p className="mt-6 text-sm text-blue-300">
            No credit card required · Free plan available
          </p>
        </div>
      </section>

      <section id="features" className="py-20 px-6 bg-[#F8FAFC]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[#1E3A5F] mb-4">
              The complete freight documentation platform
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              From the moment a load is dispatched to the day it&apos;s paid —
              WheelsDoc captures, organizes, and verifies every document
              automatically.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition"
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-base font-bold text-gray-900 mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="roles" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[#1E3A5F] mb-4">
              Built for everyone in the supply chain
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {ROLES.map((role) => (
              <div
                key={role.id}
                className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm"
              >
                <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${role.color}`}>
                  {role.label}
                </p>
                <p className="text-sm text-gray-600 mb-4">{role.description}</p>
                <ul className="space-y-2">
                  {role.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-sm text-gray-700">
                      <svg
                        className="w-4 h-4 text-[#10B981] shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 px-6 bg-[#F8FAFC]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[#1E3A5F] mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-gray-500">
              Start free. Scale as you grow.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-6 border ${
                  plan.highlighted
                    ? "border-[#1E3A5F] bg-[#1E3A5F] text-white shadow-xl"
                    : "border-gray-200 bg-white shadow-sm"
                }`}
              >
                {plan.highlighted && (
                  <div className="text-xs font-bold text-[#F59E0B] uppercase tracking-wider mb-2">
                    Most Popular
                  </div>
                )}
                <h3
                  className={`text-lg font-bold mb-1 ${
                    plan.highlighted ? "text-white" : "text-gray-900"
                  }`}
                >
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span
                    className={`text-3xl font-bold ${
                      plan.highlighted ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {plan.price}
                  </span>
                  <span
                    className={`text-sm ${
                      plan.highlighted ? "text-blue-200" : "text-gray-400"
                    }`}
                  >
                    / {plan.period}
                  </span>
                </div>
                <p
                  className={`text-sm mb-6 ${
                    plan.highlighted ? "text-blue-200" : "text-gray-500"
                  }`}
                >
                  {plan.description}
                </p>
                <ul className="space-y-2 mb-8">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className={`flex items-center gap-2 text-sm ${
                        plan.highlighted ? "text-blue-100" : "text-gray-600"
                      }`}
                    >
                      <svg
                        className={`w-4 h-4 shrink-0 ${
                          plan.highlighted ? "text-[#F59E0B]" : "text-[#10B981]"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`block w-full text-center py-2.5 rounded-xl text-sm font-bold transition ${
                    plan.highlighted
                      ? "bg-[#F59E0B] text-white hover:bg-amber-500"
                      : "bg-[#1E3A5F] text-white hover:bg-[#162d4a]"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-100 bg-white py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-[#1E3A5F] flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="w-4 h-4 text-[#F59E0B]"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <span className="text-sm font-bold text-[#1E3A5F]">WheelsDoc</span>
            </div>
            <p className="text-xs text-gray-400 max-w-xs">
              The digital freight documentation platform for modern carriers,
              brokers, and drivers.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-sm">
            <div>
              <p className="font-semibold text-gray-900 mb-3">Product</p>
              <ul className="space-y-2 text-gray-500">
                <li>
                  <a href="#features" className="hover:text-gray-900 transition">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-gray-900 transition">
                    Pricing
                  </a>
                </li>
                <li>
                  <Link href="/login" className="hover:text-gray-900 transition">
                    Sign In
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-3">Company</p>
              <ul className="space-y-2 text-gray-500">
                <li>
                  <a href="#" className="hover:text-gray-900 transition">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900 transition">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900 transition">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-3">Legal</p>
              <ul className="space-y-2 text-gray-500">
                <li>
                  <a href="#" className="hover:text-gray-900 transition">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900 transition">
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-8 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} WheelsDoc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
