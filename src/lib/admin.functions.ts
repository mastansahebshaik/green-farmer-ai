import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type AdminFarmer = {
  id: string;
  email: string | null;
  fullName: string | null;
  village: string | null;
  language: string;
  createdAt: string | null;
  lastSignInAt: string | null;
  scanCount: number;
};

async function assertAdmin(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) throw new Error("Not an admin account");
}

export const checkAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    return { isAdmin: Boolean(data) };
  });

export const listFarmers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ farmers: AdminFarmer[]; totalScans: number }> => {
    await assertAdmin(context.supabase, context.userId);

    const { data, error } = await context.supabase.rpc("get_admin_farmer_stats");
    if (error) throw new Error("Could not load admin statistics.");

    const rows = data ?? [];
    const farmers: AdminFarmer[] = rows.map((row) => ({
      id: row.id,
      email: row.email ?? null,
      fullName: row.full_name ?? null,
      village: row.village ?? null,
      language: row.language ?? "en",
      createdAt: row.created_at ?? null,
      lastSignInAt: row.last_sign_in_at ?? null,
      scanCount: Number(row.scan_count ?? 0),
    }));

    const totalScans = farmers.reduce((sum, farmer) => sum + farmer.scanCount, 0);
    return { farmers, totalScans };
  });
