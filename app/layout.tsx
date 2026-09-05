import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProjectPilot — AI Academic Project OS",
  description: "Plan, build, track and present academic projects with an AI project mentor.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
