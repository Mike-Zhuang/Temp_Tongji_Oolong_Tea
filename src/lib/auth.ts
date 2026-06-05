import { ADMIN_EMAIL } from "@/lib/constants";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserProfile } from "@/lib/types";

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    isAdmin: user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase(),
  };
}

export function isTongjiEmail(email: string) {
  return email.trim().toLowerCase().endsWith("@tongji.edu.cn");
}
