# ProjectPilot — AI Academic Project OS

**AI Guided Project Progress Tracking Platform with Planning & Mentorship Assistance**

ProjectPilot is a full-stack Next.js workspace for college project planning, execution, progress tracking, AI-assisted analysis, documentation, micro-learning, and academic mentorship.

## Read the instructions first

Open **/instructions** in the running application before using the platform. It explains the correct student, faculty, and admin workflow and the order in which accounts should be created.

### Student
1. Use **/sign-up** to create a student account.
2. Sign in through **/sign-in**.
3. Create/manage projects and use the planning, AI, documentation, micro-learning, task, milestone, and analytics features.

### Faculty
1. An authorized admin must create a faculty invitation.
2. Open the invitation and complete faculty account setup.
3. Future logins use **/faculty/sign-in**.
4. Faculty can review projects assigned to them and provide academic feedback.

### Admin
1. There is intentionally **no hard-coded admin account** in the repository.
2. Configure `.env.local` locally with the Supabase URL, anon key, and service-role key.
3. Run **npm run create-admin**.
4. The script asks for the admin email, password, and full name in the terminal. These values are not committed to the repository.
5. Sign in through **/admin/sign-in**.

## Security

- Never commit `.env.local`, passwords, service-role keys, AI provider keys, or personal credentials.
- `.gitignore` excludes `.env`, `.env.local`, and local environment variants.
- Protected role checks are performed server-side.
- Typing `/admin` or `/faculty` into the URL does not grant permission.
- AI output is advisory and should be reviewed before academic or project decisions.

## Environment

Copy `.env.example` to `.env.local` and configure the required Supabase and AI provider variables.

Run `supabase/schema.sql` in the Supabase SQL Editor before using database features.

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
