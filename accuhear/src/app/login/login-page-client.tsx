"use client";

import { LoginForm } from "@/components/auth/login-form";
import { Ear } from "lucide-react";

export function LoginPageClient() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-ink">
      {/* Animated gradient orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-brand-blue/20 blur-[120px] animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute -bottom-48 -right-48 h-[600px] w-[600px] rounded-full bg-brand-orange/15 blur-[140px] animate-[pulse_10s_ease-in-out_infinite_1s]" />
        <div className="absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-brand-blue/10 blur-[100px] animate-[pulse_6s_ease-in-out_infinite_2s]" />
      </div>

      {/* Subtle grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 w-full max-w-[420px] px-4">
        {/* Logo */}
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue">
            <Ear size={20} className="text-white" />
          </div>
          <span className="font-display text-[22px] font-bold tracking-tight text-white">
            Omni
          </span>
        </div>

        {/* Glass card */}
        <div className="rounded-[20px] border border-white/[0.08] bg-white/[0.06] p-5 sm:p-8 shadow-[0_32px_64px_rgba(0,0,0,0.3)] backdrop-blur-xl">
          <div className="mb-6 text-center">
            <h1 className="font-display text-[20px] font-bold text-white">Welcome back</h1>
            <p className="mt-1.5 text-[13px] text-white/50">Sign in to your workspace</p>
          </div>
          <div className="[&_label]:text-white/60 [&_input]:border-white/10 [&_input]:bg-white/[0.06] [&_input]:text-white [&_input]:placeholder:text-white/30 [&_input:focus]:border-brand-blue/60 [&_input:focus]:shadow-[0_0_0_3px_rgba(31,149,184,0.15)] [&_button]:bg-brand-blue [&_button]:text-white [&_button:hover]:bg-[#1a829f]">
            <LoginForm />
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-white/25">
          AccuHear Operations Management
        </p>
      </div>
    </main>
  );
}
