import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const APP_BASE = "https://carreiraid.com.br";

function escapeHtml(str: string): string {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const postId = url.searchParams.get("id") || url.pathname.split("/").filter(Boolean).pop();

  if (!postId) {
    return new Response("Post id required", { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: post } = await supabase
    .from("posts_atleta")
    .select("id, texto, imagens_urls, video_url, perfil:perfil_atleta(nome, foto_url, slug), perfil_rede:perfis_rede(nome, foto_url, slug, user_id)")
    .eq("id", postId)
    .maybeSingle();

  const canonical = `${APP_BASE}/p/${postId}`;

  if (!post) {
    return new Response(
      `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=${APP_BASE}"></head><body>Post não encontrado</body></html>`,
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }

  const perfil = Array.isArray(post.perfil) ? post.perfil[0] : post.perfil;
  const perfilRede = Array.isArray(post.perfil_rede) ? post.perfil_rede[0] : post.perfil_rede;
  const author = perfil || perfilRede;
  const authorName = author?.nome || "Carreira ID";
  const authorPhoto = author?.foto_url || null;

  const rawText = (post.texto || "").trim();
  const excerpt = rawText.length > 200 ? rawText.slice(0, 197) + "..." : rawText;
  const title = `${authorName} no Carreira ID`;
  const description = excerpt || `Veja a publicação de ${authorName} no Carreira ID`;

  const image = (post.imagens_urls && post.imagens_urls[0]) || authorPhoto || `${APP_BASE}/og-default.png`;

  const html = `<!DOCTYPE html>
<html lang="pt-BR" prefix="og: https://ogp.me/ns#">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}" />
<link rel="canonical" href="${canonical}" />

<meta property="og:type" content="article" />
<meta property="og:site_name" content="Carreira ID" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:url" content="${canonical}" />
<meta property="og:image" content="${escapeHtml(image)}" />
<meta property="og:image:secure_url" content="${escapeHtml(image)}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
<meta name="twitter:image" content="${escapeHtml(image)}" />

<meta http-equiv="refresh" content="0; url=${canonical}" />
<script>window.location.replace(${JSON.stringify(canonical)});</script>
</head>
<body>
<p>Redirecionando para <a href="${canonical}">${escapeHtml(title)}</a>...</p>
</body>
</html>`;

  return new Response(html, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
});
