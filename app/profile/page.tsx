"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Disclaimer from "@/components/Disclaimer";
import { useAuth } from "@/contexts/AuthContext";
import { saveUserData, loadUserData } from "@/lib/firebase";

const CONDITIONS = [
  "PCOS",
  "Anemia",
  "Diabetes",
  "Hypertension",
  "Thyroid",
  "General Weakness",
  "Gastric / Acidity",
  "Other",
];

type Profile = {
  name: string;
  age: string;
  gender: string;
  height: string;
  weight: string;
  goal: string;
  budget: string;
  conditions: string[];
};

const EMPTY: Profile = {
  name: "",
  age: "",
  gender: "",
  height: "",
  weight: "",
  goal: "",
  budget: "",
  conditions: [],
};

export default function ProfilePage() {
  const { user, logOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>(EMPTY);
  const [saved, setSaved] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    async function load() {
      if (user) {
        const cloud = await loadUserData(user.uid, "profile").catch(() => null);
        if (cloud) {
          setProfile(cloud as Profile);
          localStorage.setItem("sehatsathi_profile", JSON.stringify(cloud));
          return;
        }
      }
      const stored = localStorage.getItem("sehatsathi_profile");
      if (stored) setProfile(JSON.parse(stored));
    }
    load();
  }, [user]);

  function handleChange(field: keyof Profile, value: string) {
    setProfile((p) => ({ ...p, [field]: value }));
    setSaved(false);
  }

  function toggleCondition(condition: string) {
    setProfile((p) => {
      const already = p.conditions.includes(condition);
      return {
        ...p,
        conditions: already
          ? p.conditions.filter((c) => c !== condition)
          : [...p.conditions, condition],
      };
    });
    setSaved(false);
  }

  async function handleSave() {
    setSyncing(true);
    localStorage.setItem("sehatsathi_profile", JSON.stringify(profile));
    if (user) {
      await saveUserData(user.uid, "profile", profile).catch(() => null);
    }
    setSaved(true);
    setSyncing(false);
  }

  async function handleLogOut() {
    await logOut();
    router.replace("/");
  }

  const bmi =
    profile.height && profile.weight
      ? (
          parseFloat(profile.weight) /
          Math.pow(parseFloat(profile.height) / 100, 2)
        ).toFixed(1)
      : null;

  function bmiLabel(bmi: number) {
    if (bmi < 18.5) return { label: "Underweight", color: "text-blue-600" };
    if (bmi < 25) return { label: "Normal", color: "text-green-600" };
    if (bmi < 30) return { label: "Overweight", color: "text-orange-500" };
    return { label: "Obese", color: "text-red-500" };
  }

  return (
    <div className="min-h-screen pb-28">
      <div className="bg-gradient-to-br from-purple-500 to-pink-400 px-5 pt-12 pb-8 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">My Profile 👤</h1>
            <p className="text-purple-100 text-sm mt-1">
              Your health info &amp; goals
            </p>
            {user && (
              <p className="text-purple-200 text-xs mt-1">
                {user.email}
              </p>
            )}
          </div>
          {user ? (
            <button
              onClick={handleLogOut}
              className="text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg transition mt-1"
            >
              Sign Out
            </button>
          ) : (
            <a
              href="/login"
              className="text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg transition mt-1"
            >
              Sign In
            </a>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-5 space-y-4">
        <Disclaimer />

        {!user && (
          <div className="card border border-purple-100 bg-purple-50 flex items-center gap-3">
            <span className="text-2xl">☁️</span>
            <div>
              <p className="font-semibold text-purple-800 text-sm">Want to sync across devices?</p>
              <p className="text-xs text-purple-600 mt-0.5">
                <a href="/login" className="underline font-medium">Sign in or create a free account</a> to save your data to the cloud.
              </p>
            </div>
          </div>
        )}

        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
            Basic Info
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Full Name
            </label>
            <input
              type="text"
              placeholder="e.g. Riya Akter"
              value={profile.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Age
              </label>
              <input
                type="number"
                placeholder="e.g. 24"
                value={profile.age}
                onChange={(e) => handleChange("age", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Gender
              </label>
              <select
                value={profile.gender}
                onChange={(e) => handleChange("gender", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 bg-white"
              >
                <option value="">Select</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Height (cm)
              </label>
              <input
                type="number"
                placeholder="e.g. 158"
                value={profile.height}
                onChange={(e) => handleChange("height", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Weight (kg)
              </label>
              <input
                type="number"
                placeholder="e.g. 52"
                value={profile.weight}
                onChange={(e) => handleChange("weight", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
              />
            </div>
          </div>

          {bmi && (
            <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-gray-500">Your BMI</span>
              <span
                className={`font-bold text-lg ${
                  bmiLabel(parseFloat(bmi)).color
                }`}
              >
                {bmi}{" "}
                <span className="text-sm font-medium">
                  — {bmiLabel(parseFloat(bmi)).label}
                </span>
              </span>
            </div>
          )}
        </div>

        <div className="card space-y-3">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
            Health Conditions
          </h2>
          <p className="text-xs text-gray-400">
            Select all that apply (used to personalise your diet plan)
          </p>
          <div className="flex flex-wrap gap-2">
            {CONDITIONS.map((c) => {
              const selected = profile.conditions.includes(c);
              return (
                <button
                  key={c}
                  onClick={() => toggleCondition(c)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    selected
                      ? "bg-green-500 text-white border-green-500"
                      : "bg-white text-gray-500 border-gray-200 hover:border-green-300"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
            Goals &amp; Budget
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Weight Goal
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "lose", label: "Lose Weight", icon: "📉" },
                { value: "maintain", label: "Maintain", icon: "⚖️" },
                { value: "gain", label: "Gain Weight", icon: "📈" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleChange("goal", opt.value)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    profile.goal === opt.value
                      ? "bg-green-500 text-white border-green-500"
                      : "bg-white text-gray-500 border-gray-200 hover:border-green-300"
                  }`}
                >
                  <div className="text-xl">{opt.icon}</div>
                  <div className="text-xs font-medium mt-1">{opt.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Daily Food Budget
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "low", label: "Low", sub: "Under ৳150/day" },
                { value: "medium", label: "Medium", sub: "৳150–300/day" },
                { value: "high", label: "High", sub: "৳300+/day" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleChange("budget", opt.value)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    profile.budget === opt.value
                      ? "bg-teal-500 text-white border-teal-500"
                      : "bg-white text-gray-500 border-gray-200 hover:border-teal-300"
                  }`}
                >
                  <div className="text-sm font-semibold">{opt.label}</div>
                  <div
                    className={`text-xs mt-0.5 ${
                      profile.budget === opt.value
                        ? "text-teal-100"
                        : "text-gray-400"
                    }`}
                  >
                    {opt.sub}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={syncing}
          className="w-full btn-primary text-center py-3 text-base disabled:opacity-60"
        >
          {syncing ? "Saving…" : saved ? "✅ Profile Saved!" : "Save Profile"}
        </button>

        {saved && !syncing && (
          <p className="text-center text-xs text-gray-400 -mt-2">
            {user ? "☁️ Saved to your account." : "Saved on this device."}
          </p>
        )}
      </div>

      <Navbar />
    </div>
  );
}
