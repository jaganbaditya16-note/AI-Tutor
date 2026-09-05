import { createClient } from "@/lib/supabase/server";

export async function requireUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("UNAUTHORIZED");
  return data.user.id;
}

export async function getUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}
