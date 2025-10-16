/**
 * Supabase Admin Client
 * 
 * Uses service_role key for database management.
 * DO NOT import this in frontend code - server-side only!
 */

import { createClient } from "@supabase/supabase-js";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

// Admin client with service role (bypasses RLS)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Helper to run SQL queries
export async function runSQL(query: string) {
  const { data, error } = await supabaseAdmin.rpc("exec_sql", {
    query,
  });

  if (error) {
    console.error("SQL Error:", error);
    throw error;
  }

  return data;
}

// Helper to check connection
export async function checkConnection() {
  try {
    const { data, error } = await supabaseAdmin
      .from("_prisma_migrations")
      .select("*")
      .limit(1);

    if (error && error.code !== "42P01") {
      // 42P01 = table doesn't exist, which is fine
      throw error;
    }

    return true;
  } catch (err) {
    console.error("Connection check failed:", err);
    return false;
  }
}
