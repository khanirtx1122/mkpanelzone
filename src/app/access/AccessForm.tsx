"use client";

import { useActionState, useEffect, useState } from "react";
import { customerLogin, type LoginResult } from "@/app/actions";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Shield, ShieldAlert, CheckCircle2, Smartphone, Monitor, ChevronLeft, Crosshair, Hexagon } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

type PlatformType = "ANDROID" | "IOS" | "PC" | null;

export interface BranchOption {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export function AccessForm({ androidBranches }: { androidBranches: BranchOption[] }) {
  const [state, formAction, pending] = useActionState<LoginResult, FormData>(customerLogin, null);
  const isSuccess = state?.type === "SUCCESS";
  const [platform, setPlatform] = useState<PlatformType>(null);
  const [branchSlug, setBranchSlug] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (state?.type === "SUCCESS") {
      const timer = setTimeout(() => {
        router.push("/dashboard");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state, router]);

  if (state?.type === "DEVICE_MISMATCH") {
    return (
      <GlassCard className="border-brand-red-500/50 shadow-[0_0_20px_rgba(179,18,47,0.15)] p-8 text-center max-w-md w-full">
        <div className="w-16 h-16 rounded-2xl bg-brand-red-500/10 border border-brand-red-500/30 mx-auto flex items-center justify-center text-brand-red-500 mb-6">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-2xl font-extrabold text-foreground mb-2 uppercase tracking-wide">Access Already Registered</h2>
        <p className="text-brand-ink-3 text-sm mb-8">
          This customer access is already registered to another device.
        </p>
        <div className="flex flex-col gap-3">
          <Button variant="primary" asChild className="w-full">
            <Link href="/support">Contact Support</Link>
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </GlassCard>
    );
  }

  const isError = state?.type === "INVALID_CREDENTIALS";
  const isWrongPlatform = state?.type === "WRONG_PLATFORM";
  const isBranchDenied = state?.type === "BRANCH_DENIED";

  if (!platform) {
    return (
      <div className="max-w-3xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4 uppercase tracking-tight">CUSTOMER ACCESS</h1>
          <p className="text-brand-ink-3 text-[17px]">
            Select your platform to continue.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button onClick={() => setPlatform("ANDROID")} className="text-left group outline-none">
            <GlassCard className="h-full flex flex-col p-8 transition-all duration-300 hover:-translate-y-1 hover:border-brand-blue-500/50 hover:shadow-[0_0_20px_rgba(47,95,208,0.15)]">
              <div className="w-12 h-12 rounded-xl bg-surface-glass flex items-center justify-center text-brand-blue-400 mb-6 group-hover:bg-brand-blue-500/10 group-hover:scale-110 transition-all duration-300">
                <Smartphone size={24} />
              </div>
              <h3 className="text-xl font-extrabold text-foreground mb-2 tracking-tight">ANDROID</h3>
              <p className="text-brand-ink-3 text-[14px] flex-grow mb-6">Access your Android package resources and setup files.</p>
              <div className="font-bold text-sm tracking-widest text-brand-blue-500 flex items-center group-hover:text-brand-blue-400 transition-colors">
                CONTINUE <span className="ml-2">→</span>
              </div>
            </GlassCard>
          </button>

          <button onClick={() => setPlatform("IOS")} className="text-left group outline-none">
            <GlassCard className="h-full flex flex-col p-8 transition-all duration-300 hover:-translate-y-1 hover:border-foreground/50 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              <div className="w-12 h-12 rounded-xl bg-surface-glass flex items-center justify-center text-brand-ink-3 mb-6 group-hover:bg-surface group-hover:scale-110 transition-all duration-300">
                <Smartphone size={24} />
              </div>
              <h3 className="text-xl font-extrabold text-foreground mb-2 tracking-tight">IPHONE</h3>
              <p className="text-brand-ink-3 text-[14px] flex-grow mb-6">Access your iPhone package file and setup guide.</p>
              <div className="font-bold text-sm tracking-widest text-foreground flex items-center group-hover:text-brand-ink-2 transition-colors">
                CONTINUE <span className="ml-2">→</span>
              </div>
            </GlassCard>
          </button>

          <button onClick={() => setPlatform("PC")} className="text-left group outline-none">
            <GlassCard className="h-full flex flex-col p-8 transition-all duration-300 hover:-translate-y-1 hover:border-brand-red-500/50 hover:shadow-[0_0_20px_rgba(179,18,47,0.15)]">
              <div className="w-12 h-12 rounded-xl bg-surface-glass flex items-center justify-center text-brand-red-500 mb-6 group-hover:bg-brand-red-500/10 group-hover:scale-110 transition-all duration-300">
                <Monitor size={24} />
              </div>
              <h3 className="text-xl font-extrabold text-foreground mb-2 tracking-tight">PC</h3>
              <p className="text-brand-ink-3 text-[14px] flex-grow mb-6">Access your PC package resources.</p>
              <div className="font-bold text-sm tracking-widest text-brand-red-500 flex items-center group-hover:text-brand-red-400 transition-colors">
                CONTINUE <span className="ml-2">→</span>
              </div>
            </GlassCard>
          </button>
        </div>
      </div>
    );
  }

  if (isWrongPlatform) {
    return (
      <GlassCard className="border-brand-red-500/50 shadow-[0_0_20px_rgba(179,18,47,0.15)] p-8 text-center max-w-md w-full">
        <div className="w-16 h-16 rounded-2xl bg-brand-red-500/10 border border-brand-red-500/30 mx-auto flex items-center justify-center text-brand-red-500 mb-6">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-2xl font-extrabold text-foreground mb-2 uppercase tracking-wide">WRONG PLATFORM</h2>
        <p className="text-brand-ink-3 text-sm mb-8">
          This customer access belongs to another section. Please return to platform selection and try again.
        </p>
        <div className="flex flex-col gap-3">
          <Button onClick={() => setPlatform(null)} variant="primary" className="w-full">
            RETURN TO PLATFORM SELECTION
          </Button>
        </div>
      </GlassCard>
    );
  }

  /* ── Android branch selection ──────────────────────────────────────────── */
  if (platform === "ANDROID" && !branchSlug) {
    const fromDenied = isBranchDenied;
    return (
      <div className="max-w-2xl w-full">
        <div className="text-center mb-10">
          <button
            onClick={() => setPlatform(null)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-ink-3 hover:text-foreground transition-colors uppercase tracking-widest mb-6"
          >
            <ChevronLeft size={14} /> CHANGE PLATFORM
          </button>
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3 uppercase tracking-tight">ANDROID ACCESS</h1>
          <p className="text-brand-ink-3 text-[16px]">Choose your Android section to continue.</p>
        </div>

        {fromDenied && (
          <GlassCard className="border-brand-red-500/40 p-4 mb-6 text-center">
            <p className="text-brand-red-500 text-sm font-bold">
              This account does not have access to this section.
            </p>
          </GlassCard>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {androidBranches.map((branch) => (
            <button
              key={branch.id}
              onClick={() => setBranchSlug(branch.slug)}
              className="text-left group outline-none active:scale-[0.98] transition-transform"
            >
              <GlassCard className="h-full flex flex-col p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand-blue-500/50 hover:shadow-[0_0_20px_rgba(47,95,208,0.15)]">
                <div className="flex items-center justify-between mb-5">
                  <div className="w-11 h-11 rounded-xl bg-surface-glass flex items-center justify-center text-brand-blue-400 group-hover:bg-brand-blue-500/10 group-hover:scale-110 transition-all duration-300">
                    {branch.slug === "aim-plus-holo" ? <Crosshair size={22} /> : branch.slug === "hexhead" ? <Hexagon size={22} /> : <Smartphone size={22} />}
                  </div>
                  <span className="text-[10px] font-bold tracking-widest uppercase text-brand-ink-3 border border-border-subtle rounded-full px-2.5 py-1">ANDROID</span>
                </div>
                <h3 className="text-lg font-extrabold text-foreground mb-1.5 tracking-tight uppercase">{branch.name}</h3>
                <p className="text-brand-ink-3 text-[13px] flex-grow mb-5">
                  {branch.description || "Access this Android branch's resources."}
                </p>
                <div className="font-bold text-xs tracking-widest text-brand-blue-500 flex items-center group-hover:text-brand-blue-400 transition-colors">
                  CONTINUE <span className="ml-2">→</span>
                </div>
              </GlassCard>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const branch = androidBranches.find((b) => b.slug === branchSlug);

  return (
    <div className="max-w-md w-full">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-brand-blue-500/10 border border-brand-blue-500/30 mx-auto flex items-center justify-center text-brand-blue-500 shadow-[0_0_15px_rgba(47,95,208,0.2)] mb-6">
          <Shield size={32} />
        </div>
        <h1 className="text-3xl font-extrabold text-foreground mb-2 uppercase tracking-tight">
          {platform === "IOS" ? "IPHONE" : platform} ACCESS
        </h1>
        {branch && (
          <p className="text-brand-blue-500 text-xs font-bold tracking-widest uppercase mb-2">{branch.name}</p>
        )}
        <p className="text-brand-ink-3 text-[15px] mb-4">
          Enter the access details provided with your purchase.
        </p>
        <div className="flex items-center justify-center gap-4">
          {platform === "ANDROID" && (
            <button
              onClick={() => setBranchSlug(null)}
              className="text-xs font-bold text-brand-ink-2 hover:text-foreground transition-colors uppercase tracking-widest"
            >
              CHANGE SECTION
            </button>
          )}
          <button onClick={() => setPlatform(null)} className="text-xs font-bold text-brand-ink-2 hover:text-foreground transition-colors uppercase tracking-widest">
            CHANGE PLATFORM
          </button>
        </div>
      </div>

      <motion.div
        animate={isError || isBranchDenied ? { x: [-3, 3, -3, 3, 0] } : {}}
        transition={{ duration: 0.3 }}
      >
        <GlassCard className={`relative overflow-hidden transition-colors duration-300 ${isError || isBranchDenied ? 'border-brand-red-500/50' : 'border-border-subtle'}`}>
          <motion.div
            className="absolute top-0 left-0 w-[50%] h-[1px] bg-brand-blue-500 blur-[1px]"
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: "200%", opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
          <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-brand-red-500/20 blur-2xl rounded-full pointer-events-none" />

          <form action={formAction} className="space-y-5 flex flex-col relative z-10">
            <input type="hidden" name="platform" value={platform} />
            {branchSlug && <input type="hidden" name="branchSlug" value={branchSlug} />}
            <div>
              <label className="block text-sm font-bold text-brand-ink-2 mb-1">Customer Name</label>
              <Input name="identifier" type="text" required placeholder="Enter customer name" />
            </div>

            <div>
              <label className="block text-sm font-bold text-brand-ink-2 mb-1">Password</label>
              <Input name="password" type="password" required placeholder="••••••••" />
            </div>

            <AnimatePresence>
              {isError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="text-brand-red-500 text-sm font-medium"
                >
                  Invalid customer name or password.
                </motion.div>
              )}
              {isBranchDenied && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="text-brand-red-500 text-sm font-medium"
                >
                  This account does not have access to this section.
                </motion.div>
              )}
              {state?.type === "ERROR" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="text-brand-red-500 text-sm font-medium"
                >
                  {state.message}
                </motion.div>
              )}
            </AnimatePresence>

            <Button type="submit" variant="primary" size="lg" className="w-full mt-2" disabled={pending || isSuccess}>
              {isSuccess ? (
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={18} /> ACCESS VERIFIED
                </span>
              ) : pending ? (
                "VERIFYING ACCESS..."
              ) : (
                "ACCESS MY FILES"
              )}
            </Button>
          </form>
        </GlassCard>
      </motion.div>
    </div>
  );
}
