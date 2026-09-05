import type { Metadata } from "next";
import "./globals.css";import "./premium.css";import "./workspace.css";import "./extras.css";import "./insights.css";import "./viva.css";import "./documents.css";import "./mentor.css";
export const metadata:Metadata={title:"ProjectPilot — AI Academic Project OS",description:"Plan, build, track and present academic projects with an AI project mentor."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
