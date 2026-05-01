"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (mode === "signup") {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
      router.replace("/");
    } catch (err: unknown) {
      setError(friendlyError(err));
    }
    setLoading(false);
  }

  function toggle() {
    setMode((m) => (m === "signin" ? "signup" : "signin"));
    setError("");
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top banner */}
      <div className="bg-gradient-to-br from-green-500 to-teal-500 px-5 pt-14 pb-10 text-white text-center">
        <div className="text-5xl mb-3">🌿</div>
        <h1 className="text-2xl font-bold">SehatSathi</h1>
        <p className="text-green-100 text-sm mt-1">
          Your smart health &amp; diet companion
        </p>
      </div>

      {/* Form card */}
      <div className="flex-1 flex items-start justify-center px-4 -mt-5">
        <div className="card w-full max-w-sm shadow-lg">
          <h2 className="text-lg font-bold text-gray-800 mb-1">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="text-sm text-gray-400 mb-5">
            {mode === "signin"
              ? "Sign in to access your health data"
              : "Sign up to save your health data securely"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Please wait…"
                : mode === "signin"
                ? "Sign In"
                : "Create Account"}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-sm text-gray-400">
              {mode === "signin"
                ? "Don't have an account?"
                : "Already have an account?"}
              &nbsp;
              <button
                onClick={toggle}
                className="text-green-600 font-semibold hover:underline"
              >
                {mode === "signin" ? "Sign Up" : "Sign In"}
              </button>
            </p>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-gray-400 text-center mt-4">
            By continuing you agree that SehatSathi does not provide medical
            advice. Always consult a doctor.
          </p>
        </div>
      </div>
    </div>
  );
}

function friendlyError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential")
    return "Incorrect email or password.";
  if (code === "auth/email-already-in-use")
    return "This email is already registered. Try signing in.";
  if (code === "auth/weak-password")
    return "Password must be at least 6 characters.";
  if (code === "auth/invalid-email")
    return "Please enter a valid email address.";
  if (code === "auth/network-request-failed")
    return "Network error. Please check your connection.";
  return "Something went wrong. Please try again.";
}
