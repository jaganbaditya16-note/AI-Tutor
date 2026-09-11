# ProjectPilot — AI Academic Project OS

**AI Guided Project Progress Tracking Platform with Planning & Mentorship Assistance**

ProjectPilot is a full-stack Next.js workspace that takes a college project from idea → scope → technology → roadmap → tasks → progress → risk analysis → documentation → final presentation preparation.

## What is built
- Premium responsive SaaS UI with animated landing, dashboard and workspace
- Email/password authentication with Supabase Auth (no Clerk)
- Secure server-side project ownership and role checks
- Separate Student, Faculty and Admin workspaces
- Faculty invitations, project assignment, milestone review and student-visible feedback
- Project, task and milestone CRUD APIs
- AI Orchestrator that generates a complete project plan from one idea
- AI Mentor with live project + task + milestone context
- AI Project Intelligence: Outcome Predictor, Project DNA, Hidden Dependency Detector, Goal/Scope Drift Detector, Progress Authenticity Analyzer, Multi-Agent Debate, Feature Feasibility, Emergency/Recovery Mode and Personalized Micro-Learning
- Portfolio analytics and progress visualization
- Audit events for important project and AI actions
- Supabase schema with RLS enabled

## Environment
Copy `.env.example` to `.env.local` and configure:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENROUTER_API_KEY=
OPENROUTER_MODEL=openai/gpt-5-mini
```

**Never commit `.env.local`, service-role keys, AI provider keys, passwords or personal credentials.**

Run `supabase/schema.sql` in the Supabase SQL Editor before using database features.

## First admin setup
There is intentionally **no default or hard-coded admin email/password**.

1. Configure `.env.local` with your Supabase URL and service-role key.
2. Apply `supabase/schema.sql` to the project database.
3. Run:
```bash
npm install
npm run create-admin
```
4. Enter the admin email, password and full name when prompted.
5. Open `/admin/sign-in` and use those credentials.

The credentials entered into `npm run create-admin` are used only to create the Supabase account; they are not written into the source code.

## How to access each role

### Student
`/sign-up` → create a student account → `/sign-in` → `/dashboard`

### Faculty
An admin first creates a faculty invitation. The faculty member opens the invitation link, chooses a password, then uses `/faculty/sign-in`.

### Admin
The project owner/database administrator creates the first admin with `npm run create-admin`, then uses `/admin/sign-in`.

### Important
**Read the public `/instructions` page carefully before using the platform.**

Typing `/admin` or `/faculty` manually does not grant access. The protected pages and APIs check the authenticated account's database role on the server. A student who manually enters `/admin` is redirected to the student workspace rather than being granted admin access.

## Auto Planner troubleshooting
The Auto Planner requires:
- a signed-in account
- `OPENROUTER_API_KEY` configured on the server
- a valid `OPENROUTER_MODEL`
- the Supabase schema applied
- a working Supabase connection

If **Generate complete project** fails, read the error displayed by the page. Do not place an AI key in client-side code.

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

CI runs `npm run build` with placeholder environment variables so compilation and route errors are caught before deployment.
