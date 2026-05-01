import Link from "next/link";
import Navbar from "@/components/Navbar";
import Disclaimer from "@/components/Disclaimer";

const quickLinks = [
  {
    href: "/medicines",
    icon: "💊",
    title: "My Medicines",
    desc: "Add medicines & learn about side effects",
    color: "bg-green-50 border-green-200",
  },
  {
    href: "/diet",
    icon: "🥗",
    title: "Diet Plan",
    desc: "Get a personalized Bangladeshi meal plan",
    color: "bg-teal-50 border-teal-200",
  },
  {
    href: "/reminders",
    icon: "⏰",
    title: "Reminders",
    desc: "Medicine, meal & water reminders",
    color: "bg-blue-50 border-blue-200",
  },
  {
    href: "/profile",
    icon: "👤",
    title: "My Profile",
    desc: "Set your health goals & conditions",
    color: "bg-purple-50 border-purple-200",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-500 to-teal-500 px-5 pt-12 pb-8 text-white">
        <p className="text-green-100 text-sm font-medium mb-1">Welcome to</p>
        <h1 className="text-3xl font-bold tracking-tight">SehatSathi 🌿</h1>
        <p className="text-green-100 mt-1 text-sm">
          Your smart health &amp; diet companion
        </p>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-6 space-y-4">
        {/* Disclaimer */}
        <Disclaimer />

        {/* Quick Links */}
        <div>
          <h2 className="text-base font-semibold text-gray-600 mb-3">
            What would you like to do?
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {quickLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`card border ${item.color} hover:shadow-md transition-shadow`}
              >
                <div className="text-3xl mb-2">{item.icon}</div>
                <div className="font-semibold text-sm text-gray-800">
                  {item.title}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* Health Tip */}
        <div className="card bg-gradient-to-r from-green-50 to-teal-50 border border-green-100">
          <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">
            Daily Health Tip
          </p>
          <p className="text-sm text-gray-700">
            💧 Drink at least 8 glasses of water daily. Staying hydrated helps
            with digestion, energy, and skin health.
          </p>
        </div>
      </div>

      <Navbar />
    </div>
  );
}
