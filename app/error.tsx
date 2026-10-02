'use client';

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application route error:", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-[#050816] px-5 py-10 text-[#eef2ff] flex items-center justify-center">
      <section
        className="w-full max-w-lg rounded-2xl border border-slate-700/40 bg-slate-950/70 p-7 shadow-2xl"
        role="alert"
      >
        <div className="auth-icon" aria-hidden="true">
          <AlertTriangle size={19} />
        </div>
        <p className="eyebrow">PROJECTPILOT</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Something went wrong</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          This page hit an unexpected error. Your saved project data has not been
          intentionally changed. Try the page again before taking any other action.
        </p>
        <button className="btn btn-primary mt-6" type="button" onClick={() => reset()}>
          <RefreshCw size={15} /> Try again
        </button>
      </section>
    </main>
  );
}
