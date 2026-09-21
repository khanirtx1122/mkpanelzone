"use client";

import { useState } from "react";
import { managementLogin } from "@/app/actions";
import { Loader2, LogIn, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function MkAgentsLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await managementLogin(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-red-900/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-10">
          <Link href="/" className="inline-block group cursor-pointer">
            <h1 className="text-4xl font-black tracking-tighter mb-2 flex items-center justify-center gap-2">
              <span className="text-foreground group-hover:text-gray-200 transition-colors">MK</span>
              <span className="text-red-600 group-hover:text-red-500 transition-colors">PANEL</span>
            </h1>
            <p className="text-gray-400 font-mono text-sm tracking-widest uppercase">
              Secure Management Access
            </p>
          </Link>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-xl p-8 rounded-2xl border border-gray-800 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-red-600 to-blue-600" />
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-lg flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5 uppercase tracking-wider text-xs">
                  Agent / Owner ID
                </label>
                <input
                  type="text"
                  name="username"
                  required
                  autoComplete="username"
                  className="w-full bg-background/50 border border-gray-800 rounded-xl px-4 py-3 text-foreground placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your assigned ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5 uppercase tracking-wider text-xs">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  autoComplete="current-password"
                  className="w-full bg-background/50 border border-gray-800 rounded-xl px-4 py-3 text-foreground placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-foreground hover:bg-gray-100 text-background font-bold py-3.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Authenticate
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-800 text-center">
            <p className="text-xs text-gray-500 font-mono flex items-center justify-center gap-2">
              <ShieldAlert className="w-3 h-3" />
              Unauthorized access is strictly prohibited
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
