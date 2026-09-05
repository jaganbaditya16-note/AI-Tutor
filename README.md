# AI Guided Project Progress Tracking Platform with Planning & Mentorship Assistance

A full-stack academic project workspace built with Next.js, Clerk, Supabase and OpenRouter.

## Core flow
1. Clerk authenticates the student.
2. Student creates a project.
3. Project data is stored in Supabase.
4. Tasks and milestones are planned and tracked.
5. AI Mentor receives the authenticated student's project context.
6. OpenRouter generates practical mentorship.

## Setup
Create a Clerk application and configure the Clerk keys in the deployment environment. Create a Supabase project and run `supabase/schema.sql`. Add the Supabase URL and service-role key only as server environment variables. Add an OpenRouter API key as a server environment variable.

Never commit `.env.local` or secret keys.
