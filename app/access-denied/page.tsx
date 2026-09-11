import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";

export default function AccessDeniedPage() {
  return (
    <main className="min-h-screen bg-[#070b14] px-6 py-16 text-white">
      <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center shadow-2xl">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/10 text-amber-300">
          <ShieldAlert size={26} />
        </div>
        <p className="text-xs font-semibold tracking-[0.2em] text-amber-300">
          ACCESS DENIED
        </p>
        <h1 className="mt-3 text-3xl font-bold">This workspace is not available to your account.</h1>
        <p className="mt-4 text-sm leading-6 text-slate-400">
          Your account is signed in, but its role does not have permission to open this area.
          Changing the URL cannot change an account's role.
        </p>
        <Link
          href="/"
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold hover:bg-indigo-400"
        >
          <ArrowLeft size={15} /> Back to home
        </Link>
      </div>
    </main>
  );
}
