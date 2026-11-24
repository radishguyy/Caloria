import { createClient } from "@/lib/supabase/server";

/**
 * Returns the currently authenticated Supabase user or throws an Error.
 */
export async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized: User not authenticated");
  }

  return user;
}
