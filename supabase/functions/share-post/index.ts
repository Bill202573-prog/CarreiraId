import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const APP_BASE = "https://carreiraid.com.br";

const CRAWLER_UA_RE = /(facebookexternalhit|facebot|whatsapp|twitterbot|linkedinbot|slackbot|telegrambot|discordbot|pinterest|googlebot|bingbot|applebot|yandex|baiduspider|duckduckbot|embedly|skypeuripreview|redditbot|tumblr|vkshare|quora|outbrain|w3c_validator|opengraph)/i;

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

  const userAgent = req.headers.get("user-agent") || "";
  const isCrawler = CRAWLER_UA_RE.test(userAgent);
  const internalRoute = `${APP_BASE}/post/${postId}`;
  const canonical = `${APP_BASE}/p/${postId}`;

  // Humans → redirect straight to the SPA post route
  if (!isCrawler) {
    return Response.redirect(internalRoute, 302);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: post } = await supabase
    .from("posts_atleta")
    .select("id, titulo, texto, imagens_urls, video_url, perfil:perfil_atleta(nome, foto_url, slug), perfil_rede:perfis_rede(nome, foto_url, slug, user_id)")
    .eq("id", postId)
    .maybeSingle();

  if (!post) {
    return new Response(
      `<!DOCTYPE html><html><head><title>Carreira ID</title></head><body>Post não encontrado</body></html>`,
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }

  const perfil = Array.isArray(post.perfil) ? post.perfil[0] : post.perfil;
  const perfilRede = Array.isArray(post.perfil_rede) ? post.perfil_rede[0] : post.perfil_rede;
  const author = perfil || perfilRede;
  const authorName = author?.nome || "Carreira ID";
  const authorPhoto = author?.foto_url || null;

  const rawText = (post.texto || "").trim();
  const rawTitulo = (post.titulo || "").trim();

  // Title cascade: titulo curto → primeiras palavras do texto → fallback
  let title: string;
  if (rawTitulo) {
    title = rawTitulo;
  } else if (rawText) {
    title = rawText.length > 70 ? rawText.slice(0, 67) + "..." : rawText;
  } else {
    title = `Publicação de ${authorName}`;
  }

  const description = rawText
    ? (rawText.length > 200 ? rawText.slice(0, 197) + "..." : rawText)
    : `Veja a publicação de ${authorName} no Carreira ID`;

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
</head>
<body>
<h1>${escapeHtml(title)}</h1>
<p>${escapeHtml(description)}</p>
<p><a href="${internalRoute}">Abrir no Carreira ID</a></p>
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
