# ProjectPilot — AI Academic Project OS

**AI Guided Project Progress Tracking Platform with Planning & Mentorship Assistance**

ProjectPilot is a full-stack Next.js workspace that takes a college project from idea → scope → technology → roadmap → tasks → progress → risk analysis → documentation → viva preparation.

## What is built
- Premium responsive SaaS UI with animated landing, dashboard and workspace
- Email/password authentication with Supabase Auth (no Clerk)
- Secure server-side project ownership checks
- Project, task and milestone CRUD APIs
- AI Orchestrator that generates a complete project plan from one idea
- AI Mentor with live project + task + milestone context
- AI Insights / Risk Predictor with health scoring and next actions
- AI Documentation Architect for report, UML and testing outlines
- AI Viva Coach for project-specific examiner questions
- Portfolio analytics and progress visualization
- Audit events for important project and AI actions
- Supabase schema with RLS enabled

## AI team
Idea Architect · Scope Analyst · Technology Advisor · Planning Agent · Risk Predictor · Documentation Coach · Viva Coach · AI Mentor

## Environment
Copy `.env.example` to `.env.local` and configure:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENROUTER_API_KEY=
OPENROUTER_MODEL=openai/gpt-5-mini
```

Run `supabase/schema.sql` in the Supabase SQL Editor before using database features. Never commit `.env.local`, service-role keys or AI provider keys.

## Development
```bash
npm install
npm run dev
```

Production verification:
```bash
npm run build
npm start
```
