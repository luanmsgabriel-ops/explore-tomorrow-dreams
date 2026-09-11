import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Authorization header required" }, 401);

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) return json({ error: "Invalid token" }, 401);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (roleError || !roleData) return json({ error: "Only admins can create users" }, 403);

    const { email, password, full_name } = await req.json();
    if (!email || !password) return json({ error: "Email and password are required" }, 400);

    const normalizedEmail = String(email).trim().toLowerCase();

    const reconcileAccount = async (userId: string) => {
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .upsert({
          user_id: userId,
          email: normalizedEmail,
          full_name: full_name || null,
        }, { onConflict: "user_id" });
      if (profileError) throw profileError;

      const { data: currentRole, error: currentRoleError } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "user")
        .maybeSingle();
      if (currentRoleError) throw currentRoleError;

      if (!currentRole) {
        const { error: roleInsertError } = await supabaseAdmin
          .from("user_roles")
          .insert({ user_id: userId, role: "user" });
        if (roleInsertError) throw roleInsertError;
      }
    };

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (createError) {
      if (createError.message.includes("already been registered")) {
        const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) return json({ error: "Failed to look up existing user" }, 500);

        const existingUser = existingUsers.users.find((candidate) => candidate.email?.toLowerCase() === normalizedEmail);
        if (existingUser) {
          await reconcileAccount(existingUser.id);
          return json({
            success: true,
            message: "User already exists, account reconciled",
            user: { id: existingUser.id, email: existingUser.email },
            existing: true,
          });
        }
      }
      return json({ error: createError.message }, 400);
    }

    await reconcileAccount(newUser.user.id);

    return json({
      success: true,
      message: "User created successfully",
      user: { id: newUser.user.id, email: newUser.user.email },
    });
  } catch (error) {
    console.error("Error creating user:", error instanceof Error ? error.message : error);
    return json({ error: "Internal server error" }, 500);
  }
});
