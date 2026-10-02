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
    <main className="error-page">
      <section className="error-card" role="alert">
        <div className="auth-icon" aria-hidden="true">
          <AlertTriangle size={19} />
        </div>
        <p className="eyebrow">PROJECTPILOT</p>
        <h1>Something went wrong</h1>
        <p>
          This page hit an unexpected error. Your saved project data has not been
          intentionally changed. Try the page again before taking any other action.
        </p>
        <button className="btn btn-primary" type="button" onClick={() => reset()}>
          <RefreshCw size={15} /> Try again
        </button>
      </section>
    </main>
  );
}
