import { loadEnvFile } from "node:process";

loadEnvFile(".env.local");
import { createClient } from "@supabase/supabase-js";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

const rl = readline.createInterface({ input, output });

const email = (
  await rl.question("Admin email: ")
).trim().toLowerCase();

const password = await rl.question(
  "Admin password (min 6 characters): "
);

const fullName = (
  await rl.question("Admin full name: ")
).trim();

rl.close();

if (!email || !email.includes("@")) {
  throw new Error("Invalid email.");
}

if (password.length < 6) {
  throw new Error("Password must be at least 6 characters.");
}

if (!fullName) {
  throw new Error("Full name is required.");
}

const {
  data: { user },
  error: createError,
} = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: {
    full_name: fullName,
  },
});

if (createError || !user) {
  throw new Error(createError?.message || "Unable to create admin.");
}

const { error: profileError } = await supabase
  .from("profiles")
  .update({
    full_name: fullName,
    role: "admin",
  })
  .eq("id", user.id);

if (profileError) {
  await supabase.auth.admin.deleteUser(user.id);
  throw new Error(profileError.message);
}

console.log("");
console.log("Admin created successfully.");
console.log(`Email: ${email}`);
console.log("Role: admin");