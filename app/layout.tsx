import type { Metadata } from "next";
import "./globals.css";import "./premium.css";import "./workspace.css";import "./extras.css";import "./insights.css";import "./viva.css";import "./documents.css";import "./mentor.css";import "./account.css";
export const metadata:Metadata={title:"AI Guided Project Progress Tracking Platform with Planning & Mentorship Assistance",description:"AI Guided Project Progress Tracking Platform with Planning & Mentorship Assistance — plan, build, track and present academic projects."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
