"use client";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-4xl animate-pulse">🌿</div>
          <p className="text-gray-400 text-sm">Loading SehatSathi…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
