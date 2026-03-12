import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the user with anon client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await anonClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Usuário não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    // Use service role client for full access
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Delete posts by perfil_atleta
    const { data: perfilAtleta } = await adminClient
      .from("perfil_atleta")
      .select("id")
      .eq("user_id", userId);

    if (perfilAtleta && perfilAtleta.length > 0) {
      for (const p of perfilAtleta) {
        await adminClient.from("posts_atleta").delete().eq("autor_id", p.id);
        await adminClient.from("perfil_visualizacoes").delete().eq("perfil_atleta_id", p.id);
        await adminClient.from("atleta_follows").delete().eq("following_perfil_id", p.id);
      }
    }

    // 2. Delete posts by perfis_rede
    const { data: perfisRede } = await adminClient
      .from("perfis_rede")
      .select("id")
      .eq("user_id", userId);

    if (perfisRede && perfisRede.length > 0) {
      for (const p of perfisRede) {
        await adminClient.from("posts_atleta").delete().eq("perfil_rede_id", p.id);
      }
    }

    // 3. Delete user interactions
    await adminClient.from("post_likes").delete().eq("user_id", userId);
    await adminClient.from("post_comentarios").delete().eq("user_id", userId);
    await adminClient.from("rede_conexoes").delete().or(`solicitante_id.eq.${userId},destinatario_id.eq.${userId}`);
    await adminClient.from("atleta_follows").delete().eq("follower_id", userId);
    await adminClient.from("perfil_visualizacoes").delete().eq("viewer_user_id", userId);
    await adminClient.from("rede_convites").delete().eq("convidado_user_id", userId);

    // 4. Delete gamification data
    await adminClient.from("pontos_historico").delete().eq("user_id", userId);
    await adminClient.from("user_gamificacao").delete().eq("user_id", userId);
    await adminClient.from("user_badges").delete().eq("user_id", userId);
    await adminClient.from("desafio_progresso").delete().eq("user_id", userId);

    // 5. Delete carreira data
    await adminClient.from("carreira_assinaturas").delete().eq("user_id", userId);
    await adminClient.from("carreira_experiencias").delete().eq("user_id", userId);

    // 6. Delete profiles
    await adminClient.from("perfil_atleta").delete().eq("user_id", userId);
    await adminClient.from("perfis_rede").delete().eq("user_id", userId);

    // 7. Delete user_roles and profiles
    await adminClient.from("user_roles").delete().eq("user_id", userId);
    await adminClient.from("profiles").delete().eq("user_id", userId);

    // 8. Delete the auth user itself
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error("Error deleting auth user:", deleteError);
      return new Response(JSON.stringify({ error: "Erro ao apagar usuário: " + deleteError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("delete-account error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
